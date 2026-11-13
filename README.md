# sunset site

Live video from public cameras in the [Live Environment Streams](https://github.com/willytop8/Live-Environment-Streams) catalog. A camera is shown only when its HLS, MJPEG, or MP4 address is direct and the sun at its latitude and longitude is about to set: sunset is within the next hour, or the sun is already between sunset and the end of civil twilight. Sunset times use the same solar geometry as [sunrise-sunset.org](https://api.sunrise-sunset.org/json). If more than one camera matches, the side arrows and the left and right keys move between them. If none match, the page says so.

Each frame is drawn onto a canvas. The ten circles remap those pixels: the first leaves the picture as it is, and the other nine are dog, cat, monarch butterfly, honey bee, migratory birds, grasshopper, mantis shrimp, shark, and dragonfly. The bottom band fades from bluish purple to a darker purple. Grasshopper, mantis shrimp, and dragonfly also draw faint polarization lines. `prefers-reduced-motion` steps those lines.

```bash
python3 server.py
```

Open http://127.0.0.1:8000.
