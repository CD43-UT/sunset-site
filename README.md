# sunset site

Full-bleed photographs from [Wikimedia Commons Category:Sunsets](https://commons.wikimedia.org/wiki/Category:Sunsets), cropped to the sunset sky and crossfading on a timer. There is no on-page text or controls.

```bash
pip install -r requirements.txt
python3 server.py
```

Open http://127.0.0.1:8000. The server requests Category:Sunsets with a descriptive User-Agent, follows `continue.gcmcontinue`, and keeps URLs that respond as JPEG, PNG, WebP, or GIF. Each photo is cropped to the open sunset sky so the ground, water, and other foreground objects are left out. The slideshow advances about every 5 seconds with a short crossfade. `prefers-reduced-motion` holds the first photograph.
