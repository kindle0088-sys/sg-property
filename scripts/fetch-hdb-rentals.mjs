/**
 * HDB 租金数据抓取与聚合（data.gov.sg "Renting Out of Flats from Jan 2021"）
 *
 * - 全量拉取（200K 行，分页）→ 缓存 data/hdb_rentals_cache.json（原始）
 * - 聚合 → data/hdb-rentals.json:
 *   - updated / period（最新 12 个月窗口）
 *   - byTown: 每 town 的 4-ROOM 中位租金 + 各 flatType 中位
 *   - byBlock: 楼栋级（最新 12 个月，>=20 笔才出）中位租金
 *   - town4roomYieldPct: 用 town 均价 × 典型 4 房面积（约 968 sqf）估算毛收益率
 *
 * 用法: node scripts/fetch-hdb-rentals.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'data');
const CACHE = join(DATA, 'hdb_rentals_cache.json');
const RID = 'd_c9f57187485a850908655db0e8cfe651';
const UA = 'sg-property-dashboard/1.0 (personal research)';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── 拉取全量（有缓存则跳过） ──
async function fetchAll() {
  if (existsSync(CACHE)) {
    const c = JSON.parse(readFileSync(CACHE, 'utf-8'));
    console.log(`cache: ${c.length} rows`);
    return c;
  }
  const all = [];
  const LIMIT = 10000;
  let offset = 0;
  while (true) {
    const url = `https://data.gov.sg/api/action/datastore_search?resource_id=${RID}&limit=${LIMIT}&offset=${offset}`;
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    const j = await r.json();
    const recs = j.result?.records || [];
    all.push(...recs);
    console.log(`  offset ${offset} → ${all.length} (total ${j.result?.total})`);
    if (recs.length < LIMIT) break;
    offset += recs.length;
    await sleep(300);
  }
  writeFileSync(CACHE, JSON.stringify(all));
  console.log(`saved ${all.length} rows → hdb_rentals_cache.json`);
  return all;
}

// ── HDB 楼栋 id（与 hdb-fetcher blockId 一致） ──
function blockId(town, block, street) {
  const streetPart = (street || '').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return `hdb-${town.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${block}-${streetPart || 'ns'}`;
}

const median = arr => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

// ── 主流程 ──
const records = await fetchAll();
console.log(`records: ${records.length}`);

// 最新月份（字段为 rent_approval_date）
const months = records.map(r => r.rent_approval_date).filter(Boolean).sort();
const latestMonth = months[months.length - 1];
const [ly, lm] = latestMonth.split('-').map(Number);
// 12 个月窗口起点 = latest 减 11 个月
const totalMonths = ly * 12 + (lm - 1) - 11;
const cy = Math.floor(totalMonths / 12);
const cm = totalMonths % 12 + 1;
const cutoff = `${cy}-${String(cm).padStart(2, '0')}`;
console.log(`latest month: ${latestMonth} | 12M window: ${cutoff} .. ${latestMonth}`);

const recent = records.filter(r => r.rent_approval_date && r.rent_approval_date >= cutoff && r.rent_approval_date <= latestMonth);
console.log(`recent 12M rows: ${recent.length}`);

// town 级
const byTown = {};
for (const r of recent) {
  const town = (r.town || '').toUpperCase().trim();
  const ft = (r.flat_type || '').toUpperCase().trim();
  const rent = Number(r.monthly_rent);
  if (!town || !ft || !rent) continue;
  if (!byTown[town]) byTown[town] = {};
  if (!byTown[town][ft]) byTown[town][ft] = [];
  byTown[town][ft].push(rent);
}

// 楼栋级
const byBlock = {};
for (const r of recent) {
  const id = blockId(r.town, r.block, r.street_name);
  const rent = Number(r.monthly_rent);
  if (!id || !rent) continue;
  if (!byBlock[id]) byBlock[id] = [];
  byBlock[id].push(rent);
}

// town 汇总
const hdbTowns = JSON.parse(readFileSync(join(DATA, 'hdb-towns.json'), 'utf-8'));
const townOut = {};
for (const [town, flats] of Object.entries(byTown)) {
  const byFlatType = {};
  for (const [ft, rents] of Object.entries(flats)) {
    byFlatType[ft] = { count: rents.length, median: median(rents) };
  }
  const four = byFlatType['4-ROOM'];
  // 毛收益率估算：4房中位租金×12 / (town avgPsf × 968sqf)
  let yieldPct = null;
  const townData = hdbTowns[town];
  const avgPsf = townData?.avgPsf1y || townData?.avgPsf;
  if (four?.median && avgPsf > 0) {
    const estValue = avgPsf * 968;
    yieldPct = Math.round(four.median * 12 / estValue * 1000) / 10;
  }
  townOut[town] = {
    byFlatType,
    median4room: four?.median || null,
    count: Object.values(flats).reduce((s, a) => s + a.length, 0),
    yieldPct
  };
}

// 楼栋汇总（>=20 笔）
const blockOut = {};
for (const [id, rents] of Object.entries(byBlock)) {
  if (rents.length < 20) continue;
  blockOut[id] = { count: rents.length, median: median(rents), min: Math.min(...rents), max: Math.max(...rents) };
}
console.log(`towns with rent: ${Object.keys(townOut).length} | blocks with >=20 rentals: ${Object.keys(blockOut).length}`);

writeFileSync(join(DATA, 'hdb-rentals.json'), JSON.stringify({
  updated: new Date().toISOString(),
  period: `${cutoff} .. ${latestMonth}`,
  byTown: townOut,
  byBlock: blockOut
}));
console.log('✅ saved data/hdb-rentals.json');
