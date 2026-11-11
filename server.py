#!/usr/bin/env python3
"""Serve the site and photograph list from Wikimedia Commons Category:Sunsets."""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

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
    try:
        with urllib.request.urlopen(_request(url, "HEAD"), timeout=20) as response:
            if response.status != 200:
                return False
            content_type = response.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
            length = response.headers.get("Content-Length")
            if length is not None and length.isdigit() and int(length) <= 0:
                return False
            return content_type in ALLOWED_TYPES
    except (urllib.error.URLError, TimeoutError, ValueError):
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

    _cache["at"] = time.time()
    _cache["photos"] = photos
    return photos


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path != "/api/photos":
            super().do_GET()
            return
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

    def log_message(self, fmt: str, *args) -> None:
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Serving http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
