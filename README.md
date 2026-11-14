# sunset site

Live video from public cameras in the [Live Environment Streams](https://github.com/willytop8/Live-Environment-Streams) catalog, plus public HLS cameras whose view is the sky toward the sunset. The day is split into 24 clock hours. A camera is in the rotation only during the hour that contains sunset at its latitude and longitude, and only when the picture is open sky toward that sunset. Road, dock, and indoor cameras are left out. Finite MP4 files that do not keep updating are skipped. Sunset times use the same solar geometry as [sunrise-sunset.org](https://api.sunrise-sunset.org/json). If more than one camera's sunset falls in the current hour, the side arrows and the left and right keys move between them. If an hour has none, the page says so.

Each frame is drawn onto a canvas. The ten circles remap those pixels: the first leaves the picture as it is, and the other nine are dog, cat, monarch butterfly, honey bee, migratory birds, grasshopper, mantis shrimp, shark, and dragonfly. The picture is scaled to the width of the screen, keeping its shape. If that makes it taller than the screen, the extra is centered and clipped at the top and bottom. A large circle centered on the bottom-left corner, with only its inner quarter on screen, opens the ten filters in a fan while it is highlighted. Grasshopper, mantis shrimp, and dragonfly also draw faint polarization lines. `prefers-reduced-motion` steps those lines.

```bash
python3 server.py
```

Open http://127.0.0.1:8000.
