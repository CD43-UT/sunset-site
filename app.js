const DEFAULT_PLACE = {
  name: "San Francisco",
  lat: 37.7749,
  lng: -122.4194,
  timeZone: "America/Los_Angeles",
};

const SLIDE_MS = 5000;

const frameA = document.getElementById("frame-a");
const frameB = document.getElementById("frame-b");
const frames = [frameA, frameB];
const placeEl = document.getElementById("place");
const coordsEl = document.getElementById("coords");
const whenEl = document.getElementById("when");
const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");
const daylightEl = document.getElementById("daylight");
const statusEl = document.getElementById("status");
const toggleBtn = document.getElementById("toggle");
const locateBtn = document.getElementById("locate");
const indexEl = document.getElementById("index");
const captionLink = document.getElementById("caption-link");

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

function setStatus(message) {
  statusEl.textContent = message;
}

function formatCoord(lat, lng) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}° ${ns}, ${Math.abs(lng).toFixed(2)}° ${ew}`;
}

function formatClock(iso, timeZone) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

function zoneLabel(timeZone) {
  const parts = new Intl.DateTimeFormat(undefined, {
    timeZone,
    timeZoneName: "short",
  }).formatToParts(new Date());
  return parts.find((part) => part.type === "timeZoneName")?.value || timeZone;
}

function formatDaylight(seconds) {
  let hours = Math.floor(seconds / 3600);
  let minutes = Math.round((seconds % 3600) / 60);
  if (minutes === 60) {
    hours += 1;
    minutes = 0;
  }
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function photoTitle(fileTitle) {
  return String(fileTitle || "")
    .replace(/^File:/, "")
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/[_]+/g, " ")
    .trim();
}

function setPlaying(next) {
  playing = next && photos.length > 1;
  toggleBtn.textContent = playing ? "Pause" : "Play";
  toggleBtn.setAttribute("aria-pressed", playing ? "true" : "false");
  toggleBtn.setAttribute("aria-label", playing ? "Pause slideshow" : "Play slideshow");
  toggleBtn.disabled = photos.length < 2;
  if (playing) startTimer();
  else stopTimer();
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
    indexEl.textContent = `${photoIndex + 1} / ${photos.length}`;
    captionLink.textContent = `${photo.title} · Wikimedia Commons`;
    captionLink.href = photo.page;
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
      setStatus("Sunset photographs could not be loaded.");
      indexEl.textContent = "";
      captionLink.textContent = "";
      captionLink.removeAttribute("href");
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

async function loadTimes(lat, lng, name, timeZone) {
  const zone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  placeEl.textContent = name;
  coordsEl.textContent = formatCoord(lat, lng);
  const url = new URL("https://api.sunrise-sunset.org/json");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lng", String(lng));
  url.searchParams.set("formatted", "0");
  url.searchParams.set("tzid", zone);

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Times request failed (${response.status})`);
    const data = await response.json();
    if (data.status !== "OK" || !data.results) {
      throw new Error(data.status || "Times request failed");
    }
    sunriseEl.textContent = formatClock(data.results.sunrise, zone);
    sunsetEl.textContent = formatClock(data.results.sunset, zone);
    daylightEl.textContent = formatDaylight(data.results.day_length);
    const today = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: zone,
    }).format(new Date());
    whenEl.textContent = `${today} · ${zoneLabel(zone)}`;
  } catch (error) {
    sunriseEl.textContent = "—";
    sunsetEl.textContent = "—";
    daylightEl.textContent = "—";
    setStatus(error.message || "Could not load sunrise and sunset times.");
  }
}

async function loadPhotos() {
  setStatus("Loading sunset photographs…");
  const response = await fetch("/api/photos");
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Photo request failed (${response.status})`);
  }
  photos = (data.photos || [])
    .filter((photo) => photo && photo.url)
    .map((photo) => ({
      url: photo.url,
      page: photo.page || "https://commons.wikimedia.org/wiki/Category:Sunsets",
      title: photoTitle(photo.title),
    }));
  if (!photos.length) throw new Error("No sunset photographs were returned.");
  if (statusEl.textContent.startsWith("Loading")) setStatus("");
  showPhoto(0);
}

toggleBtn.addEventListener("click", () => {
  setPlaying(!playing);
});

locateBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("Location is not available in this browser.");
    return;
  }
  locateBtn.disabled = true;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      locateBtn.disabled = false;
      loadTimes(
        position.coords.latitude,
        position.coords.longitude,
        "Your location",
        Intl.DateTimeFormat().resolvedOptions().timeZone
      );
    },
    () => {
      locateBtn.disabled = false;
      setStatus("Location permission was denied. Times stay on the default place.");
    },
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
  );
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopTimer();
  else if (playing) startTimer();
});

reduceMotion.addEventListener("change", (event) => {
  document.body.classList.toggle("reduce-motion", event.matches);
  if (event.matches) setPlaying(false);
});

loadTimes(DEFAULT_PLACE.lat, DEFAULT_PLACE.lng, DEFAULT_PLACE.name, DEFAULT_PLACE.timeZone);
loadPhotos().catch((error) => {
  setStatus(error.message || "Could not load sunset photographs.");
  setPlaying(false);
});
