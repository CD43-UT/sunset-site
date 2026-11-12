# sunset site

Full-bleed looping sunset from the Wikimedia Commons video [Sunset in Pantai Kukup](https://upload.wikimedia.org/wikipedia/commons/c/c6/Sunset_in_Pantai_Kukup.webm) (`video/webm`, 1920×1080). The Fort William webcam on [LiveSunset](https://www.livesunset.io/#fort-william-scotland-204) is a YouTube embed that asks for a sign-in before it will play, and the public storyboard of that stream is only about 160×90. The bottom band fades from bluish purple to a darker purple. The first circle leaves the picture as it is. The other nine put a vision filter over the moving picture: dog, cat, monarch butterfly, honey bee, migratory birds, grasshopper, mantis shrimp, shark, and dragonfly. Grasshopper, mantis shrimp, and dragonfly also draw faint polarization lines that shift with the video.

```bash
python3 server.py
```

Open http://127.0.0.1:8000. `prefers-reduced-motion` steps the polarization lines instead of drifting them.
