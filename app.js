const SLIDE_MS = 560;

const frames = [document.getElementById("frame-a"), document.getElementById("frame-b")];
const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let photos = [];
let photoIndex = 0;
let front = 0;
let generation = 0;
let sliding = false;

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

function preload(url) {
  if (!url) return;
  const image = new Image();
  image.src = url;
}

function preloadNeighbors() {
  if (photos.length < 2) return;
  preload(photos[(photoIndex + 1) % photos.length].url);
  preload(photos[(photoIndex - 1 + photos.length) % photos.length].url);
}

function place(frame, side, instant) {
  frame.classList.toggle("is-instant", instant);
  frame.classList.toggle("is-current", side === "current");
  frame.classList.toggle("is-left", side === "left");
  frame.classList.toggle("is-right", side === "right");
}

function showPhoto(index, direction) {
  if (!photos.length || sliding) return;
  const nextIndex = ((index % photos.length) + photos.length) % photos.length;
  if (direction && (photos.length < 2 || nextIndex === photoIndex)) return;

  const photo = photos[nextIndex];
  const token = ++generation;
  const incoming = frames[1 - front];
  const outgoing = frames[front];

  const finish = () => {
    if (token !== generation) return;
    incoming.classList.remove("is-incoming");
    incoming.alt = photo.title;
    outgoing.alt = "";
    front = 1 - front;
    photoIndex = nextIndex;
    sliding = false;
    preloadNeighbors();
  };

  const animate = () => {
    if (token !== generation) return;
    if (!direction || reduceMotion.matches) {
      place(incoming, "current", true);
      place(outgoing, "right", true);
      finish();
      return;
    }

    sliding = true;
    incoming.classList.add("is-incoming");
    place(incoming, direction > 0 ? "right" : "left", true);
    incoming.getBoundingClientRect();
    place(incoming, "current", false);
    place(outgoing, direction > 0 ? "left" : "right", false);

    let settled = false;
    const settle = (event) => {
      if (settled) return;
      if (event && (event.target !== incoming || event.propertyName !== "transform")) return;
      settled = true;
      incoming.removeEventListener("transitionend", settle);
      finish();
    };
    incoming.addEventListener("transitionend", settle);
    window.setTimeout(settle, SLIDE_MS + 140);
  };

  const fail = () => {
    if (token !== generation) return;
    incoming.removeEventListener("load", animate);
    photos.splice(nextIndex, 1);
    sliding = false;
    if (!photos.length) return;
    showPhoto(direction < 0 ? nextIndex - 1 : nextIndex, direction);
  };

  incoming.addEventListener("load", animate, { once: true });
  incoming.addEventListener("error", fail, { once: true });

  if (incoming.src === photo.url && incoming.complete && incoming.naturalWidth) {
    incoming.removeEventListener("load", animate);
    incoming.removeEventListener("error", fail);
    animate();
    return;
  }

  incoming.src = photo.url;
}

function go(direction) {
  showPhoto(photoIndex + direction, direction);
}

prevButton.addEventListener("click", () => go(-1));
nextButton.addEventListener("click", () => go(1));

document.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const tag = event.target && event.target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  if (event.key === "ArrowRight") {
    event.preventDefault();
    go(1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    go(-1);
  }
});

reduceMotion.addEventListener("change", (event) => {
  document.body.classList.toggle("reduce-motion", event.matches);
});

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
  showPhoto(0, 0);
}

loadPhotos().catch(() => {});
