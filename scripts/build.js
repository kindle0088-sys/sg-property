/**
 * Main build script — Singapore Property Dashboard
 *
 * Pipeline:
 *   getToken → fetchAllTransactions → fetchRentals
 *   → processTransactions → processRentals
 *   → generate JSON → write to site/data/
 *
 * Usage:
 *   node build.js --demo   (batch 1 only, for testing)
 *   node build.js          (full fetch, 4 batches)
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getToken, fetchAllTransactions, fetchTransactions, fetchRentals, processTransactions, processRentals } from './ura-fetcher.js';
import { fetchHdbData, processHdbData } from './hdb-fetcher.js';

// Helper: convert "mmyy" (e.g. "1225") to sortable "20yy-mm" ("2025-12")
function toSortableDate(d) {
  if (!d || d.length < 4) return '';
  return `20${d.substring(2,4)}-${d.substring(0,2)}`;
}

// Helper: display format "mmyy" → "Mon YYYY"
function fmtDate(d) {
  if (!d || d.length < 4) return d || '';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const mm = parseInt(d.substring(0,2), 10);
  const yy = parseInt(d.substring(2,4), 10);
  const prefix = yy > 50 ? '19' : '20';
  return `${months[mm-1] || d.substring(0,2)} ${prefix}${String(yy).padStart(2, '0')}`;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'data');
const PROJ_DIR = join(DATA, 'projects');

const D = {
  1: 'Raffles Place / Marina', 2: 'Anson / Tanjong Pagar', 3: 'Queenstown / Tiong Bahru',
  4: 'Sentosa / Harbourfront', 5: 'Bugis / City Hall', 6: 'High Street / Beach Road',
  7: 'Middle Road / Rochor', 8: 'Little India / Farrer Park', 9: 'Kallang / Whampoa',
  10: 'Tanglin / Holland / Bukit Timah', 11: 'Bt. Timah / Newton / Novena', 12: 'Balestier / Toa Payoh',
  13: 'MacPherson / Potong Pasir', 14: 'Eunos / Geylang / Paya Lebar', 15: 'Marine Parade / Katong',
  16: 'Bedok / Upper East Coast', 17: 'Changi / Loyang', 18: 'Tampines / Pasir Ris',
  19: 'Punggol / Sengkang / Hougang', 20: 'Ang Mo Kio / Bishan / Thomson',
  21: 'Upper Bukit Timah / Clementi', 22: 'Boon Lay / Jurong / Tuas', 23: 'Hillview / Dairy Farm',
  24: 'Lim Chu Kang / Tengah', 25: 'Kranji / Woodlands', 26: 'Upper Thomson / Springleaf',
  27: 'Yishun / Sembawang', 28: 'Seletar / Yio Chu Kang'
};
const SECT = { 1:'CCR',2:'CCR',3:'RCR',4:'CCR',5:'CCR',6:'CCR',7:'CCR',8:'RCR',9:'RCR',10:'CCR',
  11:'CCR',12:'RCR',13:'RCR',14:'RCR',15:'RCR',16:'OCR',17:'OCR',18:'OCR',19:'OCR',20:'RCR',
  21:'OCR',22:'OCR',23:'OCR',24:'OCR',25:'OCR',26:'OCR',27:'OCR',28:'OCR' };

function mkdir(p) { if (!existsSync(p)) mkdirSync(p, { recursive: true }); }

// Compute average PSF from transactions filtered by date >= cutoff
// Handles both mmyy (URA) and yyyy-mm (HDB) date formats
function computeAvg1y(txns, dateField, cutoff) {
  if (!cutoff) return 0;
  const isMmyy = /^\d{4}$/.test(cutoff); // mmyy is 4 digits, yyyy-mm is 7
  const cutoffSort = isMmyy ? toSortableDate(cutoff) : cutoff;
  const filtered = txns.filter(t => {
    const v = t[dateField];
    if (!v) return false;
    const vSort = isMmyy ? toSortableDate(v) : v;
    return vSort >= cutoffSort;
  });
  const psfs = filtered.map(t => t.pricePsf).filter(Boolean);
  return psfs.length ? Math.round(psfs.reduce((a, b) => a + b, 0) / psfs.length) : 0;
}

async function main() {
  const t0 = Date.now();
  const demo = process.argv.includes('--demo');
  console.log('=== SG Property Dashboard Build ===');
  console.log('Mode:', demo ? 'DEMO (batch 1)' : 'FULL');
  console.log();

  mkdir(DATA); mkdir(PROJ_DIR);

  // 1. Token
  console.log('1/5 Getting URA token...');
  const tok = await getToken();
  console.log('  OK:', tok.substring(0, 12) + '...');

  // 2. Transactions
  console.log('\n2/5 Fetching transactions...');
  let raw;
  if (demo) {
    raw = await fetchTransactions(1);
    console.log(`  Demo: ${raw.length} projects from batch 1`);
  } else {
    raw = await fetchAllTransactions();
  }
  const txCount = raw.reduce((s, p) => s + (p.transaction?.length || 0), 0);
  console.log(`  Total: ${raw.length} projects, ${txCount} raw transactions`);

  // 3. Rentals
  console.log('\n3/5 Fetching rentals...');
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) + 1;
  const y = String(now.getFullYear()).slice(-2);
  let rawRent = [];
  for (const rp of [`${y}Q${q}`, `${y}Q${q - 1 || 4}`, `${String(now.getFullYear() - 1).slice(-2)}Q4`]) {
    try { rawRent = await fetchRentals(rp); if (rawRent.length) { console.log(`  Found ${rawRent.length} rental records for ${rp}`); break; } }
    catch (e) { console.log(`  ${rp}: ${e.message}`); }
  }

  // 4. Process
  console.log('\n4/5 Processing URA data...');
  const projects = processTransactions(raw);
  const rentals = processRentals(rawRent);
  console.log(`  ${projects.length} projects, ${projects.reduce((s, p) => s + p.transactions.length, 0)} transactions`);
  console.log(`  ${rentals.length} rental records`);

  // 4b. HDB Data
  console.log('\n4b/5 Fetching HDB resale data...');
  const hdbRaw = demo ? [] : await fetchHdbData(process.argv.includes('--fresh'));
  const hdbProjects = demo ? [] : processHdbData(hdbRaw);
  const hdbTxns = hdbProjects.reduce((s, p) => s + p.transactions.length, 0);
  const hdbTotalTxns = hdbProjects.reduce((s, p) => s + p.stats.totalTransactions, 0);
  console.log(`  ${hdbProjects.length} HDB blocks, ${hdbTxns} cached / ${hdbTotalTxns} total transactions`);
  console.log(`  HDB data: ${hdbRaw.length.toLocaleString()} raw records spanning ${hdbProjects[0]?.stats.years[0] || '?'}-${hdbProjects[0]?.stats.years[hdbProjects[0]?.stats.years.length-1] || '?'} to today`);

  // 4c. Compute 1-year averages
  const hdbTxnCount = hdbProjects.reduce((s, p) => s + p.transactions.length, 0);
  const uraTxns = projects.reduce((s, p) => s + p.transactions.length, 0);

  // Latest date across URA (mmyy format - need sortable comparison for cross-year)
  let latestSort = '', latestMmyy = '';
  for (const p of projects) {
    for (const t of p.transactions) {
      if (t.contractDate) {
        const s = toSortableDate(t.contractDate);
        if (s > latestSort) { latestSort = s; latestMmyy = t.contractDate; }
      }
    }
  }
  // Latest date across HDB (yyyy-mm format)
  let latestHdb = '';
  for (const p of hdbProjects) {
    for (const t of p.transactions) {
      if (t.month && t.month > latestHdb) latestHdb = t.month;
    }
  }

  if (latestMmyy) {
    const ld = new Date(2000 + parseInt(latestMmyy.substring(2)), parseInt(latestMmyy.substring(0,2)) - 1);
    const cd = new Date(ld); cd.setMonth(cd.getMonth() - 12);
    var CUTOFF_MMYY = String(cd.getMonth() + 1).padStart(2,'0') + String(cd.getFullYear()).slice(-2);
  }
  if (latestHdb) {
    const ld = new Date(parseInt(latestHdb.substring(0,4)), parseInt(latestHdb.substring(5,7)) - 1);
    const cd = new Date(ld); cd.setMonth(cd.getMonth() - 12);
    var CUTOFF_HDB = cd.getFullYear() + '-' + String(cd.getMonth() + 1).padStart(2,'0');
  }
  console.log(`  Avg 1y cutoff: URA=${CUTOFF_MMYY} HDB=${CUTOFF_HDB}`);

  // Inject avgPsf1y into project stats objects for downstream aggregations
  for (const p of projects) p.stats.avgPsf1y = computeAvg1y(p.transactions, 'contractDate', CUTOFF_MMYY);
  for (const p of hdbProjects) p.stats.avgPsf1y = computeAvg1y(p.transactions, 'month', CUTOFF_HDB);

  // 5. Generate output
  console.log('\n5/5 Generating files...');

  // 5a. URA project index
  const idx = projects.map(p => ({
    id: p.id, name: p.name, street: p.street,
    district: p.stats.districts[0] || null,
    marketSegment: p.marketSegment,
    avgPsf: p.stats.avgPsf, avgPsf1y: computeAvg1y(p.transactions, 'contractDate', CUTOFF_MMYY),
    minPsf: p.stats.minPsf, maxPsf: p.stats.maxPsf,
    totalTxns: p.stats.totalTransactions,
    dateRange: p.stats.dateRange,
    coord: p.coord,
    propertyTypes: p.stats.propertyTypes,
    tenureTypes: p.stats.tenureTypes,
    years: p.stats.years
  }));
  writeJSON(join(DATA, 'projects-index.json'), idx);
  console.log(`  projects-index.json (${idx.length})`);

  // 5b. Per-project
  let n = 0;
  for (const p of projects) {
    const avg1y = computeAvg1y(p.transactions, 'contractDate', CUTOFF_MMYY);
    writeJSON(join(PROJ_DIR, `${p.id}.json`), {
      id: p.id, name: p.name, street: p.street,
      marketSegment: p.marketSegment, coord: p.coord,
      stats: { ...p.stats, avgPsf1y: avg1y },
      fmtFirstDate: fmtDate(p.stats.dateRange.min),
      fmtLastDate: fmtDate(p.stats.dateRange.max),
      sortFirstDate: toSortableDate(p.stats.dateRange.min),
      sortLastDate: toSortableDate(p.stats.dateRange.max),
      transactions: p.transactions.map(t => ({
        propertyType: t.propertyType, district: t.district,
        typeOfSale: t.typeOfSale, price: t.price, areaSqf: Math.round(t.areaSqf),
        pricePsf: t.pricePsf, floorRange: t.floorRange,
        contractDate: t.contractDate,
        fmtDate: fmtDate(t.contractDate),
        sortDate: toSortableDate(t.contractDate),
        tenureType: t.tenure.type,
        tenureYears: t.tenure.years
      }))
    });
    n++;
  }
  console.log(`  ${n} project detail files`);

  // 5c. HDB project index
  const hdbIdx = hdbProjects.map(p => ({
    id: p.id, name: p.name, town: p.town, type: 'HDB', coord: null,
    avgPsf: p.stats.avgPsf,
    avgPsf1y: computeAvg1y(p.transactions, 'month', CUTOFF_HDB),
    minPsf: p.stats.minPsf, maxPsf: p.stats.maxPsf,
    totalTxns: p.stats.totalTransactions,
    dateRange: p.stats.dateRange,
    years: p.stats.years,
    flatTypes: p.flatTypes,
    street: p.street
  }));
  writeJSON(join(DATA, 'hdb-index.json'), hdbIdx);
  console.log(`  hdb-index.json (${hdbIdx.length})`);

  // 5d. Per-block HDB files
  const HDB_DIR = join(DATA, 'hdb');
  mkdir(HDB_DIR);
  let m = 0;
  for (const p of hdbProjects) {
    const avg1y = computeAvg1y(p.transactions, 'month', CUTOFF_HDB);
    writeJSON(join(HDB_DIR, `${p.id}.json`), {
      id: p.id, name: p.name, type: 'HDB',
      town: p.town, street: p.street, block: p.block,
      flatTypes: p.flatTypes, flatModels: p.flatModels,
      stats: { ...p.stats, avgPsf1y: avg1y },
      transactions: p.transactions.slice(-500).map(t => ({
        contractDate: t.month ? t.month.substring(5,7) + t.month.substring(2,4) : '',
        fmtDate: t.month ? fmtDate(t.month.substring(5,7) + t.month.substring(2,4)) : '',
        sortDate: t.month ? t.month.substring(0,7) : '',
        flatType: t.flatType, storeyRange: t.storeyRange,
        floorAreaSqf: t.floorAreaSqf, pricePsf: t.pricePsf,
        resalePrice: t.resalePrice, flatModel: t.flatModel,
        remainingLease: t.remainingLease, leaseCommenceDate: t.leaseCommenceDate
      }))
    });
    m++;
  }
  console.log(`  ${m} HDB block detail files`);

  // 5e. Combined index (URA + HDB)
  const combinedIdx = [
    ...idx.map(p => ({ ...p, type: p.type || 'Private' })),
    ...hdbIdx
  ];
  writeJSON(join(DATA, 'property-index.json'), combinedIdx);
  console.log(`  property-index.json (${combinedIdx.length})`);

  // 5f. Districts (URA only, HDB by town instead)
  const dists = buildDistricts(projects, rentals, CUTOFF_MMYY);
  writeJSON(join(DATA, 'districts.json'), dists);
  console.log(`  districts.json (${dists.length})`);

  // 5g. HDB Towns summary
  console.log('  Building HDB towns...');
  const hdbTowns = buildHdbTowns(hdbProjects, CUTOFF_HDB);
  writeJSON(join(DATA, 'hdb-towns.json'), hdbTowns);
  console.log(`  hdb-towns.json (${Object.keys(hdbTowns).length} towns)`);

  // 5h. Rentals
  writeJSON(join(DATA, 'rentals.json'), rentals);
  console.log(`  rentals.json (${rentals.length})`);

  // 5i. Market summary
  const summary = buildSummary(projects, dists, hdbProjects);
  writeJSON(join(DATA, 'market-summary.json'), summary);
  console.log('  market-summary.json');

  // 5j. Build meta
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  writeJSON(join(DATA, 'build-meta.json'), {
    buildTime: new Date().toISOString(), elapsed: secs,
    projects: projects.length,
    transactions: projects.reduce((s, p) => s + p.transactions.length, 0),
    hdbBlocks: hdbProjects.length,
    hdbTransactions: hdbTxns,
    hdbRawRecords: hdbRaw.length,
    rentals: rentals.length, demo
  });
  console.log('  build-meta.json');

  console.log(`\n✅ Build complete in ${secs}s`);
}

function writeJSON(path, data) {
  writeFileSync(path, JSON.stringify(data), 'utf-8');
}

function buildDistricts(projects, rentals, cutoff) {
  const map = {};
  for (let d = 1; d <= 28; d++) {
    map[d] = { district: d, name: D[d] || `D${d}`, sector: SECT[d] || 'OCR',
      projectCount: 0, totalTransactions: 0, psfArr: [], psfArr1y: [],
      byYear: {}, rental: null };
  }
  for (const p of projects) {
    const d = p.stats.districts[0];
    if (!d || !map[d]) continue;
    map[d].projectCount++;
    map[d].totalTransactions += p.stats.totalTransactions;
    for (const t of p.transactions) {
      if (t.pricePsf > 0) {
        map[d].psfArr.push(t.pricePsf);
        if (cutoff && t.contractDate && toSortableDate(t.contractDate) >= toSortableDate(cutoff)) map[d].psfArr1y.push(t.pricePsf);
      }
      const yr = t.contractDate?.substring(0, 4);
      if (yr) {
        if (!map[d].byYear[yr]) map[d].byYear[yr] = { count: 0, sum: 0 };
        map[d].byYear[yr].count++;
        map[d].byYear[yr].sum += t.pricePsf || 0;
      }
    }
  }
  const rMap = {};
  for (const r of rentals) {
    if (r.propertyType === 'Non-landed Properties') {
      if (!rMap[r.district]) rMap[r.district] = { rents: [], byBedroom: {} };
      rMap[r.district].rents.push(r.rent);
      const bd = r.bedrooms;
      if (!rMap[r.district].byBedroom[bd]) rMap[r.district].byBedroom[bd] = [];
      rMap[r.district].byBedroom[bd].push(r.rent);
    }
  }
  return Object.values(map).map(d => {
    const arr = d.psfArr;
    const sorted = [...arr].sort((a, b) => a - b);
    const years = Object.fromEntries(Object.entries(d.byYear).map(([k, v]) => [k, { count: v.count, avgPsf: Math.round(v.sum / v.count) }]));
    const r = rMap[d.district];
    let rentalSummary = null;
    if (r && r.rents.length > 0) {
      const rSorted = [...r.rents].sort((a, b) => a - b);
      const byBd = {};
      for (const [bd, rents] of Object.entries(r.byBedroom)) {
        const s = [...rents].sort((a, b) => a - b);
        byBd[bd] = {
          median: s[Math.floor(s.length / 2)],
          lower: s[Math.floor(s.length * 0.25)],
          upper: s[Math.floor(s.length * 0.75)],
          count: s.length
        };
      }
      rentalSummary = {
        median: rSorted[Math.floor(rSorted.length / 2)],
        lower: rSorted[Math.floor(rSorted.length * 0.25)],
        upper: rSorted[Math.floor(rSorted.length * 0.75)],
        count: rSorted.length,
        byBedroom: byBd
      };
    }
    return {
      district: d.district, name: d.name, sector: d.sector,
      projectCount: d.projectCount, totalTransactions: d.totalTransactions,
      avgPsf: arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0,
      avgPsf1y: d.psfArr1y.length ? Math.round(d.psfArr1y.reduce((a, b) => a + b, 0) / d.psfArr1y.length) : 0,
      medianPsf: sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0,
      minPsf: sorted[0] || 0, maxPsf: sorted[sorted.length - 1] || 0,
      byYear: years,
      rental: rentalSummary
    };
  });
}

function buildHdbTowns(hdbProjects, cutoff) {
  const towns = {};
  for (const p of hdbProjects) {
    const t = p.town || 'Unknown';
    if (!towns[t]) towns[t] = {
      blocks: 0, totalTransactions: 0,
      psfArr: [], psfArr1y: [], years: new Set(), flatTypes: new Set(),
      byYear: {}
    };
    const town = towns[t];
    town.blocks++;
    town.totalTransactions += p.stats.totalTransactions;
    if (p.stats.avgPsf > 0) town.psfArr.push(p.stats.avgPsf);
    (p.stats.years || []).forEach(y => town.years.add(y));
    (p.flatTypes || []).forEach(f => town.flatTypes.add(f));
    for (const tx of p.transactions) {
      const yr = tx.month ? tx.month.substring(0, 4) : null;
      if (yr && tx.pricePsf > 0) {
        if (!town.byYear[yr]) town.byYear[yr] = { count: 0, sum: 0 };
        town.byYear[yr].count++;
        town.byYear[yr].sum += tx.pricePsf;
        if (cutoff && tx.month >= cutoff) town.psfArr1y.push(tx.pricePsf);
      }
    }
  }
  const result = {};
  for (const [town, d] of Object.entries(towns)) {
    const sortedPsf = [...d.psfArr].sort((a, b) => a - b);
    const yrs = [...d.years].sort();
    const byYear = Object.fromEntries(
      Object.entries(d.byYear).map(([k, v]) => [k, { count: v.count, avgPsf: Math.round(v.sum / v.count) }])
    );
    result[town] = {
      blocks: d.blocks,
      totalTransactions: d.totalTransactions,
      avgPsf: d.psfArr.length ? Math.round(d.psfArr.reduce((a, b) => a + b, 0) / d.psfArr.length) : 0,
      avgPsf1y: d.psfArr1y.length ? Math.round(d.psfArr1y.reduce((a, b) => a + b, 0) / d.psfArr1y.length) : 0,
      minPsf: sortedPsf.length ? sortedPsf[0] : 0,
      maxPsf: sortedPsf.length ? sortedPsf[sortedPsf.length - 1] : 0,
      years: yrs,
      byYear: byYear,
      flatTypes: [...d.flatTypes].sort()
    };
  }
  return result;
}

function buildSummary(projects, districts, hdbProjects) {
  const segs = { CCR: [], RCR: [], OCR: [] };
  const segCnt = { CCR: 0, RCR: 0, OCR: 0 };
  const segs1y = { CCR: [], RCR: [], OCR: [] };
  for (const p of projects) {
    const s = p.marketSegment || 'OCR';
    if (segs[s]) { segs[s].push(p.stats.avgPsf); segCnt[s]++; }
    if (segs1y[s]) segs1y[s].push(p.stats.avgPsf1y || 0);
  }
  const bySeg = {};
  for (const s of Object.keys(segs)) {
    bySeg[s] = { avgPsf: segs[s].length ? Math.round(segs[s].reduce((a, b) => a + b, 0) / segs[s].length) : 0, count: segCnt[s] };
  }
  const bySeg1y = {};
  for (const s of Object.keys(segs1y)) {
    const a = segs1y[s].filter(Boolean);
    bySeg1y[s] = a.length ? Math.round(a.reduce((a, b) => a + b, 0) / a.length) : 0;
  }
  const allPsf = projects.map(p => p.stats.avgPsf).filter(Boolean);
  const allPsf1y = projects.map(p => p.stats.avgPsf1y || 0).filter(Boolean);
  const hdbPsf = hdbProjects ? hdbProjects.map(p => p.stats.avgPsf).filter(Boolean) : [];
  const hdbPsf1y = hdbProjects ? hdbProjects.map(p => p.stats.avgPsf1y || 0).filter(Boolean) : [];
  const hdbTxns = hdbProjects ? hdbProjects.reduce((s, p) => s + p.stats.totalTransactions, 0) : 0;
  const hdbTowns = hdbProjects ? [...new Set(hdbProjects.map(p => p.town).filter(Boolean))].length : 0;
  return {
    buildTime: new Date().toISOString(),
    totalProjects: projects.length,
    totalTransactions: projects.reduce((s, p) => s + p.stats.totalTransactions, 0),
    overallAvgPsf: allPsf.length ? Math.round(allPsf.reduce((a, b) => a + b, 0) / allPsf.length) : 0,
    overallAvgPsf1y: allPsf1y.length ? Math.round(allPsf1y.reduce((a, b) => a + b, 0) / allPsf1y.length) : 0,
    bySegment: bySeg,
    bySegment1y: bySeg1y,
    hdbBlocks: hdbProjects ? hdbProjects.length : 0,
    hdbTransactions: hdbTxns,
    hdbAvgPsf: hdbPsf.length ? Math.round(hdbPsf.reduce((a, b) => a + b, 0) / hdbPsf.length) : 0,
    hdbAvgPsf1y: hdbPsf1y.length ? Math.round(hdbPsf1y.reduce((a, b) => a + b, 0) / hdbPsf1y.length) : 0,
    hdbTowns: hdbTowns
  };
}

main().catch(err => {
  console.error('\n❌ Build failed:', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
