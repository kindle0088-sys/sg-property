/**
 * Unit test for HDB incremental fetch logic (isolated cache dir).
 * Mocks https.get with the real 3-arg signature, points HDB_CACHE_DIR at a
 * temp folder so real data is never touched.
 *
 * Verified paths:
 *  1. Fresh cache WITH _id -> incremental merge appends only new rows
 *  2. Dedupe: second run adds 0
 *  3. Legacy cache (no _id) -> falls through to full fetch (bootstraps anchor)
 */
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Isolated cache ──
const TEST_CACHE = mkdtempSync(join(tmpdir(), 'hdb-test-'));
process.env.HDB_CACHE_DIR = TEST_CACHE;

// ── Mock data.gov.sg (real 3-arg signature: url, options, callback) ──
let mockRows = [];
let callLog = [];
const origGet = https.get;
https.get = (url, opts, cb) => {
  if (typeof opts === 'function') { cb = opts; opts = {}; }
  const u = new URL(url);
  const limit = parseInt(u.searchParams.get('limit')) || 100;
  const offset = parseInt(u.searchParams.get('offset')) || 0;
  const sortDesc = u.searchParams.get('sort') === '_id desc';
  let rows = [...mockRows];
  if (sortDesc) rows.sort((a, b) => b._id - a._id);
  const page = rows.slice(offset, offset + limit);
  callLog.push({ limit, offset, sortDesc, got: page.length });
  const body = JSON.stringify({ success: true, result: { total: mockRows.length, records: page } });
  const listeners = {};
  const res = {
    on: (ev, fn) => { (listeners[ev] ||= []).push(fn); return res; }
  };
  // Emit data + end asynchronously so the caller has registered handlers
  setTimeout(() => {
    (listeners.data || []).forEach(fn => fn(Buffer.from(body)));
    (listeners.end || []).forEach(fn => fn());
  }, 0);
  cb(res);
  return res;
};

// ── Seed a "legacy" cache (no _id) for the active dataset ──
const ACTIVE_DS = 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc';
const cacheFile = join(TEST_CACHE, `${ACTIVE_DS}.json`);
// normalizeRow output format (what the cache stores), WITHOUT _id = legacy
const legacy = Array.from({ length: 100 }, (_, i) => ({
  month: '2026-01', town: 'TEST', block: String(i), streetName: 'LEGACY ST',
  flatType: '4 ROOM', flatModel: 'Model A', storeyRange: '01 TO 03',
  floorAreaSqm: 84, floorAreaSqf: 900,
  leaseCommenceDate: 2000, remainingLease: 74,
  resalePrice: 500000, pricePsf: 555
}));
writeFileSync(cacheFile, JSON.stringify(legacy));

// Import AFTER env is set
const { fetchHdbData } = await import('./hdb-fetcher.js');

let fail = 0;

// Helper: build a RAW upstream row (data.gov.sg format) with _id
function rawRow(_id, overrides = {}) {
  return {
    _id, month: '2026-07', town: 'TEST', block: '9', street_name: 'RAW ST',
    flat_type: '4 ROOM', flat_model: 'Model A', storey_range: '01 TO 03',
    floor_area_sqm: '84', resale_price: '520000',
    lease_commence_date: '2000', remaining_lease: '74 years',
    ...overrides
  };
}

// Test 1: legacy cache (no _id) -> full fetch fallback, cache gets _id
mockRows = legacy.map((r, i) => rawRow(i + 1));
const out1 = await fetchHdbData(false);
const after1 = JSON.parse(readFileSync(cacheFile, 'utf-8'));
const hasId1 = after1.some(r => r._id !== undefined);
console.log(`Test 1 legacy->full: out=${out1.length}, cache=${after1.length}, has _id=${hasId1}`);
if (!hasId1 || after1.length !== 100) { console.error('  FAIL'); fail++; }

// Test 2: fresh cache WITH _id -> incremental adds only 3 new rows
const maxId = Math.max(...after1.map(r => r._id));
mockRows = [
  ...legacy.map((r, i) => rawRow(i + 1)),
  rawRow(maxId + 1, { town: 'NEW', block: 'A' }),
  rawRow(maxId + 2, { town: 'NEW', block: 'B' }),
  rawRow(maxId + 3, { town: 'NEW', block: 'C' })
];
callLog = [];
const out2 = await fetchHdbData(false);
const after2 = JSON.parse(readFileSync(cacheFile, 'utf-8'));
const added = after2.length - after1.length;
console.log(`Test 2 incremental: added=${added} (expect 3), calls=${callLog.length} (expect small)`);
if (added !== 3) { console.error('  FAIL'); fail++; }
if (callLog.length > 5) { console.error(`  FAIL: too many API calls (${callLog.length})`); fail++; }

// Test 3: dedupe — running again adds 0 (cache merged, no _id beyond anchor)
callLog = [];
const out3 = await fetchHdbData(false);
const after3 = JSON.parse(readFileSync(cacheFile, 'utf-8'));
const added2 = after3.length - after2.length;
console.log(`Test 3 dedupe: added=${added2} (expect 0), calls=${callLog.length} (expect 1)`);
if (added2 !== 0) { console.error('  FAIL'); fail++; }
if (callLog.length > 2) { console.error(`  FAIL: too many API calls (${callLog.length})`); fail++; }

rmSync(TEST_CACHE, { recursive: true, force: true });
console.log(fail === 0 ? 'HDB INCREMENTAL TESTS PASSED' : `${fail} FAILURES`);
process.exit(fail === 0 ? 0 : 1);
