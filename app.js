/* ============================================================
   Mohammad Abdelhadi — Remote GIS Portfolio
   - All visible text lives in locales/en.js and locales/ar.js.
   - Language switch (EN/LTR, AR/RTL) persisted in localStorage.
   - Contact privacy: no phone number or email is rendered in the UI
     or stored as plain text in this file (see CONTACT below).
   ============================================================ */

const IMG = "assets/images/work/";

/* ------------------------------------------------------------
   CONTACT PRIVACY (static-site fallback)

   This is a fully static site (GitHub Pages): there is no backend,
   so contact endpoints must exist client-side for the CTA buttons
   to work. They are stored base64-encoded and reversed, decoded only
   at click time, and are never displayed in the UI or present in the
   HTML. This defeats casual scraping of the page and source, but TRUE
   hiding requires a backend or serverless function (see .env.example
   for the environment variables such a backend would use:
   WHATSAPP_PHONE_NUMBER, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
   CONTACT_EMAIL_TO, SMTP_*). If a backend is added later, replace
   the click handlers below with calls to server-side API routes.

   telegramUser is a public username (not a secret); leave "" to hide
   all Telegram buttons/options until you set it, e.g. "your_username".
   ------------------------------------------------------------ */
const CONTACT = {
  e: "bW9jLmxpYW1nQGlkYWhybWduZQ==",
  p: "MDM1ODUzNzY1Mjc5",
  telegramUser: ""
};

function decodeTarget(encoded) {
  return atob(encoded).split("").reverse().join("");
}

/* ------------------------------------------------------------
   Gallery structure (files + categories). Captions per language
   live in locales/*.js under galleryCaptions.
   Filter "uav" is an umbrella that matches ortho + dsm + aerial.
   ------------------------------------------------------------ */
const GALLERY = [
  { file: "road-dashboard-executive.jpg", cat: "dashboards" },
  { file: "road-dashboard-technical.jpg", cat: "dashboards" },
  { file: "complaints-dashboard-map.jpg", cat: "dashboards" },
  { file: "complaints-dashboard-kpis.jpg", cat: "dashboards" },
  { file: "road-dashboard-field.jpg", cat: "dashboards" },
  { file: "road-survey-workflow.jpg", cat: "dashboards" },
  { file: "environmental-dashboard.jpg", cat: "dashboards" },
  { file: "municipal-dashboard-sample.jpg", cat: "dashboards" },
  { file: "roads-transport-dashboard.jpg", cat: "dashboards" },
  { file: "water-dashboard.jpg", cat: "dashboards" },
  { file: "emergency-dashboard.jpg", cat: "smart" },
  { file: "smart-municipality-gis.jpg", cat: "smart" },
  { file: "aerial-imagery-2026.jpg", cat: "aerial" },
  { file: "aerial-documentation.jpg", cat: "aerial" },
  { file: "uav-7cm-01.jpg", cat: "ortho" },
  { file: "uav-7cm-02.jpg", cat: "ortho" },
  { file: "uav-7cm-03.jpg", cat: "ortho" },
  { file: "dsm-14cm-coverage.jpg", cat: "dsm" },
  { file: "dsm-wadi-gaza-01.jpg", cat: "dsm" },
  { file: "dsm-wadi-gaza-02.jpg", cat: "dsm" },
  { file: "dsm-agricultural.jpg", cat: "dsm" },
  { file: "street-view-01.jpg", cat: "streetview" },
  { file: "street-view-02.jpg", cat: "streetview" },
  { file: "street-view-03.jpg", cat: "streetview" },
  { file: "street-view-04.jpg", cat: "streetview" },
  { file: "city-panorama-01.jpg", cat: "streetview" },
  { file: "city-panorama-02.jpg", cat: "streetview" },
  { file: "city-panorama-03.jpg", cat: "streetview" },
  { file: "city-panorama-04.jpg", cat: "streetview" },
  { file: "field-documentation.jpg", cat: "field" },
  { file: "field-app-2026.jpg", cat: "field" },
  { file: "field-app-2023.jpg", cat: "field" },
  { file: "damage-dashboard-buildings.jpg", cat: "damage" },
  { file: "damage-buildings.jpg", cat: "damage" },
  { file: "damage-agriculture.jpg", cat: "damage" },
  { file: "damage-neighborhood.jpg", cat: "damage" }
];

const UMBRELLA_FILTERS = { uav: ["ortho", "dsm", "aerial"] };

/* ============================================================
   i18n engine
   ============================================================ */
let currentLang = (() => {
  const saved = localStorage.getItem("portfolioLanguage");
  return saved === "ar" || saved === "en" ? saved : "en";
})();

function L() {
  return window.I18N[currentLang];
}

function t(path) {
  const value = path.split(".").reduce((node, key) => (node ? node[key] : undefined), L());
  return value === undefined ? path : value;
}

function translateStaticNodes() {
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-html]").forEach((node) => {
    node.innerHTML = t(node.dataset.i18nHtml);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
}

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

/* ============================================================
   Section renderers (all read from the active locale)
   ============================================================ */
function renderHeroMetrics() {
  const grid = document.querySelector("#heroMetrics");
  grid.innerHTML = "";
  L().heroMetrics.forEach((m) => {
    const card = el("div", "hero-metric reveal visible", `<strong>${m.value}</strong><span>${m.label}</span>`);
    card.setAttribute("role", "listitem");
    grid.appendChild(card);
  });
}

function renderValueCards() {
  const grid = document.querySelector("#valueGrid");
  grid.innerHTML = "";
  L().valueCards.forEach((c) => {
    grid.appendChild(
      el(
        "article",
        "value-card reveal visible",
        `<div class="icon" aria-hidden="true">${c.icon}</div>
         <h3>${c.title}</h3>
         <dl>
           <dt>${t("labels.problem")}</dt><dd>${c.problem}</dd>
           <dt>${t("labels.deliver")}</dt><dd>${c.deliver}</dd>
           <dt>${t("labels.benefit")}</dt><dd>${c.benefit}</dd>
         </dl>`
      )
    );
  });
}

function renderServices() {
  const grid = document.querySelector("#servicesGrid");
  grid.innerHTML = "";
  L().services.forEach((s) => {
    grid.appendChild(
      el(
        "article",
        "service-card reveal visible",
        `<span class="service-tag">${s.tag}</span>
         <h3>${s.title}</h3>
         <ul>${s.items.map((i) => `<li>${i}</li>`).join("")}</ul>
         <p class="best-for">${s.bestFor}</p>
         <a class="btn btn-outline btn-sm" href="#contact">${t("labels.startPackage")}</a>`
      )
    );
  });
}

function renderUav() {
  const grid = document.querySelector("#uavGrid");
  grid.innerHTML = "";
  const uav = L().uav;
  const blocks = [
    { title: uav.needTitle, items: uav.needItems, icon: "📥" },
    { title: uav.deliverTitle, items: uav.deliverItems, icon: "📦" },
    { title: uav.suitableTitle, items: uav.suitableItems, icon: "🎯" },
    { title: uav.whyTitle, items: uav.whyItems, icon: "💡" },
    { title: uav.expTitle, items: uav.expItems, icon: "🛩️" }
  ];
  blocks.forEach((b) => {
    grid.appendChild(
      el(
        "article",
        "uav-block reveal visible",
        `<h3><span aria-hidden="true">${b.icon}</span> ${b.title}</h3>
         <ul>${b.items.map((i) => `<li>${i}</li>`).join("")}</ul>`
      )
    );
  });
}

function renderCaseStudies() {
  const grid = document.querySelector("#caseGrid");
  grid.innerHTML = "";
  L().caseStudies.forEach((c) => {
    const card = el("article", "case-card reveal visible");
    const cta = c.ctaOverride || t("labels.buildSimilar");
    card.innerHTML = `
      <button class="case-media" type="button" aria-label="${c.title}">
        <img src="${IMG + c.image}" alt="${c.title}" loading="lazy" />
        <span class="case-year">${c.year}</span>
      </button>
      <div class="case-body">
        <h3>${c.title}</h3>
        <p class="case-sub">${c.sub}</p>
        <div class="case-block"><b>${t("labels.problem")}</b><p>${c.problem}</p></div>
        <div class="case-block"><b>${t("labels.solution")}</b><p>${c.solution}</p></div>
        <div class="case-block"><b>${t("labels.role")}</b><p>${c.role}</p></div>
        <div class="case-block"><b>${t("labels.value")}</b><p>${c.value}</p></div>
        <div class="case-tags">${c.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
        <a class="btn btn-primary btn-sm" href="#contact">${cta}</a>
      </div>`;
    card.querySelector(".case-media").addEventListener("click", () => {
      openLightboxWithImage(IMG + c.image, c.title + " — " + c.sub);
    });
    grid.appendChild(card);
  });
}

function renderProofMetrics() {
  const grid = document.querySelector("#metricsGrid");
  grid.innerHTML = "";
  L().proofMetrics.forEach((m) => {
    grid.appendChild(el("div", "metric-card reveal visible", `<strong>${m.value}</strong><span>${m.label}</span>`));
  });
}

/* ---------- Gallery ---------- */
let activeCategory = "all";
let visibleGallery = [];

function matchesCategory(item, catId) {
  if (catId === "all") return true;
  if (UMBRELLA_FILTERS[catId]) return UMBRELLA_FILTERS[catId].includes(item.cat);
  return item.cat === catId;
}

function renderGalleryFilters() {
  const wrap = document.querySelector("#galleryFilters");
  wrap.innerHTML = "";
  L().galleryCats.forEach((cat) => {
    const btn = el("button", cat.id === activeCategory ? "active" : "", cat.label);
    btn.type = "button";
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", String(cat.id === activeCategory));
    btn.addEventListener("click", () => {
      activeCategory = cat.id;
      wrap.querySelectorAll("button").forEach((b) => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-selected", String(b === btn));
      });
      renderGallery();
    });
    wrap.appendChild(btn);
  });
}

function caption(file) {
  return L().galleryCaptions[file] || window.I18N.en.galleryCaptions[file] || file;
}

function categoryLabel(id) {
  const cat = L().galleryCats.find((c) => c.id === id);
  return cat ? cat.label : id;
}

function renderGallery() {
  const grid = document.querySelector("#galleryGrid");
  grid.innerHTML = "";
  visibleGallery = GALLERY.filter((g) => matchesCategory(g, activeCategory));
  visibleGallery.forEach((g, index) => {
    const item = el("button", "gallery-item");
    item.type = "button";
    item.setAttribute("aria-label", caption(g.file));
    item.innerHTML = `
      <img src="${IMG + g.file}" alt="${caption(g.file)}" loading="lazy" />
      <figcaption>
        <span class="gallery-cat">${categoryLabel(g.cat)}</span><br />${caption(g.file)}
      </figcaption>`;
    item.addEventListener("click", () => openLightbox(index));
    grid.appendChild(item);
  });
}

/* ---------- Lightbox ---------- */
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightboxImage");
const lightboxCaption = document.querySelector("#lightboxCaption");
let lightboxIndex = -1;

function openLightbox(index) {
  lightboxIndex = index;
  const g = visibleGallery[index];
  lightboxImage.src = IMG + g.file;
  lightboxImage.alt = caption(g.file);
  lightboxCaption.textContent = caption(g.file);
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
}

function openLightboxWithImage(src, text) {
  lightboxIndex = -1;
  lightboxImage.src = src;
  lightboxImage.alt = text;
  lightboxCaption.textContent = text;
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxImage.src = "";
  document.body.style.overflow = "";
}

function stepLightbox(direction) {
  if (lightboxIndex < 0 || visibleGallery.length === 0) return;
  lightboxIndex = (lightboxIndex + direction + visibleGallery.length) % visibleGallery.length;
  openLightbox(lightboxIndex);
}

document.querySelector("#lightboxClose").addEventListener("click", closeLightbox);
document.querySelector("#lightboxPrev").addEventListener("click", () => stepLightbox(-1));
document.querySelector("#lightboxNext").addEventListener("click", () => stepLightbox(1));
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (event) => {
  if (lightbox.hidden) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") stepLightbox(-1);
  if (event.key === "ArrowRight") stepLightbox(1);
});

/* ---------- Process / Why / Aside / Facts ---------- */
function renderProcess() {
  const grid = document.querySelector("#processGrid");
  grid.innerHTML = "";
  L().processSteps.forEach((s, i) => {
    grid.appendChild(
      el("li", "process-step reveal visible", `<span class="step-num">${i + 1}</span><h3>${s.title}</h3><p>${s.text}</p>`)
    );
  });
}

function renderWhy() {
  const list = document.querySelector("#whyList");
  list.innerHTML = "";
  L().whyItems.forEach((w) => {
    list.appendChild(
      el("div", "why-item reveal visible", `<span class="check" aria-hidden="true">✓</span><p><b>${w.head}</b><span>${w.text}</span></p>`)
    );
  });
  const aside = L().aside;
  const roles = document.querySelector("#rolesList");
  roles.innerHTML = "";
  aside.roles.forEach((r) => roles.appendChild(el("li", "", r)));
  const exp = document.querySelector("#expList");
  exp.innerHTML = "";
  aside.exp.forEach((e) => exp.appendChild(el("li", "", e)));
  const edu = document.querySelector("#eduList");
  edu.innerHTML = "";
  aside.edu.forEach((e) => edu.appendChild(el("li", "", e)));
}

function renderContactFacts() {
  const list = document.querySelector("#contactFacts");
  list.innerHTML = "";
  L().contact.facts.forEach(([label, value]) => {
    list.appendChild(el("li", "", `<b>${label}</b><span>${value}</span>`));
  });
}

/* ---------- Form selects (translated, selection preserved) ---------- */
function fillSelect(select, options, placeholderLabel) {
  const previous = select.value;
  select.innerHTML = "";
  const ph = el("option", "", placeholderLabel);
  ph.value = "";
  ph.disabled = true;
  ph.selected = true;
  select.appendChild(ph);
  options.forEach(([value, label]) => {
    if (value === "telegram" && !CONTACT.telegramUser) return;
    const opt = el("option", "", label);
    opt.value = value;
    select.appendChild(opt);
  });
  if (previous && [...select.options].some((o) => o.value === previous)) select.value = previous;
}

function renderFormSelects() {
  fillSelect(document.querySelector("#fMethod"), L().contact.form.methodOptions, t("contact.form.method"));
  fillSelect(document.querySelector("#fService"), L().contact.form.serviceOptions, t("contact.form.service"));
}

/* ============================================================
   Contact actions — endpoints decoded at click time only
   ============================================================ */
function buildQuickMessage() {
  return currentLang === "ar"
    ? "مرحباً محمد، اطلعت على بورتفوليو GIS الخاص بك وأود مناقشة مشروع عن بُعد."
    : "Hello Mohammad, I found your GIS portfolio and I would like to discuss a remote project.";
}

function openWhatsApp(text) {
  const phone = decodeTarget(CONTACT.p);
  window.open("https://wa.me/" + phone + "?text=" + encodeURIComponent(text), "_blank", "noopener");
}

function openEmail(subject, body) {
  const email = decodeTarget(CONTACT.e);
  window.location.href = "mailto:" + email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
}

function openTelegram() {
  if (!CONTACT.telegramUser) return;
  window.open("https://t.me/" + CONTACT.telegramUser, "_blank", "noopener");
}

function wireContactButtons() {
  document.querySelectorAll(".whatsapp-contact-link").forEach((btn) => {
    btn.addEventListener("click", () => openWhatsApp(buildQuickMessage()));
  });
  document.querySelectorAll(".email-contact-link").forEach((btn) => {
    btn.addEventListener("click", () => openEmail("Remote GIS Project Inquiry", buildQuickMessage()));
  });
  document.querySelectorAll(".telegram-contact-link").forEach((btn) => {
    btn.hidden = !CONTACT.telegramUser;
    btn.addEventListener("click", openTelegram);
  });
}

/* ---------- UAV CTA: preselect UAV service and jump to the form ---------- */
function wireUavCtas() {
  document.querySelectorAll(".uav-cta").forEach((btn) => {
    btn.addEventListener("click", () => {
      const service = document.querySelector("#fService");
      service.value = "uav";
      document.querySelector("#contact").scrollIntoView({ behavior: "smooth" });
      setTimeout(() => document.querySelector("#fName").focus(), 600);
    });
  });
}

/* ============================================================
   Project inquiry form
   ============================================================ */
const form = document.querySelector("#contactForm");
const formAlert = document.querySelector("#formAlert");
const formSubmit = document.querySelector("#formSubmit");

function showAlert(message, type) {
  formAlert.textContent = message;
  formAlert.className = "form-alert " + type;
  formAlert.hidden = false;
}

function serviceLabel(value) {
  const found = L().contact.form.serviceOptions.find(([v]) => v === value);
  return found ? found[1] : value;
}

function buildInquiryMessage(data) {
  const f = L().contact.form;
  const lines = [
    t("contact.title"),
    "",
    `${f.name}: ${data.name}`,
    `${f.org}: ${data.org || "-"}`,
    `${f.country}: ${data.country}`,
    `${f.reply}: ${data.reply}`,
    `${f.service}: ${serviceLabel(data.service)}`,
    "",
    `${f.description}:`,
    data.description
  ];
  if (data.link) lines.push("", `${f.link}: ${data.link}`);
  return lines.join("\n");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formAlert.hidden = true;

  const fields = {
    name: document.querySelector("#fName"),
    org: document.querySelector("#fOrg"),
    country: document.querySelector("#fCountry"),
    reply: document.querySelector("#fReply"),
    method: document.querySelector("#fMethod"),
    service: document.querySelector("#fService"),
    description: document.querySelector("#fDescription"),
    link: document.querySelector("#fLink"),
    consent: document.querySelector("#fConsent")
  };

  let valid = true;
  ["name", "country", "reply", "method", "service", "description"].forEach((key) => {
    const node = fields[key];
    const empty = !node.value || !node.value.trim();
    node.classList.toggle("invalid", empty);
    if (empty) valid = false;
  });

  if (!valid) {
    showAlert(t("contact.form.errorRequired"), "error");
    return;
  }
  if (!fields.consent.checked) {
    showAlert(t("contact.form.errorConsent"), "error");
    return;
  }

  const data = {
    name: fields.name.value.trim(),
    org: fields.org.value.trim(),
    country: fields.country.value.trim(),
    reply: fields.reply.value.trim(),
    method: fields.method.value,
    service: fields.service.value,
    description: fields.description.value.trim(),
    link: fields.link.value.trim()
  };
  const message = buildInquiryMessage(data);

  formSubmit.disabled = true;
  const originalLabel = formSubmit.textContent;
  formSubmit.textContent = t("contact.form.sending");

  setTimeout(() => {
    try {
      if (data.method === "whatsapp") {
        openWhatsApp(message);
        showAlert(t("contact.form.successWhatsapp"), "success");
      } else if (data.method === "telegram") {
        if (navigator.clipboard) navigator.clipboard.writeText(message).catch(() => {});
        openTelegram();
        showAlert(t("contact.form.successTelegram"), "success");
      } else {
        openEmail("Remote GIS Project Inquiry — " + data.name, message);
        showAlert(t("contact.form.successEmail"), "success");
      }
    } finally {
      formSubmit.disabled = false;
      formSubmit.textContent = originalLabel;
    }
  }, 350);
});

/* ============================================================
   Mobile navigation
   ============================================================ */
const navToggle = document.querySelector("#navToggle");
const navLinks = document.querySelector("#navLinks");
navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  })
);

/* ============================================================
   Scroll reveal
   ============================================================ */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

function observeReveals() {
  document.querySelectorAll(".reveal:not(.visible)").forEach((node) => revealObserver.observe(node));
}

/* ============================================================
   Language switching
   ============================================================ */
function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("portfolioLanguage", lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = L().dir;
  document.title = L().docTitle;
  document.querySelector("#langToggle").textContent = L().langButton;

  translateStaticNodes();
  renderHeroMetrics();
  renderValueCards();
  renderServices();
  renderUav();
  renderCaseStudies();
  renderProofMetrics();
  renderGalleryFilters();
  renderGallery();
  renderProcess();
  renderWhy();
  renderContactFacts();
  renderFormSelects();
  observeReveals();
}

document.querySelector("#langToggle").addEventListener("click", () => {
  applyLanguage(currentLang === "en" ? "ar" : "en");
});

/* ============================================================
   Boot
   ============================================================ */
applyLanguage(currentLang);
wireContactButtons();
wireUavCtas();
