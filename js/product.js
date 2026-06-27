/* ============================================
   Məhsul səhifəsi — product.js
   ============================================ */

const WA_NUMBER_FALLBACK = '994703007513';

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

async function loadProducts() {
  const res = await fetch('data/products.json?v=' + Date.now());
  return await res.json();
}

function getIdFromURL() {
  return new URLSearchParams(window.location.search).get('id');
}

function buildWALink(product) {
  const number = getWANumber();
  const msg = product.whatsapp || `Salam! ${product.name} (${product.price}₼) haqqında məlumat almaq istəyirəm.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
}

function renderProduct(p) {
  document.title = `${p.name} — elementstore.az`;

  const imgHtml = p.image
    ? `<img src="${p.image}" alt="${p.name}">`
    : `<div class="detail-image-placeholder">🏠</div>`;

  const stockHtml = p.inStock
    ? `<div class="detail-stock in">✓ Stokda var</div>`
    : `<div class="detail-stock out">✗ Stokda yoxdur</div>`;

  const waLink = buildWALink(p);
  const btnClass = p.inStock ? 'btn-whatsapp' : 'btn-whatsapp disabled';
  const btnAttr = p.inStock ? `href="${waLink}" target="_blank"` : '';

  return `
    <div class="detail-inner">
      <div class="detail-image">${imgHtml}</div>
      <div class="detail-info">
        <p class="detail-category">${p.category}</p>
        <h1 class="detail-name">${p.name}</h1>
        <p class="detail-price">${p.price} <span>₼</span></p>
        ${stockHtml}
        <p class="detail-desc">${p.description}</p>
        <a class="${btnClass}" ${btnAttr}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          ${p.inStock ? 'WhatsApp-da sifariş et' : 'Stokda yoxdur'}
        </a>
      </div>
    </div>`;
}

async function init() {
  const id = getIdFromURL();
  const container = document.getElementById('productDetail');

  if (!id) {
    container.innerHTML = `<div class="loading-state">Məhsul tapılmadı. <a href="index.html">Kataloqa qayıt</a></div>`;
    return;
  }

  try {
    const products = await loadProducts();
    const product = products.find(p => p.id === id);

    if (!product) {
      container.innerHTML = `<div class="loading-state">Məhsul tapılmadı. <a href="index.html">Kataloqa qayıt</a></div>`;
      return;
    }

    container.innerHTML = renderProduct(product);
  } catch {
    container.innerHTML = `<div class="loading-state">Xəta baş verdi. <a href="index.html">Kataloqa qayıt</a></div>`;
  }
}

init();
