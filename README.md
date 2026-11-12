# sunset site

Full-bleed photographs from [Wikimedia Commons Category:Sunsets](https://commons.wikimedia.org/wiki/Category:Sunsets), cropped around the sun or the brightest area. Side arrows and the left and right arrow keys slide the previous or next photo into view. Nothing advances on its own. The bottom band fades from bluish purple to a darker purple. The first circle leaves the photo as it is. The other nine put a vision filter over the whole photo: dog, cat, monarch butterfly, honey bee, migratory birds, grasshopper, mantis shrimp, shark, and dragonfly.

```bash
python3 server.py
```

Open http://127.0.0.1:8000. The server requests Category:Sunsets with a descriptive User-Agent, follows `continue.gcmcontinue`, and keeps URLs that respond as JPEG, PNG, WebP, or GIF. Photo addresses are relative to the page. On a static host such as GitHub Pages, where `api/photos` is not available, the page asks Commons directly and shows those image responses. The right control and the Right arrow key slide the next photo in from the right. The left control and the Left arrow key slide the previous photo in from the left. `prefers-reduced-motion` swaps the photo without the slide.
