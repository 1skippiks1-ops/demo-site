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
    const res = await fetch("data/products.json");
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

/* ---- Discount helpers ----
   getCurrentLang / t / categoryLabel / localized are shared helpers
   defined in i18n.js, which loads before this file. ---- */
function discountPercent(p) {
  const price = parseFloat(p.price);
  const oldPrice = parseFloat(p.oldPrice);
  if (!oldPrice || !price || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

function renderCard(p) {
  const imgHtml = p.image
    ? `<img src="${p.image}" alt="${localized(p, "name")}" loading="lazy">`
    : `<div class="product-image-placeholder">🏠</div>`;

  const stockHtml = p.inStock
    ? `<span class="stock-badge in">${t("stock_in")}</span>`
    : `<span class="stock-badge out">${t("stock_out")}</span>`;

  const pct = discountPercent(p);
  const priceHtml =
    pct > 0
      ? `<p class="product-price">${p.price} <span>₼</span> <span class="product-price-old">${p.oldPrice} ₼</span> <span class="product-discount-badge">-${pct}%</span></p>`
      : `<p class="product-price">${p.price} <span>₼</span></p>`;

  return `
    <a href="product.html?id=${p.id}" class="product-card">
      <div class="product-image">${imgHtml}</div>
      <div class="product-body">
        <p class="product-category">${categoryLabel(p.category)}</p>
        <h3 class="product-name">${localized(p, "name")}</h3>
        <p class="product-desc">${localized(p, "description")}</p>
        <div class="product-footer">
          ${priceHtml}
          ${stockHtml}
        </div>
      </div>
    </a>`;
}

function renderComingSoon() {
  return `
    <div class="coming-soon-card">
      <div class="coming-soon-icon">🕐</div>
      <p class="coming-soon-text">${t("coming_soon")}</p>
    </div>`;
}

let currentProducts = [];
let currentCat = "all";

function setActiveCategory(cat) {
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
  if (lbl) lbl.textContent = cat === "all" ? t("all") : categoryLabel(cat);

  renderGrid(currentProducts, cat);
}

function buildSidebars(products) {
  const activeCats = new Set(products.map((p) => p.category));

  const desktopList = document.getElementById("catList");
  const mobileList = document.getElementById("mobileCatList");

  renderCategoryButtons(desktopList, mobileList, activeCats);

  // Click handlers — desktop
  desktopList.addEventListener("click", (e) => {
    const btn = e.target.closest(".cat-btn");
    if (!btn) return;
    setActiveCategory(btn.dataset.cat);
  });

  // Click handlers — mobile
  mobileList.addEventListener("click", (e) => {
    const btn = e.target.closest(".mobile-cat-btn");
    if (!btn) return;
    setActiveCategory(btn.dataset.cat);
    closeMobileSidebar();
  });
}

function renderCategoryButtons(desktopList, mobileList, activeCats) {
  const allLabel = t("all");

  desktopList.innerHTML = `<li><button class="cat-btn${currentCat === "all" ? " active" : ""}" data-cat="all">${allLabel}</button></li>`;
  mobileList.innerHTML = `<li><button class="mobile-cat-btn${currentCat === "all" ? " active" : ""}" data-cat="all">${allLabel}</button></li>`;

  ALL_CATEGORIES.forEach(({ key, icon }) => {
    const hasProducts = activeCats.has(key);
    const label = categoryLabel(key);
    const isActive = currentCat === key;

    const dLi = document.createElement("li");
    const dBtn = document.createElement("button");
    dBtn.className =
      "cat-btn" +
      (hasProducts ? "" : " cat-btn--empty") +
      (isActive ? " active" : "");
    dBtn.dataset.cat = key;
    dBtn.innerHTML = `<span class="cat-icon">${icon}</span>${label}`;
    dLi.appendChild(dBtn);
    desktopList.appendChild(dLi);

    const mLi = document.createElement("li");
    const mBtn = document.createElement("button");
    mBtn.className =
      "mobile-cat-btn" +
      (hasProducts ? "" : " mobile-cat-btn--empty") +
      (isActive ? " active" : "");
    mBtn.dataset.cat = key;
    mBtn.innerHTML = `<span class="cat-icon">${icon}</span>${label}`;
    mLi.appendChild(mBtn);
    mobileList.appendChild(mLi);
  });
}

function renderGrid(products, cat = "all") {
  const grid = document.getElementById("productGrid");

  if (cat === "all") {
    if (!products.length) {
      grid.innerHTML = `<div class="empty-state"><h3>${t("empty_title")}</h3><p>${t("empty_sub")}</p></div>`;
      return;
    }
    grid.innerHTML = products.map(renderCard).join("");
    return;
  }

  const filtered = products.filter((p) => p.category === cat);
  if (!filtered.length) {
    grid.innerHTML = renderComingSoon();
    return;
  }
  grid.innerHTML = filtered.map(renderCard).join("");
}

/* ---- Hero discount banner: only show when a real discount exists ---- */
function updateDiscountBanner(products) {
  const banner = document.getElementById("discountBanner");
  if (!banner) return;

  const best = products.reduce((max, p) => Math.max(max, discountPercent(p)), 0);

  if (best <= 0) {
    banner.style.display = "none";
    return;
  }
  banner.style.display = "";
  const pctEl = document.getElementById("discountPercent");
  if (pctEl) pctEl.textContent = `-${best}%`;
}

/* ---- Re-render dynamic (non data-i18n) content when language changes ---- */
window.addEventListener("shop:langchange", () => {
  if (!currentProducts.length) return;
  const activeCats = new Set(currentProducts.map((p) => p.category));
  renderCategoryButtons(
    document.getElementById("catList"),
    document.getElementById("mobileCatList"),
    activeCats,
  );
  renderGrid(currentProducts, currentCat);
});

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
      `<div class="empty-state"><h3>${t("load_fail_title")}</h3><p>${t("load_fail_sub")}</p></div>`;
    const banner = document.getElementById("discountBanner");
    if (banner) banner.style.display = "none";
    return;
  }

  buildSidebars(products);
  renderGrid(products);
  updateDiscountBanner(products);

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
