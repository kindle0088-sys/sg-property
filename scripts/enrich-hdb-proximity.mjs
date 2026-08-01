/**
 * 为 HDB 楼栋注入 proximity（最近地铁/1km 学校）+ demolished 标注（幂等）
 *
 * - 有坐标的 HDB：计算 nearestMrt / schools1km（与 URA 项目同构）
 * - 无坐标的 HDB：不在 HDB 现行建筑数据库中 → 大概率已拆除/重建，�� demolished: true
 *
 * 写入: hdb-index.json / data/hdb/*.json / property-index.json (HDB 部分)
 * 用法: node scripts/enrich-hdb-proximity.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'data');

// Haversine 距离（米）——与 build.js 保持一致
function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function enrichProximity(coord, mrt, schools) {
  if (!coord || !coord.lat || !coord.lng) return null;
  let nearest = null, nearestDist = Infinity;
  for (const s of mrt) {
    const d = haversineM(coord.lat, coord.lng, s.lat, s.lng);
    if (d < nearestDist) { nearestDist = d; nearest = s; }
  }
  const schools1km = schools
    .filter(s => haversineM(coord.lat, coord.lng, s.lat, s.lng) <= 1000)
    .map(s => s.name)
    .slice(0, 5);
  return {
    nearestMrt: nearest ? nearest.name : null,
    nearestMrtDistM: nearest ? Math.round(nearestDist) : null,
    schools1km,
    schoolCount1km: schools.filter(s => haversineM(coord.lat, coord.lng, s.lat, s.lng) <= 1000).length
  };
}

const mrt = JSON.parse(readFileSync(join(DATA, 'mrt-stations.json'), 'utf-8'));
const schools = JSON.parse(readFileSync(join(DATA, 'schools.json'), 'utf-8'));
const hdbIdx = JSON.parse(readFileSync(join(DATA, 'hdb-index.json'), 'utf-8'));
const propIdx = JSON.parse(readFileSync(join(DATA, 'property-index.json'), 'utf-8'));

console.log(`MRT: ${mrt.length} | schools: ${schools.length} | hdb-index: ${hdbIdx.length}`);

// 1. 计算 + 标注 hdb-index
let withCoord = 0, demolished = 0;
for (const b of hdbIdx) {
  if (b.coord && b.coord.lat) {
    b.proximity = enrichProximity(b.coord, mrt, schools);
    b.demolished = false;
    withCoord++;
  } else {
    b.coord = null;
    b.proximity = null;
    b.demolished = true;
    demolished++;
  }
}
writeFileSync(join(DATA, 'hdb-index.json'), JSON.stringify(hdbIdx));
console.log(`hdb-index.json: ${withCoord} with proximity | ${demolished} marked demolished`);

// 2. 注入 per-block 详情
const HDB_DIR = join(DATA, 'hdb');
const files = readdirSync(HDB_DIR).filter(f => f.startsWith('hdb-') && f.endsWith('.json'));
const byId = new Map(hdbIdx.map(b => [b.id, b]));
let n = 0;
process.stdout.write('  per-block: ');
for (const f of files) {
  const id = f.replace(/\.json$/, '');
  const b = byId.get(id);
  if (!b) continue;
  const path = join(HDB_DIR, f);
  const d = JSON.parse(readFileSync(path, 'utf-8'));
  d.proximity = b.proximity || null;
  d.demolished = b.demolished || false;
  if (b.coord) d.coord = b.coord;
  writeFileSync(path, JSON.stringify(d));
  n++;
  if (n % 2000 === 0) { process.stdout.write(n + ' '); }
}
process.stdout.write('done\n');
console.log(`hdb/*.json: ${n} files updated`);

// 3. 注入 property-index.json（HDB 部分）
let n3 = 0;
for (const p of propIdx) {
  if (p.type !== 'HDB') continue;
  const b = byId.get(p.id);
  if (!b) continue;
  if (b.coord) p.coord = b.coord;
  p.proximity = b.proximity || null;
  p.demolished = b.demolished || false;
  n3++;
}
writeFileSync(join(DATA, 'property-index.json'), JSON.stringify(propIdx));
console.log(`property-index.json: ${n3} HDB entries updated`);
console.log('\n✅ Enrichment complete');
