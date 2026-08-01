/**
 * 剩余租约折价曲线（Bala's Curve 近似）
 *
 * 只聚合近期交易（默认最近 3 年），按剩余租约分桶 → 各桶 median PSF
 * 避免用全历史交易（1990 年价格低不是租约折价，是时代差异）
 *
 * 输出: data/hdb-lease-curve.json
 *   { period, buckets: [{ label, min, max, count, medianPsf, relative }] }
 *   relative: 以最高租约桶为 100 的百分比
 *
 * 用法: node scripts/build-lease-curve.mjs [--years 3]
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'data');
const HDB_DIR = join(DATA, 'hdb');

const years = process.argv.includes('--years') ? parseInt(process.argv[process.argv.indexOf('--years') + 1]) || 3 : 3;
const now = new Date();
const cutoff = `${now.getFullYear() - years}-${String(now.getMonth() + 1).padStart(2, '0')}`;
console.log(`lease curve: recent ${years}y (from ${cutoff}), walking ${HDB_DIR}...`);

// 剩余租约桶（HDB 99 年租约）
const BUCKETS = [
  { label: '<30 年', min: 0, max: 29 },
  { label: '30-39', min: 30, max: 39 },
  { label: '40-49', min: 40, max: 49 },
  { label: '50-59', min: 50, max: 59 },
  { label: '60-69', min: 60, max: 69 },
  { label: '70-79', min: 70, max: 79 },
  { label: '80-89', min: 80, max: 89 },
  { label: '90+', min: 90, max: 200 }
];
const buckets = BUCKETS.map(b => ({ ...b, psfs: [] }));

const files = readdirSync(HDB_DIR).filter(f => f.startsWith('hdb-') && f.endsWith('.json'));
let n = 0;
const t0 = Date.now();
for (const f of files) {
  const d = JSON.parse(readFileSync(join(HDB_DIR, f), 'utf-8'));
  for (const t of d.transactions || []) {
    if (!t.sortDate || t.sortDate < cutoff) continue;
    const lease = Number(t.remainingLease);
    const psf = Number(t.pricePsf);
    if (!lease || !psf) continue;
    const b = buckets.find(b => lease >= b.min && lease <= b.max);
    if (b) b.psfs.push(psf);
  }
  n++;
  if (n % 2000 === 0) process.stdout.write(`${n} `);
}
process.stdout.write('done\n');

const median = arr => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

const out = buckets.map(b => {
  const m = median(b.psfs);
  return { label: b.label, range: [b.min, b.max], count: b.psfs.length, medianPsf: m };
});
const base = out.filter(b => b.medianPsf).reduce((a, b) => (b.range[0] > a.range[0] ? b : a), { range: [0] });
const basePsf = out.find(b => b.range[0] === base.range[0])?.medianPsf;
for (const b of out) {
  b.relative = b.medianPsf && basePsf ? Math.round(b.medianPsf / basePsf * 1000) / 10 : null;
}

writeFileSync(join(DATA, 'hdb-lease-curve.json'), JSON.stringify({
  period: `${cutoff} .. ${now.toISOString().slice(0, 7)}`,
  buckets: out
}, null, 0));
console.log(`\n✅ ${(Date.now() - t0) / 1000}s | ${Object.keys(files).length} files | saved data/hdb-lease-curve.json`);
console.table(out.map(b => ({ bucket: b.label, txns: b.count, medianPsf: b.medianPsf, relative: b.relative })));
