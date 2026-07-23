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
      ? `<div><p class="product-price-old">${p.oldPrice} ₼</p><p class="product-price">${p.price} <span>₼</span></p></div>`
      : `<p class="product-price">${p.price} <span>₼</span></p>`;

  return `
    <a href="product.html?id=${p.id}" class="product-card">
      <div class="product-image">${imgHtml}${ribbonHtml}</div>
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
let currentSubcat = "all";
let currentBrand = "all";
let currentSort = "default";
let currentPage = 1;
const PAGE_SIZE = 12;

/* ---- Subcategory / brand helpers ----
   Both come from the products themselves (products.json's optional
   "subcategory" / "brand" fields) rather than a separate file, so the
   filters always match whatever the admin has actually assigned. ---- */
function getSubcategoriesForCategory(products, cat) {
  const scoped =
    cat === "all" ? products : products.filter((p) => p.category === cat);
  const subs = new Set(scoped.map((p) => p.subcategory).filter(Boolean));
  return [...subs].sort((a, b) => a.localeCompare(b));
}

// Brands scoped to a category AND (optionally) a subcategory within it —
// used by the toolbar's brand <select>, which should only ever offer
// brands that actually exist in the currently-browsed slice.
function getBrandsForScope(products, cat, subcat) {
  let scoped =
    cat === "all" ? products : products.filter((p) => p.category === cat);
  if (subcat && subcat !== "all") {
    scoped = scoped.filter((p) => p.subcategory === subcat);
  }
  const brands = new Set(scoped.map((p) => p.brand).filter(Boolean));
  return [...brands].sort((a, b) => a.localeCompare(b));
}

// Brands belonging to products that have NO subcategory — these are the
// ones shown as a flat list directly under a category in the flyout/
// accordion (categories that haven't been given subcategories yet).
function getDirectBrandsForCategory(products, cat) {
  const scoped = (
    cat === "all" ? products : products.filter((p) => p.category === cat)
  ).filter((p) => !p.subcategory);
  const brands = new Set(scoped.map((p) => p.brand).filter(Boolean));
  return [...brands].sort((a, b) => a.localeCompare(b));
}

// { subcat, brands }[] for a category — powers the nested flyout/accordion.
function getSubcategoryGroups(products, cat) {
  const scoped =
    cat === "all" ? products : products.filter((p) => p.category === cat);
  const map = new Map();
  scoped.forEach((p) => {
    if (!p.subcategory) return;
    if (!map.has(p.subcategory)) map.set(p.subcategory, new Set());
    if (p.brand) map.get(p.subcategory).add(p.brand);
  });
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([subcat, brandSet]) => ({
      subcat,
      brands: [...brandSet].sort((a, b) => a.localeCompare(b)),
    }));
}

// Rebuilds the toolbar's subcategory <select> for the given category.
// The whole toolbar group hides itself when the category has none.
function refreshSubcatOptions(cat) {
  const select = document.getElementById("subcatSelect");
  const group = document.getElementById("subcatToolbarGroup");
  if (!select || !group) return;

  const subs = getSubcategoriesForCategory(currentProducts, cat);
  if (!subs.length) {
    group.style.display = "none";
    currentSubcat = "all";
    return;
  }
  group.style.display = "";
  select.innerHTML =
    `<option value="all">${t("all_subcats")}</option>` +
    subs.map((s) => `<option value="${s}">${s}</option>`).join("");

  if (currentSubcat !== "all" && !subs.includes(currentSubcat)) {
    currentSubcat = "all";
  }
  select.value = currentSubcat;
}

// Rebuilds the toolbar's brand <select> for the given category+subcategory.
// Keeps the currently selected brand if it's still valid for that scope,
// otherwise falls back to "all" instead of silently showing zero results.
// A single-brand catalog gets nothing to actually filter, so the whole
// group hides — a dropdown with one meaningless option looks unfinished.
function refreshBrandOptions(cat) {
  const select = document.getElementById("brandSelect");
  const group = document.getElementById("brandToolbarGroup");
  if (!select || !group) return;

  const brands = getBrandsForScope(currentProducts, cat, currentSubcat);
  if (brands.length < 2) {
    group.style.display = "none";
    currentBrand = "all";
    return;
  }
  group.style.display = "";
  select.innerHTML =
    `<option value="all">${t("all_brands")}</option>` +
    brands.map((b) => `<option value="${b}">${b}</option>`).join("");

  if (currentBrand !== "all" && !brands.includes(currentBrand)) {
    currentBrand = "all";
  }
  select.value = currentBrand;
}

function updateBrandLinkActiveStates() {
  document
    .querySelectorAll(".cat-flyout-link, .mobile-cat-sublist-link")
    .forEach((el) => {
      const elSubcat = el.dataset.subcat || "all";
      const elBrand = el.dataset.brand || "all";
      el.classList.toggle(
        "active",
        el.dataset.cat === currentCat &&
          elSubcat === currentSubcat &&
          elBrand === currentBrand,
      );
    });
}

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
  currentSubcat = "all";
  currentBrand = "all";
  currentPage = 1;
  refreshSubcatOptions(cat);
  refreshBrandOptions(cat);

  // Desktop sidebar
  document
    .querySelectorAll(".cat-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.cat === cat));
  // Mobile list
  document
    .querySelectorAll(".mobile-cat-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.cat === cat));
  updateBrandLinkActiveStates();
  // Active label
  const lbl = document.getElementById("activeCatLabel");
  if (lbl) lbl.textContent = cat === "all" ? t("all") : categoryLabel(cat);

  renderGrid(currentProducts, cat);
}

// Used by the category mega-menu's shortcuts (desktop flyout / mobile
// accordion): jumps straight to a category pre-filtered by a subcategory
// and/or brand. Either can be omitted ("all") — e.g. clicking a subcategory
// heading passes no brand, clicking a nested brand link passes both.
function selectCategoryFromFlyout(cat, subcat, brand) {
  currentCat = cat;
  currentSubcat = subcat || "all";
  currentBrand = brand || "all";
  currentPage = 1;
  refreshSubcatOptions(cat);
  refreshBrandOptions(cat);

  document
    .querySelectorAll(".cat-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.cat === cat));
  document
    .querySelectorAll(".mobile-cat-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.cat === cat));
  updateBrandLinkActiveStates();

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

  renderCategoryButtons(desktopList, mobileList, activeCats, products);

  // Click handlers — desktop (plain category buttons + flyout subcat/brand links)
  desktopList.addEventListener("click", (e) => {
    const flyoutLink = e.target.closest(".cat-flyout-link");
    if (flyoutLink) {
      selectCategoryFromFlyout(
        flyoutLink.dataset.cat,
        flyoutLink.dataset.subcat || "all",
        flyoutLink.dataset.brand || "all",
      );
      return;
    }
    const btn = e.target.closest(".cat-btn");
    if (!btn) return;
    setActiveCategory(btn.dataset.cat);
  });

  // Click handlers — mobile (category buttons, accordion toggle, subcat/brand links)
  mobileList.addEventListener("click", (e) => {
    const toggle = e.target.closest(".mobile-cat-toggle");
    if (toggle) {
      toggle.classList.toggle("open");
      toggle
        .closest(".mobile-cat-item")
        ?.querySelector(".mobile-cat-sublist")
        ?.classList.toggle("open");
      return;
    }
    const subLink = e.target.closest(".mobile-cat-sublist-link");
    if (subLink) {
      selectCategoryFromFlyout(
        subLink.dataset.cat,
        subLink.dataset.subcat || "all",
        subLink.dataset.brand || "all",
      );
      closeMobileSidebar();
      return;
    }
    const btn = e.target.closest(".mobile-cat-btn");
    if (!btn) return;
    setActiveCategory(btn.dataset.cat);
    closeMobileSidebar();
  });

  // Toolbar — sort + subcategory + brand
  document.getElementById("sortSelect")?.addEventListener("change", (e) => {
    currentSort = e.target.value;
    currentPage = 1;
    renderGrid(currentProducts, currentCat);
  });
  document.getElementById("subcatSelect")?.addEventListener("change", (e) => {
    currentSubcat = e.target.value;
    currentBrand = "all";
    currentPage = 1;
    refreshBrandOptions(currentCat);
    updateBrandLinkActiveStates();
    renderGrid(currentProducts, currentCat);
  });
  document.getElementById("brandSelect")?.addEventListener("change", (e) => {
    currentBrand = e.target.value;
    currentPage = 1;
    updateBrandLinkActiveStates();
    renderGrid(currentProducts, currentCat);
  });

  refreshSubcatOptions(currentCat);
  refreshBrandOptions(currentCat);
}

function renderCategoryButtons(desktopList, mobileList, activeCats, products) {
  const allLabel = t("all");

  desktopList.innerHTML = `<li class="cat-item"><button class="cat-btn${currentCat === "all" ? " active" : ""}" data-cat="all">${allLabel}</button></li>`;
  mobileList.innerHTML = `<li class="mobile-cat-item"><div class="mobile-cat-row"><button class="mobile-cat-btn${currentCat === "all" ? " active" : ""}" data-cat="all">${allLabel}</button></div></li>`;

  ALL_CATEGORIES.forEach(({ key, icon }) => {
    // Categories with no products yet stay hidden — no point showing an
    // empty, unclickable-feeling entry before you've actually added anything.
    if (!activeCats.has(key)) return;

    const label = categoryLabel(key);
    const isActive = currentCat === key;
    const subcatGroups = getSubcategoryGroups(products, key);
    const directBrands = getDirectBrandsForCategory(products, key);
    // A single-brand catalog has nothing to actually choose between, so
    // brand links only earn their place once there's a real choice (2+).
    const hasFlyout = subcatGroups.length > 0 || directBrands.length > 1;

    const isLinkActive = (subcat, brand) =>
      currentCat === key &&
      currentSubcat === (subcat || "all") &&
      currentBrand === (brand || "all");

    // Shared inner markup for both the desktop flyout and the mobile
    // accordion: subcategory groups (bold heading + nested brand links,
    // only when 2+ brands make the nesting worthwhile), then any brands
    // whose products have no subcategory at all (same 2+ rule).
    const groupsHtml = subcatGroups
      .map(
        ({ subcat, brands }) => `
        <li class="cat-flyout-group">
          <button class="cat-flyout-link cat-flyout-link--subcat${isLinkActive(subcat) ? " active" : ""}" data-cat="${key}" data-subcat="${subcat}">${subcat}</button>
          ${
            brands.length > 1
              ? `<ul class="cat-flyout-brands">${brands
                  .map(
                    (b) =>
                      `<li><button class="cat-flyout-link${isLinkActive(subcat, b) ? " active" : ""}" data-cat="${key}" data-subcat="${subcat}" data-brand="${b}">${b}</button></li>`,
                  )
                  .join("")}</ul>`
              : ""
          }
        </li>`,
      )
      .join("");
    const directBrandsHtml =
      directBrands.length > 1
        ? directBrands
            .map(
              (b) =>
                `<li><button class="cat-flyout-link${isLinkActive(null, b) ? " active" : ""}" data-cat="${key}" data-brand="${b}">${b}</button></li>`,
            )
            .join("")
        : "";

    // ---- Desktop: li.cat-item[.has-flyout] > button.cat-btn + div.cat-flyout ----
    const dLi = document.createElement("li");
    dLi.className = "cat-item" + (hasFlyout ? " has-flyout" : "");

    const dBtn = document.createElement("button");
    dBtn.className = "cat-btn" + (isActive ? " active" : "");
    dBtn.dataset.cat = key;
    dBtn.innerHTML = `<span class="cat-icon">${icon}</span>${label}`;
    dLi.appendChild(dBtn);

    if (hasFlyout) {
      const flyout = document.createElement("div");
      flyout.className = "cat-flyout";
      flyout.innerHTML = `
        <div class="cat-flyout-title">${label}</div>
        <ul class="cat-flyout-list">${groupsHtml}${directBrandsHtml}</ul>`;
      dLi.appendChild(flyout);
    }
    desktopList.appendChild(dLi);

    // ---- Mobile: li.mobile-cat-item > div.mobile-cat-row(button[+toggle]) + ul.mobile-cat-sublist ----
    const mLi = document.createElement("li");
    mLi.className = "mobile-cat-item";

    const row = document.createElement("div");
    row.className = "mobile-cat-row";

    const mBtn = document.createElement("button");
    mBtn.className = "mobile-cat-btn" + (isActive ? " active" : "");
    mBtn.dataset.cat = key;
    mBtn.innerHTML = `<span class="cat-icon">${icon}</span>${label}`;
    row.appendChild(mBtn);

    if (hasFlyout) {
      const toggleBtn = document.createElement("button");
      toggleBtn.className = "mobile-cat-toggle";
      toggleBtn.setAttribute("aria-label", "Alt-kateqoriyalar");
      toggleBtn.innerHTML = "▾";
      row.appendChild(toggleBtn);
    }
    mLi.appendChild(row);

    if (hasFlyout) {
      const sublist = document.createElement("ul");
      sublist.className = "mobile-cat-sublist";
      sublist.innerHTML =
        subcatGroups
          .map(
            ({ subcat, brands }) => `
          <li class="mobile-cat-subgroup">
            <button class="mobile-cat-sublist-link mobile-cat-sublist-link--subcat${isLinkActive(subcat) ? " active" : ""}" data-cat="${key}" data-subcat="${subcat}">${subcat}</button>
            ${
              brands.length > 1
                ? brands
                    .map(
                      (b) =>
                        `<button class="mobile-cat-sublist-link mobile-cat-sublist-link--brand${isLinkActive(subcat, b) ? " active" : ""}" data-cat="${key}" data-subcat="${subcat}" data-brand="${b}">${b}</button>`,
                    )
                    .join("")
                : ""
            }
          </li>`,
          )
          .join("") +
        (directBrands.length > 1
          ? directBrands
              .map(
                (b) =>
                  `<li><button class="mobile-cat-sublist-link${isLinkActive(null, b) ? " active" : ""}" data-cat="${key}" data-brand="${b}">${b}</button></li>`,
              )
              .join("")
          : "");
      mLi.appendChild(sublist);
    }
    mobileList.appendChild(mLi);
  });
}

function renderGrid(products, cat = "all") {
  const grid = document.getElementById("productGrid");
  const pagination = document.getElementById("pagination");

  let filtered =
    cat === "all" ? products : products.filter((p) => p.category === cat);
  if (currentSubcat !== "all") {
    filtered = filtered.filter((p) => p.subcategory === currentSubcat);
  }
  if (currentBrand !== "all") {
    filtered = filtered.filter((p) => p.brand === currentBrand);
  }

  if (!filtered.length) {
    grid.innerHTML =
      cat === "all" && currentSubcat === "all" && currentBrand === "all"
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
  if (!hasOverflow) return;

  prevBtn.disabled = grid.scrollLeft <= 4;
  nextBtn.disabled = grid.scrollLeft >= grid.scrollWidth - grid.clientWidth - 4;
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

  if (!campaign || !campaign.enabled || !campaign.startDate) {
    banner.style.display = "none";
    return;
  }

  // Counts down to the campaign's start — once that date arrives the
  // "coming soon" banner has done its job, so it hides itself.
  const target = new Date(campaign.startDate);
  if (isNaN(target.getTime()) || target.getTime() <= Date.now()) {
    banner.style.display = "none";
    return;
  }

  currentCampaign = campaign;
  banner.style.display = "";
  applyCampaignText();
  startCampaignTimer(target);
}

/* ---- Re-render dynamic (non data-i18n) content when language changes ---- */
window.addEventListener("shop:langchange", () => {
  if (!currentProducts.length) return;
  const activeCats = new Set(currentProducts.map((p) => p.category));
  renderCategoryButtons(
    document.getElementById("catList"),
    document.getElementById("mobileCatList"),
    activeCats,
    currentProducts,
  );
  refreshSubcatOptions(currentCat);
  refreshBrandOptions(currentCat);
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
