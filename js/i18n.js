/* ============================================
   ElementStore — i18n (AZ / EN / RU)
   ============================================ */

const TRANSLATIONS = {
  az: {
    nav_catalog: "Kataloq",
    nav_contact: "Əlaqə",
    hero_eyebrow: "Keyfiyyətli məişət əşyaları",
    hero_title1: "Eviniz üçün",
    hero_title2: "ən yaxşısı",
    hero_sub: "Seçin, məlumat alın, sifariş edin — WhatsApp üzərindən birbaşa və sürətlə.",
    discount_label: "XÜSUSİ ENDİRİM",
    discount_text: "Seçilmiş məhsullarda mövsümi endirim!",
    discount_cta: "İndi bax →",
    stat_stores: "mağaza",
    stat_products: "seçim",
    stat_delivery_title: "Sürətli",
    stat_delivery: "çatdırılma",
    stat_warranty_title: "Rəsmi",
    stat_warranty: "zəmanət",
    stat_shopping_title: "Sürətli",
    stat_shopping: "alış-veriş",
    categories: "Kateqoriyalar",
    all: "Hamısı",
    loading: "Məhsullar yüklənir...",
    contact_label: "Sualınız var?",
    contact_title: "WhatsApp-da əlaqə saxlayın",
    contact_hours: "İş saatları: 7/24",
    contact_btn: "WhatsApp-a yaz",
    about_eyebrow: "Şirkətimiz Haqqında",
    about_title: "ElementStore — Eviniz üçün ən yaxşı seçim",
    about_text1: "ElementStore Azərbaycanda ev məişət texnikası, elektronika və digər ev üçün lazımlı məhsulların satışı ilə məşğul olan aparıcı ticarət platformasıdır. Biz müştərilərimizə yüksək keyfiyyətli məhsullar, rəqabətli qiymətlər və əla servis təklif edirik.",
    about_text2: "56-dan çox mağaza şəbəkəmiz, 40 mindən artıq məhsul çeşidimiz və 7/24 WhatsApp dəstəyimiz ilə hər zaman sizin yanınızdayıq.",
    about_support: "dəstək",
    about_badge1: "Etibarlı brend",
    about_badge2: "Rəsmi zəmanət",
    about_badge3: "Sürətli çatdırılma",
    footer_rights: "Bütün hüquqlar qorunur",
  },
  en: {
    nav_catalog: "Catalog",
    nav_contact: "Contact",
    hero_eyebrow: "Quality home appliances",
    hero_title1: "The best",
    hero_title2: "for your home",
    hero_sub: "Browse, get info, and order — directly via WhatsApp, fast and easy.",
    discount_label: "SPECIAL DISCOUNT",
    discount_text: "Seasonal discount on selected products!",
    discount_cta: "Shop now →",
    stat_stores: "stores",
    stat_products: "products",
    stat_delivery_title: "Fast",
    stat_delivery: "delivery",
    stat_warranty_title: "Official",
    stat_warranty: "warranty",
    stat_shopping_title: "Easy",
    stat_shopping: "shopping",
    categories: "Categories",
    all: "All",
    loading: "Loading products...",
    contact_label: "Have a question?",
    contact_title: "Contact us on WhatsApp",
    contact_hours: "Working hours: 7/24",
    contact_btn: "Message on WhatsApp",
    about_eyebrow: "About Us",
    about_title: "ElementStore — The best choice for your home",
    about_text1: "ElementStore is Azerbaijan's leading e-commerce platform specializing in home appliances, electronics, and everyday household products. We offer our customers high-quality products, competitive prices, and excellent service.",
    about_text2: "With a network of 56+ stores, 40,000+ product choices, and 7/24 WhatsApp support, we are always by your side.",
    about_support: "support",
    about_badge1: "Trusted brand",
    about_badge2: "Official warranty",
    about_badge3: "Fast delivery",
    footer_rights: "All rights reserved",
  },
  ru: {
    nav_catalog: "Каталог",
    nav_contact: "Контакт",
    hero_eyebrow: "Качественная бытовая техника",
    hero_title1: "Лучшее",
    hero_title2: "для вашего дома",
    hero_sub: "Выбирайте, узнавайте, заказывайте — напрямую через WhatsApp, быстро и удобно.",
    discount_label: "СПЕЦИАЛЬНАЯ СКИДКА",
    discount_text: "Сезонная скидка на избранные товары!",
    discount_cta: "Смотреть →",
    stat_stores: "магазинов",
    stat_products: "товаров",
    stat_delivery_title: "Быстрая",
    stat_delivery: "доставка",
    stat_warranty_title: "Официальная",
    stat_warranty: "гарантия",
    stat_shopping_title: "Быстрый",
    stat_shopping: "шопинг",
    categories: "Категории",
    all: "Все",
    loading: "Загрузка товаров...",
    contact_label: "Есть вопрос?",
    contact_title: "Свяжитесь с нами в WhatsApp",
    contact_hours: "Время работы: 7/24",
    contact_btn: "Написать в WhatsApp",
    about_eyebrow: "О нас",
    about_title: "ElementStore — Лучший выбор для вашего дома",
    about_text1: "ElementStore — ведущая торговая платформа Азербайджана, специализирующаяся на продаже бытовой техники, электроники и товаров для дома. Мы предлагаем клиентам высококачественные товары, конкурентные цены и отличный сервис.",
    about_text2: "Сеть из 56+ магазинов, более 40 000 наименований товаров и круглосуточная поддержка через WhatsApp — мы всегда рядом с вами.",
    about_support: "поддержка",
    about_badge1: "Надёжный бренд",
    about_badge2: "Официальная гарантия",
    about_badge3: "Быстрая доставка",
    footer_rights: "Все права защищены",
  },
};

let currentLang = localStorage.getItem("shop_lang") || "az";

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem("shop_lang", lang);
  document.documentElement.setAttribute("data-lang", lang);

  const t = TRANSLATIONS[lang] || TRANSLATIONS["az"];

  // Update all data-i18n elements
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key] !== undefined) {
      el.textContent = t[key];
    }
  });

  // Update all lang buttons (both header and footer)
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
  });
}

function initI18n() {
  applyLang(currentLang);

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.getAttribute("data-lang");
      applyLang(lang);
    });
  });
}

// Run immediately so text is ready before main.js
initI18n();
