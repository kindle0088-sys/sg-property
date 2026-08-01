/* === A/B Project Comparison view === */
import { state } from '../state.js';
import { loadHdbIndex, fetchProject } from '../data.js';
import { fmtNum, showPsf } from '../utils.js';
import { renderCompareChart } from '../charts.js';

const SIDE_META = {
  A: { color: '#fbbf24', label: '项目 A' },
  B: { color: '#60a5fa', label: '项目 B' }
};

// ── 主视图 ──
export async function renderCompareView(query = {}) {
  const q = typeof query === 'object' && query ? query : {};
  document.getElementById('main').innerHTML = `
    <div class="project-hero">
      <h1>Compare Projects</h1>
      <div class="sub" id="cmp-sub">选择两个项目（私人与 HDB 可混比），并排比较价格、位置与收益率</div>
    </div>
    <div class="compare-picker">
      <div class="cp-side">
        <div class="cp-label">项目 A</div>
        <input type="text" id="cmp-input-a" class="cmp-input" placeholder="搜索项目 A..." autocomplete="off" oninput="compareSuggest('a', this.value)">
        <div class="cp-suggest" id="cmp-suggest-a"></div>
      </div>
      <div class="cp-vs">VS</div>
      <div class="cp-side">
        <div class="cp-label">项目 B</div>
        <input type="text" id="cmp-input-b" class="cmp-input" placeholder="搜索项目 B..." autocomplete="off" oninput="compareSuggest('b', this.value)">
        <div class="cp-suggest" id="cmp-suggest-b"></div>
      </div>
    </div>
    <div id="compare-body"></div>
  `;
  if (q.a) selectCompare('a', q.a);
  if (q.b) selectCompare('b', q.b);
  renderCompareBody();
}

// ── 下拉建议（复用两个索引，HDB 未加载时后台补拉） ──
export function compareSuggest(side, q) {
  const el = document.getElementById('cmp-suggest-' + side);
  if (!el) return;
  const ql = (q || '').trim().toLowerCase();
  if (!ql) { el.innerHTML = ''; el.classList.remove('open'); return; }
  if (!state.hdbIndex.length) loadHdbIndex().catch(() => {});

  const all = [...state.projectsIndex, ...state.hdbIndex];
  const hits = all
    .filter(p => (p.name || '').toLowerCase().includes(ql) || (p.street || p.town || '').toLowerCase().includes(ql))
    .slice(0, 8);

  el.innerHTML = (hits.length ? hits : [{}]).map(p => {
    if (!p.id) return '<div class="cp-item" style="color:var(--text3)">无匹配项目</div>';
    const isHDB = p.type === 'HDB';
    const isEC = p.type === 'EC';
    const badge = isHDB ? '<span class="tag-hdb">HDB</span>' : (isEC ? '<span class="tag-ec">EC</span>' : '');
    const loc = isHDB ? p.town : 'D' + p.district;
    return `<div class="cp-item" onclick="selectCompare('${side}', '${p.id}')">
      ${badge} <b>${p.name}</b>
      <span class="cp-item-meta">${loc} · $${showPsf(p)} psf</span>
    </div>`;
  }).join('');
  el.classList.add('open');
}

// ── 选中项目（填充输入框 + 拉详情 + 更新 URL） ──
export async function selectCompare(side, id) {
  const key = side === 'a' ? 'A' : 'B';
  const input = document.getElementById('cmp-input-' + key.toLowerCase());
  const suggest = document.getElementById('cmp-suggest-' + key.toLowerCase());
  const all = [...state.projectsIndex, ...state.hdbIndex];
  const idx = all.find(x => x.id === id);
  if (!idx) return;
  state.compare[key] = { id, index: idx };
  if (input) input.value = idx.name;
  if (suggest) { suggest.innerHTML = ''; suggest.classList.remove('open'); }
  // URL 参数化（可分享/刷新保留）
  const sp = new URLSearchParams();
  if (state.compare.A) sp.set('a', state.compare.A.id);
  if (state.compare.B) sp.set('b', state.compare.B.id);
  history.replaceState(null, '', '#/compare' + (sp.toString() ? '?' + sp.toString() : ''));
  // 拉详情数据（缓存到 index 上）
  try { idx._detail = await fetchProject(id); } catch (e) { idx._detail = null; }
  renderCompareBody();
}

// ── 渲染对比主体 ──
async function renderCompareBody() {
  const body = document.getElementById('compare-body');
  if (!body) return;
  const a = state.compare.A, b = state.compare.B;
  if (!a || !b) {
    body.innerHTML = '<div class="text-muted" style="padding:28px;text-align:center;font-size:13px">在上方搜索框选择两个项目开始对比</div>';
    return;
  }
  const da = a.index._detail, db = b.index._detail;
  if (!da || !db) {
    body.innerHTML = '<div class="error" style="margin-top:12px">项目详情加载失败，请重试</div>';
    return;
  }
  body.innerHTML = `
    <div class="compare-grid">
      ${cmpCard('A', a.index, da)}
      ${cmpCard('B', b.index, db)}
    </div>
    <div class="cmp-chart">
      <div class="section-title">Price Trend · 年均 PSF</div>
      <div class="chart-wrap" style="height:300px"><canvas id="compareChart"></canvas></div>
    </div>
    <div class="compare-maps">
      <div class="cmp-map-card">
        <div class="cmp-map-title">📍 ${a.index.name}</div>
        <div class="map-container" id="cmpMapA" style="height:230px"></div>
      </div>
      <div class="cmp-map-card">
        <div class="cmp-map-title">📍 ${b.index.name}</div>
        <div class="map-container" id="cmpMapB" style="height:230px"></div>
      </div>
    </div>
  `;
  renderCompareChart(seriesOf(da), seriesOf(db), a.index.name, b.index.name);
  if (a.index.coord) initCompareMap('cmpMapA', a.index.coord, a.index.name, '#fbbf24');
  if (b.index.coord) initCompareMap('cmpMapB', b.index.coord, b.index.name, '#60a5fa');
}

// ── 单个指标卡 ──
function cmpCard(side, idx, detail) {
  const meta = SIDE_META[side];
  const isHDB = idx.type === 'HDB';
  const isEC = idx.type === 'EC';
  const badge = isHDB ? '<span class="tag-hdb">HDB</span>' : (isEC ? '<span class="tag-ec">EC</span>' : '<span class="tag">Private</span>');
  const st = detail.stats || {};
  const loc = isHDB ? idx.town : 'D' + (idx.district || st.districts?.[0] || '?');
  const psf = st.avgPsf1y || st.avgPsf || 0;
  const prox = detail.proximity || {};
  const yld = isHDB && state.hdbRentals?.byTown?.[idx.town]
    ? state.hdbRentals.byTown[idx.town].yieldPct : null;
  const yrs = st.years || [];
  const grow = fiveYearGrowth(seriesOf(detail));
  const yrsLabel = yrs.length ? `${yrs[0]}-${yrs[yrs.length - 1]}` : '';
  return `
    <div class="cmp-card">
      <div class="cmp-card-head">
        <span class="cmp-side-dot" style="background:${meta.color}"></span>
        ${badge} <b>${idx.name}</b>
      </div>
      <div class="cmp-card-sub">${loc} · ${fmtNum(st.totalTransactions || 0)} txns${yrsLabel ? ' · ' + yrsLabel : ''}</div>
      <div class="cmp-metrics">
        <div class="cmp-metric"><span class="cm-label">1yr PSF</span><span class="cm-val">$${fmtNum(psf)}</span></div>
        <div class="cmp-metric"><span class="cm-label">毛收益率</span><span class="cm-val">${yld != null ? yld + '%' : '—'}</span></div>
        <div class="cmp-metric"><span class="cm-label">最近地铁</span><span class="cm-val">${prox.nearestMrt ? prox.nearestMrt + ' ' + fmtNum(prox.nearestMrtDistM) + 'm' : '—'}</span></div>
        <div class="cmp-metric"><span class="cm-label">1km 学校</span><span class="cm-val">${prox.schoolCount1km != null ? prox.schoolCount1km : '—'}</span></div>
        <div class="cmp-metric"><span class="cm-label">价格涨幅（全期）</span><span class="cm-val ${grow ? (grow.pct >= 0 ? 'up' : 'down') : ''}">${grow ? (grow.pct >= 0 ? '+' : '') + grow.pct + '%' : '—'}</span></div>
        <div class="cmp-metric"><span class="cm-label">${grow ? grow.from + ' → ' + grow.to : '涨跌区间'}</span><span class="cm-val" style="font-size:12px;color:var(--text3)">${isHDB ? '99yr lease' : (st.tenureTypes?.[0] || '')}</span></div>
      </div>
    </div>`;
}

// ── 按年聚合 avg PSF ──
function seriesOf(detail) {
  const byYear = {};
  for (const t of detail.transactions || []) {
    const y = (t.sortDate || '').slice(0, 4);
    const psf = Number(t.pricePsf);
    if (!y || !psf) continue;
    if (!byYear[y]) byYear[y] = { sum: 0, n: 0 };
    byYear[y].sum += psf; byYear[y].n++;
  }
  return Object.entries(byYear).sort(([a], [b]) => a.localeCompare(b))
    .map(([year, d]) => ({ year, psf: Math.round(d.sum / d.n) }));
}

function fiveYearGrowth(series) {
  if (series.length < 2) return null;
  const from = series[0], to = series[series.length - 1];
  if (!from.psf || !to.psf) return null;
  return { pct: Math.round((to.psf - from.psf) / from.psf * 100), from: from.year, to: to.year };
}

// ── 位置小地图（独立于详情页的单地图管理，避免 state 冲突） ──
function initCompareMap(elId, coord, name, color) {
  const el = document.getElementById(elId);
  if (!el || typeof L === 'undefined') return;
  const map = L.map(el, { zoomControl: true }).setView([coord.lat, coord.lng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  L.circleMarker([coord.lat, coord.lng], {
    radius: 7, color, fillColor: color, fillOpacity: 0.8, weight: 2
  }).addTo(map).bindPopup(`<b>${name}</b>`).openPopup();
}
