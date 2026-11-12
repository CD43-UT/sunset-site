const VIDEO_API = "https://yt.chocolatemoo53.com/api/v1/videos/2occtpoOu_w";
const STORYBOARD_TEMPLATE =
  "https://i.ytimg.com/sb/2occtpoOu_w/storyboard_live_90_3x3_b2/M$M.jpg?rs=AOn4CLD_pILXDD5gORYBBNmYvM91Re3fqA";
const COLS = 3;
const ROWS = 3;
const FRAME_MS = 5000;

const visionButtons = [...document.querySelectorAll(".circle")];
const visionName = document.getElementById("vision-name");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const canvas = document.getElementById("picture");
const ctx = canvas.getContext("2d");

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

let template = STORYBOARD_TEMPLATE;
let sheet = null;
let sheetIndex = 0;
let cell = 0;
let frameClock = 0;
let frameMarkedAt = performance.now();

if (reduceMotion.matches) {
  document.body.classList.add("reduce-motion");
}

function streamSeconds() {
  return frameClock + (performance.now() - frameMarkedAt) / 1000;
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

function sheetUrl(index, bust) {
  const url = template.replace("$M", String(index));
  if (!bust) return url;
  return `${url}${url.includes("?") ? "&" : "?"}n=${Date.now()}`;
}

function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function latestIndex() {
  let lo = 0;
  let hi = 1;
  while (await loadImage(sheetUrl(hi, false))) {
    lo = hi;
    hi *= 2;
    if (hi > 8000000) break;
  }
  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (await loadImage(sheetUrl(mid, false))) lo = mid;
    else hi = mid;
  }
  return lo;
}

function draw() {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const pixelWidth = Math.max(1, Math.floor(width * dpr));
  const pixelHeight = Math.max(1, Math.floor(height * dpr));
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (!sheet) {
    ctx.fillStyle = "#140c09";
    ctx.fillRect(0, 0, width, height);
    return;
  }
  const cellWidth = sheet.naturalWidth / COLS;
  const cellHeight = sheet.naturalHeight / ROWS;
  const col = cell % COLS;
  const row = Math.floor(cell / COLS);
  const scale = Math.max(width / cellWidth, height / cellHeight);
  const destWidth = cellWidth * scale;
  const destHeight = cellHeight * scale;
  ctx.drawImage(
    sheet,
    col * cellWidth,
    row * cellHeight,
    cellWidth,
    cellHeight,
    (width - destWidth) / 2,
    (height - destHeight) / 2,
    destWidth,
    destHeight
  );
}

async function advance() {
  const nextCell = cell + 1;
  if (nextCell < COLS * ROWS) {
    cell = nextCell;
  } else {
    const next = await loadImage(sheetUrl(sheetIndex + 1, true));
    if (next) {
      sheet = next;
      sheetIndex += 1;
      cell = 0;
    }
  }
  frameClock += FRAME_MS / 1000;
  frameMarkedAt = performance.now();
  draw();
}

async function start() {
  try {
    const response = await fetch(VIDEO_API, { headers: { Accept: "application/json" } });
    if (response.ok) {
      const data = await response.json();
      const board = (data.storyboards || []).find((item) => item.templateUrl && item.templateUrl.includes("$M"));
      if (board) template = board.templateUrl;
    }
  } catch (error) {
    template = STORYBOARD_TEMPLATE;
  }
  sheetIndex = await latestIndex();
  sheet = await loadImage(sheetUrl(sheetIndex, false));
  cell = 0;
  frameClock = 0;
  frameMarkedAt = performance.now();
  draw();
  window.setInterval(() => {
    advance();
  }, FRAME_MS);
}

window.addEventListener("resize", draw);
tickPolar();
start();
