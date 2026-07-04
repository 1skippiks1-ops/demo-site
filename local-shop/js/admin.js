/* ============================================
   Admin Panel — admin.js (local only, no password)
   ============================================ */

// ---- Sidebar navigation ----
document.querySelectorAll(".sidebar-link[data-section]").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(link.dataset.section);
  });
});

function showSection(name) {
  document
    .querySelectorAll(".admin-section")
    .forEach((s) => s.classList.remove("active"));
  document
    .querySelectorAll(".sidebar-link[data-section]")
    .forEach((l) => l.classList.remove("active"));

  const sec = document.getElementById("section-" + name);
  if (sec) sec.classList.add("active");

  const link = document.querySelector(`.sidebar-link[data-section="${name}"]`);
  if (link) link.classList.add("active");

  if (name === "add") {
    clearForm();
    document.getElementById("formTitle").textContent = "Yeni məhsul";
  }
  if (name === "products") loadTable();
}

// ---- Products localStorage ----
function getProducts() {
  try {
    const p = localStorage.getItem("shop_products");
    return p ? JSON.parse(p) : null;
  } catch {
    return null;
  }
}

function setProducts(arr) {
  localStorage.setItem("shop_products", JSON.stringify(arr));
}

async function ensureProducts() {
  let products = getProducts();
  if (!products) {
    try {
      const res = await fetch("data/products.json?v=" + Date.now());
      products = await res.json();
      setProducts(products);
    } catch {
      products = [];
      setProducts(products);
    }
  }
  return products;
}

// ---- Table ----
async function loadTable() {
  const products = await ensureProducts();
  const tbody = document.getElementById("productsTableBody");

  if (!products.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#6b7280;padding:2rem">Hələ məhsul yoxdur</td></tr>`;
    return;
  }

  tbody.innerHTML = products
    .map(
      (p) => `
    <tr>
      <td class="td-name">${p.name}</td>
      <td>${p.category}</td>
      <td class="td-price">${p.price} ₼</td>
      <td>
        <span class="stock-badge ${p.inStock ? "in" : "out"}">
          ${p.inStock ? "Var" : "Yoxdur"}
        </span>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn-edit" onclick="editProduct('${p.id}')">Düzəliş</button>
          <button class="btn-delete" onclick="deleteProduct('${p.id}')">Sil</button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("");
}

// ---- Save product ----
async function saveProduct() {
  const name = document.getElementById("fName").value.trim();
  const category = document.getElementById("fCategory").value.trim();
  const price = document.getElementById("fPrice").value.trim();
  const desc = document.getElementById("fDesc").value.trim();

  if (!name || !category || !price || !desc) {
    showToast("Zəhmət olmasa bütün məcburi sahələri doldurun");
    return;
  }

  const products = await ensureProducts();
  const editId = document.getElementById("editId").value;

  const product = {
    id: editId || Date.now().toString(),
    name,
    category,
    price,
    description: desc,
    whatsapp:
      document.getElementById("fWhatsapp").value.trim() ||
      `Salam! ${name} (${price}₼) haqqında məlumat almaq istəyirəm.`,
    image: document.getElementById("fImage").value.trim(),
    inStock: document.getElementById("fStock").value === "true",
  };

  if (editId) {
    const idx = products.findIndex((p) => p.id === editId);
    if (idx !== -1) products[idx] = product;
  } else {
    products.push(product);
  }

  setProducts(products);
  showToast(editId ? "Məhsul yeniləndi ✓" : "Məhsul əlavə edildi ✓");
  clearForm();
  showSection("products");
}

// ---- Edit product ----
async function editProduct(id) {
  const products = await ensureProducts();
  const p = products.find((x) => x.id === id);
  if (!p) return;

  document.getElementById("editId").value = p.id;
  document.getElementById("fName").value = p.name;
  document.getElementById("fCategory").value = p.category;
  document.getElementById("fPrice").value = p.price;
  document.getElementById("fDesc").value = p.description;
  document.getElementById("fWhatsapp").value = p.whatsapp || "";
  document.getElementById("fImage").value = p.image || "";
  document.getElementById("fStock").value = p.inStock ? "true" : "false";

  // Şəkil önizləməsi
  const preview = document.getElementById("imagePreview");
  if (p.image) {
    preview.innerHTML = `<img src="${p.image}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">`;
  } else {
    preview.innerHTML = `<span>🖼️</span><p>Şəkil seçmək üçün klikləyin</p><small>JPG, PNG, WEBP · Maks 5MB</small>`;
  }

  document.getElementById("formTitle").textContent = "Məhsulu düzəlt";
  showSection("add");
}

// ---- Delete product ----
async function deleteProduct(id) {
  if (!confirm("Bu məhsulu silmək istədiyinizə əminsiniz?")) return;
  const products = await ensureProducts();
  setProducts(products.filter((p) => p.id !== id));
  showToast("Məhsul silindi");
  loadTable();
}

// ---- Image upload ----
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showToast("Şəkil 5MB-dan böyüktür, kiçik fayl seçin");
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    const base64 = e.target.result;
    document.getElementById("fImage").value = base64;
    const preview = document.getElementById("imagePreview");
    preview.innerHTML = `<img src="${base64}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">`;
  };
  reader.readAsDataURL(file);
}

function clearImage() {
  document.getElementById("fImage").value = "";
  document.getElementById("fImageFile").value = "";
  document.getElementById("imagePreview").innerHTML = `
    <span>🖼️</span>
    <p>Şəkil seçmək üçün klikləyin</p>
    <small>JPG, PNG, WEBP · Maks 5MB</small>`;
}

// ---- Clear form ----
function clearForm() {
  ["editId", "fName", "fCategory", "fPrice", "fDesc", "fWhatsapp"].forEach(
    (id) => {
      document.getElementById(id).value = "";
    },
  );
  document.getElementById("fStock").value = "true";
  clearImage();
}

// ---- Settings ----
function loadSettings() {
  try {
    const s = localStorage.getItem("shop_settings");
    if (!s) return;
    const settings = JSON.parse(s);
    if (settings.waNumber)
      document.getElementById("settingsWA").value = settings.waNumber;
    if (settings.siteName)
      document.getElementById("settingsName").value = settings.siteName;
  } catch {}
}

function saveSettings() {
  const settings = {
    waNumber: document.getElementById("settingsWA").value.trim(),
    siteName: document.getElementById("settingsName").value.trim(),
  };
  localStorage.setItem("shop_settings", JSON.stringify(settings));
  showToast("Parametrlər yadda saxlandı ✓");
}

// ---- Export JSON ----
async function exportJSON() {
  const products = await ensureProducts();
  const blob = new Blob([JSON.stringify(products, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "products.json";
  a.click();
  URL.revokeObjectURL(url);
  showToast("products.json yükləndi");
}

// ---- Toast ----
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}

// ---- Init ----
loadTable();
loadSettings();
