const CATALOG = "https://api.openeye.cam/v1/catalog?embeddable=1&limit=50";
const MAX_AGE_S = 10 * 60;
const HOUR_MS = 60 * 60 * 1000;

const visionButtons = [...document.querySelectorAll(".circle")];
const visionName = document.getElementById("vision-name");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const canvas = document.getElementById("frame");
const ctx = canvas.getContext("2d", { alpha: false });
const empty = document.getElementById("empty");
const credit = document.getElementById("credit");
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

const POLAR_BASE = { grasshopper: 24, mantis: 97, dragonfly: 153 };
const POLAR_SHIFT = { grasshopper: 0, mantis: 9, dragonfly: 18 };

const RAD = Math.PI / 180;
const DAY_MS = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;
const OBLIQUITY = RAD * 23.4397;

let cameras = [];
let cameraIndex = 0;
let frameCount = 0;
let shownUrl = "";

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
  const drift = document.body.classList.contains("reduce-motion")
    ? Math.floor(performance.now() / 4000)
    : performance.now() / 1000;
  return frameCount * 5 + drift;
}

function placePolar(vision) {
  const wash = document.getElementById("vision-wash");
  const base = POLAR_BASE[vision];
  if (base == null) return;
  const motion = streamSeconds();
  wash.style.setProperty("--polar-angle", `${((base + motion * 4) % 180).toFixed(2)}deg`);
  wash.style.setProperty("--polar-shift", `${((motion * 6 + POLAR_SHIFT[vision]) % 48).toFixed(2)}px`);
}

function setVision(button) {
  const vision = button.dataset.vision || "";
  document.body.dataset.vision = vision;
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

reduceMotion.addEventListener("change", (event) => {
  document.body.classList.toggle("reduce-motion", event.matches);
});

function tickPolar() {
  placePolar(document.body.dataset.vision || "");
  window.requestAnimationFrame(tickPolar);
}

function cameraUrl(camera) {
  const view = camera.view || {};
  return view.render === "image" ? view.url : "";
}

function chooseCameras(items) {
  const now = Date.now();
  return items.filter((camera) => {
    const age = Number(camera.last_frame_age_s);
    return (
      cameraUrl(camera) &&
      Number.isFinite(camera.lat) &&
      Number.isFinite(camera.lon) &&
      Number.isFinite(age) &&
      age <= MAX_AGE_S &&
      nearSunset(camera.lat, camera.lon, now)
    );
  });
}

function paint(image) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const pixelWidth = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const pixelHeight = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  const scale = Math.max(pixelWidth / image.naturalWidth, pixelHeight / image.naturalHeight);
  const destWidth = image.naturalWidth * scale;
  const destHeight = image.naturalHeight * scale;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, (pixelWidth - destWidth) / 2, (pixelHeight - destHeight) / 2, destWidth, destHeight);
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image"));
    image.src = url;
  });
}

async function showFrame(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return false;
  const type = response.headers.get("content-type") || "";
  if (!type.startsWith("image/")) return false;
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await loadImage(objectUrl);
    if (!image.naturalWidth) return false;
    paint(image);
    frameCount += 1;
    shownUrl = url;
    return true;
  } catch (error) {
    return false;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function showCredit(camera) {
  const attribution = camera && camera.redistribution && camera.redistribution.attribution;
  if (!attribution || !attribution.required || !attribution.name) {
    credit.hidden = true;
    credit.removeAttribute("href");
    credit.textContent = "";
    return;
  }
  credit.hidden = false;
  credit.textContent = attribution.name;
  if (attribution.url) credit.href = attribution.url;
  else credit.removeAttribute("href");
}

function showEmpty(message) {
  cameras = [];
  cameraIndex = 0;
  shownUrl = "";
  showCredit(null);
  empty.hidden = false;
  empty.textContent = message;
  prevButton.hidden = true;
  nextButton.hidden = true;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

async function showCurrent(attempt = 0) {
  const camera = cameras[cameraIndex];
  if (!camera || attempt > cameras.length) {
    showEmpty("No cameras are near sunset right now.");
    return;
  }
  empty.hidden = true;
  showCredit(camera);
  const several = cameras.length > 1;
  prevButton.hidden = !several;
  nextButton.hidden = !several;
  const ok = await showFrame(cameraUrl(camera));
  if (!ok) {
    cameras.splice(cameraIndex, 1);
    if (cameraIndex >= cameras.length) cameraIndex = 0;
    await showCurrent(attempt + 1);
  }
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
window.addEventListener("resize", () => {
  if (shownUrl) showFrame(shownUrl);
});

async function refreshCameras() {
  try {
    const response = await fetch(CATALOG, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(String(response.status));
    const data = await response.json();
    const next = chooseCameras(data.items || []);
    const currentId = cameras[cameraIndex] && cameras[cameraIndex].id;
    cameras = next;
    const kept = cameras.findIndex((camera) => camera.id === currentId);
    cameraIndex = kept >= 0 ? kept : 0;
    if (!cameras.length) {
      showEmpty("No cameras are near sunset right now.");
      return;
    }
    await showCurrent();
  } catch (error) {
    if (!cameras.length) showEmpty("The camera list could not be loaded.");
  }
}

tickPolar();
refreshCameras();
window.setInterval(refreshCameras, 45000);
