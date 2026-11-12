#!/usr/bin/env python3
"""Serve the site and the local Category:Sunsets photographs."""

from __future__ import annotations

import json
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HOST = "127.0.0.1"
PORT = 8000


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path != "/api/photos":
            super().do_GET()
            return
        try:
            body = (ROOT / "photos.json").read_bytes()
            json.loads(body)
        except (OSError, json.JSONDecodeError):
            message = json.dumps({"error": "Local sunset photographs are missing."}).encode()
            self._send(500, "application/json; charset=utf-8", message)
            return
        self._send(200, "application/json; charset=utf-8", body)

    def _send(self, status: int, content_type: str, body: bytes) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
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
