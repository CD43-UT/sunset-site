# sunset site

Full-bleed photographs from [Wikimedia Commons Category:Sunsets](https://commons.wikimedia.org/wiki/Category:Sunsets), crossfading on a timer. There is no on-page text or controls.

```bash
python3 server.py
```

Open http://127.0.0.1:8000. The server requests Category:Sunsets with a descriptive User-Agent, follows `continue.gcmcontinue`, and keeps URLs that respond as JPEG, PNG, WebP, or GIF. The slideshow advances about every 5 seconds with a short crossfade. `prefers-reduced-motion` holds the first photograph.
