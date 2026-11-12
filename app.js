const STREAM_URL = "https://www.youtube.com/watch?v=2occtpoOu_w";

const visionButtons = [...document.querySelectorAll(".circle")];
const visionName = document.getElementById("vision-name");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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

let player = null;
let playerReady = false;

if (reduceMotion.matches) {
  document.body.classList.add("reduce-motion");
}

function streamSeconds() {
  if (playerReady && player && typeof player.getCurrentTime === "function") {
    const time = Number(player.getCurrentTime());
    if (Number.isFinite(time) && time > 0.25) return time;
  }
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

window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    videoId: new URL(STREAM_URL).searchParams.get("v"),
    playerVars: {
      autoplay: 1,
      mute: 1,
      controls: 0,
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
      fs: 0,
      iv_load_policy: 3,
      disablekb: 1,
      origin: location.origin,
    },
    events: {
      onReady(event) {
        playerReady = true;
        event.target.mute();
        event.target.playVideo();
      },
    },
  });
};

const youtubeApi = document.createElement("script");
youtubeApi.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(youtubeApi);
tickPolar();
