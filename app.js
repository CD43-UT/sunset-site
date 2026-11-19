const CATALOG = "https://raw.githubusercontent.com/willytop8/Live-Environment-Streams/main/streams.geojson";
const HOUR_MS = 60 * 60 * 1000;

// Direct HLS streams whose frame is open sky toward the sunset.
// A camera is listed for the clock hour that contains its sunset, and only then.
const EXTRA_CAMERAS = [
  { name: "Westport South Beach", lat: 46.89, lon: -124.13, url: "https://stage-ams.srv.axds.co/stream/adaptive/nanoos/westport_south/hls.m3u8", attribution: "NANOOS" },
  { name: "Westport North Beach", lat: 46.89, lon: -124.13, url: "https://stage-ams.srv.axds.co/stream/adaptive/nanoos/westport_north/hls.m3u8", attribution: "NANOOS" },
  { name: "Siuslaw River Mouth", lat: 44.02, lon: -124.14, url: "https://stage-ams.srv.axds.co/stream/adaptive/nanoos/siuslaw/hls.m3u8", attribution: "NANOOS" },
  { name: "Carpinteria State Beach", lat: 34.39, lon: -119.52, url: "https://stage-ams.srv.axds.co/stream/adaptive/sccoos/carpinteria/hls.m3u8", attribution: "SCCOOS" },
  { name: "San Elijo State Beach", lat: 33.02, lon: -117.28, url: "https://stage-ams.srv.axds.co/stream/adaptive/sccoos/san_elijo/hls.m3u8", attribution: "SCCOOS" },
  { name: "Bastendorff Beach", lat: 43.34, lon: -124.35, url: "https://stage-ams.srv.axds.co/stream/adaptive/nanoos/bastendorff/hls.m3u8", attribution: "NANOOS" },
  { name: "Point Reyes Lifeboat Station", lat: 37.99, lon: -122.97, url: "https://stage-ams-nfs.srv.axds.co/stream/adaptive/noaa/tmmc_prls/hls.m3u8", attribution: "NOAA" },
  { name: "Stinson Beach", lat: 37.9, lon: -122.64, url: "https://stage-ams.srv.axds.co/stream/adaptive/cencoos/stinson/hls.m3u8", attribution: "CeNCOOS" },
  { name: "Fa'a'ā Airport, Tahiti", lat: -17.559, lon: -149.608, url: "https://s81.ipcamlive.com/streams/51lrjb7qwnfa342ex/stream.m3u8", attribution: "Fa'a'ā International Airport" },
  { name: "Lomani Island, Malolo Lailai", lat: -17.778, lon: 177.155, url: "https://s107.ipcamlive.com/streams/6bgepyzehc6ngxcnd/stream.m3u8", attribution: "Lomani Island Resort" },
  { name: "Biarritz Grande Plage", lat: 43.483, lon: -1.558, url: "https://live.viewsurf.com/liveedge/biarritzgrandeplage_1_1.stream/playlist.m3u8", attribution: "Viewsurf" },
  { name: "Anglet, La Barre", lat: 43.5, lon: -1.52, url: "https://live.viewsurf.com/liveedge/anglet01_1_1.stream/playlist.m3u8", attribution: "Viewsurf" },
  { name: "San Nicolò, Buggerru", lat: 39.428, lon: 8.412, url: "https://cdn-007.whatsupcams.com/hls/it_buggerru02.m3u8", attribution: "WhatsUpCams" },
  { name: "S'Archittu", lat: 40.091, lon: 8.472, url: "https://cdn-005.whatsupcams.com/hls/it_cuglieri01.m3u8", attribution: "WhatsUpCams" },
  { name: "Aviv Beach, Tel Aviv", lat: 32.072, lon: 34.763, url: "https://s31.ipcamlive.com/streams/1fes5p6gbxlhrad7t/stream.m3u8", attribution: "BeachCam Israel" },
  { name: "Hilton Beach, Tel Aviv", lat: 32.091, lon: 34.771, url: "https://s27.ipcamlive.com/streams/1btl3et0nds4m5vcm/stream.m3u8", attribution: "BeachCam Israel" },
  { name: "Bat Galim, Haifa", lat: 32.833, lon: 34.983, url: "https://s5.ipcamlive.com/streams/054mt829jlxrfhk0p/stream.m3u8", attribution: "BeachCam Israel" },
  { name: "Bloemendaal aan Zee", lat: 52.405, lon: 4.537, url: "https://wowza01.crossmediaventures.com/beachcam/beachcam.smil/playlist.m3u8", attribution: "Reddingsbrigade Bloemendaal" },
  { name: "Praia do Norte, Nazaré", lat: 39.606, lon: -9.085, url: "https://video-auth1.iol.pt/beachcam/nazareparadonorte/playlist.m3u8", attribution: "MEO Beachcam" },
  { name: "Praia do Guincho", lat: 38.732, lon: -9.473, url: "https://video-auth1.iol.pt/beachcam/praiaguinchosul/playlist.m3u8", attribution: "MEO Beachcam" },
  { name: "Playa Paraíso, Adeje", lat: 28.121, lon: -16.778, url: "https://cdn-005.whatsupcams.com/hls/es_tenerife01.m3u8", attribution: "WhatsUpCams" },
  { name: "Westerly Town Beach", lat: 41.33, lon: -71.79, url: "https://stage-ams.srv.axds.co/stream/adaptive/neracoos/westerly/hls.m3u8", attribution: "NERACOOS" },
  { name: "Holland, Lake Michigan", lat: 42.77, lon: -86.21, url: "https://stage-ams-nfs.srv.axds.co/stream/adaptive/noaa/miholland_ottawa/hls.m3u8", attribution: "NOAA" },
  { name: "Oak Island West", lat: 33.91, lon: -78.22, url: "https://stage-ams-nfs.srv.axds.co/stream/adaptive/uncw/oakisland_west/hls.m3u8", attribution: "UNCW" },
];

const visionButtons = [...document.querySelectorAll(".circle")];
const visionName = document.getElementById("vision-name");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const video = document.getElementById("picture");
const mjpeg = document.getElementById("mjpeg");
const canvas = document.getElementById("frame");
const ctx = canvas.getContext("2d", { alpha: false });
const empty = document.getElementById("empty");
const credit = document.getElementById("credit");
const cameraCount = document.getElementById("camera-count");
const prevButton = document.querySelector(".nav.prev");
const nextButton = document.querySelector(".nav.next");

const VISION_NAMES = {
  dog: "Dog",
  cat: "Cat",
  monarch: "Monarch butterfly",
  bee: "Honey bee",
  bird: "Migratory birds",
  grasshopper: "Grasshopper",
  mantis: "Mantis shrimp",
  shark: "Shark",
  dragonfly: "Dragonfly",
};

const RAD = Math.PI / 180;
const DAY_MS = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;
const OBLIQUITY = RAD * 23.4397;

let cameras = [];
let cameraIndex = 0;
let hlsPlayer = null;
let shownUrl = "";
let playGeneration = 0;

if (reduceMotion.matches) {
  document.body.classList.add("reduce-motion");
}

function toJulian(date) {
  const ms = date instanceof Date ? date.getTime() : date;
  return ms / DAY_MS - 0.5 + J1970;
}

function fromJulian(julian) {
  return new Date((julian + 0.5 - J1970) * DAY_MS);
}

function sunEvent(date, lat, lon, altitude) {
  const lw = RAD * -lon;
  const phi = RAD * lat;
  const days = toJulian(date) - J2000;
  const cycle = Math.round(days - 0.0009 - lw / (2 * Math.PI));
  const transit = 0.0009 + lw / (2 * Math.PI) + cycle;
  const anomaly = RAD * (357.5291 + 0.98560028 * transit);
  const center = RAD * (1.9148 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly) + 0.0003 * Math.sin(3 * anomaly));
  const longitude = anomaly + center + RAD * 102.9372 + Math.PI;
  const declination = Math.asin(Math.sin(OBLIQUITY) * Math.sin(longitude));
  const hourAngle = Math.acos(
    (Math.sin(altitude) - Math.sin(phi) * Math.sin(declination)) /
      (Math.cos(phi) * Math.cos(declination))
  );
  const eventTransit = 0.0009 + (hourAngle + lw) / (2 * Math.PI) + cycle;
  return fromJulian(J2000 + eventTransit + 0.0053 * Math.sin(anomaly) - 0.0069 * Math.sin(2 * longitude));
}

function sunsetThisHour(lat, lon, now) {
  try {
    const sunset = sunEvent(now, lat, lon, -0.833 * RAD).getTime();
    const hourStart = Math.floor(now / HOUR_MS) * HOUR_MS;
    return sunset >= hourStart && sunset < hourStart + HOUR_MS;
  } catch (error) {
    return false;
  }
}

function streamSeconds() {
  if (video.readyState >= 2 && Number.isFinite(video.currentTime)) return video.currentTime;
  const drift = document.body.classList.contains("reduce-motion")
    ? Math.floor(performance.now() / 4000)
    : performance.now() / 1000;
  return drift;
}

const visionFan = document.getElementById("vision-fan");
const visionHub = visionFan.querySelector(".corner");
let fanCloseTimer = 0;
let fanTouch = false;

function fanOpen() {
  if (visionFan.classList.contains("is-shut")) return false;
  return (
    visionFan.matches(":hover") ||
    visionFan.matches(":focus-within") ||
    visionFan.classList.contains("is-open") ||
    visionFan.classList.contains("is-hot")
  );
}

function syncFan() {
  const open = fanOpen();
  visionHub.setAttribute("aria-expanded", open ? "true" : "false");
  visionButtons.forEach((button) => {
    button.tabIndex = open ? 0 : -1;
    button.setAttribute("aria-hidden", open ? "false" : "true");
  });
}

function setVision(button) {
  const vision = button.dataset.vision || "";
  document.body.dataset.vision = vision;
  visionFan.dataset.vision = vision;
  visionButtons.forEach((item) => {
    const on = item === button;
    item.classList.toggle("is-on", on);
    item.setAttribute("aria-pressed", on ? "true" : "false");
  });
  visionName.textContent = VISION_NAMES[vision] || "";
  visionName.hidden = !vision;
}

visionButtons.forEach((button) => {
  button.addEventListener("click", () => setVision(button));
});

visionFan.addEventListener("pointerdown", (event) => {
  fanTouch = event.pointerType === "touch";
});

visionHub.addEventListener("click", () => {
  if (!fanTouch) return;
  fanTouch = false;
  const open = !visionFan.classList.contains("is-open");
  visionFan.classList.toggle("is-open", open);
  visionFan.classList.toggle("is-shut", !open);
  if (!open && visionFan.contains(document.activeElement)) document.activeElement.blur();
  syncFan();
});

visionFan.addEventListener("pointerenter", (event) => {
  if (event.pointerType === "touch") return;
  window.clearTimeout(fanCloseTimer);
  visionFan.classList.remove("is-shut");
  visionFan.classList.add("is-hot");
  syncFan();
});

visionFan.addEventListener("pointerleave", () => {
  window.clearTimeout(fanCloseTimer);
  fanCloseTimer = window.setTimeout(() => {
    visionFan.classList.remove("is-hot");
    syncFan();
  }, 220);
});

visionFan.addEventListener("focusin", () => {
  visionFan.classList.remove("is-shut");
  syncFan();
});
visionFan.addEventListener("focusout", (event) => {
  if (visionFan.contains(event.relatedTarget)) return;
  window.setTimeout(syncFan, 0);
});

visionFan.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  visionFan.classList.remove("is-open", "is-hot");
  visionFan.classList.add("is-shut");
  if (visionFan.contains(document.activeElement)) document.activeElement.blur();
  syncFan();
});

document.addEventListener("pointerdown", (event) => {
  if (visionFan.contains(event.target)) return;
  if (!fanOpen()) return;
  visionFan.classList.remove("is-open", "is-hot");
  visionFan.classList.add("is-shut");
  syncFan();
});

reduceMotion.addEventListener("change", (event) => {
  document.body.classList.toggle("reduce-motion", event.matches);
});

function showsSunsetSky(props) {
  const scene = props.scene_type || "";
  const environment = props.environment || "";
  const name = `${props.name || ""} ${props.display_name || ""}`.toLowerCase();
  if (scene === "traffic" || scene === "highway" || environment === "traffic") return false;
  if (/\bi-?\d+\b|highway|freeway|interstate/.test(name)) return false;
  if (name.includes("magelang")) return false;
  return true;
}

function chooseCameras(features) {
  const now = Date.now();
  const chosen = [];
  features.forEach((feature) => {
    const props = feature.properties || {};
    const coords = feature.geometry && feature.geometry.coordinates;
    const kind = props.url_type;
    if (!props.url || (kind !== "hls" && kind !== "mjpeg" && kind !== "mp4")) return;
    if (props.coordinates_quality === "country_centroid" || !coords) return;
    if (!showsSunsetSky(props)) return;
    const lon = Number(coords[0]);
    const lat = Number(coords[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    if (!sunsetThisHour(lat, lon, now)) return;
    chosen.push({
      url: props.url,
      kind,
      name: props.name || props.display_name || "",
      attribution: props.attribution || "",
    });
  });
  EXTRA_CAMERAS.forEach((camera) => {
    if (!sunsetThisHour(camera.lat, camera.lon, now)) return;
    chosen.push({
      url: camera.url,
      kind: "hls",
      name: camera.name,
      attribution: camera.attribution,
    });
  });
  const rank = { hls: 0, mjpeg: 1, mp4: 2 };
  chosen.sort((a, b) => rank[a.kind] - rank[b.kind]);
  return chosen;
}

async function finiteFile(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    const length = Number(response.headers.get("content-length"));
    return response.ok && Number.isFinite(length) && length > 0;
  } catch (error) {
    return false;
  }
}

function mediaSize(media) {
  return {
    width: media.videoWidth || media.naturalWidth || 0,
    height: media.videoHeight || media.naturalHeight || 0,
  };
}

function byte(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}

function makeLift(exp, floor) {
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i += 1) {
    const t = Math.pow(i / 255, exp);
    lut[i] = byte((floor + (1 - floor) * t) * 255);
  }
  return lut;
}

const LIFT_DOG = makeLift(0.94, 0.045);
const LIFT_CAT = makeLift(0.82, 0.11);

const MANTIS_BANDS = 18;
const mantisBand = new Uint8Array(MANTIS_BANDS * 3);

function mantisHue(h) {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const q = 255 * (1 - f);
  const t = 255 * f;
  switch (i % 6) {
    case 0: return [255, t, 0];
    case 1: return [q, 255, 0];
    case 2: return [0, 255, t];
    case 3: return [0, q, 255];
    case 4: return [t, 0, 255];
    default: return [255, 0, q];
  }
}

for (let band = 0; band < MANTIS_BANDS; band += 1) {
  const h = band / MANTIS_BANDS;
  const rgb = mantisHue(h);
  if (h < 0.06 || h > 0.94) {
    rgb[1] *= 0.35;
    rgb[2] *= 0.35;
  } else if (h > 0.55 && h < 0.78) {
    rgb[0] = Math.min(255, rgb[0] + 70);
  }
  mantisBand[band * 3] = byte(rgb[0]);
  mantisBand[band * 3 + 1] = byte(rgb[1]);
  mantisBand[band * 3 + 2] = byte(rgb[2]);
}

const POLAR = {
  grasshopper: { angle: 24, spacing: 28, thickness: 2 },
  mantis: { angle: 97, spacing: 15, thickness: 1 },
  dragonfly: { angle: 132, spacing: 20, thickness: 1 },
};

const scratch = [0, 0, 0];

function rgb(r, g, b) {
  scratch[0] = r;
  scratch[1] = g;
  scratch[2] = b;
  return scratch;
}

function paintDog(r, g, b) {
  const y = (r + g) / 2;
  const l = 0.3 * r + 0.5 * g + 0.2 * b;
  const warm = Math.max(0, y - b);
  const cool = Math.max(0, b - y);
  return rgb(
    LIFT_DOG[byte(l + warm * 0.16 - cool * 0.42)],
    LIFT_DOG[byte(l + warm * 0.05 - cool * 0.42)],
    LIFT_DOG[byte(l - warm * 0.48 + cool * 0.62)]
  );
}

function paintCat(r, g, b) {
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  if (chroma < 14) {
    const c = LIFT_CAT[byte(0.3 * r + 0.59 * g + 0.11 * b)];
    return rgb(c, c, c);
  }
  const gCone = g * 0.9 + r * 0.08;
  const seen = 0.35 * r + 0.45 * g + 0.2 * b;
  const mute = Math.min(1, Math.max(0, (r - g) / 110));
  let nr = gCone * 0.46 + b * 0.16;
  let ng = gCone * 1.02 + b * 0.04;
  let nb = b * 1.08 + g * 0.1;
  if (b > r && b > g) nr += b * 0.12;
  nr = nr * (1 - mute) + seen * 0.58 * mute;
  ng = ng * (1 - mute) + seen * 0.54 * mute;
  nb = nb * (1 - mute) + seen * 0.38 * mute;
  return rgb(LIFT_CAT[byte(nr)], LIFT_CAT[byte(ng)], LIFT_CAT[byte(nb)]);
}

function paintMonarch(r, g, b) {
  const warm = Math.max(0, Math.min(r, g * 1.15) - b);
  return rgb(
    byte(r * 1.02 + b * 0.08 + warm * 0.14),
    byte(g * 1.12 + warm * 0.08),
    byte(b * 1.14 + r * 0.02)
  );
}

function paintBee(r, g, b) {
  const redExcess = r - g * 1.55 - b * 0.4;
  const redDark = redExcess > 24 ? Math.min(1, (redExcess - 24) / 110) : 0;
  const yg = g * 0.7 + Math.min(r, g * 1.1) * 0.3;
  let nr = Math.min(r, g * 1.05) * 0.48 + b * 0.7;
  let ng = g * 1.04 + Math.min(r, g) * 0.14;
  let nb = b * 1.2 + g * 0.06;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  const purple = chroma < 28 ? 0 : (Math.min(yg, b) / 255) * Math.min(1, chroma / 90);
  nr += purple * 48;
  nb += purple * 28;
  ng *= 1 - purple * 0.2;
  const dark = 20;
  return rgb(
    byte(nr * (1 - redDark) + dark * redDark),
    byte(ng * (1 - redDark) + dark * redDark),
    byte(nb * (1 - redDark) + (dark + 6) * redDark)
  );
}

function paintBird(r, g, b) {
  return rgb(byte(r * 1.02 + b * 0.07), byte(g * 1.04), byte(b * 1.1 + r * 0.015));
}

function paintGrasshopper(r, g, b) {
  const nr = r * 0.56 + b * 0.05 + g * 0.06;
  const ng = g * 1.16 + b * 0.1 + r * 0.04;
  const nb = b * 1.2 + g * 0.1 + r * 0.05;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  const mix = Math.min(1, 0.28 + chroma / 90);
  return rgb(
    byte(r * (1 - mix) + nr * mix),
    byte(g * (1 - mix) + ng * mix),
    byte(b * (1 - mix) + nb * mix)
  );
}

function paintMantis(r, g, b) {
  const max = r > g ? (r > b ? r : b) : g > b ? g : b;
  const min = r < g ? (r < b ? r : b) : g < b ? g : b;
  const d = max - min;
  const level = Math.min(255, Math.round(max / 51) * 51);
  if (d < 18) return rgb(level, level, level);
  let h;
  if (max === r) h = (g - b) / d;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  if (h < 0) h += 6;
  const band = Math.round((h / 6) * MANTIS_BANDS) % MANTIS_BANDS;
  const scale = level / 255;
  return rgb(
    byte(mantisBand[band * 3] * scale),
    byte(mantisBand[band * 3 + 1] * scale),
    byte(mantisBand[band * 3 + 2] * scale)
  );
}

function paintShark(r, g, b) {
  const x = (0.3 * r + 0.52 * g + 0.18 * b) / 255;
  let t = 0.07 + 0.93 * Math.pow(x, 0.8);
  t = (t - 0.5) * 1.15 + 0.5;
  const c = byte(Math.min(1, Math.max(0, t)) * 255);
  return rgb(c, c, c);
}

function paintDragonfly(r, g, b) {
  let nr = r * 1.26 + b * 0.16;
  let ng = g * 0.98;
  let nb = b * 1.16;
  if (r > g * 1.35 && r > b * 1.2) {
    ng *= 0.72;
    nb *= 0.62;
    nr = Math.min(255, nr + 8);
  } else if (b > r && b > g) {
    nr += b * 0.08;
  }
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  const mix = Math.min(1, chroma / 48);
  return rgb(
    byte(r * (1 - mix) + nr * mix),
    byte(g * (1 - mix) + ng * mix),
    byte(b * (1 - mix) + nb * mix)
  );
}

const VISION_PAINT = {
  dog: paintDog,
  cat: paintCat,
  monarch: paintMonarch,
  bee: paintBee,
  bird: paintBird,
  grasshopper: paintGrasshopper,
  mantis: paintMantis,
  shark: paintShark,
  dragonfly: paintDragonfly,
};

function applyVisionPixels(data, width, height, vision, seconds) {
  const paintPixel = VISION_PAINT[vision];
  if (!paintPixel) return;
  const polar = POLAR[vision];
  let cos = 0;
  let sin = 0;
  let shift = 0;
  let spacing = 1;
  let thickness = 0;
  if (polar) {
    const theta = ((polar.angle + seconds * 4) % 180) * (Math.PI / 180);
    cos = Math.cos(theta);
    sin = Math.sin(theta);
    spacing = polar.spacing;
    thickness = polar.thickness;
    shift = seconds * 28;
  }
  for (let y = 0, i = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1, i += 4) {
      const next = paintPixel(data[i], data[i + 1], data[i + 2]);
      let r = next[0];
      let g = next[1];
      let b = next[2];
      if (polar) {
        let coord = x * cos + y * sin + shift;
        coord -= Math.floor(coord / spacing) * spacing;
        if (coord < 0) coord += spacing;
        if (coord < thickness) {
          r = r * 0.93 + 17.85;
          g = g * 0.93 + 17.85;
          b = b * 0.93 + 17.85;
        }
      }
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }
}

function paint(media) {
  const size = mediaSize(media);
  if (size.width < 2 || size.height < 2) return false;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const pixelWidth = Math.round(canvas.clientWidth * dpr);
  const pixelHeight = Math.round(canvas.clientHeight * dpr);
  if (pixelWidth < 2 || pixelHeight < 2) return false;
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  const scale = pixelWidth / size.width;
  const destWidth = pixelWidth;
  const destHeight = size.height * scale;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#140c09";
  ctx.fillRect(0, 0, pixelWidth, pixelHeight);
  ctx.drawImage(media, (pixelWidth - destWidth) / 2, (pixelHeight - destHeight) / 2, destWidth, destHeight);
  const vision = document.body.dataset.vision || "";
  if (vision) {
    try {
      const image = ctx.getImageData(0, 0, pixelWidth, pixelHeight);
      applyVisionPixels(image.data, pixelWidth, pixelHeight, vision, streamSeconds());
      ctx.putImageData(image, 0, 0);
    } catch (error) {
      // A tainted frame stays as drawn instead of clearing the picture.
    }
  }
  return true;
}

function activeMedia() {
  if (mjpeg.src && !mjpeg.hidden && mjpeg.naturalWidth) return mjpeg;
  if (video.readyState >= 2 && video.videoWidth) return video;
  return null;
}

function drawFrame() {
  const media = activeMedia();
  if (media && paint(media)) empty.hidden = true;
  window.requestAnimationFrame(drawFrame);
}

function stopPlayback() {
  if (hlsPlayer) {
    hlsPlayer.destroy();
    hlsPlayer = null;
  }
  video.pause();
  video.removeAttribute("src");
  video.load();
  mjpeg.removeAttribute("src");
  mjpeg.hidden = true;
}

function playStream(camera) {
  stopPlayback();
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(ok);
    };
    const timer = window.setTimeout(() => finish(false), 10000);
    if (camera.kind === "mjpeg") {
      mjpeg.hidden = false;
      mjpeg.onload = () => finish(mjpeg.naturalWidth > 0);
      mjpeg.onerror = () => finish(false);
      mjpeg.src = camera.url;
      return;
    }
    const startVideo = () => {
      const play = video.play();
      if (play && play.catch) play.catch(() => {});
    };
    if (camera.kind === "hls" && window.Hls && Hls.isSupported()) {
      hlsPlayer = new Hls({ enableWorker: false, manifestLoadingTimeOut: 8000, levelLoadingTimeOut: 8000 });
      hlsPlayer.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) finish(false);
      });
      hlsPlayer.on(Hls.Events.MANIFEST_PARSED, startVideo);
      hlsPlayer.loadSource(camera.url);
      hlsPlayer.attachMedia(video);
      video.onloadeddata = () => {
        if (video.videoWidth > 0) finish(true);
      };
      return;
    }
    video.onloadeddata = () => {
      if (video.videoWidth > 0) finish(true);
    };
    video.onerror = () => finish(false);
    video.src = camera.url;
    startVideo();
  });
}

function showCredit(camera) {
  const name = camera && camera.attribution;
  if (!name) {
    credit.hidden = true;
    credit.removeAttribute("href");
    credit.textContent = "";
    return;
  }
  credit.hidden = false;
  credit.textContent = name;
  credit.removeAttribute("href");
}

function showEmpty(message) {
  stopPlayback();
  cameras = [];
  cameraIndex = 0;
  shownUrl = "";
  showCredit(null);
  updateNav();
  empty.hidden = false;
  empty.textContent = message;
  prevButton.hidden = true;
  nextButton.hidden = true;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function updateNav() {
  const several = cameras.length > 1;
  prevButton.hidden = !several;
  nextButton.hidden = !several;
  if (!cameras.length) {
    cameraCount.hidden = true;
    cameraCount.textContent = "";
    return;
  }
  cameraCount.hidden = false;
  cameraCount.textContent = cameras.length === 1
    ? "1 camera near sunset"
    : `${cameraIndex + 1} of ${cameras.length} cameras near sunset`;
}

async function showCurrent(attempt = 0) {
  const generation = attempt === 0 ? ++playGeneration : playGeneration;
  const camera = cameras[cameraIndex];
  if (!camera || attempt > cameras.length) {
    showEmpty("No cameras are near sunset right now.");
    return;
  }
  if (camera.kind === "mp4" && await finiteFile(camera.url)) {
    if (generation !== playGeneration) return;
    cameras.splice(cameraIndex, 1);
    if (cameraIndex >= cameras.length) cameraIndex = 0;
    await showCurrent(attempt + 1);
    return;
  }
  showCredit(camera);
  updateNav();
  const ok = await playStream(camera);
  if (generation !== playGeneration) return;
  if (!ok) {
    cameras.splice(cameraIndex, 1);
    if (cameraIndex >= cameras.length) cameraIndex = 0;
    await showCurrent(attempt + 1);
    return;
  }
  shownUrl = camera.url;
  empty.hidden = true;
}

function stepCamera(delta) {
  if (cameras.length < 2) return;
  cameraIndex = (cameraIndex + delta + cameras.length) % cameras.length;
  showCurrent();
}

prevButton.addEventListener("click", () => stepCamera(-1));
nextButton.addEventListener("click", () => stepCamera(1));
window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") stepCamera(-1);
  if (event.key === "ArrowRight") stepCamera(1);
});

async function refreshCameras() {
  try {
    const response = await fetch(CATALOG);
    if (!response.ok) throw new Error(String(response.status));
    const data = await response.json();
    const next = chooseCameras(data.features || []);
    const currentUrl = cameras[cameraIndex] && cameras[cameraIndex].url;
    cameras = next;
    const kept = cameras.findIndex((camera) => camera.url === currentUrl);
    cameraIndex = kept >= 0 ? kept : 0;
    if (!cameras.length) {
      showEmpty("No cameras are near sunset right now.");
      return;
    }
    updateNav();
    if (kept < 0 || shownUrl !== cameras[cameraIndex].url) await showCurrent();
  } catch (error) {
    if (!cameras.length) showEmpty("The camera list could not be loaded.");
  }
}

drawFrame();
refreshCameras();
window.setInterval(refreshCameras, 5 * 60 * 1000);
