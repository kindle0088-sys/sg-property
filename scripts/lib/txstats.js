// 纯函数统计工具（build.js 抽出以便单测）

// "mmyy" (e.g. "1225") → sortable "20yy-mm" ("2025-12")
export function toSortableDate(d) {
  if (!d || d.length < 4) return '';
  return `20${d.substring(2,4)}-${d.substring(0,2)}`;
}

// Compute average PSF from transactions filtered by date >= cutoff
// Handles both mmyy (URA) and yyyy-mm (HDB) date formats.
// Median ± 3 × 1.4826 × MAD outlier rejection: protects the average
// against single bad floor-area records skewing PSF.
export function computeAvg1y(txns, dateField, cutoff) {
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
  if (!psfs.length) return 0;
  if (psfs.length < 5) return Math.round(psfs.reduce((a, b) => a + b, 0) / psfs.length); // 小样本不过滤
  const sorted = [...psfs].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const devs = sorted.map(v => Math.abs(v - median)).sort((a, b) => a - b);
  const mad = devs[Math.floor(devs.length / 2)] || 0;
  const lo = median - 3 * 1.4826 * mad;
  const hi = median + 3 * 1.4826 * mad;
  const clean = psfs.filter(v => v >= lo && v <= hi);
  if (!clean.length) return Math.round(median);
  return Math.round(clean.reduce((a, b) => a + b, 0) / clean.length);
}
