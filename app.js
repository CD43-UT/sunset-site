const VIDEO_URL = "https://upload.wikimedia.org/wikipedia/commons/c/c6/Sunset_in_Pantai_Kukup.webm";

const visionButtons = [...document.querySelectorAll(".circle")];
const visionName = document.getElementById("vision-name");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const video = document.getElementById("picture");
const canvas = document.getElementById("frame");
const ctx = canvas.getContext("2d", { alpha: false });

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

if (reduceMotion.matches) {
  document.body.classList.add("reduce-motion");
}

function streamSeconds() {
  const time = Number(video.currentTime);
  if (Number.isFinite(time) && time > 0.05) return time;
  return performance.now() / 1000;
}

function placePolar(vision) {
  const wash = document.getElementById("vision-wash");
  const base = POLAR_BASE[vision];
  if (base == null) return;
  const seconds = streamSeconds();
  const motion = document.body.classList.contains("reduce-motion") ? Math.floor(seconds / 4) : seconds;
  const angle = (base + motion * 4) % 180;
  const shift = (motion * 6 + POLAR_SHIFT[vision]) % 48;
  wash.style.setProperty("--polar-angle", `${angle.toFixed(2)}deg`);
  wash.style.setProperty("--polar-shift", `${shift.toFixed(2)}px`);
}

function setVision(button) {
  const vision = button.dataset.vision || "";
  document.body.dataset.vision = vision;
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

function startVideo() {
  video.muted = true;
  video.defaultMuted = true;
  const play = video.play();
  if (play && typeof play.catch === "function") {
    play.catch(() => {});
  }
}

if (video.getAttribute("src") !== VIDEO_URL) {
  video.src = VIDEO_URL;
}
video.crossOrigin = "anonymous";

function paintFrame() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssWidth = canvas.clientWidth;
  const cssHeight = canvas.clientHeight;
  const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
  const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  const frameWidth = video.videoWidth;
  const frameHeight = video.videoHeight;
  if (frameWidth && frameHeight && video.readyState >= 2) {
    const scale = Math.max(pixelWidth / frameWidth, pixelHeight / frameHeight);
    const destWidth = frameWidth * scale;
    const destHeight = frameHeight * scale;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(video, (pixelWidth - destWidth) / 2, (pixelHeight - destHeight) / 2, destWidth, destHeight);
  }
  window.requestAnimationFrame(paintFrame);
}

video.addEventListener("canplay", startVideo);
startVideo();
tickPolar();
paintFrame();
