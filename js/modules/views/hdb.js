/* === HDB dashboard + Town detail views === */
import { state } from '../state.js';
import { fmtNum, fmtPrice, slugifyTown, showPsf } from '../utils.js';

// ── HDB Dashboard view ──
export function renderHdbDashboard() {
  const sm = state.marketSummary;
  const towns = state.hdbTownsData;
  const townEntries = Object.entries(towns);
  const hdbCount = state.hdbIndex.length;
  const hdbTxns = state.hdbIndex.reduce((s, p) => s + (p.totalTxns || 0), 0);
  const hdbAvg = sm.hdbAvgPsf1y || sm.hdbAvgPsf || 0;

  // Town-level aggregates
  const sortedTowns = [...townEntries].sort((a, b) => b[1].totalTransactions - a[1].totalTransactions);

  document.getElementById('main').innerHTML = `
    <div class="hero">
      <h1>HDB Resale Market</h1>
      <p>data.gov.sg · ${townEntries.length} towns · ${fmtNum(hdbCount)} blocks · ${fmtNum(hdbTxns)} transactions</p>
      <div class="kpi-row">
        <div class="kpi"><div class="val">${townEntries.length}</div><div class="lbl">Towns</div></div>
        <div class="kpi"><div class="val">${fmtNum(hdbCount)}</div><div class="lbl">Blocks</div></div>
        <div class="kpi"><div class="val">${fmtNum(hdbTxns)}</div><div class="lbl">Transactions</div></div>
        <div class="kpi"><div class="val">$${fmtNum(hdbAvg)}</div><div class="lbl">Avg PSF</div></div>
        <div class="kpi"><div class="val">1990 - 2026</div><div class="lbl">Data Span</div></div>
      </div>
    </div>

    <div class="section-title">Search HDB Blocks</div>
    <div class="search-bar">
      <div class="search-wrap">
        <input type="text" id="search-input" placeholder="Search by block name, street, or town..." autocomplete="off" oninput="searchProjects(this.value)">
        <button class="search-clear" id="search-clear" onclick="clearSearch()" title="Clear search" aria-label="Clear search">✕</button>
      </div>
    </div>
    <div id="search-results" class="search-results"></div>

    <div class="section-title">Towns Overview</div>
    <div class="town-row">
      ${sortedTowns.map(([name, t]) => `
        <div class="town-card" onclick="navigate('/town/${slugifyTown(name)}')">
          <div class="t-header">
            <span class="t-name">${name}</span>
          </div>
          <div class="t-psf">$${fmtNum(t.avgPsf1y || t.avgPsf)}</div>
          <div class="t-detail">
            <span>${fmtNum(t.blocks)} blocks</span>
            <span>${fmtNum(t.totalTransactions)} txns</span>
          </div>
          <div class="t-flats">
            ${t.flatTypes.slice(0, 4).map(f => `<span class="tag-tiny">${f}</span>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:24px">
      <div>
        <div class="section-title">Top by Transaction Volume</div>
        <div class="table-wrap">
          <table>
            <tr><th>Town</th><th>Blocks</th><th>Avg PSF</th><th>Transactions</th></tr>
            ${sortedTowns.slice(0, 10).map(([name, t]) => `
              <tr onclick="navigate('/town/${slugifyTown(name)}')" style="cursor:pointer">
                <td class="text-gold">${name}</td>
                <td>${fmtNum(t.blocks)}</td>
                <td class="text-blue">$${fmtNum(t.avgPsf1y || t.avgPsf)}</td>
                <td>${fmtNum(t.totalTransactions)}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      </div>
      <div>
        <div class="section-title">Top by Avg PSF</div>
        <div class="table-wrap">
          <table>
            <tr><th>Town</th><th>Avg PSF</th><th>Blocks</th><th>Transactions</th></tr>
            ${[...townEntries].sort((a, b) => (b[1].avgPsf1y || b[1].avgPsf) - (a[1].avgPsf1y || a[1].avgPsf)).slice(0, 10).map(([name, t]) => `
              <tr onclick="navigate('/town/${slugifyTown(name)}')" style="cursor:pointer">
                <td class="text-gold">${name}</td>
                <td class="text-blue">$${fmtNum(t.avgPsf1y || t.avgPsf)}</td>
                <td>${fmtNum(t.blocks)}</td>
                <td>${fmtNum(t.totalTransactions)}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      </div>
    </div>
  `;
}

// ── Town detail view ──
export function renderTown(townSlug) {
  // Find town from slug (lowercase, hyphens)
  const townName = Object.keys(state.hdbTownsData).find(
    k => slugifyTown(k) === townSlug
  );
  if (!townName) {
    document.getElementById('main').innerHTML = `<div class="error">⚠️ Town "${townSlug}" not found</div>`;
    return;
  }
  const data = state.hdbTownsData[townName];
  const blocks = state.hdbIndex.filter(p => p.town === townName);

  document.getElementById('main').innerHTML = `
    <div class="project-hero">
      <a href="javascript:void(0)" onclick="navigate('/hdb')" style="font-size:13px">&larr; Back to HDB</a>
      <h1>${townName}</h1>
      <div class="sub">${fmtNum(data.blocks)} blocks · ${fmtNum(data.totalTransactions)} transactions · ${data.years[0] || '?'} - ${data.years[data.years.length-1] || '?'}</div>
      <div class="project-meta">
        <div class="pm"><div class="pv">${fmtNum(data.blocks)}</div><div class="pl">Blocks</div></div>
        <div class="pm"><div class="pv">$${fmtNum(data.avgPsf1y || data.avgPsf)}</div><div class="pl">1yr Avg PSF</div></div>
        <div class="pm"><div class="pv">$${fmtNum(data.minPsf)}</div><div class="pl">Min PSF</div></div>
        <div class="pm"><div class="pv">$${fmtNum(data.maxPsf)}</div><div class="pl">Max PSF</div></div>
        <div class="pm"><div class="pv">${fmtNum(data.totalTransactions)}</div><div class="pl">Total Txns</div></div>
      </div>
      <div class="flat-tags">
        ${data.flatTypes.map(f => `<span class="tag">${f}</span>`).join(' ')}
      </div>
    </div>

    <div class="section-title">Blocks in ${townName} (${blocks.length})</div>
    <div class="card-grid">
      ${blocks.sort((a, b) => b.totalTxns - a.totalTxns).map(p => `
        <div class="card" onclick="navigate('/project/${p.id}')">
          <h3>${p.name}${p.demolished ? ' <span class="tag-demolished" title="已不在 HDB 现行建筑数据库中">已拆</span>' : ''}</h3>
          <div class="meta">${p.street || ''} ${p.avgPsf ? '· 1yr $' + showPsf(p) + ' psf' : ''}</div>
          <div class="stat">
            <span>PSF: <span class="stat-gold">$${showPsf(p)}</span></span>
            <span>Txns: <span class="stat-gold">${fmtNum(p.totalTxns)}</span></span>
            <span>${p.years?.[0] || ''} - ${p.years?.[p.years.length-1] || ''}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
