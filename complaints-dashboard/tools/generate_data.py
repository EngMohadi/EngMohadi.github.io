# -*- coding: utf-8 -*-
"""
Municipal Complaints Smart Dashboard - Data generator
Reads boundary/roads/buildings from Denmark_sample.gpkg (Kolding),
builds 10 neighborhoods (k-means on buildings + Voronoi clipped to boundary),
generates ~900 complaints spread over 2025-01 .. 2026-07 with seasonal
patterns, and exports GeoJSON layers into ../data/.
"""
import sqlite3, json, math, random, struct, os
from datetime import date, timedelta
from shapely import wkb as shp_wkb
from shapely.geometry import mapping, Point, MultiPoint
from shapely.ops import unary_union, voronoi_diagram
from shapely.strtree import STRtree

random.seed(42)
GPKG = r"D:\DASH_BOARD\DataSamples\Denmark_sample.gpkg"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
os.makedirs(OUT, exist_ok=True)
TODAY = date(2026, 7, 3)


# ---------- GPKG geometry blob -> shapely ----------
def gpkg_geom(blob):
    if blob is None:
        return None
    flags = blob[3]
    env = (flags >> 1) & 0x07
    env_size = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}[env]
    return shp_wkb.loads(bytes(blob[8 + env_size:]))


def read_layer(cur, table, where=""):
    cols = [r[1] for r in cur.execute(f'PRAGMA table_info("{table}")')]
    sel = ", ".join(f'"{c}"' for c in cols)
    rows = []
    for row in cur.execute(f'SELECT {sel} FROM "{table}" {where}'):
        rec = dict(zip(cols, row))
        rec["_geom"] = gpkg_geom(rec.pop("Shape"))
        rows.append(rec)
    return rows


db = sqlite3.connect(GPKG)
cur = db.cursor()

boundary = read_layer(cur, "cut")[0]["_geom"]
buildings = [r for r in read_layer(cur, "buildings_a") if r["_geom"] is not None]
roads_all = [r for r in read_layer(cur, "roads") if r["_geom"] is not None]
drivable = {"residential", "secondary", "tertiary", "unclassified", "living_street",
            "pedestrian", "secondary_link", "tertiary_link", "primary", "primary_link"}
roads = [r for r in roads_all if r["fclass"] in drivable and r["name"].strip()]
print(f"boundary ok | buildings={len(buildings)} | named streets={len(roads)}")

# keep only buildings inside boundary
b_pts = []
for b in buildings:
    c = b["_geom"].centroid
    if boundary.contains(c):
        b_pts.append((c.x, c.y))
print(f"buildings inside boundary: {len(b_pts)}")


# ---------- k-means (pure python) -> 10 neighborhood seeds ----------
K = 10
def kmeans(points, k, iters=40):
    cents = random.sample(points, k)
    for _ in range(iters):
        groups = [[] for _ in range(k)]
        for p in points:
            i = min(range(k), key=lambda j: (p[0]-cents[j][0])**2 + (p[1]-cents[j][1])**2)
            groups[i].append(p)
        new = []
        for i, g in enumerate(groups):
            if g:
                new.append((sum(p[0] for p in g)/len(g), sum(p[1] for p in g)/len(g)))
            else:
                new.append(cents[i])
        if new == cents:
            break
        cents = new
    return cents

seeds = kmeans(b_pts, K)

NB_NAMES = ["حي المركز", "الحي الشمالي", "الحي الجنوبي", "الحي الشرقي", "الحي الغربي",
            "حي الميناء", "حي الجامعة", "حي الحدائق", "حي الصناعة", "حي الضاحية"]

cells = voronoi_diagram(MultiPoint([Point(s) for s in seeds]), envelope=boundary.envelope)
neighborhoods = []
for cell in cells.geoms:
    clipped = cell.intersection(boundary)
    if clipped.is_empty:
        continue
    # match cell to its seed
    idx = min(range(K), key=lambda j: cell.distance(Point(seeds[j])))
    neighborhoods.append({"idx": idx, "geom": clipped})
neighborhoods.sort(key=lambda n: n["idx"])
nb_feats = []
for n in neighborhoods:
    i = n["idx"]
    nb_feats.append({
        "neighborhood_id": f"N-{i+1:02d}",
        "name": NB_NAMES[i],
        "area_km2": round(n["geom"].area * (111.32 * 111.32 * math.cos(math.radians(55.49))), 3),
        "geom": n["geom"],
    })
print(f"neighborhoods: {len(nb_feats)}")

nb_tree = STRtree([n["geom"] for n in nb_feats])
road_geoms = [r["_geom"] for r in roads]
road_tree = STRtree(road_geoms)


def locate(pt):
    """return (neighborhood_id, street_name) for a point"""
    cand = nb_tree.query(pt, predicate="intersects")
    nb = nb_feats[cand[0]]["neighborhood_id"] if len(cand) else None
    ri = road_tree.nearest(pt)
    return nb, roads[ri]["name"].strip()


# ---------- complaint model ----------
CATS = {
    "WTR": ("مياه", "قسم المياه", ["تسرب مياه", "انقطاع مياه", "ضعف ضخ", "كسر خط رئيسي", "عداد مياه تالف"]),
    "SEW": ("صرف صحي", "قسم الصرف الصحي", ["طفح صرف", "انسداد مجرى", "رائحة كريهة", "كسر منهول", "غطاء منهول مفقود"]),
    "RDS": ("طرق", "قسم الطرق والأشغال", ["حفرة في الشارع", "هبوط أرضي", "رصيف مكسور", "شارع ترابي", "مطب غير مرخص"]),
    "LGT": ("إنارة", "قسم الكهرباء والإنارة", ["عمود مطفأ", "سلك مكشوف", "عطل لوحة تحكم", "إنارة متذبذبة", "إنارة مضاءة نهاراً"]),
    "WST": ("نفايات", "قسم النظافة", ["تراكم نفايات", "حاوية ممتلئة", "مكب عشوائي", "حاوية تالفة", "مخلفات بناء"]),
    "ENV": ("صحة وبيئة", "قسم الصحة والبيئة", ["انتشار حشرات", "قوارض", "مياه راكدة", "حرق مخلفات", "تلوث هواء"]),
    "ENC": ("تعديات", "قسم الرقابة والتفتيش", ["بناء مخالف", "إغلاق شارع", "تعدي على رصيف", "إشغال ساحة عامة", "لوحة إعلانية مخالفة"]),
    "PRK": ("حدائق ومرافق", "قسم الحدائق والمرافق", ["تلف ألعاب", "مقاعد مكسورة", "نظافة حديقة", "أشجار متضررة", "سياج متضرر"]),
}
# relative weight per category per month-index (1..12) : seasonality
SEASON = {
    "WTR": [2, 2, 3, 4, 6, 8, 9, 8, 6, 4, 3, 2],     # summer peak
    "SEW": [7, 7, 6, 4, 3, 2, 2, 2, 4, 6, 8, 8],     # winter/rain peak
    "RDS": [8, 8, 7, 5, 4, 3, 3, 3, 4, 5, 7, 8],     # winter damage
    "LGT": [7, 6, 5, 4, 3, 2, 2, 3, 4, 6, 7, 8],     # dark months
    "WST": [6, 6, 6, 6, 7, 8, 9, 9, 7, 6, 6, 6],     # steady, summer bump
    "ENV": [2, 2, 3, 5, 7, 9, 9, 8, 6, 4, 2, 2],     # insects in summer
    "ENC": [4, 4, 5, 5, 5, 5, 4, 4, 5, 5, 4, 4],     # steady
    "PRK": [2, 2, 4, 6, 7, 8, 8, 7, 5, 3, 2, 2],     # park season
}
PRIORITIES = [("منخفضة", 14, 25), ("متوسطة", 7, 40), ("عالية", 3, 25), ("عاجلة", 1, 10)]
SOURCES = [("تطبيق", 35), ("واتساب", 25), ("اتصال", 22), ("مكتب", 12), ("موقع إلكتروني", 6)]
EMPLOYEES = [("EMP-01", "أحمد الخطيب"), ("EMP-02", "محمد سالم"), ("EMP-03", "خالد العمري"),
             ("EMP-04", "سارة يوسف"), ("EMP-05", "ليلى حسن"), ("EMP-06", "عمر نصار"),
             ("EMP-07", "نور الدين قاسم"), ("EMP-08", "هدى مراد"), ("EMP-09", "يوسف زيدان"),
             ("EMP-10", "رنا عابد")]
DESC = {
    "WTR": "يوجد {sub} في {street} منذ عدة أيام ويحتاج تدخل سريع",
    "SEW": "مشكلة {sub} أمام المنازل في {street} وتسبب إزعاجاً للسكان",
    "RDS": "{sub} في {street} يشكل خطراً على المركبات والمشاة",
    "LGT": "{sub} في {street} والمنطقة مظلمة ليلاً",
    "WST": "{sub} بالقرب من {street} ولم يتم رفعها",
    "ENV": "{sub} في محيط {street} ويؤثر على صحة السكان",
    "ENC": "{sub} ملاحظ في {street} ويعيق الحركة",
    "PRK": "{sub} في الحديقة القريبة من {street}",
}
RESOLUTIONS = ["تم إصلاح العطل بالكامل", "تمت معالجة المشكلة ورفع المخلفات", "تم إرسال فريق الصيانة وإغلاق البلاغ",
               "تمت المعالجة والتأكد ميدانياً", "تم الحل بالتنسيق مع القسم المختص", "أُنجزت أعمال الإصلاح وفق الجدول"]


def weighted(pairs):
    total = sum(w for _, w in pairs)
    r = random.uniform(0, total)
    acc = 0
    for v, w in pairs:
        acc += w
        if r <= acc:
            return v
    return pairs[-1][0]


# random point: 80% jittered building centroid, 20% point along a road
def random_point():
    for _ in range(50):
        if random.random() < 0.8:
            bx, by = random.choice(b_pts)
            pt = Point(bx + random.gauss(0, 0.0006), by + random.gauss(0, 0.0004))
        else:
            line = random.choice(road_geoms)
            pt = line.interpolate(random.random(), normalized=True)
            pt = Point(pt.x + random.gauss(0, 0.0002), pt.y + random.gauss(0, 0.00015))
        if boundary.contains(pt):
            return pt
    return Point(random.choice(b_pts))


# months: 2025-01 .. 2026-07
months = [(2025, m) for m in range(1, 13)] + [(2026, m) for m in range(1, 8)]
complaints = []
cid = 0
for (yr, mo) in months:
    # total complaints this month: base + noise, slight growth in 2026
    base = 44 if yr == 2025 else 52
    n_month = base + random.randint(-8, 10)
    weights = [(code, SEASON[code][mo - 1]) for code in CATS]
    last_day = (date(yr + (mo == 12), (mo % 12) + 1, 1) - timedelta(days=1)).day
    if (yr, mo) == (2026, 7):
        last_day = 3  # only up to today
        n_month = 7
    for _ in range(n_month):
        cid += 1
        code = weighted(weights)
        cat, dept, subs = CATS[code]
        sub = random.choice(subs)
        prio = weighted([(p, w) for p, _, w in PRIORITIES])
        target = {p: t for p, t, _ in PRIORITIES}[prio]
        rec = date(yr, mo, random.randint(1, last_day))
        age = (TODAY - rec).days

        # status: old complaints mostly closed, ~12% linger open
        close_p = min(0.88, 0.30 + age / 75.0)
        if random.random() < close_p and age > 0:
            status = "مغلقة"
            dur = max(1, int(random.gauss(target * 1.1, target * 0.7)))
            dur = min(dur, max(age, 1))
            closed = rec + timedelta(days=dur)
            days_to_close = dur
            note = random.choice(RESOLUTIONS)
        else:
            status = "جديدة" if age <= 7 and random.random() < 0.7 else "قيد المعالجة"
            closed, days_to_close, note = None, None, None

        pt = random_point()
        nb, street = locate(pt)
        if nb is None:
            continue
        emp = random.choice(EMPLOYEES)
        complaints.append({
            "complaint_id": f"C-{cid:04d}",
            "category_id": code,
            "category": cat,
            "sub_category": sub,
            "status": status,
            "priority": prio,
            "target_days": target,
            "received_date": rec.isoformat(),
            "closed_date": closed.isoformat() if closed else None,
            "days_to_close": days_to_close,
            "neighborhood_id": nb,
            "street_name": street,
            "assigned_dept": dept,
            "assigned_emp_id": emp[0],
            "assigned_emp": emp[1],
            "source": weighted(SOURCES),
            "description": DESC[code].format(sub=sub, street=street),
            "image_url": None,
            "resolution_note": note,
            "x_coord": round(pt.x, 6),
            "y_coord": round(pt.y, 6),
            "_geom": pt,
        })

print(f"complaints generated: {len(complaints)}")


# ---------- GeoJSON export ----------
def rnd(o, nd=6):
    if isinstance(o, float):
        return round(o, nd)
    if isinstance(o, (list, tuple)):
        return [rnd(v, nd) for v in o]
    return o


def to_fc(items, geom_key="_geom", props=None, nd=6):
    feats = []
    for it in items:
        g = mapping(it[geom_key])
        g["coordinates"] = rnd(g["coordinates"], nd)
        p = {k: v for k, v in it.items() if k != geom_key and not k.startswith("_")}
        if props:
            p = {k: p.get(k) for k in props}
        feats.append({"type": "Feature", "geometry": g, "properties": p})
    return {"type": "FeatureCollection",
            "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
            "features": feats}


def dump(name, fc):
    path = os.path.join(OUT, name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(fc, f, ensure_ascii=False, separators=(",", ":"))
    print(f"wrote {name}: {os.path.getsize(path)//1024} KB, {len(fc['features'])} features")


# complaints
dump("complaints.geojson", to_fc(complaints))

# neighborhoods (with complaint counts baked in for convenience)
nb_items = []
for n in nb_feats:
    nb_items.append({"neighborhood_id": n["neighborhood_id"], "name": n["name"],
                     "area_km2": n["area_km2"], "_geom": n["geom"].simplify(0.00005)})
dump("neighborhoods.geojson", to_fc(nb_items))

# municipality boundary
dump("municipality.geojson", to_fc([{"name": "Kolding Kommune", "name_ar": "بلدية كولدنغ",
                                     "_geom": boundary.simplify(0.00005)}]))

# roads (named drivable only)
rd_items = [{"name": r["name"].strip(), "fclass": r["fclass"],
             "_geom": r["_geom"].simplify(0.00002)} for r in roads]
dump("roads.geojson", to_fc(rd_items, nd=5))

# buildings (simplified)
bl_items = [{"osm_id": b["osm_id"], "_geom": b["_geom"].simplify(0.00002)}
            for b in buildings if boundary.intersects(b["_geom"])]
dump("buildings.geojson", to_fc(bl_items, nd=5))

# quick stats
from collections import Counter
print("\nby status:", Counter(c["status"] for c in complaints))
print("by category:", Counter(c["category"] for c in complaints))
print("by year:", Counter(c["received_date"][:4] for c in complaints))
