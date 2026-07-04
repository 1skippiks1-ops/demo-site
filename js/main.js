/* ============================================
   Kataloq — main.js
   ============================================ */

const WA_NUMBER_FALLBACK = "994703007513";

// İrşad-dan götürülmüş kateqoriyalar (sabit sıra)
const ALL_CATEGORIES = [
  { key: "Telefon və aksesuarlar", icon: "📱" },
  { key: "Böyük məişət texnikası", icon: "🫙" },
  { key: "Kiçik məişət texnikası", icon: "🍳" },
  { key: "TV və Audio", icon: "📺" },
  { key: "Foto texnika", icon: "📷" },
  { key: "Notbuk, planşet və kompüter texnikası", icon: "💻" },
  { key: "Evə uyğun məhsullar", icon: "🏠" },
  { key: "Mebellər və tekstil", icon: "🛋️" },
  { key: "Nəqliyyat və Əyləncə", icon: "🚲" },
  { key: "İdman və sağlamlıq", icon: "💪" },
  { key: "Avtomobil üçün məhsullar", icon: "🚗" },
  { key: "İnşaat", icon: "🔨" },
  { key: "Dəftərxana ləvazimatları", icon: "✏️" },
];

async function loadProducts() {
  try {
    const res = await fetch("data/products.json?v=" + Date.now());
    return await res.json();
  } catch {
    return [];
  }
}

function getSettings() {
  try {
    const s = localStorage.getItem("shop_settings");
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
}

function getWANumber() {
  const s = getSettings();
  return s.waNumber || WA_NUMBER_FALLBACK;
}

function getSiteName() {
  const s = getSettings();
  return s.siteName || "ElementStore";
}

function renderCard(p) {
  const imgHtml = p.image
    ? `<img src="${p.image}" alt="${p.name}" loading="lazy">`
    : `<div class="product-image-placeholder">🏠</div>`;

  const stockHtml = p.inStock
    ? `<span class="stock-badge in">Stokda var</span>`
    : `<span class="stock-badge out">Stokda yoxdur</span>`;

  return `
    <a href="product.html?id=${p.id}" class="product-card">
      <div class="product-image">${imgHtml}</div>
      <div class="product-body">
        <p class="product-category">${p.category}</p>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.description}</p>
        <div class="product-footer">
          <p class="product-price">${p.price} <span>₼</span></p>
          ${stockHtml}
        </div>
      </div>
    </a>`;
}

function renderComingSoon(catKey) {
  return `
    <div class="coming-soon-card">
      <div class="coming-soon-icon">🕐</div>
      <p class="coming-soon-text">Tezliklə məhsul əlavə olunacaq</p>
    </div>`;
}

let currentProducts = [];
let currentCat = "all";

function setActiveCategory(cat, label) {
  currentCat = cat;

  // Desktop sidebar
  document
    .querySelectorAll(".cat-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.cat === cat));
  // Mobile list
  document
    .querySelectorAll(".mobile-cat-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.cat === cat));
  // Active label
  const lbl = document.getElementById("activeCatLabel");
  if (lbl) lbl.textContent = label;

  renderGrid(currentProducts, cat);
}

function buildSidebars(products) {
  const activeCats = new Set(products.map((p) => p.category));

  const desktopList = document.getElementById("catList");
  const mobileList = document.getElementById("mobileCatList");

  // Clear and rebuild both lists
  desktopList.innerHTML =
    '<li><button class="cat-btn active" data-cat="all">Hamısı</button></li>';
  mobileList.innerHTML =
    '<li><button class="mobile-cat-btn active" data-cat="all">Hamısı</button></li>';

  ALL_CATEGORIES.forEach(({ key, icon }) => {
    const hasProducts = activeCats.has(key);

    // Desktop
    const dLi = document.createElement("li");
    const dBtn = document.createElement("button");
    dBtn.className = "cat-btn" + (hasProducts ? "" : " cat-btn--empty");
    dBtn.dataset.cat = key;
    dBtn.innerHTML = `<span class="cat-icon">${icon}</span>${key}`;
    dLi.appendChild(dBtn);
    desktopList.appendChild(dLi);

    // Mobile
    const mLi = document.createElement("li");
    const mBtn = document.createElement("button");
    mBtn.className =
      "mobile-cat-btn" + (hasProducts ? "" : " mobile-cat-btn--empty");
    mBtn.dataset.cat = key;
    mBtn.innerHTML = `<span class="cat-icon">${icon}</span>${key}`;
    mLi.appendChild(mBtn);
    mobileList.appendChild(mLi);
  });

  // Click handlers — desktop
  desktopList.addEventListener("click", (e) => {
    const btn = e.target.closest(".cat-btn");
    if (!btn) return;
    const label = btn.textContent.trim();
    setActiveCategory(btn.dataset.cat, label);
  });

  // Click handlers — mobile
  mobileList.addEventListener("click", (e) => {
    const btn = e.target.closest(".mobile-cat-btn");
    if (!btn) return;
    const label = btn.textContent.trim();
    setActiveCategory(btn.dataset.cat, label);
    closeMobileSidebar();
  });
}

function renderGrid(products, cat = "all") {
  const grid = document.getElementById("productGrid");

  if (cat === "all") {
    if (!products.length) {
      grid.innerHTML = `<div class="empty-state"><h3>Məhsul tapılmadı</h3><p>Hələ məhsul əlavə edilməyib.</p></div>`;
      return;
    }
    grid.innerHTML = products.map(renderCard).join("");
    return;
  }

  const filtered = products.filter((p) => p.category === cat);
  if (!filtered.length) {
    grid.innerHTML = renderComingSoon(cat);
    return;
  }
  grid.innerHTML = filtered.map(renderCard).join("");
}

/* ---- Mobile sidebar ---- */
function openMobileSidebar() {
  document.getElementById("mobileSidebar").classList.add("open");
  document.getElementById("mobileOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeMobileSidebar() {
  document.getElementById("mobileSidebar").classList.remove("open");
  document.getElementById("mobileOverlay").classList.remove("open");
  document.body.style.overflow = "";
}

async function init() {
  document.title = getSiteName();
  const products = await loadProducts();
  currentProducts = products;

  if (!products.length) {
    document.getElementById("productGrid").innerHTML =
      `<div class="empty-state"><h3>Məhsullar yüklənmir</h3><p>Zəhmət olmasa bir az sonra yenidən cəhd edin.</p></div>`;
    return;
  }

  buildSidebars(products);
  renderGrid(products);

  document
    .getElementById("mobileMenuBtn")
    ?.addEventListener("click", openMobileSidebar);
  // Mobile category trigger (inside catalog)
  document
    .getElementById("mobileCatTrigger")
    .addEventListener("click", openMobileSidebar);
  // Close sidebar
  document
    .getElementById("mobileSidebarClose")
    .addEventListener("click", closeMobileSidebar);
  document
    .getElementById("mobileOverlay")
    .addEventListener("click", closeMobileSidebar);
}

init();
