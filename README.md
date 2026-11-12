# sunset site

Full-bleed live view of the Fort William, Scotland webcam from [LiveSunset](https://www.livesunset.io/#fort-william-scotland-204). That page embeds `https://www.youtube.com/watch?v=2occtpoOu_w`, and the watch page asks for a sign-in before it will play. The picture here is YouTube's public live storyboard for that same webcam, a JPEG sheet of frames at `https://i.ytimg.com/sb/2occtpoOu_w/storyboard_live_90_3x3_b2/M$M.jpg?rs=AOn4CLD_pILXDD5gORYBBNmYvM91Re3fqA`. The page follows the newest sheet and steps through its frames. The bottom band fades from bluish purple to a darker purple. The first circle leaves the picture as it is. The other nine put a vision filter over the moving picture: dog, cat, monarch butterfly, honey bee, migratory birds, grasshopper, mantis shrimp, shark, and dragonfly. Grasshopper, mantis shrimp, and dragonfly also draw faint polarization lines that shift with the stream.

```bash
python3 server.py
```

Open http://127.0.0.1:8000. `prefers-reduced-motion` steps the polarization lines instead of drifting them.
