/* ═══════════════════════════════════════════════════
   智廚坊 Smart Chef — script.js (Full Update)
═══════════════════════════════════════════════════ */

// Menggunakan relative path agar otomatis terhubung ke backend FastAPI tanpa kendala port CORS
const BACKEND_URL = "";

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
    if (p) p.classList.remove("page-active");
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
  if (mobileMenu) mobileMenu.classList.remove("open");
  isMenuOpen = false;

  // Trigger scroll reveals on newly shown page
  setTimeout(initScrollReveal, 80);
}

function updateBackButton() {
  if (!btnNavBack) return;
  if (currentPage !== "home") {
    btnNavBack.classList.add("visible");
  } else {
    btnNavBack.classList.remove("visible");
  }
}

if (btnNavBack) {
  btnNavBack.addEventListener("click", () => {
    if (pageHistory.length > 1) {
      pageHistory.pop(); 
      const prev = pageHistory[pageHistory.length - 1];
      goTo(prev, false);
    } else {
      goTo("home", false);
    }
  });
}

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

if (hamburger && mobileMenu) {
  hamburger.addEventListener("click", () => {
    isMenuOpen = !isMenuOpen;
    mobileMenu.classList.toggle("open", isMenuOpen);
  });

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
}

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
  Object.values(stages).forEach((s) => {
    if (s) s.classList.add("hidden");
  });
  if (stages[name]) stages[name].classList.remove("hidden");
  updateStepIndicator(name);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateStepIndicator(stage) {
  const map = { upload: 1, koreksi: 2, hasil: 3 };
  const current = map[stage] || 1;

  [1, 2, 3].forEach((i) => {
    const el = document.getElementById(`csi-${i}`);
    const line = document.getElementById(`csi-line-${i}`);
    if (el) el.className = "csi-circle"; // Reset class dasar
    if (line) line.classList.remove("csi-line-done");

    if (el) {
      if (i < current) {
        el.classList.add("csi-done");
        if (line) line.classList.add("csi-line-done");
      } else if (i === current) {
        el.classList.add("csi-active");
      }
    }
  });
}

// Back buttons wiring
const btnBackUpload = document.getElementById("btn-back-upload");
if (btnBackUpload) {
  btnBackUpload.addEventListener("click", () => showStage("upload"));
}

const btnBackKoreksi = document.getElementById("btn-back-koreksi");
if (btnBackKoreksi) {
  btnBackKoreksi.addEventListener("click", () => showStage("koreksi"));
}

const btnMasakLagi = document.getElementById("btn-masak-lagi");
if (btnMasakLagi) {
  btnMasakLagi.addEventListener("click", () => {
    resetUploadForm();
    showStage("upload");
    const recipesContainer = document.getElementById("recipes");
    if (recipesContainer) {
      recipesContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-chopsticks">🥢</div>
          <p>Daftar koreksi bahan atau hasil resep masakan akan muncul di sini.</p>
          <span class="empty-cjk">等待中…</span>
        </div>`;
    }
  });
}

function resetUploadForm() {
  const fileInput = document.getElementById("file");
  const preview = document.getElementById("preview");
  const photo = document.getElementById("photo");
  const loading = document.getElementById("loading");
  const submitBtn = document.getElementById("submit-btn");

  if (fileInput) fileInput.value = "";
  if (preview) { preview.src = ""; preview.style.display = "none"; }
  if (photo) { photo.src = ""; photo.style.display = "none"; }
  if (loading) loading.style.display = "none";
  if (submitBtn) submitBtn.disabled = false;
  stopLoadingAnimation();
}

/* ══════════════════════════════════════════════════
   FILE INPUT & DRAG-DROP
══════════════════════════════════════════════════ */
const fileInput = document.getElementById("file");
const preview = document.getElementById("preview");
const fileDrop = document.getElementById("file-drop-label");

if (fileInput && preview) {
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) {
      preview.src = URL.createObjectURL(file);
      preview.style.display = "block";
    } else {
      preview.style.display = "none";
    }
  });
}

if (fileDrop && fileInput && preview) {
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
   CAMERA FUNCTIONALITY
══════════════════════════════════════════════════ */
const startCameraBtn = document.getElementById("start-camera");
const takePictureBtn = document.getElementById("take-picture");
const video = document.getElementById("camera");
const canvas = document.getElementById("snapshot");
const photo = document.getElementById("photo");
let stream;

if (startCameraBtn && takePictureBtn && video && canvas && photo) {
  startCameraBtn.addEventListener("click", async () => {
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
}

/* ══════════════════════════════════════════════════
   LOADING STEPS SYSTEM (BACKDROP SYNC)
══════════════════════════════════════════════════ */
let loadingInterval = null;
let loadingTimeoutIds = [];

function startLoadingAnimation(isTahapDua = false) {
  stopLoadingAnimation();

  function runCycle() {
    ["ls1", "ls2", "ls3"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.className = "ls";
    });

    if (!isTahapDua) {
      loadingTimeoutIds.push(setTimeout(() => { 
        const el = document.getElementById("ls1"); if (el) el.className = "ls active"; 
      }, 100));
      loadingTimeoutIds.push(setTimeout(() => { 
        const el1 = document.getElementById("ls1"); if (el1) el1.className = "ls done"; 
        const el2 = document.getElementById("ls2"); if (el2) el2.className = "ls active"; 
      }, 1500));
      loadingTimeoutIds.push(setTimeout(() => { 
        const el2 = document.getElementById("ls2"); if (el2) el2.className = "ls done"; 
        const el3 = document.getElementById("ls3"); if (el3) el3.className = "ls active"; 
      }, 3000));
    }
  }

  runCycle();
  if (!isTahapDua) {
    loadingInterval = setInterval(runCycle, 4500);
  }
}

function stopLoadingAnimation() {
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
  loadingTimeoutIds.forEach((id) => clearTimeout(id));
  loadingTimeoutIds = [];
  
  ["ls1", "ls2", "ls3"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.className = "ls";
  });
}

/* ══════════════════════════════════════════════════
   TAHAP 1: UPLOAD & DETEKSI BAHAN MASAKAN
══════════════════════════════════════════════════ */
const uploadForm = document.getElementById("upload-form");
const loading = document.getElementById("loading");
const submitBtn = document.getElementById("submit-btn");
const loadingTitle = document.getElementById("loading-title");

if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = fileInput ? fileInput.files[0] : null;
    let blob;
    if (photo && photo.src && photo.style.display === "block") {
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

    if (submitBtn) submitBtn.disabled = true;
    if (loadingTitle) loadingTitle.innerText = "AI sedang mendeteksi bahan makanan…";
    if (loading) loading.style.display = "block";
    
    startLoadingAnimation(false);

    try {
      const uploadRes = await fetch(`${BACKEND_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) throw new Error(`Upload gagal: ${uploadRes.status}`);
      const uploadData = await uploadRes.json();
      
      if (loading) loading.style.display = "none";
      stopLoadingAnimation();
      
      renderKoreksiBahan(uploadData.labels);
      showStage("koreksi");
    } catch (err) {
      console.error(err);
      if (loading) loading.style.display = "none";
      stopLoadingAnimation();
      const areaKoreksi = document.getElementById("koreksi-area");
      if (areaKoreksi) {
        areaKoreksi.innerHTML = `
          <div class="error-state">
            <p>⚠️ Gagal terhubung ke server.<br>Pastikan backend sudah berjalan.</p>
            <small style="color:rgba(249,242,231,0.4);font-size:.75rem;margin-top:8px;display:block">${err.message}</small>
          </div>`;
      }
      showStage("koreksi");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

/* ══════════════════════════════════════════════════
   PERBAIKAN BUG: RENDER LIST KOREKSI BAHAN
══════════════════════════════════════════════════ */
function renderKoreksiBahan(labels) {
  const koreksiArea = document.getElementById("koreksi-area");
  if (!koreksiArea) return;
  
  koreksiArea.innerHTML = ""; 

  const container = document.createElement("div");
  container.className = "koreksi-container";

  const titleDiv = document.createElement("div");
  titleDiv.className = "koreksi-title";
  titleDiv.innerHTML = "🔍 AI Mendeteksi Bahan Berikut — Periksa &amp; Sesuaikan:";
  container.appendChild(titleDiv);

  const listDiv = document.createElement("div");
  listDiv.id = "koreksi-list";

  if (Array.isArray(labels) && labels.length > 0) {
    labels.forEach((item) => {
      if (item && typeof item === 'object' && item.nama) {
        listDiv.appendChild(createKoreksiRow(item.nama, item.jumlah || "Secukupnya"));
      } else {
        listDiv.appendChild(createKoreksiRow(item, "1 buah"));
      }
    });
  } else {
    listDiv.appendChild(createKoreksiRow("", "Secukupnya"));
  }
  container.appendChild(listDiv);

  const btnTambah = document.createElement("button");
  btnTambah.type = "button";
  btnTambah.className = "btn-tambah-bahan";
  btnTambah.id = "btn-tambah-bahan";
  btnTambah.innerText = "➕ Tambah Bahan Lain";
  container.appendChild(btnTambah);

  const btnProses = document.createElement("button");
  btnProses.type = "button";
  btnProses.className = "btn-proses-resep";
  btnProses.id = "btn-proses-resep";
  btnProses.innerText = "Rekomendasikan Masakan Sekarang 🍳";
  container.appendChild(btnProses);

  koreksiArea.appendChild(container);

  btnTambah.addEventListener("click", addCustomBahanRow);
  btnProses.addEventListener("click", prosesResepFinal);
}

function createKoreksiRow(nama = "", jumlah = "Secukupnya") {
  const div = document.createElement("div");
  div.className = "koreksi-row";
  div.innerHTML = `
    <input type="text" class="input-nama"   value="${escHtml(nama)}"   placeholder="Nama bahan (contoh: Tomat)" required>
    <input type="text" class="input-jumlah" value="${escHtml(jumlah)}" placeholder="Jumlah (contoh: 2 buah)"   required>
    <button type="button" class="btn-hapus-bahan">✕</button>
  `;
  div.querySelector(".btn-hapus-bahan").addEventListener("click", () => div.remove());
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
   FITUR BARU: ANIMASI MENUNGGU (DYNAMIC LOADING STATE)
══════════════════════════════════════════════════ */
function renderLoadingState() {
  const recipesDiv = document.getElementById("recipes");
  if (!recipesDiv) return;

  recipesDiv.innerHTML = `
    <div class="ai-loading-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center;">
      <div class="chef-spinner" style="width: 64px; height: 64px; border: 5px dashed var(--gold); border-top: 5px solid transparent; border-radius: 50%; animation: spin 1.8s linear infinite; margin-bottom: 24px;"></div>
      <h3 style="color: var(--gold); font-size: 1.3rem; margin-bottom: 8px; font-weight: 600; letter-spacing: 0.5px;">Smart Chef Sedang Berpikir...</h3>
      <p id="dynamic-loading-sub" style="color: rgba(249, 242, 231, 0.7); font-size: 0.9rem; max-width: 400px; min-height: 40px; line-height: 1.5; transition: opacity 0.2s ease;">Gemini AI sedang memadukan cita rasa dan menyusun 3 variasi resep untukmu.</p>
      <span style="font-family: 'Noto Serif SC', serif; color: rgba(201, 151, 58, 0.3); font-size: 2.5rem; margin-top: 15px; display: block; user-select: none;">烹饪中…</span>
    </div>
  `;

  if (!document.getElementById("style-spinner-animation")) {
    const style = document.createElement("style");
    style.id = "style-spinner-animation";
    style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }
}

/* ══════════════════════════════════════════════════
   TAHAP 2: PROSES KIRIM DATA BAHAN KE GEMINI AI
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

  // 1. Geser seketika ke halaman panggung hasil resep
  showStage("hasil");
  
  // 2. Tampilkan animasi pemutar berputar estetik
  renderLoadingState();

  // 3. Teks sub-judul interaktif berganti acak berkala
  const loadingSubtitles = [
    "Gemini AI sedang memikirkan kombinasi rasa terbaik…",
    "Sedang menakar bumbu untuk 3 tingkat kesulitan masakan…",
    "Menyusun langkah-langkah memasak yang praktis di dapur…",
    "Hampir selesai! Sedang mempercantik susunan format resep…"
  ];
  let subIndex = 0;
  const subInterval = setInterval(() => {
    const subEl = document.getElementById("dynamic-loading-sub");
    if (subEl) {
      subEl.style.opacity = 0;
      setTimeout(() => {
        subIndex = (subIndex + 1) % loadingSubtitles.length;
        subEl.innerText = loadingSubtitles[subIndex];
        subEl.style.opacity = 1;
      }, 200);
    }
  }, 3000);

  try {
    const aiRes = await fetch(`${BACKEND_URL}/ai-recipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: finalItems }),
    });
    
    if (!aiRes.ok) throw new Error(`Gemini API gagal: ${aiRes.status}`);
    const aiData = await aiRes.json();
    
    clearInterval(subInterval);
    
    let resepArray = [];
    if (aiData && Array.isArray(aiData.recipes)) {
      resepArray = aiData.recipes;
    } else if (Array.isArray(aiData)) {
      resepArray = aiData;
    } else if (aiData && aiData.recipe) {
      resepArray = [aiData.recipe];
    }
    
    displayRecipe(resepArray, finalItems);
  } catch (err) {
    console.error(err);
    clearInterval(subInterval);
    
    const recipesContainer = document.getElementById("recipes");
    if (recipesContainer) {
      recipesContainer.innerHTML = `
        <div class="error-state" style="text-align:center; padding: 40px 20px;">
          <p style="color: #e83050; font-weight: 600;">⚠️ Gagal memproses variasi resep dari Gemini AI.</p>
          <p style="font-size: 0.85rem; color: rgba(249,242,231,0.6); margin-top: 8px;">Silakan periksa koneksi server backend Anda atau coba beberapa saat lagi.</p>
          <small style="color:rgba(249,242,231,0.3); font-size:.75rem; margin-top:12px; display:block">${err.message}</small>
        </div>`;
    }
  }
}

/* ══════════════════════════════════════════════════
   TAHAP 3: STRUKTUR STRIP KARTU GRID HASIL MASAKAN
══════════════════════════════════════════════════ */
function displayRecipe(recipes, finalLabels = []) {
  const recipesDiv = document.getElementById("recipes");
  if (!recipesDiv) return;
  recipesDiv.innerHTML = ""; 

  if (!recipes || !Array.isArray(recipes) || recipes.length === 0) {
    recipesDiv.innerHTML = `<div class="error-state"><p>❌ Resep gagal diracik. Coba sesuaikan kembali kombinasi bahan Anda.</p></div>`;
    return;
  }

  if (finalLabels.length > 0) {
    const headerSummary = document.createElement("div");
    headerSummary.className = "detected-wrap";
    headerSummary.innerHTML = `
      <div class="detected-title">📋 Komposisi Bahan Masakan Anda:</div>
      <div class="labels-row" style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px;">
        ${finalLabels.map((l) => `<span class="lbl-chip">${escHtml(l)}</span>`).join("")}
      </div>
      <div class="recipe-divider" style="margin-top:20px; border-bottom:1px dashed rgba(249,242,231,0.2);"></div>
    `;
    recipesDiv.appendChild(headerSummary);
  }

  const gridContainer = document.createElement("div");
  gridContainer.className = "recipes-grid";
  gridContainer.style.display = "grid";
  gridContainer.style.gridTemplateColumns = "repeat(auto-fit, minmax(300px, 1fr))";
  gridContainer.style.gap = "24px";
  gridContainer.style.marginTop = "24px";

  recipes.forEach((item) => {
    const card = document.createElement("div");
    card.className = `recipe-card difficulty-${item.difficulty ? item.difficulty.toLowerCase() : 'mudah'}`;
    card.style.background = "rgba(20, 20, 20, 0.6)";
    card.style.border = "1px solid rgba(201, 151, 58, 0.3)";
    card.style.borderRadius = "12px";
    card.style.padding = "24px";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    
    let badgeColor = "#2ea872"; 
    const diffText = item.difficulty ? item.difficulty.toLowerCase() : "mudah";
    if (diffText.includes("sedang")) {
      badgeColor = "#ffaa40"; 
    } else if (diffText.includes("sulit")) {
      badgeColor = "#e83050"; 
    }

    const ingredientsHtml = Array.isArray(item.ingredients) 
      ? item.ingredients.map((ing) => `<li style="margin-bottom:4px;">${escHtml(ing)}</li>`).join("") 
      : "<li>Bahan tidak tersedia</li>";

    const stepsHtml = Array.isArray(item.steps) 
      ? item.steps.map((step) => `<li style="margin-bottom:6px;">${escHtml(step)}</li>`).join("") 
      : "<li>Langkah memasak tidak tersedia</li>";

    card.innerHTML = `
      <div style="margin-bottom:12px;">
        <span class="badge-difficulty" style="background:${badgeColor}; color:#fff; padding:4px 10px; font-size:0.75rem; font-weight:700; border-radius:4px; text-transform:uppercase; letter-spacing:0.5px;">
          ⚡ KESULITAN: ${escHtml(item.difficulty ?? "MUDAH")}
        </span>
      </div>
      <h3 class="recipe-title" style="margin:4px 0 8px 0; color:var(--gold); font-size:1.4rem; font-weight:600; line-height:1.3;">🍜 ${escHtml(item.title ?? "Resep AI")}</h3>
      <p class="recipe-description" style="font-style:italic; font-size:0.85rem; color:rgba(249,242,231,0.7); margin-bottom:20px; line-height:1.4;">"${escHtml(item.description ?? '')}"</p>
      
      <div class="recipe-section" style="margin-bottom:15px;">
        <h4 style="color:var(--gold); font-size:1rem; margin-bottom:8px; font-weight:500; border-bottom:1px solid rgba(201,151,58,0.15); padding-bottom:4px;">🥢 Bahan-bahan:</h4>
        <ul style="padding-left:18px; font-size:0.9rem; line-height:1.5; color:rgba(249,242,231,0.9);">${ingredientsHtml}</ul>
      </div>
      
      <div class="recipe-section" style="margin-top:auto;">
        <h4 style="color:var(--gold); font-size:1rem; margin-bottom:8px; font-weight:500; border-bottom:1px solid rgba(201,151,58,0.15); padding-bottom:4px;">📋 Langkah Memasak:</h4>
        <ol style="padding-left:18px; font-size:0.9rem; line-height:1.5; color:rgba(249,242,231,0.9);">${stepsHtml}</ol>
      </div>
    `;
    gridContainer.appendChild(card);
  });

  recipesDiv.appendChild(gridContainer);
}

/* ══════════════════════════════════════════════════
   CANVAS FIREWORKS (KEMBANG API TRADISIONAL)
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
    "#f0c060", "#c9973a", "#fff0c0", "#e83050", "#ff6688",
    "#ffaa40", "#d4183a", "#ffd166", "#b5001f", "#2ea872", "#9bf0c0"
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