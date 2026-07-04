# -*- coding: utf-8 -*-
"""
Export all dashboard GeoJSON layers into a single OGC GeoPackage:
data/complaints.gpkg  (layers: complaints, neighborhoods, municipality, roads, buildings)

Pure python (sqlite3 + shapely) — no GDAL required.
"""
import sqlite3, json, os, struct
from shapely.geometry import shape
from shapely import wkb as shp_wkb
from shapely.geometry.base import BaseGeometry

DATA = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
OUT = os.path.join(DATA, "complaints.gpkg")

LAYERS = [
    # (table, geojson file, forced geometry type name)
    ("complaints",    "complaints.geojson",    "POINT"),
    ("neighborhoods", "neighborhoods.geojson", "MULTIPOLYGON"),
    ("municipality",  "municipality.geojson",  "MULTIPOLYGON"),
    ("roads",         "roads.geojson",         "MULTILINESTRING"),
    ("buildings",     "buildings.geojson",     "MULTIPOLYGON"),
]


def gpkg_blob(geom: BaseGeometry) -> bytes:
    """shapely geometry -> GeoPackage geometry blob (standard, little-endian, no envelope)."""
    header = b"GP" + bytes([0x00, 0x01]) + struct.pack("<i", 4326)
    return header + shp_wkb.dumps(geom)


def force_multi(geom, gtype):
    from shapely.geometry import MultiPolygon, MultiLineString, Polygon, LineString
    if gtype == "MULTIPOLYGON" and isinstance(geom, Polygon):
        return MultiPolygon([geom])
    if gtype == "MULTILINESTRING" and isinstance(geom, LineString):
        return MultiLineString([geom])
    return geom


def sql_type(values):
    """infer sqlite column type from sample python values."""
    for v in values:
        if v is None:
            continue
        if isinstance(v, bool):
            return "BOOLEAN"
        if isinstance(v, int):
            return "INTEGER"
        if isinstance(v, float):
            return "REAL"
        return "TEXT"
    return "TEXT"


if os.path.exists(OUT):
    os.remove(OUT)

db = sqlite3.connect(OUT)
cur = db.cursor()

# --- GeoPackage skeleton ---
cur.execute("PRAGMA application_id = 0x47504B47")   # 'GPKG'
cur.execute("PRAGMA user_version = 10300")          # GeoPackage 1.3

cur.execute("""CREATE TABLE gpkg_spatial_ref_sys (
  srs_name TEXT NOT NULL, srs_id INTEGER PRIMARY KEY,
  organization TEXT NOT NULL, organization_coordsys_id INTEGER NOT NULL,
  definition TEXT NOT NULL, description TEXT)""")
cur.executemany("INSERT INTO gpkg_spatial_ref_sys VALUES (?,?,?,?,?,?)", [
    ("Undefined Cartesian SRS", -1, "NONE", -1, "undefined", None),
    ("Undefined Geographic SRS", 0, "NONE", 0, "undefined", None),
    ("WGS 84 geodetic", 4326, "EPSG", 4326,
     'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,'
     'AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,'
     'AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,'
     'AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]',
     "longitude/latitude coordinates in decimal degrees on the WGS 84 spheroid"),
])

cur.execute("""CREATE TABLE gpkg_contents (
  table_name TEXT NOT NULL PRIMARY KEY, data_type TEXT NOT NULL,
  identifier TEXT UNIQUE, description TEXT DEFAULT '',
  last_change DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  min_x DOUBLE, min_y DOUBLE, max_x DOUBLE, max_y DOUBLE,
  srs_id INTEGER,
  CONSTRAINT fk_gc_r_srs_id FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys(srs_id))""")

cur.execute("""CREATE TABLE gpkg_geometry_columns (
  table_name TEXT NOT NULL, column_name TEXT NOT NULL,
  geometry_type_name TEXT NOT NULL, srs_id INTEGER NOT NULL,
  z TINYINT NOT NULL, m TINYINT NOT NULL,
  CONSTRAINT pk_geom_cols PRIMARY KEY (table_name, column_name),
  CONSTRAINT fk_gc_tn FOREIGN KEY (table_name) REFERENCES gpkg_contents(table_name),
  CONSTRAINT fk_gc_srs FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys(srs_id))""")

# --- write each layer ---
for table, fname, gtype in LAYERS:
    with open(os.path.join(DATA, fname), encoding="utf-8") as f:
        fc = json.load(f)
    feats = fc["features"]

    # collect attribute columns (ordered by first appearance)
    cols = []
    for ft in feats:
        for k in ft["properties"]:
            if k not in cols:
                cols.append(k)
    types = {c: sql_type([ft["properties"].get(c) for ft in feats[:200]]) for c in cols}

    col_defs = ", ".join(f'"{c}" {types[c]}' for c in cols)
    cur.execute(f'CREATE TABLE "{table}" ('
                f'fid INTEGER PRIMARY KEY AUTOINCREMENT, '
                f'geom GEOMETRY{", " + col_defs if cols else ""})')

    minx = miny = float("inf"); maxx = maxy = float("-inf")
    rows = []
    for ft in feats:
        geom = force_multi(shape(ft["geometry"]), gtype)
        b = geom.bounds
        minx, miny = min(minx, b[0]), min(miny, b[1])
        maxx, maxy = max(maxx, b[2]), max(maxy, b[3])
        rows.append([sqlite3.Binary(gpkg_blob(geom))] +
                    [ft["properties"].get(c) for c in cols])
    ph = ", ".join("?" * (1 + len(cols)))
    col_names = ", ".join(['geom'] + [f'"{c}"' for c in cols])
    cur.executemany(f'INSERT INTO "{table}" ({col_names}) VALUES ({ph})', rows)

    cur.execute("INSERT INTO gpkg_contents (table_name, data_type, identifier, "
                "min_x, min_y, max_x, max_y, srs_id) VALUES (?,?,?,?,?,?,?,?)",
                (table, "features", table, minx, miny, maxx, maxy, 4326))
    cur.execute("INSERT INTO gpkg_geometry_columns VALUES (?,?,?,?,?,?)",
                (table, "geom", gtype, 4326, 0, 0))
    print(f"layer '{table}': {len(rows)} features, {len(cols)} attribute columns")

db.commit()
db.close()
print(f"\nwrote {OUT} ({os.path.getsize(OUT)//1024} KB)")
