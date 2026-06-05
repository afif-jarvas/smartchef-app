/* ═══════════════════════════════════════════════════
   智廚坊 Smart Chef — script.js  (fully wired)
═══════════════════════════════════════════════════ */

const BACKEND_URL = "http://127.0.0.1:8000";

/* ══════════════════════════════════════════════════
   SPA PAGE ROUTER
══════════════════════════════════════════════════ */
const pages = {
  home: document.getElementById("page-home"),
  about: document.getElementById("page-about"),
  chef: document.getElementById("page-chef"),
};

const navLinks = document.querySelectorAll(".nav-link");
const mmLinks = document.querySelectorAll(".mm-link");
const btnNavBack = document.getElementById("btn-nav-back");

// Page history stack for back navigation
const pageHistory = ["home"];
let currentPage = "home";

function goTo(pageId, addToHistory = true) {
  // Hide all pages
  Object.values(pages).forEach((p) => {
    p.classList.remove("page-active");
  });

  // Show target
  if (pages[pageId]) {
    pages[pageId].classList.add("page-active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Update history
  if (addToHistory && pageId !== currentPage) {
    pageHistory.push(pageId);
  }
  currentPage = pageId;

  // Show/hide back button
  updateBackButton();

  // Update nav active state
  navLinks.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === pageId);
  });

  // Close mobile menu
  mobileMenu.classList.remove("open");
  isMenuOpen = false;

  // Trigger scroll reveals on newly shown page
  setTimeout(initScrollReveal, 80);
}

function updateBackButton() {
  // Show back button on any page that isn't Home
  if (currentPage !== "home") {
    btnNavBack.classList.add("visible");
  } else {
    btnNavBack.classList.remove("visible");
  }
}

btnNavBack.addEventListener("click", () => {
  // Pop current from history, go to previous
  if (pageHistory.length > 1) {
    pageHistory.pop(); // remove current
    const prev = pageHistory[pageHistory.length - 1];
    goTo(prev, false);
  } else {
    goTo("home", false);
  }
});

// Wire every element with data-page attribute
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-page]");
  if (btn) goTo(btn.dataset.page);
});

/* ══════════════════════════════════════════════════
   HAMBURGER MENU
══════════════════════════════════════════════════ */
const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobile-menu");
let isMenuOpen = false;

hamburger.addEventListener("click", () => {
  isMenuOpen = !isMenuOpen;
  mobileMenu.classList.toggle("open", isMenuOpen);
});

// Close on outside click
document.addEventListener("click", (e) => {
  if (
    isMenuOpen &&
    !hamburger.contains(e.target) &&
    !mobileMenu.contains(e.target)
  ) {
    isMenuOpen = false;
    mobileMenu.classList.remove("open");
  }
});

/* ══════════════════════════════════════════════════
   SCROLL REVEAL
══════════════════════════════════════════════════ */
function initScrollReveal() {
  const obs = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
  );

  document
    .querySelectorAll(".reveal-on-scroll:not(.visible)")
    .forEach((el) => obs.observe(el));
}

document.addEventListener("DOMContentLoaded", initScrollReveal);

/* ══════════════════════════════════════════════════
   CHEF PAGE — STAGE SYSTEM
══════════════════════════════════════════════════ */
const stages = {
  upload: document.getElementById("stage-upload"),
  koreksi: document.getElementById("stage-koreksi"),
  hasil: document.getElementById("stage-hasil"),
};

function showStage(name) {
  Object.values(stages).forEach((s) => s.classList.add("hidden"));
  stages[name].classList.remove("hidden");
  updateStepIndicator(name);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateStepIndicator(stage) {
  const map = { upload: 1, koreksi: 2, hasil: 3 };
  const current = map[stage] || 1;

  [1, 2, 3].forEach((i) => {
    const el = document.getElementById(`csi-${i}`);
    const line = document.getElementById(`csi-line-${i}`);
    el.classList.remove("csi-active", "csi-done");
    if (line) line.classList.remove("csi-line-done");

    if (i < current) {
      el.classList.add("csi-done");
      if (line) line.classList.add("csi-line-done");
    } else if (i === current) el.classList.add("csi-active");
  });
}

// Back buttons
document
  .getElementById("btn-back-upload")
  .addEventListener("click", () => showStage("upload"));
document
  .getElementById("btn-back-koreksi")
  .addEventListener("click", () => showStage("koreksi"));
document.getElementById("btn-masak-lagi").addEventListener("click", () => {
  resetUploadForm();
  showStage("upload");
  document.getElementById("recipes").innerHTML = `
    <div class="empty-state">
      <div class="empty-chopsticks">🥢</div>
      <p>Daftar koreksi bahan atau hasil resep masakan akan muncul di sini.</p>
      <span class="empty-cjk">等待中…</span>
    </div>`;
});

function resetUploadForm() {
  const fileInput = document.getElementById("file");
  const preview = document.getElementById("preview");
  const photo = document.getElementById("photo");
  const loading = document.getElementById("loading");
  fileInput.value = "";
  preview.src = "";
  preview.style.display = "none";
  photo.src = "";
  photo.style.display = "none";
  loading.style.display = "none";
  document.getElementById("submit-btn").disabled = false;
  resetLoadingSteps();
}

/* ══════════════════════════════════════════════════
   FILE INPUT & DRAG-DROP
══════════════════════════════════════════════════ */
const fileInput = document.getElementById("file");
const preview = document.getElementById("preview");
const fileDrop = document.getElementById("file-drop-label");

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  } else {
    preview.style.display = "none";
  }
});

if (fileDrop) {
  fileDrop.addEventListener("dragover", (e) => {
    e.preventDefault();
    fileDrop.style.borderColor = "var(--gold)";
  });
  fileDrop.addEventListener("dragleave", () => {
    fileDrop.style.borderColor = "";
  });
  fileDrop.addEventListener("drop", (e) => {
    e.preventDefault();
    fileDrop.style.borderColor = "";
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) {
      const dt = new DataTransfer();
      dt.items.add(f);
      fileInput.files = dt.files;
      preview.src = URL.createObjectURL(f);
      preview.style.display = "block";
    }
  });
}

/* ══════════════════════════════════════════════════
   CAMERA
══════════════════════════════════════════════════ */
const startCameraBtn = document.getElementById("start-camera");
const takePictureBtn = document.getElementById("take-picture");
const video = document.getElementById("camera");
const canvas = document.getElementById("snapshot");
const photo = document.getElementById("photo");
let stream;

startCameraBtn.addEventListener("click", async () => {
  // If already took photo — allow retake
  if (photo.style.display === "block") {
    photo.src = "";
    photo.style.display = "none";
    startCameraBtn.innerHTML = "▶ &nbsp;Mulai Kamera";
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
    video.srcObject = stream;
    video.style.display = "block";
    startCameraBtn.style.display = "none";
    takePictureBtn.style.display = "inline-flex";
  } catch (err) {
    alert("Akses kamera ditolak atau tidak tersedia.");
    console.error(err);
  }
});

takePictureBtn.addEventListener("click", () => {
  const ctx = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  if (stream) stream.getTracks().forEach((t) => t.stop());
  const dataUrl = canvas.toDataURL("image/png");
  photo.src = dataUrl;
  photo.style.display = "block";
  video.style.display = "none";
  takePictureBtn.style.display = "none";
  startCameraBtn.style.display = "inline-flex";
  startCameraBtn.innerHTML = "↩ &nbsp;Ambil Ulang";
});

/* ══════════════════════════════════════════════════
   LOADING STEPS ANIMATION
══════════════════════════════════════════════════ */
function animateLoadingSteps(stepMax = 3) {
  ["ls1", "ls2", "ls3"].forEach((id) => {
    document.getElementById(id).className = "ls";
  });
  if (stepMax >= 1)
    setTimeout(() => {
      document.getElementById("ls1").className = "ls active";
    }, 200);
  if (stepMax >= 2)
    setTimeout(() => {
      document.getElementById("ls1").className = "ls done";
      document.getElementById("ls2").className = "ls active";
    }, 1200);
  if (stepMax === 3)
    setTimeout(() => {
      document.getElementById("ls2").className = "ls done";
      document.getElementById("ls3").className = "ls active";
    }, 2200);
}
function resetLoadingSteps() {
  ["ls1", "ls2", "ls3"].forEach((id) => {
    document.getElementById(id).className = "ls";
  });
}

/* ══════════════════════════════════════════════════
   TAHAP 1: UPLOAD & DETEKSI BAHAN
══════════════════════════════════════════════════ */
const uploadForm = document.getElementById("upload-form");
const loading = document.getElementById("loading");
const submitBtn = document.getElementById("submit-btn");
const loadingTitle = document.getElementById("loading-title");

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = fileInput.files[0];
  let blob;
  if (photo.src && photo.style.display === "block") {
    const res = await fetch(photo.src);
    blob = await res.blob();
  } else if (file) {
    blob = file;
  } else {
    alert("Silakan unggah foto atau ambil foto terlebih dahulu!");
    return;
  }

  const formData = new FormData();
  formData.append("file", blob, "gambar.png");

  submitBtn.disabled = true;
  loadingTitle.innerText = "AI sedang mendeteksi bahan makanan…";
  loading.style.display = "block";
  animateLoadingSteps(2);

  try {
    const uploadRes = await fetch(`${BACKEND_URL}/upload`, {
      method: "POST",
      body: formData,
    });
    if (!uploadRes.ok) throw new Error(`Upload gagal: ${uploadRes.status}`);
    const uploadData = await uploadRes.json();
    loading.style.display = "none";
    resetLoadingSteps();
    renderKoreksiBahan(uploadData.labels);
    showStage("koreksi");
  } catch (err) {
    console.error(err);
    loading.style.display = "none";
    resetLoadingSteps();
    // Show error inside koreksi area and move there
    document.getElementById("koreksi-area").innerHTML = `
      <div class="error-state">
        <p>⚠️ Gagal terhubung ke server.<br>Pastikan Cloud Run sudah berjalan dan BACKEND_URL sudah diatur.</p>
        <small style="color:rgba(249,242,231,0.4);font-size:.75rem;margin-top:8px;display:block">${err.message}</small>
      </div>`;
    showStage("koreksi");
  } finally {
    submitBtn.disabled = false;
  }
});

/* ══════════════════════════════════════════════════
   RENDER KOREKSI BAHAN
══════════════════════════════════════════════════ */
function renderKoreksiBahan(labels) {
  let html = `
    <div class="koreksi-container">
      <div class="koreksi-title">🔍 AI Mendeteksi Bahan Berikut — Periksa &amp; Sesuaikan:</div>
      <div id="koreksi-list">
  `;
  labels.forEach((label) => {
    html += createKoreksiRow(label, "1 buah");
  });
  html += `
      </div>
      <button type="button" class="btn-tambah-bahan" id="btn-tambah-bahan">➕ Tambah Bahan Lain</button>
      <button type="button" class="btn-proses-resep" id="btn-proses-resep">Rekomendasikan Masakan Sekarang 🍳</button>
    </div>
  `;
  document.getElementById("koreksi-area").innerHTML = html;

  // Wire buttons rendered inside the area
  document
    .getElementById("btn-tambah-bahan")
    .addEventListener("click", addCustomBahanRow);
  document
    .getElementById("btn-proses-resep")
    .addEventListener("click", prosesResepFinal);
}

function createKoreksiRow(nama = "", jumlah = "Secukupnya") {
  const div = document.createElement("div");
  div.className = "koreksi-row";
  div.innerHTML = `
    <input type="text" class="input-nama"   value="${escHtml(nama)}"   placeholder="Nama bahan (contoh: Tomat)" required>
    <input type="text" class="input-jumlah" value="${escHtml(jumlah)}" placeholder="Jumlah (contoh: 2 buah)"   required>
    <button type="button" class="btn-hapus-bahan">✕</button>
  `;
  div
    .querySelector(".btn-hapus-bahan")
    .addEventListener("click", () => div.remove());
  return div;
}

function addCustomBahanRow() {
  const container = document.getElementById("koreksi-list");
  if (container) container.appendChild(createKoreksiRow("", "Secukupnya"));
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ══════════════════════════════════════════════════
   TAHAP 2: KIRIM KE GEMINI AI
══════════════════════════════════════════════════ */
async function prosesResepFinal() {
  const rows = document.querySelectorAll(".koreksi-row");
  const finalItems = [];
  rows.forEach((row) => {
    const nama = row.querySelector(".input-nama").value.trim();
    const jumlah = row.querySelector(".input-jumlah").value.trim();
    if (nama) finalItems.push(`${jumlah} ${nama}`);
  });
  if (finalItems.length === 0) {
    alert("Daftar bahan tidak boleh kosong!");
    return;
  }

  // Show loading on chef page (re-use loading el, move stage to hasil)
  loadingTitle.innerText = "Gemini AI sedang meracik resep terbaik…";
  loading.style.display = "block";
  resetLoadingSteps();
  document.getElementById("ls1").className = "ls done";
  document.getElementById("ls2").className = "ls done";
  document.getElementById("ls3").className = "ls active";

  // Keep on koreksi stage while loading
  showStage("koreksi");

  try {
    const aiRes = await fetch(`${BACKEND_URL}/ai-recipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: finalItems }),
    });
    if (!aiRes.ok) throw new Error(`Gemini API gagal: ${aiRes.status}`);
    const aiData = await aiRes.json();
    loading.style.display = "none";
    resetLoadingSteps();
    displayRecipe(aiData.recipe, finalItems);
    showStage("hasil");
  } catch (err) {
    console.error(err);
    loading.style.display = "none";
    resetLoadingSteps();
    document.getElementById("recipes").innerHTML = `
      <div class="error-state">
        <p>⚠️ Gagal memproses resep dari Gemini AI. Silakan coba kembali.</p>
        <small style="color:rgba(249,242,231,0.4);font-size:.75rem;margin-top:8px;display:block">${err.message}</small>
      </div>`;
    showStage("hasil");
  }
}

/* ══════════════════════════════════════════════════
   TAMPILKAN RESEP
══════════════════════════════════════════════════ */
function displayRecipe(recipe, finalLabels = []) {
  const recipesDiv = document.getElementById("recipes");
  if (!recipe) {
    recipesDiv.innerHTML = `<div class="error-state"><p>❌ Resep tidak ditemukan. Coba kombinasi bahan lain.</p></div>`;
    return;
  }
  const detectedHtml =
    finalLabels.length > 0
      ? `<div class="detected-wrap">
         <div class="detected-title">📋 Bahan yang Dikonfirmasi:</div>
         <div class="labels-row">${finalLabels.map((l) => `<span class="lbl-chip">${escHtml(l)}</span>`).join("")}</div>
       </div><div class="recipe-divider"></div>`
      : "";

  const ingredients =
    Array.isArray(recipe.ingredients) && recipe.ingredients.length
      ? recipe.ingredients.map((i) => `<li>${escHtml(i)}</li>`).join("")
      : "<li>Data bahan tidak tersedia</li>";
  const steps =
    Array.isArray(recipe.steps) && recipe.steps.length
      ? recipe.steps.map((s) => `<li>${escHtml(s)}</li>`).join("")
      : "<li>Data langkah tidak tersedia</li>";

  recipesDiv.innerHTML = `
    <div class="recipe-card">
      ${detectedHtml}
      <h3 class="recipe-title">🍜 ${escHtml(recipe.title ?? "Resep dari AI")}</h3>
      <div class="recipe-section">
        <h4>🥢 Bahan-bahan</h4>
        <ul>${ingredients}</ul>
      </div>
      <div class="recipe-divider"></div>
      <div class="recipe-section">
        <h4>📋 Langkah Memasak</h4>
        <ol>${steps}</ol>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════
   KEMBANG API CHINESE — Canvas Fireworks
══════════════════════════════════════════════════ */
(function () {
  const canvas = document.getElementById("fireworks-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const COLORS = [
    "#f0c060",
    "#c9973a",
    "#fff0c0",
    "#e83050",
    "#ff6688",
    "#ffaa40",
    "#d4183a",
    "#ffd166",
    "#b5001f",
    "#2ea872",
    "#9bf0c0",
  ];

  class Spark {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.color = color;
      const angle = Math.random() * Math.PI * 2;
      const spd = 0.5 + Math.random() * 2.2;
      this.vx = Math.cos(angle) * spd;
      this.vy = Math.sin(angle) * spd - 0.5;
      this.life = 1;
      this.decay = 0.007 + Math.random() * 0.009;
      this.size = 1.4 + Math.random() * 2.2;
      this.trail = [];
    }
    update() {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 5) this.trail.shift();
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.025;
      this.vx *= 0.99;
      this.life -= this.decay;
    }
    draw() {
      for (let i = 0; i < this.trail.length; i++) {
        const t = this.trail[i];
        ctx.globalAlpha = (i / this.trail.length) * this.life * 0.3;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = Math.max(0, this.life) * 0.75;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let sparks = [];
  function burst() {
    const mx = canvas.width * 0.12;
    const x = mx + Math.random() * (canvas.width - mx * 2);
    const y = 50 + Math.random() * (canvas.height * 0.42);
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    const n = 60 + Math.floor(Math.random() * 30);
    for (let i = 0; i < n; i++) sparks.push(new Spark(x, y, c));
  }
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sparks = sparks.filter((s) => s.life > 0);
    sparks.forEach((s) => {
      s.update();
      s.draw();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(loop);
  }
  loop();
  burst();
  setInterval(burst, 3200);
})();
