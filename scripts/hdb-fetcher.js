/**
 * HDB Resale Data Fetcher
 * Downloads and processes HDB resale flat prices from data.gov.sg
 * Covers 1990 - present via API pagination
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Allow overriding cache location (used by tests; CI could point elsewhere too)
const CACHE_DIR = process.env.HDB_CACHE_DIR || join(__dirname, '..', 'data', 'hdb_cache');

const DATASETS = [
  {
    id: 'd_ebc5ab87086db484f88045b47411ebc5',
    name: '1990-1999', isActive: false,
    hasRemainingLease: false
  },
  {
    id: 'd_43f493c6c50d54243cc1eab0df142d6a',
    name: '2000-Feb2012', isActive: false,
    hasRemainingLease: false
  },
  {
    id: 'd_2d5ff9ea31397b66239f245f57751537',
    name: 'Mar2012-Dec2014', isActive: false,
    hasRemainingLease: false
  },
  {
    id: 'd_ea9ed51da2787afaf8e51f827c304208',
    name: '2015-2016', isActive: false,
    hasRemainingLease: true
  },
  {
    id: 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc',
    name: '2017-2026', isActive: true,
    hasRemainingLease: true
  }
];

const API_BASE = 'https://data.gov.sg/api/action/datastore_search';
const FETCH_TIMEOUT_MS = 30_000;

function ensureDir(p) { if (!existsSync(p)) mkdirSync(p, { recursive: true }); }

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse: ' + e.message)); }
      });
    });
    // 防止网络挂起卡死构建（本地计划任务没有 CI 的 timeout 兜底）
    req.setTimeout(FETCH_TIMEOUT_MS, () => {
      req.destroy(new Error(`Timeout after ${FETCH_TIMEOUT_MS / 1000}s: ${url}`));
    });
    req.on('error', reject);
  });
}

async function fetchPaginated(dataset, maxPages = 80) {
  const allRecords = [];
  const LIMIT = 5000; // Keep small to avoid memory/stack issues
  let offset = 0;
  let page = 0;

  while (page < maxPages) {
    const url = `${API_BASE}?resource_id=${dataset.id}&limit=${LIMIT}&offset=${offset}`;
    let resp;
    try { resp = await fetchJson(url); } catch (e) {
      console.log(`    Error at offset ${offset}: ${e.message}`);
      break;
    }
    if (!resp?.success || !resp?.result?.records?.length) break;
    
    const records = resp.result.records;
    const total = resp.result.total || 0;
    
    allRecords.push(...records);
    offset += records.length;
    page++;

    if (page % 10 === 0) {
      console.log(`    Page ${page}: ${allRecords.length.toLocaleString()} / ${total.toLocaleString()}`);
    }
    if (offset >= total) break;
  }
  return allRecords;
}

function parseRemainingLease(text) {
  if (!text || text === '-' || text.toLowerCase() === 'na' || text.toLowerCase() === 'nil') return null;
  const m = text.match(/(\d+)\s*years?/);
  return m ? parseInt(m[1]) : null;
}

export function normalizeRow(row, hasRemainingLease) {
  const price = parseFloat(row.resale_price);
  if (!price || isNaN(price)) return null;

  const floorAreaSqm = parseFloat(row.floor_area_sqm || row.floor_area || 0);
  const floorAreaSqf = floorAreaSqm * 10.7639;
  if (floorAreaSqf <= 0) return null;

  const leaseCommence = parseInt(row.lease_commence_date || row.lease_commencement_date || 0);
  const remainingYears = hasRemainingLease
    ? parseRemainingLease(row.remaining_lease)
    : (leaseCommence ? Math.max(0, 99 - (parseInt(row.month?.substring(0, 4) || new Date().getFullYear()) - leaseCommence)) : null);

  return {
    _id: row._id, // keep upstream row id — incremental anchor for active dataset
    month: row.month || '',
    town: (row.town || '').toUpperCase().trim(),
    flatType: (row.flat_type || '').toUpperCase().trim(),
    block: (row.block || '').trim(),
    streetName: (row.street_name || '').toUpperCase().trim(),
    storeyRange: (row.storey_range || row.storeyrange || '').trim(),
    floorAreaSqm,
    floorAreaSqf: Math.round(floorAreaSqf),
    flatModel: (row.flat_model || '').trim(),
    leaseCommenceDate: leaseCommence,
    remainingLease: remainingYears,
    resalePrice: price,
    pricePsf: Math.round(price / floorAreaSqf)
  };
}

function pushBatch(target, source, batchSize = 50000) {
  for (let i = 0; i < source.length; i += batchSize) {
    Array.prototype.push.apply(target, source.slice(i, i + batchSize));
  }
}

function blockId(town, block, street) {
  // Include street to avoid merging different blocks with same number on different streets
  const streetPart = (street || '').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return `hdb-${town.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${block}-${streetPart || 'ns'}`;
}

// Incremental fetch for an active dataset: pull only rows with _id > cached maxId.
// data.gov.sg appends new rows at the tail with monotonically increasing _id.
// Returns null when the cache predates _id tracking (legacy format) — caller
// should then fall back to a full re-fetch to bootstrap the anchor.
async function fetchActiveIncremental(ds, cached) {
  const maxId = cached.reduce((m, r) => Math.max(m, r._id || 0), 0);
  if (maxId === 0 && cached.length > 0) {
    console.log(`    Legacy cache without _id anchor (${cached.length} rows) — full re-fetch required`);
    return null;
  }
  console.log(`    Incremental: cached ${cached.length.toLocaleString()} rows, max _id=${maxId}`);

  const fresh = [];
  const LIMIT = 5000;
  let offset = 0;
  // Loop until we've seen a batch with no row above maxId — the tail is new.
  while (true) {
    const url = `${API_BASE}?resource_id=${ds.id}&limit=${LIMIT}&offset=${offset}&sort=_id%20desc`;
    let resp;
    try { resp = await fetchJson(url); } catch (e) {
      console.log(`    Error at offset ${offset}: ${e.message}`);
      break;
    }
    if (!resp?.success || !resp?.result?.records?.length) break;
    const records = resp.result.records;
    const newRows = records.filter(r => (r._id || 0) > maxId);
    fresh.push(...newRows);
    const total = resp.result.total || 0;
    offset += records.length;
    // Stop when this batch contains no new rows (we've reached the cached region)
    // or when we've covered the whole dataset.
    if (newRows.length === 0 || offset >= total || records.length < LIMIT) break;
    if (offset > 300000) break; // safety cap — should never be reached in practice
  }

  console.log(`    Incremental: ${fresh.length.toLocaleString()} new rows found`);
  if (!fresh.length) return cached;

  // Normalize new rows and merge (dedupe by _id)
  const byId = new Map(cached.map(r => [r._id, r]));
  for (let i = 0; i < fresh.length; i += 50000) {
    const batch = fresh.slice(i, i + 50000)
      .map(r => normalizeRow(r, ds.hasRemainingLease))
      .filter(Boolean);
    for (const row of batch) byId.set(row._id, row);
  }
  return [...byId.values()];
}

export async function fetchHdbData(forceRefresh = false) {
  ensureDir(CACHE_DIR);
  let allRecords = [];

  for (const ds of DATASETS) {
    const cacheFile = join(CACHE_DIR, `${ds.id}.json`);
    const hasCache = existsSync(cacheFile);

    // ── Historical datasets: never re-fetch unless forced ──
    if (!ds.isActive) {
      if (!forceRefresh && hasCache) {
        const cached = JSON.parse(readFileSync(cacheFile, 'utf-8'));
        pushBatch(allRecords, cached);
        console.log(`  ${ds.name}: ${cached.length.toLocaleString()} records (cached)`);
        continue;
      }
      if (forceRefresh && hasCache) {
        const cached = JSON.parse(readFileSync(cacheFile, 'utf-8'));
        pushBatch(allRecords, cached);
        console.log(`  ${ds.name}: ${cached.length.toLocaleString()} records (cached, historical kept — not re-fetched even with --fresh)`);
        continue;
      }
      // No cache at all → full fetch once
      console.log(`  ${ds.name}: no cache — full fetch (one-time)`);
    } else if (!forceRefresh && hasCache) {
      // ── Active dataset: incremental by _id anchor ──
      console.log(`  ${ds.name} (active): incremental update`);
      try {
        const cached = JSON.parse(readFileSync(cacheFile, 'utf-8'));
        const merged = await fetchActiveIncremental(ds, cached);
        if (merged) {
          writeFileSync(cacheFile, JSON.stringify(merged));
          pushBatch(allRecords, merged);
          console.log(`    Merged cache: ${merged.length.toLocaleString()} records`);
          continue;
        }
        console.log(`    Legacy cache — falling through to full fetch to bootstrap _id anchor`);
        // fall through to full fetch
      } catch (err) {
        console.log(`  ${ds.name}: incremental FAILED (${err.message}) — falling back to full fetch`);
        // fall through to full fetch
      }
    } else {
      console.log(`  ${ds.name}: no cache or --fresh — full fetch`);
    }

    // ── Full fetch (no cache, --fresh, or incremental failed) ──
    try {
      const rawRecords = await fetchPaginated(ds);
      console.log(`    Raw: ${rawRecords.length.toLocaleString()} records`);

      let normalized = [];
      for (let i = 0; i < rawRecords.length; i += 50000) {
        const batch = rawRecords.slice(i, i + 50000).map(r => normalizeRow(r, ds.hasRemainingLease)).filter(Boolean);
        pushBatch(normalized, batch);
      }

      writeFileSync(cacheFile, JSON.stringify(normalized));
      pushBatch(allRecords, normalized);
      console.log(`    Normalized: ${normalized.length.toLocaleString()} records`);
    } catch (err) {
      console.log(`  ${ds.name}: FAILED - ${err.message}`);
      if (existsSync(cacheFile)) {
        const cached = JSON.parse(readFileSync(cacheFile, 'utf-8'));
        pushBatch(allRecords, cached);
        console.log(`    Using ${cached.length.toLocaleString()} cached records`);
      }
    }
  }

  console.log(`  Total: ${allRecords.length.toLocaleString()} HDB records`);
  return allRecords;
}

export function processHdbData(records) {
  const blockMap = new Map();
  let skipped = 0;

  for (const r of records) {
    const id = blockId(r.town, r.block, r.streetName);
    if (!blockMap.has(id)) {
      blockMap.set(id, {
        id, type: 'HDB',
        town: r.town, block: r.block, streetName: r.streetName,
        flatTypes: new Set(), flatModels: new Set(),
        transactions: []
      });
    }
    const b = blockMap.get(id);
    b.flatTypes.add(r.flatType);
    b.flatModels.add(r.flatModel);
    b.transactions.push(r);
  }

  const result = [];
  for (const b of blockMap.values()) {
    b.transactions.sort((a, m) => m.month.localeCompare(a.month)); // newest first
    const tx = b.transactions;
    const psfArr = tx.map(t => t.pricePsf).filter(p => p > 0);
    const years = [...new Set(tx.map(t => t.month?.substring(0, 4)).filter(Boolean))].sort();
    const prices = tx.map(t => t.resalePrice);

    result.push({
      id: b.id, type: 'HDB',
      town: b.town, block: b.block, street: b.streetName,
      name: `Blk ${b.block} ${b.streetName}`,
      flatTypes: [...b.flatTypes],
      flatModels: [...b.flatModels],
      coord: null,
      stats: {
        totalTransactions: tx.length,
        minPrice: Math.min(...prices), maxPrice: Math.max(...prices),
        avgPsf: psfArr.length ? Math.round(psfArr.reduce((a, b) => a + b, 0) / psfArr.length) : 0,
        minPsf: psfArr.length ? Math.min(...psfArr) : 0,
        maxPsf: psfArr.length ? Math.max(...psfArr) : 0,
        years,
        dateRange: { min: tx[tx.length-1]?.month || null, max: tx[0]?.month || null },
        propertyTypes: ['HDB'],
        tenureTypes: ['99-year Leasehold']
      },
      transactions: tx
    });
  }

  return result.sort((a, b) => a.town.localeCompare(b.town) || (a.streetName || '').localeCompare(b.streetName || ''));
}
