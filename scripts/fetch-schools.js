/**
 * Fetch school coordinates via Nominatim (OpenStreetMap)
 * - Pulls the MOE school directory from data.gov.sg (337 schools)
 * - Geocodes PRIMARY SCHOOLS only by name via Nominatim
 * - Caches results to data/schools.json (rerunnable, incremental)
 *
 * Usage: node fetch-schools.js
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'data');
const OUT = join(DATA, 'schools.json');

const SCHOOL_DS = 'ede26d32-01af-4228-b1ed-f05c45a1d8ee';
const UA = 'sg-property-dashboard/1.0 (personal research)';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchJson(url) {
  const resp = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!resp.ok) throw new Error(`${resp.status} ${url}`);
  return resp.json();
}

async function geocode(name, address) {
  // Try exact school name first, then school name + "singapore"
  for (const q of [name, `${name} Singapore`]) {
    try {
      const j = await fetchJson(
        `https://nominatim.openstreetmap.org/search?format=json&limit=2&q=${encodeURIComponent(q)}`
      );
      const hit = j.find(r => (r.type === 'school' || r.class === 'amenity') && r.lat && r.lon);
      if (hit) return { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon), match: q === name ? 'name' : 'name+SG' };
    } catch (e) { /* try next */ }
  }
  // Fallback: geocode by full address
  try {
    const j = await fetchJson(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address + ', Singapore')}`
    );
    if (j[0]?.lat && j[0]?.lon) return { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon), match: 'address' };
  } catch (e) { /* give up */ }
  return null;
}

async function main() {
  // 1. Load school directory
  const j = await fetchJson(`https://data.gov.sg/api/action/datastore_search?resource_id=${SCHOOL_DS}&limit=500`);
  const records = j.result?.records || [];
  console.log(`School directory: ${records.length} schools`);

  const primaries = records.filter(r =>
    (r.mainlevel_code || '').toUpperCase().includes('PRIMARY') ||
    /primary school/i.test(r.school_name || '')
  );
  console.log(`Primary schools: ${primaries.length}`);

  // 2. Load existing cache
  const existing = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf-8')) : [];
  const byName = new Map(existing.map(s => [s.name.toLowerCase(), s]));
  let done = existing.length, fail = 0;

  for (const r of primaries) {
    const name = r.school_name.trim();
    const key = name.toLowerCase();
    if (byName.has(key)) continue; // cached

    const address = `${r.address || ''}, ${r.postal_code || ''}`.replace(/\s+/g, ' ').trim();
    const hit = await geocode(name, address);
    if (hit) {
      byName.set(key, { name, address: (r.address || '').trim(), postal: r.postal_code, ...hit });
      done++;
      console.log(`  ✓ ${name} (${hit.match})`);
    } else {
      fail++;
      console.log(`  ✗ ${name} (no result)`);
    }
    await sleep(1100); // Nominatim: max 1 req/sec
  }

  const out = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  writeFileSync(OUT, JSON.stringify(out, null, 0));
  console.log(`\nSaved ${out.length} schools to data/schools.json (${fail} failed this run)`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
