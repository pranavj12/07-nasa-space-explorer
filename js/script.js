const API_KEY = "euGxLvkSNjS4p7X9gV1rsi11dCPPzuWyr9QO4ANQ";
const APOD_BASE = "https://api.nasa.gov/planetary/apod";

const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const fetchBtn = document.getElementById("fetchBtn");
const gallery = document.getElementById("gallery");
const loadingScreen = document.getElementById("loadingScreen");
const errorScreen = document.getElementById("errorScreen");
const errorMsg = document.getElementById("errorMsg");
const modalOverlay = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");
const modalMedia = document.getElementById("modalMedia");
const modalDate = document.getElementById("modalDate");
const modalTitle = document.getElementById("modalTitle");
const modalExplanation = document.getElementById("modalExplanation");
const factText = document.getElementById("factText");

const spaceFacts = [
  "A day on Venus is longer than a year on Venus.",
  "Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.",
  "Mars has the tallest volcano in the solar system: Olympus Mons.",
  "The footprints left on the Moon can remain there for millions of years.",
  "One million Earths could fit inside the Sun.",
  "The International Space Station orbits Earth about every 90 minutes.",
  "There are more stars in the observable universe than grains of sand on Earth.",
  "Saturn could float in water because its average density is lower than water.",
  "Neutron stars are so dense that a teaspoon of their material would weigh billions of tons.",
  "Jupiter's Great Red Spot is a giant storm that has lasted for centuries."
];

function showRandomFact() {
  if (!factText) return;
  const index = Math.floor(Math.random() * spaceFacts.length);
  factText.textContent = spaceFacts[index];
}

function showLoading() {
  loadingScreen.hidden = false;
  errorScreen.hidden = true;
  gallery.hidden = true;
  fetchBtn.disabled = true;
  fetchBtn.textContent = "Loading...";
}

function hideLoading() {
  loadingScreen.hidden = true;
  gallery.hidden = false;
  fetchBtn.disabled = false;
  fetchBtn.textContent = "🚀 Get Space Images";
}

function showError(message) {
  errorScreen.hidden = false;
  errorMsg.textContent = message;
}

function hideError() {
  errorScreen.hidden = true;
}

function formatReadableDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function createVideoPreview(item) {
  const wrap = document.createElement("div");
  wrap.className = "gallery-img-wrap";

  const badge = document.createElement("span");
  badge.className = "video-badge";
  badge.textContent = "▶ VIDEO";
  wrap.appendChild(badge);

  const thumbSrc =
    item.thumbnail_url ||
    (getYouTubeId(item.url)
      ? `https://img.youtube.com/vi/${getYouTubeId(item.url)}/hqdefault.jpg`
      : null);

  if (thumbSrc) {
    const img = document.createElement("img");
    img.src = thumbSrc;
    img.alt = item.title;
    img.loading = "lazy";
    img.onerror = () => {
      wrap.innerHTML = "";
      wrap.appendChild(badge);

      const fallback = document.createElement("div");
      fallback.className = "video-thumb";
      fallback.textContent = "🎬";
      wrap.appendChild(fallback);
    };
    wrap.appendChild(img);
  } else {
    const fallback = document.createElement("div");
    fallback.className = "video-thumb";
    fallback.textContent = "🎬";
    wrap.appendChild(fallback);
  }

  return wrap;
}

function createImagePreview(item) {
  const wrap = document.createElement("div");
  wrap.className = "gallery-img-wrap";

  const img = document.createElement("img");
  img.src = item.url;
  img.alt = item.title;
  img.loading = "lazy";
  img.onerror = () => {
    wrap.innerHTML = `<div class="video-thumb">🪐</div>`;
  };

  wrap.appendChild(img);
  return wrap;
}

function createCard(item) {
  const card = document.createElement("article");
  card.className = "gallery-item";
  card.setAttribute("tabindex", "0");
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `View details for ${item.title}`);

  const preview =
    item.media_type === "video"
      ? createVideoPreview(item)
      : createImagePreview(item);

  const info = document.createElement("div");
  info.className = "gallery-item-info";

  const dateEl = document.createElement("p");
  dateEl.className = "gallery-item-date";
  dateEl.textContent = formatReadableDate(item.date);

  const titleEl = document.createElement("p");
  titleEl.className = "gallery-item-title";
  titleEl.textContent = item.title;

  info.appendChild(dateEl);
  info.appendChild(titleEl);

  card.appendChild(preview);
  card.appendChild(info);

  const openItem = () => showModal(item);
  card.addEventListener("click", openItem);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openItem();
    }
  });

  return card;
}

function renderEmptyState(message, icon = "🌑") {
  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">${icon}</div>
      <p>${message}</p>
    </div>
  `;
}

function renderGallery(items) {
  gallery.innerHTML = "";

  const list = Array.isArray(items) ? items : [items];

  if (!list.length) {
    renderEmptyState("No APOD results were found for this date range. Try another range.");
    return;
  }

  list.forEach((item) => {
    gallery.appendChild(createCard(item));
  });
}

function showModal(item) {
  modalMedia.innerHTML = "";

  if (item.media_type === "image") {
    const img = document.createElement("img");
    img.src = item.hdurl || item.url;
    img.alt = item.title;
    modalMedia.appendChild(img);
  } else if (item.media_type === "video") {
    const youtubeId = getYouTubeId(item.url);

    if (youtubeId) {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube.com/embed/${youtubeId}`;
      iframe.title = item.title;
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      modalMedia.appendChild(iframe);
    } else if (item.url && item.url.endsWith(".mp4")) {
      const video = document.createElement("video");
      video.src = item.url;
      video.controls = true;
      video.preload = "metadata";
      modalMedia.appendChild(video);
    } else {
      const link = document.createElement("a");
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "modal-video-link";
      link.textContent = "▶ Open Video";
      modalMedia.appendChild(link);
    }
  }

  modalDate.textContent = formatReadableDate(item.date);
  modalTitle.textContent = item.title;
  modalExplanation.textContent = item.explanation;

  modalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  modalClose.focus();
}

function closeModal() {
  modalOverlay.hidden = true;
  modalMedia.innerHTML = "";
  modalDate.textContent = "";
  modalTitle.textContent = "";
  modalExplanation.textContent = "";
  document.body.style.overflow = "";
}

async function fetchAPOD() {
  const start = startDateInput.value;
  const end = endDateInput.value;

  if (!start || !end) {
    showError("Please select both a start date and an end date.");
    return;
  }

  if (start > end) {
    showError("Start date must be before or equal to the end date.");
    return;
  }

  hideError();
  showLoading();

  try {
    const url = `${APOD_BASE}?api_key=${API_KEY}&start_date=${start}&end_date=${end}&thumbs=true`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.msg || data.error?.message || `API error: ${response.status}`);
    }

    const list = Array.isArray(data) ? data : [data];
    list.sort((a, b) => new Date(b.date) - new Date(a.date));

    renderGallery(list);
  } catch (error) {
    console.error(error);
    showError(error.message || "Failed to load NASA data.");
    renderEmptyState("We couldn’t load the NASA gallery right now. Please try again.", "⚠️");
  } finally {
    hideLoading();
  }
}

function initStarfield() {
  const canvas = document.getElementById("starfield");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const stars = Array.from({ length: 170 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.7 + 0.2,
    a: Math.random() * 0.7 + 0.2,
    t: Math.random() * Math.PI * 2,
    s: Math.random() * 0.025 + 0.004
  }));

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stars.forEach((star) => {
      star.t += star.s;
      const alpha = star.a * (0.65 + 0.35 * Math.sin(star.t));
      ctx.beginPath();
      ctx.arc(star.x * canvas.width, star.y * canvas.height, star.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(draw);
}

fetchBtn.addEventListener("click", fetchAPOD);

[startDateInput, endDateInput].forEach((input) => {
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      fetchAPOD();
    }
  });
});

modalClose.addEventListener("click", closeModal);

modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modalOverlay.hidden) {
    closeModal();
  }
});

window.addEventListener("DOMContentLoaded", () => {
  showRandomFact();
  initStarfield();
});