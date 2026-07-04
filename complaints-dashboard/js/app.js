/* ===== Municipal Complaints Smart Dashboard - app.js ===== */
/* OpenLayers + Chart.js — bilingual (ar/en), light & neon themes */
"use strict";

const TODAY = new Date("2026-07-03T12:00:00");
const DATA = { complaints: [], neighborhoods: null, municipality: null, roads: null, buildings: null };
const NB_NAMES = {}; // neighborhood_id -> arabic name

const CAT_COLORS = {
  "مياه": "#1e88e5", "صرف صحي": "#6d4c41", "طرق": "#546e7a", "إنارة": "#f9a825",
  "نفايات": "#43a047", "صحة وبيئة": "#00897b", "تعديات": "#e53935", "حدائق ومرافق": "#7cb342"
};
const STATUS_COLORS = { "جديدة": "#29b6f6", "قيد المعالجة": "#ffa726", "مغلقة": "#66bb6a" };
const OVERDUE_COLOR = "#e53935";

/* ---------- i18n ---------- */
const I18N = {
  ar: {
    appTitle: "داشبورد شكاوى المواطنين",
    appSubtitle: "Municipal Complaints Smart Dashboard — بلدية كولدنغ",
    themeDark: "داكن", themeLight: "فاتح",
    btnExcel: "⬇ تصدير Excel", btnPdf: "🖨 تقرير PDF",
    fFrom: "من تاريخ", fTo: "إلى تاريخ", fNb: "الحي", fCat: "نوع الشكوى", fStatus: "الحالة", fPrio: "الأولوية",
    allNb: "كل الأحياء", allCat: "كل الأنواع", allStatus: "كل الحالات", allPrio: "الكل",
    stNew: "جديدة", stProg: "قيد المعالجة", stClosed: "مغلقة", stOverdueOnly: "متأخرة فقط",
    prUrgent: "عاجلة", prHigh: "عالية", prMed: "متوسطة", prLow: "منخفضة",
    reset: "↺ إعادة تعيين", showing: (n) => `عرض ${n} شكوى`,
    kpiTotal: "إجمالي الشكاوى", kpiOpen: "شكاوى مفتوحة", kpiClosed: "شكاوى مغلقة", kpiOverdue: "شكاوى متأخرة",
    kpiAvg: "متوسط مدة الإغلاق (يوم)", kpiTopNb: "أكثر حي فيه شكاوى", kpiTopCat: "أكثر نوع شكوى",
    mapTitle: "🗺 خريطة الشكاوى", byStatus: "حسب الحالة", byCategory: "حسب النوع",
    layers: "🗂 الطبقات", basemaps: "خرائط الأساس", overlays: "طبقات البيانات",
    bmOsm: "خارطة فاتحة (OSM)", bmSat: "صورة فضائية (Google)", bmDark: "خارطة داكنة", bmLight: "خارطة فاتحة (Carto)",
    ovComplaints: "نقاط الشكاوى", ovHeat: "تلوين الأحياء (كثافة)", ovBoundary: "حدود البلدية", ovRoads: "الشوارع", ovBld: "المباني",
    buffer: "⭕ أداة البفر", bufferRadius: "نصف القطر (متر)", bufferClear: "مسح",
    bufferHint: "انقر على الخريطة لتحديد مركز البفر",
    brTotal: "شكاوى داخل النطاق", brOpen: "مفتوحة", brClosed: "مغلقة", brOverdue: "متأخرة", brTop: "أكثر نوع",
    chCatTitle: "📊 الشكاوى حسب النوع", chStatusTitle: "🍩 الشكاوى حسب الحالة",
    chMonthlyTitle: "📈 الاتجاه الشهري 2025 – 2026 (مستلمة / مغلقة)",
    chNbTitle: "🏘 الشكاوى حسب الحي", chDeptTitle: "🏢 أداء الأقسام (متوسط أيام الإغلاق)", chSourceTitle: "📱 مصدر الشكوى",
    tblStreetsTitle: "🛣 أكثر الشوارع شكاوى (Top 10)",
    thStreet: "الشارع", thCount: "عدد الشكاوى", thOpen: "مفتوحة", thTopCat: "أكثر نوع",
    tblComplaintsTitle: "📄 آخر الشكاوى", rowHint: "انقر على صف لتحديد موقع الشكوى على الخريطة",
    thId: "رقم الشكوى", thCat: "النوع", thSub: "النوع الفرعي", thStatus: "الحالة", thPrio: "الأولوية",
    thDate: "تاريخ الاستلام", thNb: "الحي", thDept: "القسم", thDays: "مدة الحل",
    scrollHint: "مرر إلى الأسفل",
    phGenerated: "تاريخ التقرير", phPeriod: "الفترة", phShown: "عدد الشكاوى",
    footer: "Municipal Complaints Smart Dashboard © 2026 — بيانات تجريبية",
    overdue: "متأخرة", day: "يوم", received: "مستلمة", closedSeries: "مغلقة",
    countSeries: "عدد الشكاوى", avgSeries: "متوسط أيام الإغلاق",
    ppSub: "النوع الفرعي", ppPrio: "الأولوية", ppRec: "تاريخ الاستلام", ppClosed: "تاريخ الإغلاق",
    ppNb: "الحي", ppStreet: "الشارع", ppDept: "القسم", ppEmp: "الموظف", ppSrc: "المصدر",
    legStatus: "الحالة", legCat: "نوع الشكوى", legDensity: "كثافة الشكاوى بالحي",
    loadErr: "تعذر تحميل البيانات — تأكد من تشغيل الصفحة عبر خادم محلي (وليس file://)",
  },
  en: {
    appTitle: "Citizens Complaints Dashboard",
    appSubtitle: "Municipal Complaints Smart Dashboard — Kolding Municipality",
    themeDark: "Dark", themeLight: "Light",
    btnExcel: "⬇ Export Excel", btnPdf: "🖨 PDF Report",
    fFrom: "From date", fTo: "To date", fNb: "Neighborhood", fCat: "Category", fStatus: "Status", fPrio: "Priority",
    allNb: "All neighborhoods", allCat: "All categories", allStatus: "All statuses", allPrio: "All",
    stNew: "New", stProg: "In progress", stClosed: "Closed", stOverdueOnly: "Overdue only",
    prUrgent: "Urgent", prHigh: "High", prMed: "Medium", prLow: "Low",
    reset: "↺ Reset", showing: (n) => `Showing ${n} complaints`,
    kpiTotal: "Total complaints", kpiOpen: "Open complaints", kpiClosed: "Closed complaints", kpiOverdue: "Overdue complaints",
    kpiAvg: "Avg. closure time (days)", kpiTopNb: "Top neighborhood", kpiTopCat: "Top category",
    mapTitle: "🗺 Complaints map", byStatus: "By status", byCategory: "By category",
    layers: "🗂 Layers", basemaps: "Basemaps", overlays: "Data layers",
    bmOsm: "Light map (OSM)", bmSat: "Satellite (Google)", bmDark: "Dark map", bmLight: "Light map (Carto)",
    ovComplaints: "Complaint points", ovHeat: "Neighborhood density", ovBoundary: "Municipal boundary", ovRoads: "Roads", ovBld: "Buildings",
    buffer: "⭕ Buffer tool", bufferRadius: "Radius (meters)", bufferClear: "Clear",
    bufferHint: "Click on the map to set the buffer center",
    brTotal: "Complaints inside", brOpen: "Open", brClosed: "Closed", brOverdue: "Overdue", brTop: "Top category",
    chCatTitle: "📊 Complaints by category", chStatusTitle: "🍩 Complaints by status",
    chMonthlyTitle: "📈 Monthly trend 2025 – 2026 (received / closed)",
    chNbTitle: "🏘 Complaints by neighborhood", chDeptTitle: "🏢 Department performance (avg. days to close)", chSourceTitle: "📱 Complaint source",
    tblStreetsTitle: "🛣 Top 10 streets by complaints",
    thStreet: "Street", thCount: "Complaints", thOpen: "Open", thTopCat: "Top category",
    tblComplaintsTitle: "📄 Latest complaints", rowHint: "Click a row to locate the complaint on the map",
    thId: "Complaint ID", thCat: "Category", thSub: "Sub-category", thStatus: "Status", thPrio: "Priority",
    thDate: "Received", thNb: "Neighborhood", thDept: "Department", thDays: "Days to close",
    scrollHint: "Scroll down",
    phGenerated: "Report date", phPeriod: "Period", phShown: "Complaints shown",
    footer: "Municipal Complaints Smart Dashboard © 2026 — Demo data",
    overdue: "Overdue", day: "d", received: "Received", closedSeries: "Closed",
    countSeries: "Complaints", avgSeries: "Avg. days to close",
    ppSub: "Sub-category", ppPrio: "Priority", ppRec: "Received", ppClosed: "Closed",
    ppNb: "Neighborhood", ppStreet: "Street", ppDept: "Department", ppEmp: "Employee", ppSrc: "Source",
    legStatus: "Status", legCat: "Category", legDensity: "Complaint density",
    loadErr: "Failed to load data — run the page from a local server (not file://)",
  },
};

const CAT_EN = { "مياه": "Water", "صرف صحي": "Sewage", "طرق": "Roads", "إنارة": "Lighting",
  "نفايات": "Waste", "صحة وبيئة": "Health & Env.", "تعديات": "Encroachments", "حدائق ومرافق": "Parks & Facilities" };
const STATUS_EN = { "جديدة": "New", "قيد المعالجة": "In progress", "مغلقة": "Closed" };
const PRIO_EN = { "عاجلة": "Urgent", "عالية": "High", "متوسطة": "Medium", "منخفضة": "Low" };
const DEPT_EN = { "قسم المياه": "Water Dept.", "قسم الصرف الصحي": "Sewage Dept.", "قسم الطرق والأشغال": "Roads & Works",
  "قسم الكهرباء والإنارة": "Electricity & Lighting", "قسم النظافة": "Sanitation", "قسم الصحة والبيئة": "Health & Environment",
  "قسم الرقابة والتفتيش": "Inspection Dept.", "قسم الحدائق والمرافق": "Parks & Facilities" };
const SRC_EN = { "تطبيق": "App", "واتساب": "WhatsApp", "اتصال": "Phone call", "مكتب": "Office", "موقع إلكتروني": "Website" };
const NB_EN = { "حي المركز": "City Center", "الحي الشمالي": "North District", "الحي الجنوبي": "South District",
  "الحي الشرقي": "East District", "الحي الغربي": "West District", "حي الميناء": "Harbor District",
  "حي الجامعة": "University District", "حي الحدائق": "Gardens District", "حي الصناعة": "Industrial District",
  "حي الضاحية": "Suburb District" };
const EMP_EN = { "أحمد الخطيب": "Ahmed Al-Khatib", "محمد سالم": "Mohammed Salem", "خالد العمري": "Khaled Al-Omari",
  "سارة يوسف": "Sara Yousef", "ليلى حسن": "Laila Hassan", "عمر نصار": "Omar Nassar",
  "نور الدين قاسم": "Nour Al-Din Qasem", "هدى مراد": "Huda Murad", "يوسف زيدان": "Yousef Zeidan", "رنا عابد": "Rana Abed" };
const RES_EN = { "تم إصلاح العطل بالكامل": "The fault was fully repaired.",
  "تمت معالجة المشكلة ورفع المخلفات": "The issue was resolved and the waste removed.",
  "تم إرسال فريق الصيانة وإغلاق البلاغ": "A maintenance team was dispatched and the ticket closed.",
  "تمت المعالجة والتأكد ميدانياً": "Resolved and verified in the field.",
  "تم الحل بالتنسيق مع القسم المختص": "Resolved in coordination with the relevant department.",
  "أُنجزت أعمال الإصلاح وفق الجدول": "Repair works completed on schedule." };
const DESC_EN = {
  WTR: (sub, st) => `There is a ${sub.toLowerCase()} on ${st} for several days that needs urgent attention`,
  SEW: (sub, st) => `${sub} in front of homes on ${st}, causing a nuisance to residents`,
  RDS: (sub, st) => `${sub} on ${st} endangering vehicles and pedestrians`,
  LGT: (sub, st) => `${sub} on ${st}; the area is dark at night`,
  WST: (sub, st) => `${sub} near ${st} that has not been collected`,
  ENV: (sub, st) => `${sub} around ${st}, affecting residents' health`,
  ENC: (sub, st) => `${sub} observed on ${st}, obstructing movement`,
  PRK: (sub, st) => `${sub} in the park near ${st}`,
};
const SUB_EN = { "تسرب مياه": "Water leak", "انقطاع مياه": "Water outage", "ضعف ضخ": "Low pressure", "كسر خط رئيسي": "Main line break",
  "طفح صرف": "Sewage overflow", "انسداد مجرى": "Blocked drain", "رائحة كريهة": "Bad odor", "كسر منهول": "Broken manhole",
  "حفرة في الشارع": "Pothole", "هبوط أرضي": "Road subsidence", "رصيف مكسور": "Broken sidewalk", "شارع ترابي": "Unpaved street",
  "عمود مطفأ": "Lamp out", "سلك مكشوف": "Exposed wire", "عطل لوحة تحكم": "Control panel fault", "إنارة متذبذبة": "Flickering light",
  "تراكم نفايات": "Waste pile-up", "حاوية ممتلئة": "Full container", "مكب عشوائي": "Illegal dumping", "حاوية تالفة": "Damaged container",
  "انتشار حشرات": "Insect infestation", "قوارض": "Rodents", "مياه راكدة": "Stagnant water", "حرق مخلفات": "Waste burning",
  "بناء مخالف": "Illegal construction", "إغلاق شارع": "Street blockage", "تعدي على رصيف": "Sidewalk encroachment", "إشغال ساحة عامة": "Public square occupation",
  "تلف ألعاب": "Damaged playground", "مقاعد مكسورة": "Broken benches", "نظافة حديقة": "Park cleanliness", "أشجار متضررة": "Damaged trees",
  "عداد مياه تالف": "Damaged water meter", "غطاء منهول مفقود": "Missing manhole cover", "مطب غير مرخص": "Unauthorized speed bump",
  "إنارة مضاءة نهاراً": "Lights on during daytime", "مخلفات بناء": "Construction debris", "تلوث هواء": "Air pollution",
  "لوحة إعلانية مخالفة": "Illegal billboard", "سياج متضرر": "Damaged fence" };

let lang = localStorage.getItem("mcd_lang") || "ar";
let theme = localStorage.getItem("mcd_theme") || "light";
let styleMode = "status";
let charts = {};
let map, complaintsLayer, nbLayer, muniLayer, roadsLayer, bldLayer, popupOverlay;
let basemaps = {};
let filtered = [];
let bufferMode = false;
let bufferState = null; // { lonlat: [lon,lat], radius: meters }
let bufferSource;

/* ---------- helpers ---------- */
const $ = (id) => document.getElementById(id);
const t = (key) => I18N[lang][key];
const fmt = (n) => n.toLocaleString("en-US"); // western digits always, in every language
const dCat = (c) => (lang === "ar" ? c : CAT_EN[c] || c);
const dStatus = (s) => (lang === "ar" ? s : STATUS_EN[s] || s);
const dPrio = (p) => (lang === "ar" ? p : PRIO_EN[p] || p);
const dDept = (d) => (lang === "ar" ? d : DEPT_EN[d] || d);
const dSrc = (s) => (lang === "ar" ? s : SRC_EN[s] || s);
const dNb = (id) => { const n = NB_NAMES[id] || id; return lang === "ar" ? n : NB_EN[n] || n; };
const dSub = (s) => (lang === "ar" ? s : SUB_EN[s] || s);
const dEmp = (e) => (lang === "ar" ? e : EMP_EN[e] || e);
const dRes = (r) => (r == null ? r : lang === "ar" ? r : RES_EN[r] || r);
const dDesc = (p) => lang === "ar" ? p.description
  : (DESC_EN[p.category_id] ? DESC_EN[p.category_id](SUB_EN[p.sub_category] || p.sub_category, p.street_name) : p.description);

function isOverdue(p) {
  if (p.status === "مغلقة") return false;
  const due = new Date(p.received_date);
  due.setDate(due.getDate() + (p.target_days || 7));
  return due < TODAY;
}
function statusColor(p) { return isOverdue(p) ? OVERDUE_COLOR : STATUS_COLORS[p.status] || "#999"; }
function statusBadge(p) {
  if (isOverdue(p)) return `<span class="badge b-overdue">${t("overdue")}</span>`;
  const cls = p.status === "مغلقة" ? "b-closed" : p.status === "جديدة" ? "b-new" : "b-prog";
  return `<span class="badge ${cls}">${dStatus(p.status)}</span>`;
}

/* ---------- data loading ---------- */
async function loadAll() {
  const get = (u) => fetch(u, { cache: "no-cache" }).then((x) => x.json()); // revalidate so data updates show
  const [c, n, m, r, b] = await Promise.all([
    get("data/complaints.geojson"),
    get("data/neighborhoods.geojson"),
    get("data/municipality.geojson"),
    get("data/roads.geojson"),
    get("data/buildings.geojson"),
  ]);
  Object.assign(DATA, { complaints: c, neighborhoods: n, municipality: m, roads: r, buildings: b });
  n.features.forEach((f) => (NB_NAMES[f.properties.neighborhood_id] = f.properties.name));
}

/* ---------- filters ---------- */
function applyFilter() {
  const f = {
    from: $("fFrom").value, to: $("fTo").value,
    nb: $("fNb").value, cat: $("fCat").value,
    status: $("fStatus").value, prio: $("fPrio").value,
  };
  filtered = [];
  complaintSource.forEachFeature((feat) => {
    const p = feat.get("props");
    let ok = true;
    if (f.from && p.received_date < f.from) ok = false;
    if (ok && f.to && p.received_date > f.to) ok = false;
    if (ok && f.nb && p.neighborhood_id !== f.nb) ok = false;
    if (ok && f.cat && p.category !== f.cat) ok = false;
    if (ok && f.prio && p.priority !== f.prio) ok = false;
    if (ok && f.status) {
      if (f.status === "متأخرة") ok = isOverdue(p);
      else ok = p.status === f.status;
    }
    if (ok && bufferState) {
      const d = ol.sphere.getDistance(bufferState.lonlat, [p.x_coord, p.y_coord]);
      ok = d <= bufferState.radius;
    }
    feat.set("visible", ok, true);
    if (ok) filtered.push({ ...p, __feature: feat });
  });
  complaintSource.changed();
  nbSource.changed();
  updateKPIs();
  updateCharts();
  updateTables();
  updateLegend();
  updateBufferResults();
  $("filterCount").textContent = t("showing")(fmt(filtered.length));
}

/* ---------- KPIs ---------- */
function updateKPIs() {
  const total = filtered.length;
  const closed = filtered.filter((p) => p.status === "مغلقة");
  const overdue = filtered.filter(isOverdue).length;
  const avg = closed.length
    ? (closed.reduce((s, p) => s + (p.days_to_close || 0), 0) / closed.length).toFixed(1)
    : "—";
  const topNb = Object.entries(groupCount(filtered, "neighborhood_id")).sort((a, b) => b[1] - a[1])[0];
  const topCat = Object.entries(groupCount(filtered, "category")).sort((a, b) => b[1] - a[1])[0];

  $("kpiTotal").textContent = fmt(total);
  $("kpiOpen").textContent = fmt(total - closed.length);
  $("kpiClosed").textContent = fmt(closed.length);
  $("kpiOverdue").textContent = fmt(overdue);
  $("kpiAvg").textContent = avg;
  $("kpiTopNb").textContent = topNb ? `${dNb(topNb[0])} (${fmt(topNb[1])})` : "—";
  $("kpiTopCat").textContent = topCat ? `${dCat(topCat[0])} (${fmt(topCat[1])})` : "—";
}
function groupCount(arr, key) {
  const out = {};
  arr.forEach((p) => { const k = p[key]; out[k] = (out[k] || 0) + 1; });
  return out;
}

/* ---------- map ---------- */
let complaintSource, nbSource;

function makeBasemaps() {
  basemaps = {
    osm: new ol.layer.Tile({ source: new ol.source.OSM(), visible: false, zIndex: 0 }),
    sat: new ol.layer.Tile({
      source: new ol.source.XYZ({
        url: "https://mt{0-3}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
        attributions: "© Google", maxZoom: 20,
      }),
      visible: false, zIndex: 0,
    }),
    dark: new ol.layer.Tile({
      source: new ol.source.XYZ({
        url: "https://{a-d}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        attributions: "© CARTO © OpenStreetMap", maxZoom: 20,
      }),
      visible: false, zIndex: 0,
    }),
    light: new ol.layer.Tile({
      source: new ol.source.XYZ({
        url: "https://{a-d}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        attributions: "© CARTO © OpenStreetMap", maxZoom: 20,
      }),
      visible: true, zIndex: 0,
    }),
  };
}
function setBasemap(key) {
  Object.entries(basemaps).forEach(([k, l]) => l.setVisible(k === key));
  const radio = document.querySelector(`input[name="basemap"][value="${key}"]`);
  if (radio) radio.checked = true;
}

function buildMap() {
  const fmtGeo = new ol.format.GeoJSON({ featureProjection: "EPSG:3857" });
  makeBasemaps();

  muniLayer = new ol.layer.Vector({
    source: new ol.source.Vector({ features: fmtGeo.readFeatures(DATA.municipality) }),
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({ color: "#0d47a1", width: 3, lineDash: [8, 5] }),
    }),
    visible: false, zIndex: 5,
  });

  bldLayer = new ol.layer.Vector({
    source: new ol.source.Vector({ features: fmtGeo.readFeatures(DATA.buildings) }),
    style: new ol.style.Style({
      fill: new ol.style.Fill({ color: "rgba(120,130,145,0.35)" }),
      stroke: new ol.style.Stroke({ color: "rgba(90,100,115,0.5)", width: 0.5 }),
    }),
    visible: false, zIndex: 2,
  });

  roadsLayer = new ol.layer.Vector({
    source: new ol.source.Vector({ features: fmtGeo.readFeatures(DATA.roads) }),
    style: new ol.style.Style({ stroke: new ol.style.Stroke({ color: "#8d6e63", width: 1.5 }) }),
    visible: false, zIndex: 3,
  });

  nbSource = new ol.source.Vector({ features: fmtGeo.readFeatures(DATA.neighborhoods) });
  nbLayer = new ol.layer.Vector({ source: nbSource, style: nbStyle, visible: false, zIndex: 4 });

  complaintSource = new ol.source.Vector({ features: fmtGeo.readFeatures(DATA.complaints) });
  complaintSource.forEachFeature((f) => {
    f.set("props", f.getProperties(), true);
    f.set("visible", true, true);
  });
  complaintsLayer = new ol.layer.Vector({ source: complaintSource, style: complaintStyle, zIndex: 10 });

  // buffer layer
  bufferSource = new ol.source.Vector();
  const bufferLayer = new ol.layer.Vector({
    source: bufferSource,
    style: (feat) => feat.get("kind") === "center"
      ? new ol.style.Style({
          image: new ol.style.Circle({
            radius: 6,
            fill: new ol.style.Fill({ color: "#00bcd4" }),
            stroke: new ol.style.Stroke({ color: "#fff", width: 2 }),
          }),
        })
      : new ol.style.Style({
          fill: new ol.style.Fill({ color: "rgba(0,188,212,0.12)" }),
          stroke: new ol.style.Stroke({ color: "#00bcd4", width: 2.5, lineDash: [6, 5] }),
        }),
    zIndex: 8,
  });

  popupOverlay = new ol.Overlay({
    element: $("popup"),
    autoPan: { animation: { duration: 200 } },
    positioning: "bottom-center",
  });

  map = new ol.Map({
    target: "map",
    controls: ol.control.defaults.defaults({ zoom: false, rotate: false })
      .extend([new ol.control.ScaleLine({ units: "metric" })]), // scale bar shown in print only (CSS)
    layers: [basemaps.osm, basemaps.sat, basemaps.dark, basemaps.light,
      bldLayer, roadsLayer, nbLayer, muniLayer, bufferLayer, complaintsLayer],
    overlays: [popupOverlay],
    view: new ol.View({ center: [0, 0], zoom: 12 }),
  });

  map.getView().fit(muniLayer.getSource().getExtent(), { padding: [30, 30, 30, 30] });

  // basemap radios
  document.querySelectorAll('input[name="basemap"]').forEach((r) =>
    r.addEventListener("change", () => setBasemap(r.value)));

  // overlay toggles
  $("lyrComplaints").addEventListener("change", (e) => complaintsLayer.setVisible(e.target.checked));
  $("lyrHeat").addEventListener("change", (e) => { nbLayer.setVisible(e.target.checked); updateLegend(); });
  $("lyrBoundary").addEventListener("change", (e) => muniLayer.setVisible(e.target.checked));
  $("lyrRoads").addEventListener("change", (e) => roadsLayer.setVisible(e.target.checked));
  $("lyrBld").addEventListener("change", (e) => bldLayer.setVisible(e.target.checked));

  // style mode segment
  document.querySelectorAll("#styleMode button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#styleMode button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      styleMode = btn.dataset.mode;
      complaintSource.changed();
      updateLegend();
    });
  });

  // popup
  $("popupCloser").addEventListener("click", closePopup);
  map.on("singleclick", (evt) => {
    if (bufferMode) {
      const lonlat = ol.proj.toLonLat(evt.coordinate);
      bufferState = { lonlat, radius: +$("bufferRadius").value || 500 };
      drawBuffer();
      applyFilter();
      return;
    }
    let hit = null;
    map.forEachFeatureAtPixel(evt.pixel, (feat, layer) => {
      if (layer === complaintsLayer && feat.get("visible")) { hit = feat; return true; }
    }, { hitTolerance: 6 });
    if (hit) showPopup(hit); else closePopup();
  });
  map.on("pointermove", (evt) => {
    if (bufferMode) { map.getTargetElement().style.cursor = "crosshair"; return; }
    const has = map.hasFeatureAtPixel(evt.pixel, {
      layerFilter: (l) => l === complaintsLayer, hitTolerance: 6,
    });
    map.getTargetElement().style.cursor = has ? "pointer" : "";
  });
}
function closePopup() { $("popup").style.display = "none"; popupOverlay.setPosition(undefined); }

function complaintStyle(feat) {
  if (!feat.get("visible")) return null;
  const p = feat.get("props");
  const overdue = isOverdue(p);
  const color = styleMode === "status" ? statusColor(p) : (CAT_COLORS[p.category] || "#999");
  const urgent = p.priority === "عاجلة";
  return new ol.style.Style({
    image: new ol.style.Circle({
      radius: urgent ? 7 : 5.5,
      fill: new ol.style.Fill({ color }),
      stroke: new ol.style.Stroke({
        color: overdue && styleMode === "category" ? OVERDUE_COLOR : "#ffffff",
        width: overdue && styleMode === "category" ? 2.5 : 1.5,
      }),
    }),
  });
}

const RAMP = ["#fee8e7", "#fbc4bc", "#f59a8e", "#e96a5c", "#d13b2f", "#a81f17"];
function nbStyle(feat) {
  const id = feat.get("neighborhood_id");
  const counts = groupCount(filtered, "neighborhood_id");
  const max = Math.max(1, ...Object.values(counts));
  const v = counts[id] || 0;
  const idx = Math.min(RAMP.length - 1, Math.floor((v / max) * (RAMP.length - 1) + 0.001));
  const nbName = lang === "ar" ? feat.get("name") : (NB_EN[feat.get("name")] || feat.get("name"));
  return new ol.style.Style({
    fill: new ol.style.Fill({ color: hexToRgba(RAMP[idx], 0.48) }),
    stroke: new ol.style.Stroke({ color: "#8c2d23", width: 1.2 }),
    text: new ol.style.Text({
      text: `${nbName}\n${fmt(v)}`,
      font: "700 11px Tajawal, sans-serif",
      fill: new ol.style.Fill({ color: "#5d1a12" }),
      stroke: new ol.style.Stroke({ color: "rgba(255,255,255,0.85)", width: 3 }),
      textAlign: "center",
    }),
  });
}
function hexToRgba(hex, a) {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
}

function showPopup(feat) {
  const p = feat.get("props");
  $("popupContent").innerHTML = `
    <div class="popup-title">${p.complaint_id} — ${dCat(p.category)} ${statusBadge(p)}</div>
    <div class="popup-row"><b>${t("ppSub")}</b><span>${dSub(p.sub_category)}</span></div>
    <div class="popup-row"><b>${t("ppPrio")}</b><span class="badge b-prio-${p.priority}">${dPrio(p.priority)}</span></div>
    <div class="popup-row"><b>${t("ppRec")}</b><span>${p.received_date}</span></div>
    ${p.closed_date ? `<div class="popup-row"><b>${t("ppClosed")}</b><span>${p.closed_date} (${p.days_to_close} ${t("day")})</span></div>` : ""}
    <div class="popup-row"><b>${t("ppNb")}</b><span>${dNb(p.neighborhood_id)}</span></div>
    <div class="popup-row"><b>${t("ppStreet")}</b><span>${p.street_name}</span></div>
    <div class="popup-row"><b>${t("ppDept")}</b><span>${dDept(p.assigned_dept)}</span></div>
    <div class="popup-row"><b>${t("ppEmp")}</b><span>${dEmp(p.assigned_emp)}</span></div>
    <div class="popup-row"><b>${t("ppSrc")}</b><span>${dSrc(p.source)}</span></div>
    <div class="popup-desc">${dDesc(p)}</div>
    ${p.resolution_note ? `<div class="popup-desc">✅ ${dRes(p.resolution_note)}</div>` : ""}
    <img class="popup-photo" src="data/img/${p.category_id}.jpg" alt="${dCat(p.category)}"
         title="${lang === "ar" ? "انقر للتكبير" : "Click to enlarge"}">`;
  const photo = $("popupContent").querySelector(".popup-photo");
  photo.addEventListener("click", () => photo.classList.toggle("big"));
  $("popup").style.display = "block";
  popupOverlay.setPosition(feat.getGeometry().getCoordinates());
}

/* ---------- buffer tool ---------- */
function drawBuffer() {
  bufferSource.clear();
  if (!bufferState) return;
  const circle = ol.geom.Polygon.circular(bufferState.lonlat, bufferState.radius, 96)
    .transform("EPSG:4326", "EPSG:3857");
  bufferSource.addFeature(new ol.Feature({ geometry: circle, kind: "ring" }));
  bufferSource.addFeature(new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat(bufferState.lonlat)), kind: "center",
  }));
}
function updateBufferResults() {
  const el = $("bufferResults");
  if (!bufferState) { el.innerHTML = ""; return; }
  const open = filtered.filter((p) => p.status !== "مغلقة").length;
  const overdue = filtered.filter(isOverdue).length;
  const topCat = Object.entries(groupCount(filtered, "category")).sort((a, b) => b[1] - a[1])[0];
  el.innerHTML = `
    <div class="br-row"><span>${t("brTotal")} (${fmt(bufferState.radius)} m)</span><b>${fmt(filtered.length)}</b></div>
    <div class="br-row"><span>${t("brOpen")}</span><b>${fmt(open)}</b></div>
    <div class="br-row"><span>${t("brClosed")}</span><b>${fmt(filtered.length - open)}</b></div>
    <div class="br-row"><span>${t("brOverdue")}</span><b style="color:var(--danger)">${fmt(overdue)}</b></div>
    ${topCat ? `<div class="br-row"><span>${t("brTop")}</span><b>${dCat(topCat[0])}</b></div>` : ""}`;
}
function clearBuffer() {
  bufferState = null;
  bufferSource.clear();
  applyFilter();
}

/* ---------- legend ---------- */
function updateLegend() {
  let html = "";
  if (styleMode === "status") {
    html += `<h4>${t("legStatus")}</h4>`;
    Object.entries(STATUS_COLORS).forEach(([k, c]) => {
      html += `<div class="legend-item"><span class="legend-swatch" style="background:${c}"></span>${dStatus(k)}</div>`;
    });
    html += `<div class="legend-item"><span class="legend-swatch" style="background:${OVERDUE_COLOR}"></span>${t("overdue")}</div>`;
  } else {
    html += `<h4>${t("legCat")}</h4>`;
    Object.entries(CAT_COLORS).forEach(([k, c]) => {
      html += `<div class="legend-item"><span class="legend-swatch" style="background:${c}"></span>${dCat(k)}</div>`;
    });
  }
  if ($("lyrHeat").checked) {
    const max = Math.max(1, ...Object.values(groupCount(filtered, "neighborhood_id")));
    html += `<h4 style="margin-top:8px">${t("legDensity")}</h4>
      <div class="legend-ramp">${RAMP.map((c) => `<span style="background:${c}"></span>`).join("")}</div>
      <div class="legend-ramp-labels"><span>0</span><span>${fmt(max)}</span></div>`;
  }
  $("legend").innerHTML = html;
}

/* ---------- charts ---------- */
Chart.defaults.font.family = "Tajawal, sans-serif";
Chart.defaults.font.size = 12;

let printMode = false; // charts re-rendered in light colors for PDF capture
const uiDark = () => document.body.classList.contains("theme-neon") && !printMode;
function chartColors() {
  Chart.defaults.color = uiDark() ? "#9fc3e0" : "#475569";
  Chart.defaults.borderColor = uiDark() ? "rgba(0,229,255,0.10)" : "rgba(0,0,0,0.08)";
}
function makeChart(id, cfg) {
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart($(id).getContext("2d"), cfg);
}

function updateCharts() {
  chartColors();

  // drill-down: when one main category is selected, show its sub-categories
  const selCat = $("fCat").value;
  let catLabels, catData, catColors;
  if (selCat) {
    const bySub = groupCount(filtered.filter((p) => p.category === selCat), "sub_category");
    const subs = Object.keys(bySub).sort((a, b) => bySub[b] - bySub[a]);
    catLabels = subs.map(dSub);
    catData = subs.map((s) => bySub[s]);
    const base = CAT_COLORS[selCat] || "#1565c0";
    catColors = subs.map((_, i) => hexToRgba(base, 1 - i * 0.14)); // shades of the category color
  } else {
    const byCat = groupCount(filtered, "category");
    const catKeys = Object.keys(CAT_COLORS).filter((c) => byCat[c]);
    catLabels = catKeys.map(dCat);
    catData = catKeys.map((c) => byCat[c]);
    catColors = catKeys.map((c) => CAT_COLORS[c]);
  }
  makeChart("chCategory", {
    type: "bar",
    data: {
      labels: catLabels,
      datasets: [{ data: catData, backgroundColor: catColors, borderRadius: 6, barPercentage: 0.62 }],
    },
    options: baseOpts({
      indexAxis: "y",
      plugins: { legend: { display: false } },
      // always show every category label, never skip on small heights
      scales: { y: { ticks: { autoSkip: false, font: { size: 10.5 } } } },
    }),
  });

  const closed = filtered.filter((p) => p.status === "مغلقة").length;
  const overdue = filtered.filter(isOverdue).length;
  const newC = filtered.filter((p) => p.status === "جديدة" && !isOverdue(p)).length;
  const prog = filtered.filter((p) => p.status === "قيد المعالجة" && !isOverdue(p)).length;
  makeChart("chStatus", {
    type: "doughnut",
    data: {
      labels: [t("stClosed"), t("stProg"), t("stNew"), t("overdue")],
      datasets: [{ data: [closed, prog, newC, overdue], backgroundColor: ["#66bb6a", "#ffa726", "#29b6f6", OVERDUE_COLOR], borderWidth: 2, borderColor: uiDark() ? "#0d1526" : "#fff" }],
    },
    options: baseOpts({ cutout: "58%", plugins: { legend: { position: "bottom", rtl: lang === "ar" } } }),
  });

  const months = [];
  for (let y = 2025; y <= 2026; y++)
    for (let m = 1; m <= 12; m++) {
      if (y === 2026 && m > 7) break;
      months.push(`${y}-${String(m).padStart(2, "0")}`);
    }
  const rec = {}, clo = {};
  filtered.forEach((p) => {
    rec[p.received_date.slice(0, 7)] = (rec[p.received_date.slice(0, 7)] || 0) + 1;
    if (p.closed_date) clo[p.closed_date.slice(0, 7)] = (clo[p.closed_date.slice(0, 7)] || 0) + 1;
  });
  makeChart("chMonthly", {
    type: "line",
    data: {
      labels: months,
      datasets: [
        { label: t("received"), data: months.map((m) => rec[m] || 0), borderColor: "#1e88e5", backgroundColor: "rgba(30,136,229,.12)", fill: true, tension: 0.35, pointRadius: 0, pointHitRadius: 12, pointStyle: "line", borderWidth: 2.5 },
        { label: t("closedSeries"), data: months.map((m) => clo[m] || 0), borderColor: "#66bb6a", backgroundColor: "rgba(102,187,106,.10)", fill: true, tension: 0.35, pointRadius: 0, pointHitRadius: 12, pointStyle: "line", borderWidth: 2.5 },
      ],
    },
    options: baseOpts({
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { position: "top", rtl: lang === "ar", labels: { usePointStyle: true, pointStyleWidth: 34 } } },
    }),
  });

  const byNb = groupCount(filtered, "neighborhood_id");
  const nbIds = Object.keys(NB_NAMES).sort();
  makeChart("chNb", {
    type: "bar",
    data: {
      labels: nbIds.map(dNb),
      datasets: [{ data: nbIds.map((i) => byNb[i] || 0), backgroundColor: uiDark() ? "#00e5ff" : "#1565c0", borderRadius: 6 }],
    },
    options: baseOpts({ indexAxis: "y", plugins: { legend: { display: false } } }),
  });

  const deptAgg = {};
  filtered.forEach((p) => {
    const d = (deptAgg[p.assigned_dept] = deptAgg[p.assigned_dept] || { n: 0, closed: 0, days: 0 });
    d.n++;
    if (p.status === "مغلقة") { d.closed++; d.days += p.days_to_close || 0; }
  });
  const depts = Object.keys(deptAgg).sort((a, b) => deptAgg[b].n - deptAgg[a].n);
  makeChart("chDept", {
    type: "bar",
    data: {
      labels: depts.map((d) => (lang === "ar" ? d.replace("قسم ", "") : DEPT_EN[d] || d)),
      datasets: [
        { label: t("countSeries"), data: depts.map((d) => deptAgg[d].n), backgroundColor: uiDark() ? "rgba(0,229,255,.45)" : "#90caf9", borderRadius: 5, yAxisID: "y", pointStyle: "rect" },
        { label: t("avgSeries"), data: depts.map((d) => deptAgg[d].closed ? +(deptAgg[d].days / deptAgg[d].closed).toFixed(1) : 0), type: "line", borderColor: "#e53935", backgroundColor: "#e53935", yAxisID: "y2", tension: 0.3, pointStyle: "line", borderWidth: 2.5 },
      ],
    },
    options: baseOpts({
      plugins: { legend: { position: "bottom", rtl: lang === "ar", labels: { usePointStyle: true, pointStyleWidth: 12 } } },
      scales: {
        y: { beginAtZero: true, position: lang === "ar" ? "right" : "left" },
        y2: { beginAtZero: true, position: lang === "ar" ? "left" : "right", grid: { drawOnChartArea: false } },
      },
    }),
  });

  const bySrc = groupCount(filtered, "source");
  const srcs = Object.keys(bySrc);
  makeChart("chSource", {
    type: "pie",
    data: {
      labels: srcs.map(dSrc),
      datasets: [{ data: srcs.map((s) => bySrc[s]), backgroundColor: ["#26a69a", "#5c6bc0", "#ffa726", "#8d6e63", "#78909c"], borderWidth: 2, borderColor: uiDark() ? "#0d1526" : "#fff" }],
    },
    options: baseOpts({
      // compact legend so all 5 sources fit on a single row
      plugins: { legend: { position: "bottom", rtl: lang === "ar", labels: { boxWidth: 11, boxHeight: 11, font: { size: 10.5 }, padding: 7 } } },
    }),
  });
}
function baseOpts(extra) {
  // animation:false is required: print snapshots capture the canvas immediately,
  // an animating chart would be captured blank
  return Object.assign({ responsive: true, maintainAspectRatio: false, animation: false, locale: "en-US" }, extra);
}

/* ---------- tables ---------- */
function updateTables() {
  const byStreet = {};
  filtered.forEach((p) => {
    const s = (byStreet[p.street_name] = byStreet[p.street_name] || { n: 0, open: 0, cats: {} });
    s.n++;
    if (p.status !== "مغلقة") s.open++;
    s.cats[p.category] = (s.cats[p.category] || 0) + 1;
  });
  const top = Object.entries(byStreet).sort((a, b) => b[1].n - a[1].n).slice(0, 10);
  $("tblStreets").querySelector("tbody").innerHTML = top.map(([name, s], i) => {
    const topCat = Object.entries(s.cats).sort((a, b) => b[1] - a[1])[0][0];
    return `<tr><td>${i + 1}</td><td>${name}</td><td><b>${fmt(s.n)}</b></td><td>${fmt(s.open)}</td><td>${dCat(topCat)}</td></tr>`;
  }).join("");

  const rows = [...filtered].sort((a, b) => b.received_date.localeCompare(a.received_date)).slice(0, 60);
  $("tblComplaints").querySelector("tbody").innerHTML = rows.map((p) => `
    <tr data-id="${p.complaint_id}">
      <td><b>${p.complaint_id}</b></td><td>${dCat(p.category)}</td><td>${dSub(p.sub_category)}</td>
      <td>${statusBadge(p)}</td><td><span class="badge b-prio-${p.priority}">${dPrio(p.priority)}</span></td>
      <td>${p.received_date}</td><td>${dNb(p.neighborhood_id)}</td>
      <td>${p.street_name}</td><td>${dDept(p.assigned_dept)}</td>
      <td>${p.days_to_close != null ? p.days_to_close + " " + t("day") : "—"}</td></tr>`).join("");

  $("tblComplaints").querySelectorAll("tbody tr").forEach((tr) => {
    tr.addEventListener("click", () => {
      const rec = filtered.find((p) => p.complaint_id === tr.dataset.id);
      if (!rec) return;
      const geom = rec.__feature.getGeometry();
      map.getView().animate({ center: geom.getCoordinates(), zoom: 16, duration: 500 });
      setTimeout(() => showPopup(rec.__feature), 550);
      document.querySelector(".map-panel").scrollIntoView({ behavior: "smooth" });
    });
  });
}

/* ---------- exports ---------- */
function exportExcel() {
  const A = lang === "ar";
  const rows = filtered.map((p) => ({
    [A ? "رقم الشكوى" : "Complaint ID"]: p.complaint_id,
    [A ? "كود النوع" : "Category code"]: p.category_id,
    [A ? "نوع الشكوى" : "Category"]: dCat(p.category),
    [A ? "النوع الفرعي" : "Sub-category"]: dSub(p.sub_category),
    [A ? "الحالة" : "Status"]: dStatus(p.status),
    [A ? "متأخرة" : "Overdue"]: isOverdue(p) ? (A ? "نعم" : "Yes") : (A ? "لا" : "No"),
    [A ? "الأولوية" : "Priority"]: dPrio(p.priority),
    [A ? "تاريخ الاستلام" : "Received"]: p.received_date,
    [A ? "تاريخ الإغلاق" : "Closed"]: p.closed_date || "",
    [A ? "مدة الحل (يوم)" : "Days to close"]: p.days_to_close ?? "",
    [A ? "كود الحي" : "Neighborhood ID"]: p.neighborhood_id,
    [A ? "الحي" : "Neighborhood"]: dNb(p.neighborhood_id),
    [A ? "اسم الشارع" : "Street"]: p.street_name,
    [A ? "القسم المسؤول" : "Department"]: dDept(p.assigned_dept),
    [A ? "الموظف المسؤول" : "Employee"]: dEmp(p.assigned_emp),
    [A ? "مصدر الشكوى" : "Source"]: dSrc(p.source),
    [A ? "الوصف" : "Description"]: dDesc(p),
    [A ? "ملاحظات الحل" : "Resolution note"]: dRes(p.resolution_note) || "",
    X: p.x_coord, Y: p.y_coord,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0] || {}).map(() => ({ wch: 16 }));
  const wb = XLSX.utils.book_new();
  wb.Workbook = { Views: [{ RTL: A }] };
  XLSX.utils.book_append_sheet(wb, ws, A ? "الشكاوى" : "Complaints");

  const kName = A ? "المؤشر" : "Indicator", kVal = A ? "القيمة" : "Value";
  const byCat = groupCount(filtered, "category");
  const byNb = groupCount(filtered, "neighborhood_id");
  const summary = [
    { [kName]: t("kpiTotal"), [kVal]: filtered.length },
    { [kName]: t("kpiOpen"), [kVal]: filtered.filter((p) => p.status !== "مغلقة").length },
    { [kName]: t("kpiClosed"), [kVal]: filtered.filter((p) => p.status === "مغلقة").length },
    { [kName]: t("kpiOverdue"), [kVal]: filtered.filter(isOverdue).length },
    {},
    ...Object.entries(byCat).map(([k, v]) => ({ [kName]: dCat(k), [kVal]: v })),
    {},
    ...Object.entries(byNb).map(([k, v]) => ({ [kName]: dNb(k), [kVal]: v })),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), A ? "ملخص" : "Summary");
  XLSX.writeFile(wb, `complaints_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
function fillPrintHeader() {
  const now = new Date();
  const loc = lang === "ar" ? "ar-EG-u-nu-latn" : "en-GB"; // arabic month names, western digits
  $("phTitle").textContent = t("appTitle");
  $("phSubtitle").textContent = t("appSubtitle");
  $("phDate").textContent = `${t("phGenerated")}: ${now.toLocaleDateString(loc)} ${now.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" })}`;
  $("phCount").textContent = `${t("phShown")}: ${fmt(filtered.length)}`;
  const parts = [`${t("phPeriod")}: ${$("fFrom").value} → ${$("fTo").value}`];
  if ($("fNb").value) parts.push(`${t("fNb")}: ${dNb($("fNb").value)}`);
  if ($("fCat").value) parts.push(`${t("fCat")}: ${dCat($("fCat").value)}`);
  if ($("fStatus").value) parts.push(`${t("fStatus")}: ${$("fStatus").selectedOptions[0].textContent}`);
  if ($("fPrio").value) parts.push(`${t("fPrio")}: ${dPrio($("fPrio").value)}`);
  if (bufferState) parts.push(`${t("buffer").replace("⭕ ", "")}: ${fmt(bufferState.radius)} m`);
  $("phFilters").textContent = parts.join("  |  ");
}
// charts overlap when printed as live canvases -> snapshot them as static images
function preparePrintCharts() {
  printMode = true;
  updateCharts(); // re-render with light (paper) colors
  Object.entries(charts).forEach(([id, ch]) => {
    const wrap = $(id).parentElement;
    let img = wrap.querySelector("img.print-chart");
    if (!img) {
      img = document.createElement("img");
      img.className = "print-chart";
      wrap.appendChild(img);
    }
    img.src = ch.toBase64Image("image/png", 1);
  });
}
function restoreAfterPrint() {
  if (!printMode) return;
  printMode = false;
  updateCharts();
}
function exportPdf() { window.print(); }

/* ---------- language & theme ---------- */
function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const v = t(el.dataset.i18n);
    if (typeof v === "string") el.textContent = v;
  });
  $("btnLang").textContent = lang === "ar" ? "EN" : "ع";
  $("btnTheme").innerHTML = document.body.classList.contains("theme-neon")
    ? `☀️ <span data-i18n="themeLight">${t("themeLight")}</span>`
    : `🌙 <span data-i18n="themeDark">${t("themeDark")}</span>`;
  // rebuild neighborhood + category select labels (keep selection)
  [...$("fNb").options].forEach((o) => {
    if (o.value) o.textContent = `${dNb(o.value)} (${o.value})`;
  });
  [...$("fCat").options].forEach((o) => {
    if (o.value) o.textContent = dCat(o.value);
  });
  localStorage.setItem("mcd_lang", lang);
}
function applyTheme() {
  document.body.classList.toggle("theme-neon", theme === "neon");
  // auto-match basemap (unless satellite selected)
  const current = Object.entries(basemaps).find(([, l]) => l.getVisible());
  if (current && current[0] !== "sat") setBasemap(theme === "neon" ? "dark" : "light");
  localStorage.setItem("mcd_theme", theme);
}

/* ---------- init ---------- */
async function init() {
  await loadAll();

  const nbSel = $("fNb");
  DATA.neighborhoods.features
    .sort((a, b) => a.properties.neighborhood_id.localeCompare(b.properties.neighborhood_id))
    .forEach((f) => {
      const o = document.createElement("option");
      o.value = f.properties.neighborhood_id;
      o.textContent = `${f.properties.name} (${f.properties.neighborhood_id})`;
      nbSel.appendChild(o);
    });
  const catSel = $("fCat");
  Object.keys(CAT_COLORS).forEach((c) => {
    const o = document.createElement("option");
    o.value = c; o.textContent = c;
    catSel.appendChild(o);
  });

  buildMap();

  ["fFrom", "fTo", "fNb", "fCat", "fStatus", "fPrio"].forEach((id) =>
    $(id).addEventListener("change", applyFilter));
  $("btnReset").addEventListener("click", () => {
    $("fFrom").value = "2025-01-01"; $("fTo").value = "2026-07-03";
    $("fNb").value = ""; $("fCat").value = ""; $("fStatus").value = ""; $("fPrio").value = "";
    clearBuffer();
  });

  document.querySelectorAll(".kpi-card[data-kpi]").forEach((card) => {
    card.addEventListener("click", () => {
      const k = card.dataset.kpi;
      $("fStatus").value = k === "open" ? "قيد المعالجة" : k === "closed" ? "مغلقة" : k === "overdue" ? "متأخرة" : "";
      applyFilter();
    });
  });

  $("btnExcel").addEventListener("click", exportExcel);
  $("btnPdf").addEventListener("click", exportPdf);
  // default PDF filename = document.title at print time
  const screenTitle = document.title;
  window.addEventListener("beforeprint", () => {
    document.title = `Complaints Smart Dashboard_${new Date().toISOString().slice(0, 10)}`;
    fillPrintHeader();
    preparePrintCharts();
  }); // Ctrl+P too
  window.addEventListener("afterprint", () => {
    document.title = screenTitle;
    restoreAfterPrint();
  });

  // floating panels
  const togglePanel = (panelId, btnId, cb) => {
    $(btnId).addEventListener("click", () => {
      const panel = $(panelId);
      const nowHidden = panel.classList.toggle("hidden");
      $(btnId).classList.toggle("active", !nowHidden);
      if (cb) cb(!nowHidden);
    });
  };
  togglePanel("layersPanel", "btnLayers");
  // legend show/hide
  $("btnLegendToggle").addEventListener("click", () => {
    const hidden = $("legend").classList.toggle("hidden");
    $("btnLegendToggle").classList.toggle("active", !hidden);
  });
  togglePanel("bufferPanel", "btnBuffer", (open) => {
    bufferMode = open;
    if (!open) map.getTargetElement().style.cursor = "";
  });
  document.querySelectorAll(".float-close").forEach((b) =>
    b.addEventListener("click", () => {
      $(b.dataset.close).classList.add("hidden");
      if (b.dataset.close === "bufferPanel") { bufferMode = false; $("btnBuffer").classList.remove("active"); map.getTargetElement().style.cursor = ""; }
      if (b.dataset.close === "layersPanel") $("btnLayers").classList.remove("active");
    }));

  // buffer radius live update
  $("bufferRadius").addEventListener("change", () => {
    if (bufferState) {
      bufferState.radius = +$("bufferRadius").value || 500;
      drawBuffer();
      applyFilter();
    }
  });
  $("btnBufferClear").addEventListener("click", clearBuffer);

  // theme toggle
  $("btnTheme").addEventListener("click", () => {
    theme = theme === "neon" ? "light" : "neon";
    applyTheme();
    applyLang();      // refresh theme button label
    updateCharts();   // re-render with theme colors
  });

  // language toggle
  $("btnLang").addEventListener("click", () => {
    lang = lang === "ar" ? "en" : "ar";
    applyLang();
    applyFilter();    // re-render everything in new language
  });

  // scroll hint
  const hint = $("scrollHint");
  hint.addEventListener("click", () => window.scrollBy({ top: window.innerHeight * .8, behavior: "smooth" }));
  window.addEventListener("scroll", () => {
    if (window.scrollY > 150) hint.classList.add("gone");
  }, { passive: true });

  applyTheme();
  applyLang();
  applyFilter();
}

init().catch((e) => {
  console.error(e);
  alert(t("loadErr"));
});
