/* ============================================
   Kataloq — main.js
   ============================================ */

// The catalog renders its grid/featured section asynchronously after fetching
// products.json, so the browser's automatic scroll restoration fires too early
// (before the page has its real height) and ends up in the wrong place. We
// restore the scroll position ourselves once rendering is done instead.
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const WA_NUMBER_FALLBACK = "994703007513";

const ALL_CATEGORIES = [
  { key: "Böyük məişət texnikası", icon: "🫙" },
  { key: "Kiçik məişət texnikası", icon: "🍳" },
  { key: "TV və Audio", icon: "📺" },
  { key: "Evə uyğun məhsullar", icon: "🏠" },
];

async function loadProducts() {
  try {
    const res = await fetch("data/products.json");
    return await res.json();
  } catch {
    return [];
  }
}

async function loadCampaign() {
  try {
    const res = await fetch("data/campaign.json");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
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
  return s.siteName || "Elementstore";
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

// Only shows products explicitly marked "Ön plana çıxar" in the admin —
// leaving it unchecked means the product stays out of this section.
// Among those, highest discount % leads.
function getFeaturedProducts(products) {
  return products
    .filter((p) => p.featured)
    .sort((a, b) => discountPercent(b) - discountPercent(a));
}

function renderCard(p) {
  const pct = discountPercent(p);

  const imgHtml = p.image
    ? `<img src="${p.image}" alt="${localized(p, "name")}" loading="lazy">`
    : `<div class="product-image-placeholder">🏠</div>`;
  const ribbonHtml =
    pct > 0 ? `<span class="discount-ribbon">-${pct}%</span>` : "";

  const stockHtml = p.inStock
    ? `<span class="stock-badge in">${t("stock_in")}</span>`
    : `<span class="stock-badge out">${t("stock_out")}</span>`;

  const priceHtml =
    pct > 0
      ? `<div class="product-price-block"><p class="product-price-old">${p.oldPrice} ₼</p><p class="product-price">${p.price} <span>₼</span></p></div>`
      : `<p class="product-price">${p.price} <span>₼</span></p>`;

  const cartBtnHtml = `<button class="card-cart-btn" data-id="${p.id}" aria-label="${t("cart_add")}"${p.inStock ? "" : " disabled"}>🛒</button>`;

  return `
    <a href="product.html?id=${p.id}" class="product-card">
      <div class="product-image">${imgHtml}${ribbonHtml}${cartBtnHtml}</div>
      <div class="product-body">
        <p class="product-category">${categoryLabel(p.category)}</p>
        <h3 class="product-name">${localized(p, "name")}</h3>
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
let currentSort = "default";
let currentPage = 1;
const PAGE_SIZE = 12;

function applySort(products, sort) {
  if (sort === "price_asc") {
    return [...products].sort(
      (a, b) => parseFloat(a.price) - parseFloat(b.price),
    );
  }
  if (sort === "price_desc") {
    return [...products].sort(
      (a, b) => parseFloat(b.price) - parseFloat(a.price),
    );
  }
  return products;
}

function setActiveCategory(cat) {
  currentCat = cat;
  currentPage = 1;

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
  document
    .getElementById("catalog")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function buildSidebars(products) {
  const activeCats = new Set(products.map((p) => p.category));

  const desktopList = document.getElementById("catList");
  const mobileList = document.getElementById("mobileCatList");

  renderCategoryButtons(desktopList, mobileList, activeCats);

  desktopList.addEventListener("click", (e) => {
    const btn = e.target.closest(".cat-btn");
    if (!btn) return;
    setActiveCategory(btn.dataset.cat);
  });

  mobileList.addEventListener("click", (e) => {
    const btn = e.target.closest(".mobile-cat-btn");
    if (!btn) return;
    setActiveCategory(btn.dataset.cat);
    closeMobileSidebar();
  });

  document.getElementById("sortSelect")?.addEventListener("change", (e) => {
    currentSort = e.target.value;
    currentPage = 1;
    renderGrid(currentProducts, currentCat);
  });
}

function renderCategoryButtons(desktopList, mobileList, activeCats) {
  const allLabel = t("all");

  desktopList.innerHTML = `<li class="cat-item"><button class="cat-btn${currentCat === "all" ? " active" : ""}" data-cat="all">${allLabel}</button></li>`;
  mobileList.innerHTML = `<li class="mobile-cat-item"><div class="mobile-cat-row"><button class="mobile-cat-btn${currentCat === "all" ? " active" : ""}" data-cat="all">${allLabel}</button></div></li>`;

  ALL_CATEGORIES.forEach(({ key, icon }) => {
    // All main categories always show (browsable even before you've added
    // anything to them yet), just styled as muted when still empty.
    const hasProducts = activeCats.has(key);
    const label = categoryLabel(key);
    const isActive = currentCat === key;

    const dLi = document.createElement("li");
    dLi.className = "cat-item";
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
    mLi.className = "mobile-cat-item";
    const row = document.createElement("div");
    row.className = "mobile-cat-row";
    const mBtn = document.createElement("button");
    mBtn.className =
      "mobile-cat-btn" +
      (hasProducts ? "" : " mobile-cat-btn--empty") +
      (isActive ? " active" : "");
    mBtn.dataset.cat = key;
    mBtn.innerHTML = `<span class="cat-icon">${icon}</span>${label}`;
    row.appendChild(mBtn);
    mLi.appendChild(row);
    mobileList.appendChild(mLi);
  });
}

function renderGrid(products, cat = "all") {
  const grid = document.getElementById("productGrid");
  const pagination = document.getElementById("pagination");

  let filtered =
    cat === "all" ? products : products.filter((p) => p.category === cat);

  if (!filtered.length) {
    grid.innerHTML =
      cat === "all"
        ? `<div class="empty-state"><h3>${t("empty_title")}</h3><p>${t("empty_sub")}</p></div>`
        : renderComingSoon();
    if (pagination) pagination.innerHTML = "";
    return;
  }

  filtered = applySort(filtered, currentSort);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  grid.innerHTML = pageItems.map(renderCard).join("");
  renderPagination(totalPages);
}

function goToPage(page) {
  currentPage = page;
  renderGrid(currentProducts, currentCat);
  document
    .getElementById("catalog")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderPagination(totalPages) {
  const pagination = document.getElementById("pagination");
  if (!pagination) return;

  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  // Build the page-number list: always show first/last, current ± 1,
  // and collapse the rest behind "…" once there are too many to fit.
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  const pageButtons = pages
    .map((p) =>
      p === "…"
        ? `<span class="page-ellipsis">…</span>`
        : `<button class="page-btn${p === currentPage ? " active" : ""}" data-page="${p}">${p}</button>`,
    )
    .join("");

  pagination.innerHTML = `
    <button class="page-arrow" data-page="${currentPage - 1}" ${currentPage <= 1 ? "disabled" : ""} aria-label="Geri">‹</button>
    ${pageButtons}
    <button class="page-arrow" data-page="${currentPage + 1}" ${currentPage >= totalPages ? "disabled" : ""} aria-label="İrəli">›</button>
  `;
}

document.getElementById("pagination")?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-page]");
  if (!btn || btn.disabled) return;
  const page = parseInt(btn.dataset.page, 10);
  if (!isNaN(page)) goToPage(page);
});

/* ---- Featured / best-deals section: hidden unless there's real data ---- */
function renderFeaturedSection(products) {
  const section = document.getElementById("featuredSection");
  const grid = document.getElementById("featuredGrid");
  if (!section || !grid) return;

  const featured = getFeaturedProducts(products);
  if (!featured.length) {
    section.style.display = "none";
    return;
  }
  section.style.display = "";
  grid.innerHTML = featured.map(renderCard).join("");
  requestAnimationFrame(updateFeaturedArrows);
}

/* ---- Featured carousel arrows: only shown when the row actually overflows ---- */
function updateFeaturedArrows() {
  const grid = document.getElementById("featuredGrid");
  const prevBtn = document.getElementById("featuredPrev");
  const nextBtn = document.getElementById("featuredNext");
  if (!grid || !prevBtn || !nextBtn) return;

  const hasOverflow = grid.scrollWidth > grid.clientWidth + 4;
  prevBtn.classList.toggle("hidden", !hasOverflow);
  nextBtn.classList.toggle("hidden", !hasOverflow);
  if (!hasOverflow) {
    grid.classList.remove("fade-left", "fade-right");
    return;
  }

  const canScrollLeft = grid.scrollLeft > 4;
  const canScrollRight =
    grid.scrollLeft < grid.scrollWidth - grid.clientWidth - 4;
  prevBtn.disabled = !canScrollLeft;
  nextBtn.disabled = !canScrollRight;
  grid.classList.toggle("fade-left", canScrollLeft);
  grid.classList.toggle("fade-right", canScrollRight);
}

function scrollFeatured(direction) {
  const grid = document.getElementById("featuredGrid");
  if (!grid) return;
  const card = grid.querySelector(".product-card");
  const gap = 24; // matches .featured-grid gap
  const amount = card ? card.getBoundingClientRect().width + gap : 300;
  grid.scrollBy({ left: direction * amount, behavior: "smooth" });
}

function initFeaturedCarousel() {
  const grid = document.getElementById("featuredGrid");
  const prevBtn = document.getElementById("featuredPrev");
  const nextBtn = document.getElementById("featuredNext");
  if (!grid || !prevBtn || !nextBtn) return;

  prevBtn.addEventListener("click", () => scrollFeatured(-1));
  nextBtn.addEventListener("click", () => scrollFeatured(1));
  grid.addEventListener("scroll", updateFeaturedArrows);
  window.addEventListener("resize", updateFeaturedArrows);
}

/* ---- Campaign banner + countdown timer ----
   Reads data/campaign.json (a static file, same pattern as products.json,
   so every visitor — not just the admin's own browser — sees the same
   countdown). Counts down to the campaign's start date; hidden entirely
   if disabled, missing, or the start date has already passed. ---- */
let currentCampaign = null;
let campaignTimerHandle = null;

function stopCampaignTimer() {
  if (campaignTimerHandle) {
    clearInterval(campaignTimerHandle);
    campaignTimerHandle = null;
  }
}

function startCampaignTimer(targetDate) {
  stopCampaignTimer();
  const banner = document.getElementById("campaignBanner");
  const pad = (n) => String(n).padStart(2, "0");

  function tick() {
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) {
      stopCampaignTimer();
      if (banner) banner.style.display = "none";
      return;
    }
    document.getElementById("timerDays").textContent = pad(
      Math.floor(diff / 86400000),
    );
    document.getElementById("timerHours").textContent = pad(
      Math.floor((diff % 86400000) / 3600000),
    );
    document.getElementById("timerMinutes").textContent = pad(
      Math.floor((diff % 3600000) / 60000),
    );
    document.getElementById("timerSeconds").textContent = pad(
      Math.floor((diff % 60000) / 1000),
    );
  }

  tick();
  campaignTimerHandle = setInterval(tick, 1000);
}

function applyCampaignText() {
  if (!currentCampaign) return;
  const titleEl = document.getElementById("campaignTitle");
  const subEl = document.getElementById("campaignSubtitle");
  if (titleEl) titleEl.textContent = localized(currentCampaign, "title");
  if (subEl) subEl.textContent = localized(currentCampaign, "subtitle");
}

function setupCampaign(campaign) {
  const banner = document.getElementById("campaignBanner");
  if (!banner) return;

  if (!campaign || !campaign.enabled) {
    banner.style.display = "none";
    return;
  }

  const now = Date.now();
  const start = campaign.startDate ? new Date(campaign.startDate) : null;
  const end = campaign.endDate ? new Date(campaign.endDate) : null;
  const startValid = start && !isNaN(start.getTime());
  const endValid = end && !isNaN(end.getTime());

  // Before the campaign starts: count down to the start (a "coming soon"
  // banner). Once that date arrives, switch to counting down to the end
  // instead (a "hurry, ends soon" banner) — hide only once both have passed.
  let countdownTarget = null;
  if (startValid && start.getTime() > now) {
    countdownTarget = start;
  } else if (endValid && end.getTime() > now) {
    countdownTarget = end;
  }

  if (!countdownTarget) {
    banner.style.display = "none";
    return;
  }

  currentCampaign = campaign;
  banner.style.display = "";
  applyCampaignText();
  startCampaignTimer(countdownTarget);
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
  renderFeaturedSection(currentProducts);
  applyCampaignText();
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
  const [products, campaign] = await Promise.all([
    loadProducts(),
    loadCampaign(),
  ]);
  currentProducts = products;

  if (!products.length) {
    document.getElementById("productGrid").innerHTML =
      `<div class="empty-state"><h3>${t("load_fail_title")}</h3><p>${t("load_fail_sub")}</p></div>`;
    const banner = document.getElementById("campaignBanner");
    if (banner) banner.style.display = "none";
    return;
  }

  buildSidebars(products);
  renderGrid(products);
  initFeaturedCarousel();
  renderFeaturedSection(products);
  setupCampaign(campaign);
  bindCardAddToCart(document.getElementById("productGrid"));
  bindCardAddToCart(document.getElementById("featuredGrid"));

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

  restoreScrollPosition();
}

/* ---- Scroll position restore (see scrollRestoration note above) ---- */
function restoreScrollPosition() {
  try {
    const navEntry = performance.getEntriesByType("navigation")[0];
    const isBack = navEntry && navEntry.type === "back_forward";
    const saved = sessionStorage.getItem("catalogScrollY");
    if (isBack && saved !== null) {
      window.scrollTo(0, parseInt(saved, 10) || 0);
    }
  } catch {
    // sessionStorage/Performance API unavailable — just stay at the top.
  }
}

window.addEventListener("pagehide", () => {
  try {
    sessionStorage.setItem("catalogScrollY", String(window.scrollY));
  } catch {
    // sessionStorage unavailable (e.g. private mode) — nothing to persist.
  }
});

init();
