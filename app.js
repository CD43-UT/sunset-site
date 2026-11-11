const SLIDE_MS = 5000;

const frames = [document.getElementById("frame-a"), document.getElementById("frame-b")];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let photos = [];
let photoIndex = 0;
let front = 0;
let timer = null;
let playing = false;
let generation = 0;
let slideshowArmed = false;

if (reduceMotion.matches) {
  document.body.classList.add("reduce-motion");
}

function photoTitle(fileTitle) {
  return String(fileTitle || "")
    .replace(/^File:/, "")
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/[_]+/g, " ")
    .trim();
}

function stopTimer() {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

function startTimer() {
  stopTimer();
  if (!playing || photos.length < 2) return;
  timer = setInterval(() => showPhoto(photoIndex + 1), SLIDE_MS);
}

function setPlaying(next) {
  playing = next && photos.length > 1;
  if (playing) startTimer();
  else stopTimer();
}

function showPhoto(index) {
  if (!photos.length) return;
  const nextIndex = (index + photos.length) % photos.length;
  const photo = photos[nextIndex];
  const token = ++generation;
  const incoming = frames[1 - front];
  const outgoing = frames[front];

  const reveal = () => {
    if (token !== generation) return;
    incoming.alt = photo.title;
    outgoing.alt = "";
    incoming.classList.add("is-visible");
    outgoing.classList.remove("is-visible");
    front = 1 - front;
    photoIndex = nextIndex;
    if (!slideshowArmed) {
      slideshowArmed = true;
      setPlaying(!reduceMotion.matches);
    }
    const upcoming = photos[(photoIndex + 1) % photos.length];
    if (upcoming && upcoming.url !== photo.url) {
      const preload = new Image();
      preload.src = upcoming.url;
    }
  };

  const fail = () => {
    if (token !== generation) return;
    incoming.removeEventListener("load", reveal);
    photos.splice(nextIndex, 1);
    if (!photos.length) {
      setPlaying(false);
      return;
    }
    showPhoto(Math.min(nextIndex, photos.length - 1));
  };

  incoming.addEventListener("load", reveal, { once: true });
  incoming.addEventListener("error", fail, { once: true });

  if (incoming.src === photo.url && incoming.complete && incoming.naturalWidth) {
    incoming.removeEventListener("load", reveal);
    incoming.removeEventListener("error", fail);
    reveal();
    return;
  }

  incoming.src = photo.url;
}

async function loadPhotos() {
  const response = await fetch("/api/photos");
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Photo request failed (${response.status})`);
  photos = (data.photos || [])
    .filter((photo) => photo && photo.url)
    .map((photo) => ({
      url: photo.url,
      title: photoTitle(photo.title),
    }));
  if (!photos.length) throw new Error("No sunset photographs were returned.");
  showPhoto(0);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopTimer();
  else if (playing) startTimer();
});

reduceMotion.addEventListener("change", (event) => {
  document.body.classList.toggle("reduce-motion", event.matches);
  if (event.matches) setPlaying(false);
  else if (photos.length > 1) setPlaying(true);
});

loadPhotos().catch(() => {
  setPlaying(false);
});
