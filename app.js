const CATALOG = "https://raw.githubusercontent.com/willytop8/Live-Environment-Streams/main/streams.geojson";
const HOUR_MS = 60 * 60 * 1000;

// Public HLS cameras added where the catalog's longitudes leave a gap in the sunset window.
const EXTRA_CAMERAS = [
  { name: "East Auckland", lat: -36.781, lon: 174.994, url: "https://s127.ipcamlive.com/streams/7fw6t1rpgfzojagvk/stream.m3u8", attribution: "New Plymouth Sport Fishing and Underwater Club" },
  { name: "Plantation Island, Malolo Lailai", lat: -17.783, lon: 177.158, url: "https://s107.ipcamlive.com/streams/6bjsxqxujpac6chnm/stream.m3u8", attribution: "Plantation Island Resort" },
  { name: "Fa'a'ā Airport, Tahiti", lat: -17.559, lon: -149.608, url: "https://s81.ipcamlive.com/streams/51lrjb7qwnfa342ex/stream.m3u8", attribution: "Fa'a'ā International Airport" },
  { name: "Liverpool, Nova Scotia", lat: 44.038, lon: -64.717, url: "https://5790d294af2dc.streamlock.net/IPCameraQCCRFMRadio/default.stream/playlist.m3u8", attribution: "QCCR 99.3 FM" },
  { name: "Villa Gesell beach", lat: -37.256, lon: -56.967, url: "https://cam104.gesell.com.ar/playlist.m3u8", attribution: "Municipio de Villa Gesell" },
  { name: "Ubatuba, SP-055", lat: -23.518, lon: -45.201, url: "https://34.104.32.249.nip.io/SP055-KM073/stream.m3u8", attribution: "Rodovias de São Paulo" },
  { name: "Santa Maria harbour, Sal", lat: 16.597, lon: -22.917, url: "https://s75.ipcamlive.com/streams/4bhb1vl9xdzambqz0/stream.m3u8", attribution: "Santa Maria, Cape Verde" },
  { name: "Playa Paraíso, Adeje", lat: 28.121, lon: -16.778, url: "https://cdn-005.whatsupcams.com/hls/es_tenerife01.m3u8", attribution: "WhatsUpCams" },
  { name: "Fenit harbour", lat: 52.273, lon: -9.863, url: "https://cdn-004.whatsupcams.com/hls/ie_tralee01.m3u8", attribution: "WhatsUpCams" },
  { name: "Doñana", lat: 37.0, lon: -6.37, url: "http://streaming-camaras.ebd.csic.es/cams/cam04.m3u8", attribution: "Estación Biológica de Doñana" },
  { name: "Biarritz Grande Plage", lat: 43.483, lon: -1.558, url: "https://live.viewsurf.com/liveedge/biarritzgrandeplage_1_1.stream/playlist.m3u8", attribution: "Viewsurf" },
  { name: "Akti Kontogialos, Corfu", lat: 39.62, lon: 19.92, url: "https://corfulive.gr/akti_kontogialos/akti_kontogialos.m3u8", attribution: "Corfu Live" },
  { name: "Velikiye Luki", lat: 56.34, lon: 30.545, url: "https://video.iluki.ru/VLK-MAT-1-PUB-4/index.m3u8", attribution: "Velikiye Luki" },
  { name: "Astrakhan", lat: 46.35, lon: 48.033, url: "http://dvr.astrakhan.ru/kuli-46-hd-1/index.m3u8", attribution: "Astrakhan" },
  { name: "Yekaterinburg", lat: 56.838, lon: 60.605, url: "http://31.131.80.2:8080/d16c8e89-0ca1-4c5c-ad84-f657f93fb5ef/mono.m3u8", attribution: "Yekaterinburg" },
  { name: "Shymbulak, Almaty", lat: 43.13, lon: 77.08, url: "https://ipcam.kz/cam1/tracks-v1/mono.m3u8", attribution: "Shymbulak" },
  { name: "Barnaul", lat: 53.348, lon: 83.776, url: "https://live.katun24.ru:8082/stroteley_soch/index.m3u8", attribution: "Katun 24" },
  { name: "Krasnoyarsk", lat: 56.015, lon: 92.87, url: "http://62.213.36.148:1935/live/kkd2-top.stream/playlist.m3u8", attribution: "Bobrovy Log" },
  { name: "Irkutsk", lat: 52.287, lon: 104.305, url: "http://tv.streams.baikal-telecom.net/CoWorking_IRGUPS/index.m3u8", attribution: "Irkutsk" },
  { name: "Vrangel", lat: 42.73, lon: 132.75, url: "http://city.vtvn.ru:88/hls_65_4/stream_65_4.m3u8", attribution: "Nakhodka" },
  { name: "Magadan", lat: 59.568, lon: 150.808, url: "http://rec.maglan.ru:8080/hls/101863/985606ad36895351906f/playlist.m3u8", attribution: "Magadan" },
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

const POLAR_BASE = { grasshopper: 24, mantis: 97, dragonfly: 132 };
const POLAR_SHIFT = { grasshopper: 0, mantis: 9, dragonfly: 18 };

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

function nearSunset(lat, lon, now) {
  try {
    const sunset = sunEvent(now, lat, lon, -0.833 * RAD);
    const civilEnd = sunEvent(now, lat, lon, -6 * RAD);
    return now >= sunset.getTime() - HOUR_MS && now <= civilEnd.getTime();
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

function placePolar(vision) {
  const wash = document.getElementById("vision-wash");
  const base = POLAR_BASE[vision];
  if (base == null) return;
  const motion = streamSeconds();
  wash.style.setProperty("--polar-angle", `${((base + motion * 4) % 180).toFixed(2)}deg`);
  wash.style.setProperty("--polar-shift", `${((motion * 6 + POLAR_SHIFT[vision]) % 48).toFixed(2)}px`);
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
  canvas.style.filter = vision ? `url(#vision-${vision})` : "none";
  placePolar(vision);
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

function tickPolar() {
  placePolar(document.body.dataset.vision || "");
  window.requestAnimationFrame(tickPolar);
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
    const lon = Number(coords[0]);
    const lat = Number(coords[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    if (!nearSunset(lat, lon, now)) return;
    chosen.push({
      url: props.url,
      kind,
      name: props.name || props.display_name || "",
      attribution: props.attribution || "",
    });
  });
  EXTRA_CAMERAS.forEach((camera) => {
    if (!nearSunset(camera.lat, camera.lon, now)) return;
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

tickPolar();
drawFrame();
refreshCameras();
window.setInterval(refreshCameras, 5 * 60 * 1000);
