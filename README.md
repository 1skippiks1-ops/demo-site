# MəişətShop — Cloudflare Pages Setup

## Qısa qurulum təlimatı

### 1. GitHub repo yarat
1. github.com → "New repository" → ad ver (məs. `meishetshop`)
2. Bu qovluğun bütün fayllarını upload et

### 2. Cloudflare Pages-ə qoş
1. dash.cloudflare.com → Workers & Pages → "Create application" → Pages
2. GitHub-ı qoş → repo seç
3. Build parametrləri:
   - **Build command:** (boş burax)
   - **Build output directory:** `/` (kök qovluq)
4. "Save and Deploy" — hazırdır!

Saytın URL-i: `meishetshop.pages.dev`

### 3. Admin panelə giriş
`sizin-sayt.pages.dev/admin.html`

### Məhsul əlavə etmə iş axını
1. `/admin.html`-ə gir → şifrəni daxil et
2. "Yeni məhsul" → məlumatları doldur → Yadda saxla
3. Parametrlər → "products.json yüklə" → faylı yüklə
4. GitHub-da `data/products.json` faylını bu yeni fayl ilə əvəz et
5. Cloudflare avtomatik deploy edir (1-2 dəqiqə)

### Gələcəkdə .az domen əlavə etmə
1. Cloudflare Pages → Custom domains → "Set up a custom domain"
2. DNS provayderinizdə (və ya Cloudflare DNS-də):
   - CNAME: `@` → `meishetshop.pages.dev`
3. Hazır — saytın kodu dəyişmir!

### WhatsApp nömrəsi
Admin panel → Parametrlər → WhatsApp nömrəsini daxil et (994501234567 formatında)
