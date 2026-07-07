const sampleLayers = {
  neighborhoods: [
    { name: "North Sample District", x: 30, y: 30, w: 35, h: 28 },
    { name: "Central Sample District", x: 57, y: 48, w: 38, h: 32 },
    { name: "South Sample District", x: 40, y: 72, w: 42, h: 26 }
  ],
  roads: [
    { name: "Sample Main Road", x: 12, y: 22, length: 76, rotate: 8 },
    { name: "Sample Ring Road", x: 22, y: 55, length: 62, rotate: -16 },
    { name: "Sample Service Road", x: 36, y: 80, length: 48, rotate: 4 }
  ],
  buildings: [
    { name: "Building A-101", x: 24, y: 34 },
    { name: "Building A-102", x: 28, y: 38 },
    { name: "Building B-201", x: 52, y: 45 },
    { name: "Building B-202", x: 60, y: 52 },
    { name: "Building C-301", x: 42, y: 74 },
    { name: "Building C-302", x: 50, y: 78 }
  ],
  complaints: [
    { name: "Road damage", category: "Road damage", status: "Open", x: 36, y: 42 },
    { name: "Waste collection", category: "Waste collection", status: "Resolved", x: 58, y: 35 },
    { name: "Water issue", category: "Water issue", status: "Open", x: 68, y: 58 },
    { name: "Street lighting", category: "Street lighting", status: "Resolved", x: 45, y: 66 },
    { name: "Building violation", category: "Building violation", status: "Open", x: 31, y: 72 },
    { name: "Road damage follow-up", category: "Road damage", status: "Resolved", x: 73, y: 78 }
  ],
  facilities: [
    { name: "Sample Municipal Office", type: "Facility", x: 48, y: 48 },
    { name: "Sample Water Point", type: "Facility", x: 64, y: 64 },
    { name: "Sample Service Yard", type: "Facility", x: 32, y: 58 }
  ]
};

const activeLayers = new Set(Object.keys(sampleLayers));
const map = document.querySelector("#fakeMap");
const results = document.querySelector("#demoResults");
const statsGrid = document.querySelector("#statsGrid");
const searchInput = document.querySelector("#demoSearch");
const chart = document.querySelector("#complaintsChart");

function allRecords() {
  return Object.entries(sampleLayers).flatMap(([layer, records]) => records.map((record) => ({ ...record, layer })));
}

function renderMap() {
  const records = allRecords().filter((record) => activeLayers.has(record.layer));
  map.innerHTML = "";
  records.forEach((record) => {
    const node = document.createElement("div");
    node.className = `map-feature ${record.layer.slice(0, -1)}`;
    node.title = `${record.name} (${record.layer})`;
    node.style.left = `${record.x}%`;
    node.style.top = `${record.y}%`;
    if (record.layer === "neighborhoods") {
      node.style.width = `${record.w}%`;
      node.style.height = `${record.h}%`;
    }
    if (record.layer === "roads") {
      node.style.width = `${record.length}%`;
      node.style.transform = `rotate(${record.rotate}deg)`;
    }
    map.appendChild(node);
  });
}

function renderStats() {
  const complaints = sampleLayers.complaints;
  const open = complaints.filter((item) => item.status === "Open").length;
  const resolved = complaints.filter((item) => item.status === "Resolved").length;
  const categories = countBy(complaints, "category");
  const mostReported = Object.entries(categories).sort((a, b) => b[1] - a[1])[0][0];
  const stats = [
    ["Total complaints", complaints.length],
    ["Open complaints", open],
    ["Resolved complaints", resolved],
    ["Avg. response", "2.4d"],
    ["Top category", mostReported]
  ];
  statsGrid.innerHTML = stats.map(([label, value]) => `<article class="stat-card"><strong>${value}</strong><span>${label}</span></article>`).join("");
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
}

function renderResults() {
  const query = searchInput.value.trim().toLowerCase();
  const records = allRecords().filter((record) => {
    if (!activeLayers.has(record.layer)) return false;
    return [record.name, record.category, record.status, record.type, record.layer].filter(Boolean).some((value) => value.toLowerCase().includes(query));
  });
  results.innerHTML = `<div class="record-list">${records
    .map((record) => `<div class="record-item"><strong>${record.name}</strong><span>${record.layer}${record.status ? ` - ${record.status}` : ""}</span></div>`)
    .join("")}</div>`;
}

function renderChart() {
  const ctx = chart.getContext("2d");
  const counts = countBy(sampleLayers.complaints, "category");
  const entries = Object.entries(counts);
  const max = Math.max(...entries.map((entry) => entry[1]));
  ctx.clearRect(0, 0, chart.width, chart.height);
  ctx.font = "13px Arial";
  entries.forEach(([label, value], index) => {
    const y = 30 + index * 42;
    const width = (value / max) * 220;
    ctx.fillStyle = "#1f8a70";
    ctx.fillRect(150, y, width, 22);
    ctx.fillStyle = "#172033";
    ctx.fillText(label, 8, y + 16);
    ctx.fillText(value, 160 + width, y + 16);
  });
}

document.querySelectorAll("[data-layer]").forEach((input) => {
  input.addEventListener("change", () => {
    if (input.checked) activeLayers.add(input.dataset.layer);
    else activeLayers.delete(input.dataset.layer);
    renderMap();
    renderResults();
  });
});

searchInput.addEventListener("input", renderResults);
document.querySelector("#printDemo").addEventListener("click", () => window.print());

renderMap();
renderStats();
renderResults();
renderChart();
