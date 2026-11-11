# sunset site

Full-bleed photographs from [Wikimedia Commons Category:Sunsets](https://commons.wikimedia.org/wiki/Category:Sunsets). Side arrows and the left and right arrow keys slide the previous or next photo into view. Nothing advances on its own.

```bash
python3 server.py
```

Open http://127.0.0.1:8000. The server requests Category:Sunsets with a descriptive User-Agent, follows `continue.gcmcontinue`, and keeps URLs that respond as JPEG, PNG, WebP, or GIF. The right control and the Right arrow key slide the next photo in from the right. The left control and the Left arrow key slide the previous photo in from the left. `prefers-reduced-motion` swaps the photo without the slide.
