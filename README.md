# sunset site

Full-bleed live view of the Fort William, Scotland webcam that [LiveSunset](https://www.livesunset.io/#fort-william-scotland-204) plays from `https://www.youtube.com/watch?v=2occtpoOu_w`. The bottom band fades from bluish purple to a darker purple. The first circle leaves the picture as it is. The other nine put a vision filter over the moving picture: dog, cat, monarch butterfly, honey bee, migratory birds, grasshopper, mantis shrimp, shark, and dragonfly. Grasshopper, mantis shrimp, and dragonfly also draw faint polarization lines that shift with the stream.

```bash
python3 server.py
```

Open http://127.0.0.1:8000. The video starts muted so the browser can play it. `prefers-reduced-motion` steps the polarization lines instead of drifting them.
