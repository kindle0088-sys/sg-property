/**
 * Nominatim 实测探针 —— HDB block 地址匹配率（OneMap 已 token 化的替代验证）
 * 从 hdb-index.json 按 town 抽样 10 栋，测原样/缩写展开两种变体
 * 用法: node hdb-geocode-probe.mjs
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const hdbIdx = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'hdb-index.json'), 'utf-8'));

// ── 新加坡街道缩写展开（Nominatim/OSM 存全名） ──
const ABBREV = {
  AVE: 'AVENUE', RD: 'ROAD', ST: 'STREET', DR: 'DRIVE', CRES: 'CRESCENT',
  GDNS: 'GARDENS', JLN: 'JALAN', CL: 'CLOSE', CIR: 'CIRCUS', TCK: 'TERRACE',
  PK: 'PARK', LOR: 'LORONG', STH: 'SOUTH', NTH: 'NORTH', WST: 'WEST', EST: 'EAST',
  UPP: 'UPPER', RING: 'RING', BLDG: 'BUILDING', PL: 'PLACE', WALK: 'WALK',
  CTR: 'CENTRE', AFT: 'AFTER', BEF: 'BEFORE', BT: 'BUKIT', TG: 'TANJONG', PAYA: 'PAYA'
};
function expandStreet(s) {
  return String(s || '').toUpperCase()
    .split(/\s+/)
    .map(w => (w in ABBREV ? ABBREV[w] : w))
    .join(' ');
}

// ── 按 town 均匀抽样 10 栋 ──
const byTown = {};
for (const b of hdbIdx) {
  if (!byTown[b.town]) byTown[b.town] = [];
  byTown[b.town].push(b);
}
const towns = Object.keys(byTown);
const picked = [];
const pickedTowns = new Set();
const step = Math.max(1, Math.floor(towns.length / 10));
for (let i = 0; i < towns.length && picked.length < 10; i += step) {
  pickedTowns.add(towns[i]);
  picked.push(byTown[towns[i]][0]);
}
console.log(`hdb-index: ${hdbIdx.length} blocks / ${towns.length} towns`);
console.log('Picked towns:', [...pickedTowns].join(', '));

const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'sg-property-dashboard/1.0 (personal research)';

async function search(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=3&q=${encodeURIComponent(q)}`;
  const t0 = Date.now();
  try {
    const resp = await fetch(url, { headers: { 'User-Agent': UA } });
    const ms = Date.now() - t0;
    if (!resp.ok) return { status: resp.status, ms, hits: [] };
    const hits = await resp.json();
    return { status: resp.status, ms, hits };
  } catch (e) {
    return { status: 'ERR', ms: Date.now() - t0, err: e.message };
  }
}

function pickHit(hits) {
  const inSG = hits.filter(h => {
    const lat = parseFloat(h.lat), lon = parseFloat(h.lon);
    return lat > 1.1 && lat < 1.5 && lon > 103.5 && lon < 104.2;
  });
  return inSG[0] || null;
}

let match = 0;
for (const b of picked) {
  const raw = `${b.block} ${b.street}`;
  const full = `${b.block} ${expandStreet(b.street)}`;
  const variants = [
    { label: 'raw+SG', q: `${raw}, Singapore` },
    { label: 'full+SG', q: `${full}, Singapore` },
    { label: 'full only', q: full }
  ];
  const results = [];
  let ok = false;
  for (const v of variants) {
    const r = await search(v.q);
    const hit = pickHit(r.hits);
    results.push({ label: v.label, status: r.status, n: r.hits.length, hit, ms: r.ms });
    if (hit) { ok = true; break; }
    await sleep(1100);
  }
  if (ok) match++;
  console.log(`\n[${b.town}] "${raw}"`);
  for (const r of results) {
    console.log(`  ${r.label.padEnd(10)} status=${r.status} hits=${r.n} ${r.ms}ms` +
      (r.hit ? ` | MATCH: ${r.hit.display_name}` : ' | -'));
  }
  await sleep(1100);
}

console.log(`\n===== NOMINATIM PROBE: ${match}/${picked.length} matched =====`);
