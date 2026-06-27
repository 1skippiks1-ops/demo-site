/* ============================================
   Kataloq — main.js
   ============================================ */

const WA_NUMBER_FALLBACK = '994703007513';

async function loadProducts() {
  try {
    const res = await fetch('data/products.json?v=' + Date.now());
    return await res.json();
  } catch {
    return [];
  }
}

function getSettings() {
  try {
    const s = localStorage.getItem('shop_settings');
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
}

function getWANumber() {
  const s = getSettings();
  return s.waNumber || WA_NUMBER_FALLBACK;
}

function getSiteName() {
  const s = getSettings();
  return s.siteName || 'elementstore.az';
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

function buildFilters(products) {
  const cats = [...new Set(products.map(p => p.category))];
  const bar = document.querySelector('.filter-bar');
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.cat = cat;
    btn.textContent = cat;
    bar.appendChild(btn);
  });

  bar.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderGrid(products, btn.dataset.cat);
  });
}

function renderGrid(products, cat = 'all') {
  const grid = document.getElementById('productGrid');
  const filtered = cat === 'all' ? products : products.filter(p => p.category === cat);

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state"><h3>Məhsul tapılmadı</h3><p>Bu kateqoriyada hələ məhsul yoxdur.</p></div>`;
    return;
  }
  grid.innerHTML = filtered.map(renderCard).join('');
}

async function init() {
  document.title = getSiteName();
  const products = await loadProducts();

  if (!products.length) {
    document.getElementById('productGrid').innerHTML =
      `<div class="empty-state"><h3>Məhsullar yüklənmir</h3><p>Zəhmət olmasa bir az sonra yenidən cəhd edin.</p></div>`;
    return;
  }

  buildFilters(products);
  renderGrid(products);
}

init();
