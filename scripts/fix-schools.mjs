/**
 * 修复 schools.json 中的非新加坡脏坐标 —— 逐个 Nominatim 按地址重查
 * 检测: 坐标不在新加坡范围 (lat 1-2, lng 103-105) 即视为脏数据
 * 用法: node scripts/fix-schools.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'data');
const UA = 'sg-property-dashboard/1.0 (personal research)';
const sleep = ms => new Promise(r => setTimeout(r, ms));

function inSG(lat, lng) {
  const la = Number(lat), ln = Number(lng);
  return la > 1 && la < 2 && ln > 103 && ln < 105;
}

const arr = JSON.parse(readFileSync(join(DATA, 'schools.json'), 'utf-8'));
const bad = arr.filter(s => !inSG(s.lat, s.lng));
console.log('schools with non-SG coords:', bad.length);

async function query(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    const j = await r.json();
    return j[0] || null;
  } catch (e) { return null; }
}

let fixed = 0;
for (const s of bad) {
  // 优先按地址（地址查不到再退回 name+Singapore）
  const queries = [
    s.address ? `${s.address}, Singapore` : null,
    `${s.name}, Singapore`
  ].filter(Boolean);
  let hit = null, used = '';
  for (const q of queries) {
    const h = await query(q);
    if (h && inSG(h.lat, h.lon)) { hit = h; used = q; break; }
    await sleep(1100);
  }
  if (hit) {
    s.lat = parseFloat(hit.lat);
    s.lng = parseFloat(hit.lon);
    s.match = 'address-nominatim';
    fixed++;
    console.log(`  ✓ ${s.name} (${used}) -> (${s.lat}, ${s.lng})`);
  } else {
    console.log(`  ✗ ${s.name}: no SG hit`);
  }
  await sleep(1100);
}
writeFileSync(join(DATA, 'schools.json'), JSON.stringify(arr));
console.log(`\n✅ Fixed ${fixed}, remaining bad ${arr.filter(s => !inSG(s.lat, s.lng)).length}`);