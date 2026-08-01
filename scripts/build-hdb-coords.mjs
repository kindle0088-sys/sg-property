/**
 * 构建 HDB 楼栋坐标映射（一次性 / CI 友好）
 *
 * 数据源:
 *   1. data/hdb_existing_building.geojson  —— HDB 官方楼栋足迹（缺失时自动下载）
 *   2. data/lta_road_name_code.json         —— LTA 街道名/代码映射（缺失时从 LTA xlsx 生成）
 *   3. data/hdb-index.json                  —— HDB 楼栋索引
 *
 * 流程:
 *   GeoJSON (BLK_NO, ST_COD) → LTA 换街道名 → (block, street 归一化) → 中心点坐标
 *   → 与 data/hdb-index.json 的 (block, street) join → data/hdb-coords.json
 *
 * 用法: node scripts/build-hdb-coords.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'data');
const GEO_PATH = join(DATA, 'hdb_existing_building.geojson');
const LTA_JSON = join(DATA, 'lta_road_name_code.json');
const UA = 'sg-property-dashboard/1.0 (personal research)';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── 街道名归一化（resale 缩写 → 全名展开，两边统一） ──
const ABBREV = {
  AVE: 'AVENUE', AV: 'AVENUE', RD: 'ROAD', ST: 'STREET', DR: 'DRIVE', CRES: 'CRESCENT',
  GDNS: 'GARDENS', JLN: 'JALAN', CL: 'CLOSE', CIR: 'CIRCUS', TCK: 'TERRACE',
  PK: 'PARK', LOR: 'LORONG', STH: 'SOUTH', NTH: 'NORTH', WST: 'WEST', EST: 'EAST',
  UPP: 'UPPER', RING: 'RING', BLDG: 'BUILDING', PL: 'PLACE', WALK: 'WALK',
  CTR: 'CENTRE', AFT: 'AFTER', BEF: 'BEFORE', BT: 'BUKIT', TG: 'TANJONG',
  NBR: 'NEIGHBOURHOOD', BVD: 'BOULEVARD', WAY: 'WAY', RISE: 'RISE', VIEW: 'VIEW',
  FIELD: 'FIELD', PLAINS: 'PLAINS', GREEN: 'GREEN', PARK: 'PARK', GDN: 'GARDEN'
};
export function normalizeStreet(s) {
  return String(s || '').toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(w => (w in ABBREV ? ABBREV[w] : w))
    .filter(Boolean)
    .join(' ');
}

// ── 多边形取中心点（顶点平均，足够准） ──
function polygonCenter(geom) {
  if (!geom) return null;
  if (geom.type === 'Point') return { lng: geom.coordinates[0], lat: geom.coordinates[1] };
  const rings = geom.type === 'Polygon' ? geom.coordinates : (geom.type === 'MultiPolygon' ? geom.coordinates.flat() : null);
  if (!rings) return null;
  const ring = rings[0];
  let sumLng = 0, sumLat = 0, n = 0;
  for (const [lng, lat] of ring) { sumLng += lng; sumLat += lat; n++; }
  if (!n) return null;
  return { lng: +(sumLng / n).toFixed(6), lat: +(sumLat / n).toFixed(6) };
}

// ── 自动下载 HDB Existing Building GeoJSON（如果缺失） ──
async function ensureGeoJson() {
  if (existsSync(GEO_PATH)) return readFileSync(GEO_PATH);
  console.log('GeoJSON missing — downloading from data.gov.sg...');
  const RID = 'd_16b157c52ed637edd6ba1232e026258d';
  const pollUrl = `https://api-open.data.gov.sg/v1/public/api/datasets/${RID}/poll-download`;
  const r = await fetch(pollUrl, { headers: { 'User-Agent': UA } });
  const j = await r.json();
  if (j.code !== 0) throw new Error(`poll-download failed: ${JSON.stringify(j)}`);
  const dl = await fetch(j.data.url);
  const buf = Buffer.from(await dl.arrayBuffer());
  writeFileSync(GEO_PATH, buf);
  console.log(`  saved ${buf.length} bytes -> ${GEO_PATH}`);
  return buf;
}

// ── 自动从 LTA xlsx 生成街道名映射（如果 lta_road_name_code.json 缺失） ──
async function ensureLtaMap() {
  if (existsSync(LTA_JSON)) return JSON.parse(readFileSync(LTA_JSON, 'utf-8'));
  console.log('LTA map missing — downloading xlsx from data.gov.sg / LTA...');
  const xlsxUrl = 'https://www.lta.gov.sg/content/dam/ltagov/industry_innovations/industry_matters/development_construction_resources/Street_Work_Proposals/Standards_and_Specifications/GIS_Data_Hub/road_name_road_code_jan2024.xlsx';
  const xlsxPath = join(DATA, '_lta_road.xlsx');
  const r = await fetch(xlsxUrl, { headers: { 'User-Agent': UA } });
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(xlsxPath, buf);
  console.log(`  saved ${buf.length} bytes (xlsx); parsing with python openpyxl...`);
  const { execSync } = await import('child_process');
  // 用项目里的 python venv 解析
  const py = 'C:/Users/jiali/.workbuddy/binaries/python/envs/default/Scripts/python.exe';
  execSync(`"${py}" -c "import openpyxl, json, re; wb=openpyxl.load_workbook('${xlsxPath}', read_only=True); ws=wb['GISDomain']; road={}; \\nfor r in ws.iter_rows(values_only=True):\\n    vals=[str(x).strip() if x else '' for x in r]\\n    for i,v in enumerate(vals):\\n        if re.fullmatch(r'[A-Z]{3}\\d{2}[A-Z]', v):\\n            nm=next((x for x in vals[i+1:] if x), None)\\n            if nm: road.setdefault(v, nm)\\njson.dump(road, open('${LTA_JSON}','w'))"`, { stdio: 'inherit', shell: true });
  return JSON.parse(readFileSync(LTA_JSON, 'utf-8'));
}

// ── 主流程 ──
const geoBuf = await ensureGeoJson();
const geo = JSON.parse(geoBuf.toString('utf-8'));
const roadMap = await ensureLtaMap();
const hdbIdx = JSON.parse(readFileSync(join(DATA, 'hdb-index.json'), 'utf-8'));

console.log(`GeoJSON features: ${geo.features.length} | road codes: ${Object.keys(roadMap).length} | hdb blocks: ${hdbIdx.length}`);

// 1. 从 GeoJSON 建查���表: (BLK_NO, ST_COD → 街道名) → coord
const byKey = new Map();
let withCoord = 0, withStreet = 0;
for (const f of geo.features) {
  const p = f.properties || {};
  const blk = String(p.BLK_NO || '').toUpperCase().trim();
  const stCod = String(p.ST_COD || '').toUpperCase().trim();
  const street = roadMap[stCod] || null;
  const coord = polygonCenter(f.geometry);
  if (!blk || !coord) continue;
  withCoord++;
  if (street) {
    withStreet++;
    const key = `${blk}|${normalizeStreet(street)}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(coord);
  }
}
console.log(`GeoJSON with coord: ${withCoord}, with street name: ${withStreet}`);

// 2. 匹配 hdb-index
const out = {};
let matched = 0;
const miss = [];
for (const b of hdbIdx) {
  const blk = String(b.block || '').toUpperCase().trim();
  const key = `${blk}|${normalizeStreet(b.street)}`;
  const hits = byKey.get(key);
  if (hits && hits.length) {
    const c = hits.reduce((a, c) => ({ lat: a.lat + c.lat, lng: a.lng + c.lng }), { lat: 0, lng: 0 });
    out[b.id] = { lat: +(c.lat / hits.length).toFixed(6), lng: +(c.lng / hits.length).toFixed(6) };
    matched++;
  } else {
    miss.push({ id: b.id, town: b.town, block: b.block, street: b.street });
  }
}

writeFileSync(join(DATA, 'hdb-coords.json'), JSON.stringify(out));
writeFileSync(join(DATA, 'hdb-geocode-miss.json'), JSON.stringify(miss, null, 0));
console.log(`\n✅ Matched ${matched}/${hdbIdx.length} blocks (${(matched / hdbIdx.length * 100).toFixed(1)}%)`);
console.log(`   Miss ${miss.length} → data/hdb-geocode-miss.json`);
if (miss.length) {
  console.log('\nMiss samples:');
  miss.slice(0, 10).forEach(m => console.log(`  ${m.id} | ${m.block} ${m.street} (${m.town})`));
}
