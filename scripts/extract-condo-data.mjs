// 提取 10 个 condo 项目的研报数据包
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data', 'projects');
const outDir = path.join(root, 'reports', '_data');
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  'parc-clematis', 'normanton-park', 'grand-dunman', 'treasure-at-tampines',
  'chuan-park', 'the-florence-residences', 'canninghill-piers', 'the-continuum',
  'affinity-at-serangoon', 'emerald-of-katong'
];

const SALE_TYPE = { '1': '新售 New Sale', '2': '楼花转售 Sub Sale', '3': '现楼转售 Resale', '未知': '未知' };

function yearAvg(trans) {
  const byYear = {};
  for (const t of trans) {
    const y = String(t.sortDate || t.contractDate).slice(0, 4);
    if (!byYear[y]) byYear[y] = { n: 0, sumPsf: 0, sumPrice: 0 };
    byYear[y].n++;
    byYear[y].sumPsf += +t.pricePsf;
    byYear[y].sumPrice += +t.price;
  }
  return Object.entries(byYear)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([y, v]) => ({ year: y, n: v.n, avgPsf: Math.round(v.sumPsf / v.n), avgPrice: Math.round(v.sumPrice / v.n) }));
}

function unitProfileByArea(trans) {
  const buckets = { '1房 (~<700sqft)': 0, '2房 (700-1000sqft)': 0, '3房 (1000-1350sqft)': 0, '4房+ (>1350sqft)': 0 };
  for (const t of trans) {
    const a = +t.areaSqf;
    if (a < 700) buckets['1房 (~<700sqft)']++;
    else if (a < 1000) buckets['2房 (700-1000sqft)']++;
    else if (a < 1350) buckets['3房 (1000-1350sqft)']++;
    else buckets['4房+ (>1350sqft)']++;
  }
  return buckets;
}

function priceHistory(trans) {
  const rows = yearAvg(trans);
  return rows.map((r, i) => ({ ...r, yoy: i === 0 ? null : ((r.avgPsf - rows[i - 1].avgPsf) / rows[i - 1].avgPsf * 100) }));
}

function saleMix(trans) {
  const m = { '新售': 0, '楼花转售': 0, '现楼转售': 0 };
  for (const t of trans) {
    const k = SALE_TYPE[String(t.typeOfSale)] || '现楼转售';
    if (k.includes('新售')) m['新售']++;
    else if (k.includes('楼花')) m['楼花转售']++;
    else m['现楼转售']++;
  }
  const n = trans.length || 1;
  return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, { n: v, pct: +(v / n * 100).toFixed(1) }]));
}

function topUnits(trans) {
  const rows = trans.map(t => ({ price: +t.price, psf: +t.pricePsf, area: +t.areaSqf, floor: t.floorRange, date: t.fmtDate }));
  rows.sort((a, b) => b.price - a.price);
  return { top10ByPrice: rows.slice(0, 10), top5ByPsf: [...rows].sort((a, b) => b.psf - a.psf).slice(0, 5) };
}

for (const slug of targets) {
  const f = path.join(dataDir, `${slug}.json`);
  if (!fs.existsSync(f)) { console.error(`MISSING ${slug}`); continue; }
  const d = JSON.parse(fs.readFileSync(f, 'utf-8'));
  const s = d.stats || {};
  const trans = Array.isArray(d.transactions) ? d.transactions : [];
  const pkg = {
    slug, name: d.name, street: d.street, segment: d.marketSegment,
    coord: d.coord, proximity: d.proximity, stats: s,
    fmtFirstDate: d.fmtFirstDate, fmtLastDate: d.fmtLastDate,
    priceHistory: priceHistory(trans),
    unitProfile: unitProfileByArea(trans),
    saleMix: saleMix(trans),
    top: topUnits(trans),
    nTrans: trans.length
  };
  fs.writeFileSync(path.join(outDir, `${slug}.json`), JSON.stringify(pkg, null, 2), 'utf-8');
  console.log(`OK ${slug}: ${trans.length} 笔, 年度 ${pkg.priceHistory.length} 年`);
}
