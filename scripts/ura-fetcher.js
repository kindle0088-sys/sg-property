/**
 * URA API data fetcher module
 * Handles token acquisition and data fetching from URA Data Service
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { svy21ToWgs84, projectSlug } from './svy21.js';

// URA access key: read from environment variable or local gitignored file
// Never commit the key to the repository.
// Lazy-loaded: only read when URA API is actually called, so that
// --skip-ura builds (HDB refresh on CI) can import this module without a key.
const __dirname = dirname(fileURLToPath(import.meta.url));

// Manual coordinate overrides for projects where the URA API returns x/y = 0
// (common for new launches). Keyed by project slug; values are {lat, lng}.
const COORD_OVERRIDES_FILE = join(__dirname, '..', 'data', 'coord-overrides.json');
let COORD_OVERRIDES = {};
try { COORD_OVERRIDES = JSON.parse(readFileSync(COORD_OVERRIDES_FILE, 'utf-8')); } catch (e) { /* no overrides */ }
function loadAccessKey() {
  if (process.env.URA_ACCESS_KEY) return process.env.URA_ACCESS_KEY;
  const keyFile = join(__dirname, '.ura-key');
  if (existsSync(keyFile)) return readFileSync(keyFile, 'utf-8').trim();
  throw new Error('URA_ACCESS_KEY not set. Create scripts/.ura-key or set the URA_ACCESS_KEY env var.');
}
const TOKEN_URL = 'https://eservice.ura.gov.sg/uraDataService/insertNewToken/v1';
const API_BASE = 'https://eservice.ura.gov.sg/uraDataService/invokeUraDS/v1';

let _token = null;

const sleep = ms => new Promise(r => setTimeout(r, ms));

// URA gateway is flaky from overseas (504 timeouts). Retry with backoff.
// 4xx (except 429) are permanent — fail fast; 5xx/429/network errors — retry.
async function fetchWithRetry(url, opts, { retries = 4, baseDelay = 3000, label = 'URA' } = {}) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      const resp = await fetch(url, opts);
      if (resp.ok) return resp;
      if (resp.status >= 400 && resp.status < 500 && resp.status !== 429) {
        // permanent error — mark and rethrow through catch below
        const err = new Error(`${label} failed: ${resp.status}`);
        err.permanent = true;
        throw err;
      }
      lastErr = new Error(`${label} failed: ${resp.status}`);
      console.log(`  ⚠ ${label} ${resp.status} (attempt ${i + 1}/${retries}), retrying in ${baseDelay / 1000}s...`);
    } catch (e) {
      if (e.permanent) throw e;
      lastErr = e;
      console.log(`  ⚠ ${label} network error (attempt ${i + 1}/${retries}), retrying in ${baseDelay / 1000}s...`);
    }
    await sleep(baseDelay * Math.pow(2, i));
  }
  throw lastErr;
}

export async function getToken() {
  const resp = await fetchWithRetry(TOKEN_URL, {
    method: 'GET',
    headers: { 'AccessKey': loadAccessKey() }
  }, { label: 'URA token' });
  const data = await resp.json();
  if (data.Result) { _token = data.Result; return data.Result; }
  throw new Error(`URA token error: ${JSON.stringify(data)}`);
}

function headers() {
  if (!_token) throw new Error('Token not available. Call getToken() first.');
  return { 'AccessKey': loadAccessKey(), 'Token': _token };
}

async function fetchService(service, params = {}) {
  const qs = new URLSearchParams({ service, ...params }).toString();
  const url = `${API_BASE}?${qs}`;
  const resp = await fetchWithRetry(url, { method: 'GET', headers: headers() }, { label: `URA ${service}` });
  const data = await resp.json();
  return data.Result || [];
}

export async function fetchTransactions(batch = 1) {
  return fetchService('PMI_Resi_Transaction', { batch: String(batch) });
}

export async function fetchAllTransactions() {
  const all = [];
  for (let b = 1; b <= 4; b++) {
    console.log(`  Fetching batch ${b}/4...`);
    const data = await fetchTransactions(b);
    all.push(...data);
    const txCount = data.reduce((s, p) => s + (p.transaction?.length || 0), 0);
    console.log(`  Batch ${b}: ${data.length} projects, ${txCount} transactions`);
  }
  return all;
}

export async function fetchRentals(refPeriod) {
  return fetchService('PMI_Resi_Rental', { refPeriod });
}

export async function fetchDeveloperSales(refPeriod) {
  return fetchService('PMI_Resi_Developer_Sales', refPeriod ? { refPeriod } : {});
}

export { projectSlug };

function extractDistrict(district) {
  if (!district) return null;
  const d = parseInt(district, 10);
  return isNaN(d) ? null : d;
}

export function parseTenure(tenure) {
  if (!tenure) return { type: 'unknown', years: null, from: null };
  const lower = tenure.toLowerCase();
  if (lower.includes('freehold')) return { type: 'Freehold', years: null, from: null };
  const m = tenure.match(/(\d+)\s*years?\s*lease\s*commencing\s*from\s*(\d{4})/i);
  if (m) return { type: 'Leasehold', years: parseInt(m[1]), from: parseInt(m[2]) };
  const m2 = tenure.match(/(\d+)/);
  if (m2) return { type: 'Leasehold', years: parseInt(m2[1]), from: null };
  return { type: tenure, years: null, from: null };
}

export function processTransactions(rawData) {
  const map = new Map();

  for (const entry of rawData) {
    const name = (entry.project || '').trim();
    if (!name || !entry.transaction?.length) continue;

    const slug = projectSlug(name);
    if (!map.has(slug)) {
      map.set(slug, {
        id: slug, name, street: (entry.street || '').trim(),
        marketSegment: entry.marketSegment || '',
        x: entry.x, y: entry.y, coord: null, transactions: []
      });
    }

    const proj = map.get(slug);
    if (!proj.coord && proj.x != null && proj.y != null && proj.x > 0 && proj.y > 0) {
      try { proj.coord = svy21ToWgs84(proj.x, proj.y); } catch (e) { /* skip */ }
    }
    // Fallback: URA sometimes returns x/y = 0 for new launches → use manual override
    if (!proj.coord && COORD_OVERRIDES[slug]) {
      proj.coord = COORD_OVERRIDES[slug];
    }

    for (const t of entry.transaction) {
      if (!t.price || !t.area) continue;
      const areaSqf = t.area * 10.7639;
      proj.transactions.push({
        propertyType: t.propertyType || '',
        district: extractDistrict(t.district),
        tenure: parseTenure(t.tenure),
        typeOfSale: t.typeOfSale || 0,
        price: t.price,
        nettPrice: t.nettPrice || t.price,
        area: parseFloat(t.area),
        areaSqf,
        pricePsf: Math.round(t.price / areaSqf),
        floorRange: t.floorRange || '',
        contractDate: t.contractDate || '',
        noOfUnits: t.noOfUnits || 1
      });
    }
  }

  const result = [];
  for (const p of map.values()) {
    const tx = p.transactions;
    if (!tx.length) continue;
    const psfArr = tx.map(t => t.pricePsf).filter(Boolean);
    // Fix: mmyy format (e.g. "0126" = Jan 2026). Extract actual 4-digit year.
    const years = [...new Set(tx.map(t => {
      if (!t.contractDate || t.contractDate.length < 4) return null;
      const yy = t.contractDate.substring(2, 4);
      return yy ? `20${yy}` : null;
    }).filter(Boolean))].sort();
    const districts = [...new Set(tx.map(t => t.district).filter(d => d != null))].sort();

    // Fix sort: convert "mmyy" → "20yy-mm" for correct cross-year ordering
    function sortKey(d) {
      if (!d || d.length < 4) return '';
      return `20${d.substring(2,4)}-${d.substring(0,2)}`;
    }
    tx.sort((a, b) => sortKey(b.contractDate).localeCompare(sortKey(a.contractDate)));

    // Use sortKey for date range too
    const sortedDates = tx.map(t => t.contractDate).filter(Boolean).sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

    result.push({
      ...p,
      transactions: tx,
      stats: {
        totalTransactions: tx.length,
        minPrice: Math.min(...tx.map(t => t.price)),
        maxPrice: Math.max(...tx.map(t => t.price)),
        minPsf: psfArr.length ? Math.min(...psfArr) : 0,
        maxPsf: psfArr.length ? Math.max(...psfArr) : 0,
        avgPsf: psfArr.length ? Math.round(psfArr.reduce((a, b) => a + b, 0) / psfArr.length) : 0,
        years, districts,
        propertyTypes: [...new Set(tx.map(t => t.propertyType).filter(Boolean))],
        tenureTypes: [...new Set(tx.map(t => t.tenure.type).filter(Boolean))],
        dateRange: {
          min: sortedDates.length ? sortedDates[0] : null,
          max: sortedDates.length ? sortedDates[sortedDates.length - 1] : null
        }
      }
    });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

export function processRentals(rawData) {
  const result = [];
  for (const entry of rawData) {
    if (!entry.rental) continue;
    for (const r of entry.rental) {
      const d = extractDistrict(r.district);
      if (d == null || !r.rent) continue;
      result.push({
        district: d,
        propertyType: r.propertyType || '',
        bedrooms: r.noOfBedRoom || 'NA',
        rent: r.rent || 0,
        areaSqf: r.areaSqft || '',
        areaSqm: r.areaSqm || '',
        leaseDate: r.leaseDate || ''
      });
    }
  }
  return result;
}
