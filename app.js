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
