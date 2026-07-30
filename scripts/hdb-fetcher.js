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
const CACHE_DIR = join(__dirname, '..', 'data', 'hdb_cache');

const DATASETS = [
  {
    id: 'd_ebc5ab87086db484f88045b47411ebc5',
    name: '1990-1999', isActive: false,
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

function ensureDir(p) { if (!existsSync(p)) mkdirSync(p, { recursive: true }); }

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse: ' + e.message)); }
      });
    }).on('error', reject);
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

function normalizeRow(row, hasRemainingLease) {
  const price = parseFloat(row.resale_price);
  if (!price || isNaN(price)) return null;

  const floorAreaSqm = parseFloat(row.floor_area_sqm || row.floor_area || 0);
  const floorAreaSqf = floorAreaSqm * 10.7639;
  if (floorAreaSqf <= 0) return null;

  const leaseCommence = parseInt(row.lease_commence_date || row.lease_commencement_date || 0);
  const remainingYears = hasRemainingLease
    ? parseRemainingLease(row.remaining_lease)
    : (leaseCommence ? Math.max(0, 99 - (parseInt(row.month?.substring(0, 4) || '2026') - leaseCommence)) : null);

  return {
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
  return `hdb-${town.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${block}`;
}

export async function fetchHdbData(forceRefresh = false) {
  ensureDir(CACHE_DIR);
  let allRecords = [];

  for (const ds of DATASETS) {
    const cacheFile = join(CACHE_DIR, `${ds.id}.json`);

    // Use cache if available and not forcing refresh
    if (!forceRefresh && existsSync(cacheFile)) {
      const raw = readFileSync(cacheFile, 'utf-8');
      const cached = JSON.parse(raw);
      pushBatch(allRecords, cached);
      console.log(`  ${ds.name}: ${cached.length.toLocaleString()} records (cached)`);
      continue;
    }

    console.log(`  Fetching ${ds.name}...`);
    try {
      const rawRecords = await fetchPaginated(ds);
      pushBatch(allRecords, rawRecords);
      console.log(`    Raw: ${rawRecords.length.toLocaleString()} records`);

      // Batch normalize 
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
        dateRange: { min: tx[0]?.month || null, max: tx[tx.length-1]?.month || null },
        propertyTypes: ['HDB'],
        tenureTypes: ['99-year Leasehold']
      },
      transactions: tx.slice(-500)
    });
  }

  return result.sort((a, b) => a.town.localeCompare(b.town) || (a.streetName || '').localeCompare(b.streetName || ''));
}
