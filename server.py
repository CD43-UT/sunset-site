#!/usr/bin/env python3
"""Serve the site and photograph list from Wikimedia Commons Category:Sunsets."""

from __future__ import annotations

import io
import json
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
HOST = "127.0.0.1"
PORT = 8000
USER_AGENT = (
    "SunsetSite/1.0 (https://github.com/CD43-UT/sunset-site; "
    "Wikimedia Commons Category:Sunsets slideshow)"
)
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_PHOTOS = 40
MAX_PAGES = 6
CACHE_SECONDS = 60 * 30

BASE_QUERY = {
    "action": "query",
    "format": "json",
    "formatversion": "2",
    "generator": "categorymembers",
    "gcmtitle": "Category:Sunsets",
    "gcmtype": "file",
    "gcmlimit": "20",
    "prop": "imageinfo",
    "iiprop": "url|mime",
    "iiextmetadatafilter": "ImageDescription|LicenseShortName",
    "maxlag": "5",
}

_cache: dict = {"at": 0.0, "photos": None}
_sources: list[dict] = []
_crops: dict[int, bytes] = {}
_crop_lock = threading.Lock()


def _request(url: str, method: str = "GET") -> urllib.request.Request:
    return urllib.request.Request(url, method=method, headers={"User-Agent": USER_AGENT})


def _fetch_json(params: dict) -> dict:
    url = COMMONS_API + "?" + urllib.parse.urlencode(params)
    delay = 1.0
    last_error = "Commons request failed"
    for _ in range(4):
        try:
            with urllib.request.urlopen(_request(url), timeout=30) as response:
                data = json.load(response)
        except urllib.error.HTTPError as error:
            last_error = f"Commons request failed ({error.code})"
            if error.code in {429, 503}:
                time.sleep(delay)
                delay *= 2
                continue
            raise RuntimeError(last_error) from error
        if data.get("error", {}).get("code") == "maxlag":
            last_error = "Commons asked us to wait (maxlag)"
            time.sleep(delay)
            delay *= 2
            continue
        return data
    raise RuntimeError(last_error)


def _is_image_response(url: str) -> bool:
    delay = 1.0
    for _ in range(3):
        try:
            with urllib.request.urlopen(_request(url, "HEAD"), timeout=20) as response:
                if response.status != 200:
                    return False
                content_type = response.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
                length = response.headers.get("Content-Length")
                if length is not None and length.isdigit() and int(length) <= 0:
                    return False
                return content_type in ALLOWED_TYPES
        except urllib.error.HTTPError as error:
            if error.code == 429:
                time.sleep(delay)
                delay *= 2
                continue
            return False
        except (urllib.error.URLError, TimeoutError, ValueError):
            return False
    return False


def _candidates(pages: list) -> list[dict]:
    found = []
    for page in pages:
        info = (page.get("imageinfo") or [None])[0] or {}
        mime = str(info.get("mime") or "").lower()
        url = info.get("url")
        if mime not in ALLOWED_TYPES or not url:
            continue
        title = str(page.get("title") or "").removeprefix("File:")
        found.append(
            {
                "url": url,
                "page": info.get("descriptionurl") or "https://commons.wikimedia.org/wiki/Category:Sunsets",
                "title": title,
                "mime": mime,
            }
        )
    return found


def _thumb_url(original: str, width: int = 1280) -> str:
    clean = original.split("?", 1)[0]
    marker = "/wikipedia/commons/"
    index = clean.find(marker)
    if index < 0:
        return clean
    rest = clean[index + len(marker) :]
    name = rest.rsplit("/", 1)[-1]
    return f"{clean[:index]}/wikipedia/commons/thumb/{rest}/{width}px-{urllib.parse.unquote(name)}"


def _sky_pixel(r: int, g: int, b: int) -> bool:
    brightest = max(r, g, b)
    darkest = min(r, g, b)
    if brightest < 55:
        return False
    if darkest > 188 and brightest - darkest < 28:
        return False
    if b > r + 18 and r < 110:
        return False
    return r >= 75 and r + 8 >= g and r + 20 >= b


def _sun_pixel(r: int, g: int, b: int) -> bool:
    luminance = 0.3 * r + 0.59 * g + 0.11 * b
    return r > 205 and g > 130 and luminance > 175 and r > b + 20 and b < 215


def _sunset_box(image: Image.Image) -> tuple[int, int, int, int]:
    """Crop to the open sunset sky, leaving out ground, water, and edge objects."""
    width, height = image.size
    sample_w = 360
    sample_h = max(1, round(height * sample_w / width))
    sample = image.convert("RGB").resize((sample_w, sample_h), Image.Resampling.BOX)
    pixels = sample.load()
    row_score = [
        sum(_sky_pixel(*pixels[x, y]) for x in range(sample_w)) / sample_w for y in range(sample_h)
    ]

    spans: list[tuple[int, int]] = []
    start = None
    for y, score in enumerate(row_score + [0]):
        if score >= 0.9 and start is None:
            start = y
        elif score < 0.9 and start is not None:
            spans.append((start, y - 1))
            start = None
    spans = [span for span in spans if span[1] - span[0] + 1 >= max(8, int(sample_h * 0.05))]

    if spans:
        # The upper band is the sky. A lower band is usually a reflection.
        y0, y1 = min(spans, key=lambda span: span[0])
        columns = [
            sum(_sky_pixel(*pixels[x, y]) for y in range(y0, y1 + 1)) / (y1 - y0 + 1)
            for x in range(sample_w)
        ]
        keep = [x for x, score in enumerate(columns) if score >= 0.85]
        if len(keep) > sample_w * 0.35:
            x0, x1 = keep[0], keep[-1]
        else:
            x0, x1 = 0, sample_w - 1
    else:
        points = [(x, y) for y in range(sample_h) for x in range(sample_w) if _sun_pixel(*pixels[x, y])]
        if points:
            ys = sorted(point[1] for point in points)
            limit = ys[max(0, len(ys) // 5)]
            cluster = [point for point in points if point[1] <= limit + 2] or points
            focus_x = sum(point[0] for point in cluster) / len(cluster)
            focus_y = sum(point[1] for point in cluster) / len(cluster)
        else:
            focus_x, focus_y = sample_w / 2, sample_h * 0.35
        box_w = int(sample_w * 0.42)
        box_h = int(sample_h * 0.4)
        x0 = max(0, min(sample_w - box_w, int(focus_x - box_w / 2)))
        y0 = max(0, min(sample_h - box_h, int(focus_y - box_h * 0.58)))
        x1, y1 = x0 + box_w - 1, y0 + box_h - 1

    def edge_has_intruder(side: str) -> bool:
        if side == "top":
            coords = [(x, y0) for x in range(x0, x1 + 1)]
        elif side == "bottom":
            coords = [(x, y1) for x in range(x0, x1 + 1)]
        elif side == "left":
            coords = [(x0, y) for y in range(y0, y1 + 1)]
        else:
            coords = [(x1, y) for y in range(y0, y1 + 1)]
        luminances = []
        intruders = 0
        for x, y in coords:
            red, green, blue = pixels[x, y]
            luminance = 0.3 * red + 0.59 * green + 0.11 * blue
            luminances.append(luminance)
            if luminance < 100 or (min(red, green, blue) > 185 and max(red, green, blue) - min(red, green, blue) < 32):
                intruders += 1
        if not luminances:
            return False
        median = sorted(luminances)[len(luminances) // 2]
        # Only treat dark or white specks as intruders when the rest of the edge is sunset.
        if median < 120:
            return False
        return intruders >= 1

    floor_h = max(8, int((y1 - y0) * 0.55))
    floor_w = max(8, int((x1 - x0) * 0.55))
    for _ in range(sample_w):
        moved = False
        if y1 - y0 > floor_h and edge_has_intruder("top"):
            y0 += 1
            moved = True
        if y1 - y0 > floor_h and edge_has_intruder("bottom"):
            y1 -= 1
            moved = True
        if x1 - x0 > floor_w and edge_has_intruder("left"):
            x0 += 1
            moved = True
        if x1 - x0 > floor_w and edge_has_intruder("right"):
            x1 -= 1
            moved = True
        if not moved:
            break

    left = max(0, min(width - 1, round(x0 * width / sample_w)))
    right = max(left + 1, min(width, round((x1 + 1) * width / sample_w)))
    top = max(0, min(height - 1, round(y0 * height / sample_h)))
    bottom = max(top + 1, min(height, round((y1 + 1) * height / sample_h)))
    return _shave_intruders(image.convert("RGB"), (left, top, right, bottom))


def _shave_intruders(image: Image.Image, box: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
    """Drop a fringe of branches, tree tips, or snow that the coarse pass left behind."""
    left, top, right, bottom = box
    view = image.crop(box)
    view_w, view_h = view.size
    probe_w = min(720, view_w)
    probe_h = max(1, round(view_h * probe_w / view_w))
    probe = view.resize((probe_w, probe_h), Image.Resampling.BOX)
    pixels = probe.load()

    def dark(x: int, y: int) -> bool:
        red, green, blue = pixels[x, y]
        return max(red, green, blue) < 48

    def snow(x: int, y: int) -> bool:
        red, green, blue = pixels[x, y]
        return min(red, green, blue) > 188 and max(red, green, blue) - min(red, green, blue) < 28

    x0, y0, x1, y1 = 0, 0, probe_w - 1, probe_h - 1
    y_limit = int(probe_h * 0.42)
    x_limit = int(probe_w * 0.42)
    while y0 < y_limit and any(dark(x, y0) or snow(x, y0) for x in range(x0, x1 + 1)):
        y0 += 1
    while probe_h - 1 - y1 < y_limit and y1 > y0 and any(dark(x, y1) or snow(x, y1) for x in range(x0, x1 + 1)):
        y1 -= 1
    while x0 < x_limit and any(dark(x0, y) or snow(x0, y) for y in range(y0, y1 + 1)):
        x0 += 1
    while probe_w - 1 - x1 < x_limit and x1 > x0 and any(dark(x1, y) or snow(x1, y) for y in range(y0, y1 + 1)):
        x1 -= 1

    new_left = min(right - 1, left + round(x0 * view_w / probe_w))
    new_right = max(new_left + 1, left + round((x1 + 1) * view_w / probe_w))
    new_top = min(bottom - 1, top + round(y0 * view_h / probe_h))
    new_bottom = max(new_top + 1, top + round((y1 + 1) * view_h / probe_h))
    return new_left, new_top, min(right, new_right), min(bottom, new_bottom)


def _download(url: str) -> bytes:
    delay = 1.0
    last_error: Exception | None = None
    for _ in range(4):
        try:
            with urllib.request.urlopen(_request(url), timeout=40) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            last_error = error
            if error.code == 429:
                time.sleep(delay)
                delay *= 2
                continue
            raise
    if last_error:
        raise last_error
    raise RuntimeError("download failed")


def cropped_jpeg(index: int) -> bytes:
    with _crop_lock:
        cached = _crops.get(index)
    if cached is not None:
        return cached
    if index < 0 or index >= len(_sources):
        raise IndexError(index)
    source = _sources[index]["url"]
    try:
        raw = _download(_thumb_url(source))
    except urllib.error.HTTPError as error:
        if error.code not in {400, 404}:
            raise
        raw = _download(source.split("?", 1)[0])
    try:
        with Image.open(io.BytesIO(raw)) as image:
            box = _sunset_box(image)
            cropped = image.convert("RGB").crop(box)
            output = io.BytesIO()
            cropped.save(output, format="JPEG", quality=84, optimize=True)
            data = output.getvalue()
    except (OSError, ValueError):
        data = raw
    with _crop_lock:
        _crops[index] = data
    return data


def load_photos() -> list[dict]:
    now = time.time()
    if _cache["photos"] is not None and now - _cache["at"] < CACHE_SECONDS:
        return _cache["photos"]

    params = dict(BASE_QUERY)
    photos: list[dict] = []
    seen: set[str] = set()

    for _ in range(MAX_PAGES):
        data = _fetch_json(params)
        batch = _candidates(data.get("query", {}).get("pages", []))
        if batch:
            with ThreadPoolExecutor(max_workers=6) as pool:
                checks = list(pool.map(lambda item: _is_image_response(item["url"]), batch))
            for item, ok in zip(batch, checks):
                if not ok or item["url"] in seen:
                    continue
                seen.add(item["url"])
                photos.append(item)
                if len(photos) >= MAX_PHOTOS:
                    break
        if len(photos) >= MAX_PHOTOS:
            break
        token = data.get("continue")
        if not token:
            break
        params = {**BASE_QUERY, **token}

    if not photos:
        raise RuntimeError("Category:Sunsets returned no image URLs")

    global _sources
    _sources = photos
    with _crop_lock:
        _crops.clear()
    listed = [
        {"url": f"/media/{index}", "title": photo["title"], "page": photo["page"]}
        for index, photo in enumerate(photos)
    ]
    _cache["at"] = time.time()
    _cache["photos"] = listed
    return listed


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path == "/api/photos":
            self._send_photos()
            return
        if path.startswith("/media/"):
            self._send_crop(path.removeprefix("/media/"))
            return
        super().do_GET()

    def _send_photos(self):
        try:
            photos = load_photos()
            body = json.dumps(
                {
                    "source": "https://commons.wikimedia.org/wiki/Category:Sunsets",
                    "photos": photos,
                }
            ).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
        except Exception as error:  # noqa: BLE001 — surface a single client error
            message = json.dumps({"error": str(error)}).encode()
            self.send_response(502)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(message)))
            self.end_headers()
            self.wfile.write(message)

    def _send_crop(self, key: str):
        try:
            load_photos()
            data = cropped_jpeg(int(key))
        except (ValueError, IndexError, urllib.error.URLError, TimeoutError, RuntimeError):
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Content-Type", "image/jpeg")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "public, max-age=86400")
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt: str, *args) -> None:
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Serving http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
