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

from PIL import Image, ImageOps

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
THUMB_WIDTH = 1280

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


def _thumb_url(original: str, width: int = THUMB_WIDTH) -> str:
    clean = original.split("?", 1)[0]
    marker = "/wikipedia/commons/"
    index = clean.find(marker)
    if index < 0:
        return clean
    rest = clean[index + len(marker) :]
    name = rest.rsplit("/", 1)[-1]
    return f"{clean[:index]}/wikipedia/commons/thumb/{rest}/{width}px-{urllib.parse.unquote(name)}"


def _sun_scores(blob: bytes) -> tuple[list[float], list[float]]:
    """Warm highlights score as the sun. A plain white lamp does not get that bonus."""
    sun: list[float] = []
    luminance: list[float] = []
    for index in range(0, len(blob), 3):
        red = blob[index]
        green = blob[index + 1]
        blue = blob[index + 2]
        light = 0.2126 * red + 0.7152 * green + 0.0722 * blue
        warm = max(0.0, red - blue)
        white = max(0.0, min(red, green, blue) - 170)
        sun.append(light + 1.25 * warm - 0.45 * white)
        luminance.append(light)
    return sun, luminance


def _integral(values: list[float], width: int, height: int) -> list[float]:
    stride = width + 1
    table = [0.0] * (stride * (height + 1))
    for y in range(height):
        row_sum = 0.0
        base = y * width
        for x in range(width):
            row_sum += values[base + x]
            table[(y + 1) * stride + x + 1] = table[y * stride + x + 1] + row_sum
    return table


def _window_sum(table: list[float], width: int, x0: int, y0: int, x1: int, y1: int) -> float:
    stride = width + 1
    return table[y1 * stride + x1] - table[y0 * stride + x1] - table[y1 * stride + x0] + table[y0 * stride + x0]


def bright_box(image: Image.Image) -> tuple[int, int, int, int]:
    """Square crop centered on the sun, or on the brightest area when no sun stands out."""
    rgb = ImageOps.exif_transpose(image).convert("RGB")
    width, height = rgb.size
    sample_w = 240
    sample_h = max(1, round(height * sample_w / width))
    sample = rgb.resize((sample_w, sample_h), Image.Resampling.BOX)
    sun, _luminance = _sun_scores(sample.tobytes())
    radius = max(6, int(round(min(sample_w, sample_h) * 0.09)))
    table = _integral(sun, sample_w, sample_h)
    area = radius * radius
    best_score = None
    center_x = sample_w / 2
    center_y = sample_h * 0.4
    for y in range(0, sample_h - radius + 1, 2):
        for x in range(0, sample_w - radius + 1, 2):
            score = _window_sum(table, sample_w, x, y, x + radius, y + radius) / area
            if best_score is None or score > best_score:
                best_score = score
                center_x = x + radius / 2
                center_y = y + radius / 2
    ordered = sorted(sun)
    median = ordered[len(ordered) // 2]
    ratio = (best_score or 0) / (median + 1)
    if ratio > 2.1:
        fraction = 0.38
    elif ratio > 1.45:
        fraction = 0.5
    else:
        fraction = 0.72
    side = min(sample_w, sample_h, max(int(min(sample_w, sample_h) * fraction), radius * 2))
    x0 = max(0, min(sample_w - side, int(round(center_x - side / 2))))
    y0 = max(0, min(sample_h - side, int(round(center_y - side / 2))))
    left = round(x0 * width / sample_w)
    top = round(y0 * height / sample_h)
    right = min(width, round((x0 + side) * width / sample_w))
    bottom = min(height, round((y0 + side) * height / sample_h))
    return left, top, max(left + 1, right), max(top + 1, bottom)


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
    if not _sources:
        load_photos()
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
            left, top, right, bottom = bright_box(image)
            cropped = ImageOps.exif_transpose(image).convert("RGB").crop((left, top, right, bottom))
            output = io.BytesIO()
            cropped.save(output, format="JPEG", quality=84, optimize=True)
            data = output.getvalue()
    except (OSError, ValueError):
        data = raw
    with _crop_lock:
        if index < len(_sources) and _sources[index]["url"] == source:
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
        {"url": f"/media/{index}?v=bright", "title": photo["title"], "page": photo["page"]}
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

    def _send_photos(self) -> None:
        try:
            photos = load_photos()
            body = json.dumps(
                {
                    "source": "https://commons.wikimedia.org/wiki/Category:Sunsets",
                    "photos": photos,
                }
            ).encode()
            self._send(200, "application/json; charset=utf-8", body, "no-store")
        except Exception as error:  # noqa: BLE001 — surface a single client error
            message = json.dumps({"error": str(error)}).encode()
            self._send(502, "application/json; charset=utf-8", message, "no-store")

    def _send_crop(self, token: str) -> None:
        try:
            index = int(token)
            data = cropped_jpeg(index)
        except (ValueError, IndexError):
            self.send_error(404)
            return
        except Exception:  # noqa: BLE001 — a failed crop should not take down the page
            self.send_error(502)
            return
        self._send(200, "image/jpeg", data, "no-cache")

    def _send(self, status: int, content_type: str, body: bytes, cache: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", cache)
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt: str, *args) -> None:
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Serving http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
