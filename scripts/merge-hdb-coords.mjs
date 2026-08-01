/**
 * 把 hdb-coords.json 注入 build 产物（幂等，可反复跑）
 *   1. data/hdb-index.json          —— 每栋加 coord 字段
 *   2. data/property-index.json     —— HDB 部分加 coord 字段
 *   3. data/hdb/*.json              —— 每栋详情加 coord 字段
 * 同时为 property-index.json 的 URA 项目计算 type（EC 判定）
 *
 * 用法: node scripts/merge-hdb-coords.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'data');

const coords = JSON.parse(readFileSync(join(DATA, 'hdb-coords.json'), 'utf-8'));
const hdbIdx = JSON.parse(readFileSync(join(DATA, 'hdb-index.json'), 'utf-8'));
const propIdx = JSON.parse(readFileSync(join(DATA, 'property-index.json'), 'utf-8'));

console.log(`coords: ${Object.keys(coords).length} | hdb-index: ${hdbIdx.length} | property-index: ${propIdx.length}`);

// ── EC 判定：propertyTypes 含 Executive Condominium ──
function ecType(p) {
  const pts = (p.propertyTypes || []).map(x => String(x).toLowerCase());
  return pts.includes('executive condominium') ? 'EC' : 'Private';
}

// 1. hdb-index.json
let n1 = 0;
for (const b of hdbIdx) {
  if (coords[b.id]) { b.coord = coords[b.id]; n1++; }
  else b.coord = null;
}
writeFileSync(join(DATA, 'hdb-index.json'), JSON.stringify(hdbIdx));
console.log(`hdb-index.json: ${n1}/${hdbIdx.length} with coord`);

// 2. property-index.json（HDB 部分注坐标；URA 部分算 EC type）
let n2h = 0, n2e = 0;
for (const p of propIdx) {
  if (p.type === 'HDB') {
    if (coords[p.id]) { p.coord = coords[p.id]; n2h++; }
    else p.coord = null;
  } else {
    const t = ecType(p);
    if (t === 'EC') n2e++;
    p.type = t;
  }
}
writeFileSync(join(DATA, 'property-index.json'), JSON.stringify(propIdx));
console.log(`property-index.json: ${n2h} HDB coords | ${n2e} projects marked EC`);

// 3. data/hdb/*.json
const HDB_DIR = join(DATA, 'hdb');
const files = readdirSync(HDB_DIR).filter(f => f.startsWith('hdb-') && f.endsWith('.json'));
let n3 = 0;
for (const f of files) {
  const id = f.replace(/\.json$/, '');
  const path = join(HDB_DIR, f);
  const d = JSON.parse(readFileSync(path, 'utf-8'));
  if (coords[id]) { d.coord = coords[id]; n3++; }
  else d.coord = null;
  writeFileSync(path, JSON.stringify(d));
}
console.log(`hdb/*.json: ${n3}/${files.length} with coord`);
console.log('\n✅ Merge complete');
