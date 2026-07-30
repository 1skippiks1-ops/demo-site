/* ============================================
   Səbət — cart.js
   Shared by index.html and product.html. Loads after i18n.js (needs t() /
   localized()) and before main.js / product.js (which call addToCart()).
   State lives in localStorage as [{ id, qty }] — just ids/quantities, not
   full product snapshots, so prices/names always come fresh from
   products.json and never go stale.
   ============================================ */

const CART_KEY = "shop_cart";
const CART_WA_FALLBACK = "994703007513";

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // localStorage unavailable (private mode / quota) — cart just won't persist.
  }
  updateCartBadge();
  window.dispatchEvent(new CustomEvent("shop:cartchange"));
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function addToCart(id, qty = 1) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === id);
  if (existing) existing.qty += qty;
  else cart.push({ id, qty });
  setCart(cart);
}

function removeFromCart(id) {
  setCart(getCart().filter((item) => item.id !== id));
}

function setCartQty(id, qty) {
  if (qty <= 0) {
    removeFromCart(id);
    return;
  }
  const cart = getCart();
  const existing = cart.find((item) => item.id === id);
  if (existing) existing.qty = qty;
  setCart(cart);
}

function clearCart() {
  setCart([]);
}

function updateCartBadge() {
  document.querySelectorAll(".cart-badge").forEach((badge) => {
    const count = getCartCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? "" : "none";
  });
}

async function loadCartProducts() {
  try {
    const res = await fetch("data/products.json");
    return await res.json();
  } catch {
    return [];
  }
}

// Mirrors getWANumber() in main.js/product.js — duplicated (rather than
// imported) so cart.js has no load-order dependency on either file.
function getCartWANumber() {
  try {
    const s = JSON.parse(localStorage.getItem("shop_settings") || "{}");
    return s.waNumber || CART_WA_FALLBACK;
  } catch {
    return CART_WA_FALLBACK;
  }
}

let cartToastTimer = null;
function showCartToast(message) {
  let toast = document.getElementById("shopToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "shopToast";
    toast.className = "shop-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(cartToastTimer);
  cartToastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function buildCartWhatsAppLink(lines) {
  const number = getCartWANumber();
  const itemLines = lines
    .map(({ qty, product: p }, i) => {
      const name = localized(p, "name");
      const lineTotal = (parseFloat(p.price) * qty).toFixed(2);
      return `${i + 1}. ${name} — ${qty} x ${p.price}₼ = ${lineTotal}₼`;
    })
    .join("\n");
  const total = lines
    .reduce((sum, { qty, product: p }) => sum + parseFloat(p.price) * qty, 0)
    .toFixed(2);
  const msg = `${t("cart_wa_greeting")}\n\n${itemLines}\n\n${t("cart_total")}: ${total}₼`;
  return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
}

function renderCartDrawer(products) {
  const body = document.getElementById("cartBody");
  const footer = document.getElementById("cartFooter");
  if (!body || !footer) return;

  const cart = getCart();
  const lines = cart
    .map((item) => {
      const p = products.find((x) => x.id === item.id);
      return p ? { id: item.id, qty: item.qty, product: p } : null;
    })
    .filter(Boolean);

  if (!lines.length) {
    body.innerHTML = `<div class="cart-empty"><p>${t("cart_empty")}</p></div>`;
    footer.innerHTML = "";
    return;
  }

  body.innerHTML = lines
    .map(({ id, qty, product: p }) => {
      const imgHtml = p.image
        ? `<img src="${p.image}" alt="${localized(p, "name")}">`
        : `<div class="cart-item-img-placeholder">🏠</div>`;
      const lineTotal = (parseFloat(p.price) * qty).toFixed(2);
      return `
      <div class="cart-item" data-id="${id}">
        <div class="cart-item-img">${imgHtml}</div>
        <div class="cart-item-info">
          <p class="cart-item-name">${localized(p, "name")}</p>
          <p class="cart-item-price">${p.price} ₼</p>
          <div class="cart-item-qty">
            <button class="cart-qty-btn" data-action="dec" aria-label="-">−</button>
            <span>${qty}</span>
            <button class="cart-qty-btn" data-action="inc" aria-label="+">+</button>
          </div>
        </div>
        <div class="cart-item-side">
          <p class="cart-item-total">${lineTotal} ₼</p>
          <button class="cart-item-remove" aria-label="Sil">✕</button>
        </div>
      </div>`;
    })
    .join("");

  const total = lines
    .reduce((sum, { qty, product: p }) => sum + parseFloat(p.price) * qty, 0)
    .toFixed(2);

  footer.innerHTML = `
    <div class="cart-total-row">
      <button class="cart-clear-btn" id="cartClearBtn">${t("cart_clear")}</button>
      <span class="cart-total-amount">${t("cart_total")}: ${total} ₼</span>
    </div>
    <a class="btn-whatsapp" id="cartCheckoutBtn" href="${buildCartWhatsAppLink(lines)}" target="_blank">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      ${t("cart_checkout_whatsapp")}
    </a>`;
}

let cartProductsCache = null;

async function openCartDrawer() {
  const overlay = document.getElementById("cartOverlay");
  const drawer = document.getElementById("cartDrawer");
  if (!overlay || !drawer) return;
  overlay.classList.add("open");
  drawer.classList.add("open");
  document.body.style.overflow = "hidden";
  if (!cartProductsCache) cartProductsCache = await loadCartProducts();
  renderCartDrawer(cartProductsCache);
}

function closeCartDrawer() {
  document.getElementById("cartOverlay")?.classList.remove("open");
  document.getElementById("cartDrawer")?.classList.remove("open");
  document.body.style.overflow = "";
}

function refreshOpenCartDrawer() {
  if (cartProductsCache && document.getElementById("cartDrawer")?.classList.contains("open")) {
    renderCartDrawer(cartProductsCache);
  }
}

function initCart() {
  updateCartBadge();

  document.querySelectorAll(".cart-btn").forEach((btn) =>
    btn.addEventListener("click", openCartDrawer),
  );
  document.getElementById("cartClose")?.addEventListener("click", closeCartDrawer);
  document.getElementById("cartOverlay")?.addEventListener("click", closeCartDrawer);

  document.getElementById("cartBody")?.addEventListener("click", (e) => {
    const item = e.target.closest(".cart-item");
    if (!item) return;
    const id = item.dataset.id;

    if (e.target.closest(".cart-item-remove")) {
      removeFromCart(id);
      refreshOpenCartDrawer();
      return;
    }
    const qtyBtn = e.target.closest(".cart-qty-btn");
    if (qtyBtn) {
      const entry = getCart().find((c) => c.id === id);
      if (!entry) return;
      const newQty = qtyBtn.dataset.action === "inc" ? entry.qty + 1 : entry.qty - 1;
      setCartQty(id, newQty);
      refreshOpenCartDrawer();
    }
  });

  document.getElementById("cartFooter")?.addEventListener("click", (e) => {
    if (e.target.closest("#cartClearBtn")) {
      clearCart();
      refreshOpenCartDrawer();
    }
  });

  window.addEventListener("shop:cartchange", updateCartBadge);
  window.addEventListener("shop:langchange", refreshOpenCartDrawer);
}

// Delegated "add to cart" handler for product cards — reusable by both
// main.js (catalog/featured grids) and any other page rendering cards.
// The button lives inside the card's outer <a>, so its click must be
// stopped from also triggering the card's navigation.
function bindCardAddToCart(container) {
  container?.addEventListener("click", (e) => {
    const btn = e.target.closest(".card-cart-btn");
    if (!btn || btn.disabled) return;
    e.preventDefault();
    e.stopPropagation();
    addToCart(btn.dataset.id);
    showCartToast(t("cart_added"));
  });
}

initCart();
