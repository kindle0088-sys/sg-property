/* === Formatting & small helpers (pure functions) === */

export function fmtNum(n) {
  const v = Number(n);
  if (v == null || isNaN(v)) return '-';
  return v.toLocaleString();
}

export function fmtPrice(n) {
  const v = Number(n);
  if (v == null || isNaN(v)) return '-';
  return '$' + v.toLocaleString();
}

export function saleTypeLabel(t) {
  switch (t) {
    case 1: return '<span class="stat-green">New Sale</span>';
    case 2: return '<span class="stat-gold">Sub Sale</span>';
    case 3: return '<span class="stat-red">Resale</span>';
    default: return '-';
  }
}

// Town name → URL-safe slug (spaces and slashes → hyphens)
export function slugifyTown(name) {
  return (name || '').toLowerCase().replace(/[\s/]+/g, '-');
}

// PSF 数值 + 窗口信息：avgPsf1y 存在 = 真 1yr；否则 fallback 全期平均
// 前端标签必须用 psfLabel()，避免"历史均价冒充 1yr"
export function psfText(p) {
  const v = p.avgPsf1y || p.avgPsf || 0;
  return { v, is1y: !!p.avgPsf1y };
}

export function showPsf(p) {
  return fmtNum(psfText(p).v);
}

// "1yr PSF" vs "Avg PSF (all)"（按项目实际窗口）
export function psfLabel(p) {
  return p.avgPsf1y ? '1yr PSF' : 'Avg PSF (all)';
}

export function psfTrend(p) {
  if (!p.avgPsf1y || !p.avgPsf || p.avgPsf === 0) return '';
  const diff = (p.avgPsf1y - p.avgPsf) / p.avgPsf * 100;
  const sign = diff > 0.5 ? '▲' : diff < -0.5 ? '▼' : '—';
  const cls = diff > 0.5 ? 'text-green' : diff < -0.5 ? 'text-red' : 'text-muted';
  return ` <span class="${cls}" style="font-size:11px">${sign}${Math.round(Math.abs(diff))}%</span>`;
}

export function highlight(text, query) {
  if (!text || !query) return text || '';
  const idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return text;
  return text.slice(0, idx) + '<strong style="color:var(--gold)">' + text.slice(idx, idx + query.length) + '</strong>' + text.slice(idx + query.length);
}
