/**
 * 修复 schools.json 中的伦敦脏坐标 —— 逐个 Nominatim 重查
 * 用法: node scripts/fix-schools.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'data');
const UA = 'sg-property-dashboard/1.0 (personal research)';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const arr = JSON.parse(readFileSync(join(DATA, 'schools.json'), 'utf-8'));
const bad = arr.filter(s => s.match === 'fixed-manual');
console.log('schools with wrong fixed-manual coords:', bad.length);

async function query(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    const j = await r.json();
    return j[0] || null;
  } catch (e) { return null; }
}

let fixed = 0, stillBad = 0;
for (const s of bad) {
  const q = `${s.name}, ${s.address || ''}, Singapore`;
  const hit = await query(q);
  if (hit && Number(hit.lat) > 1 && Number(hit.lat) < 2 && Number(hit.lon) > 103 && Number(hit.lon) < 105) {
    s.lat = parseFloat(hit.lat);
    s.lng = parseFloat(hit.lon);
    s.match = 'nominatim-fixed';
    fixed++;
    console.log(`  ✓ ${s.name} -> (${s.lat}, ${s.lng})`);
  } else {
    stillBad++;
    console.log(`  ✗ ${s.name}: no good hit`);
  }
  await sleep(1100);
}
writeFileSync(join(DATA, 'schools.json'), JSON.stringify(arr));
console.log(`\n✅ Fixed ${fixed}, still bad ${stillBad}`);