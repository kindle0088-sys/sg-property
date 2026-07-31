/* === Private dashboard + District detail views === */
import { state } from '../state.js';
import { fmtNum, fmtPrice, showPsf, psfTrend } from '../utils.js';

// ── Investment metric helper (shared by district cards & detail) ──
export function invMetric(d) {
  const parts = [];
  if (d.grossYieldPct != null) {
    parts.push(`<span class="inv-yield">Yield ${d.grossYieldPct.toFixed(1)}%</span>`);
  }
  if (d.appreciation5y != null) {
    const v = d.appreciation5y;
    const cls = v >= 0 ? 'text-red' : 'text-green';
    parts.push(`<span class="${cls}">5y ${v >= 0 ? '+' : ''}${v.toFixed(1)}%</span>`);
  }
  return parts.length ? `<div class="d-inv">${parts.join(' · ')}</div>` : '';
}

// ── Private Dashboard view ──
export function renderPrivateDashboard() {
  const dists = state.districtsData;
  const sm = state.marketSummary;
  const hdbCount = state.hdbIndex.length;
  const hdbTxns = state.hdbIndex.reduce((s, p) => s + (p.totalTxns || 0), 0);
  const activeDists = dists.filter(d => d.projectCount > 0);

  // Top gainers/losers - projects sorted by avg psf change (approximate from district data)
  const topByVol = [...dists].sort((a, b) => b.totalTransactions - a.totalTransactions).slice(0, 5);
  const topByPsf = [...dists].filter(d => (d.avgPsf1y || d.avgPsf) > 0).sort((a, b) => (b.avgPsf1y || b.avgPsf) - (a.avgPsf1y || a.avgPsf)).slice(0, 5);

  document.getElementById('main').innerHTML = `
    <div class="hero">
      <h1>Singapore Property Dashboard</h1>
      <p>URA private condos &amp; landed properties · ${sm.totalProjects} projects · ${fmtNum(sm.totalTransactions)} transactions</p>
      <div class="kpi-row">
        <div class="kpi"><div class="val">${sm.totalProjects}</div><div class="lbl">Private Projects</div></div>
        <div class="kpi"><div class="val">${fmtNum(hdbCount)}</div><div class="lbl">HDB Blocks</div></div>
        <div class="kpi"><div class="val">${fmtNum(sm.totalTransactions)}</div><div class="lbl">Private Txns</div></div>
        <div class="kpi"><div class="val">${fmtNum(hdbTxns)}</div><div class="lbl">HDB Txns</div></div>
        <div class="kpi"><div class="val">$${fmtNum(sm.overallAvgPsf1y || sm.overallAvgPsf)}</div><div class="lbl">1yr Avg PSF</div></div>
        <div class="kpi"><div class="val">${activeDists.length}</div><div class="lbl">Districts</div></div>
      </div>
    </div>

    <div class="section-title">Search Projects</div>
    <div class="filter-bar">
      <button class="filter-btn active" data-filter="All" onclick="setFilter('All')">All</button>
      <button class="filter-btn" data-filter="Private" onclick="setFilter('Private')">Private</button>
      <button class="filter-btn" data-filter="HDB" onclick="setFilter('HDB')">HDB</button>
    </div>
    <div class="search-bar">
      <div class="search-wrap">
        <input type="text" id="search-input" placeholder="Search by project name, street, or district..." autocomplete="off" oninput="searchProjects(this.value)">
        <button class="search-clear" id="search-clear" onclick="clearSearch()" title="Clear search" aria-label="Clear search">✕</button>
      </div>
    </div>
    <div id="search-results" class="search-results"></div>

    <div class="section-title">
      Districts Overview
      <a href="#" onclick="navigate('/map');return false" class="map-link">🗺️ Open Map View</a>
    </div>
    <div class="district-row">
      ${dists.filter(d => d.projectCount > 0).map(d => `
        <div class="district-card" onclick="navigate('/district/${d.district}')">
          <div class="d-header">
            <span class="d-name">D${d.district} ${d.name}</span>
            <span class="d-sector ${d.sector.toLowerCase()}">${d.sector}</span>
          </div>
          <div class="d-psf">$${fmtNum(d.avgPsf1y || d.avgPsf || d.medianPsf)}<span class="d-psf-label">1yr avg</span></div>
          ${invMetric(d)}
          <div class="d-detail">
            <span>${d.projectCount} projects</span>
            <span>${fmtNum(d.totalTransactions)} txns</span>
          </div>
          ${d.rental ? `<div class="d-detail">Rental median: <span class="text-gold">$${fmtNum(d.rental.median)}</span></div>` : ''}
        </div>
      `).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:24px">
      <div>
        <div class="section-title">Top by Transaction Volume</div>
        <div class="table-wrap">
          <table>
            <tr><th>District</th><th>Name</th><th>Avg PSF</th><th>Transactions</th></tr>
            ${activeDists.sort((a,b)=>b.totalTransactions-a.totalTransactions).slice(0,10).map(d => `
              <tr onclick="navigate('/district/${d.district}')" style="cursor:pointer">
                <td class="text-gold">D${d.district}</td>
                <td>${d.name}</td>
                <td class="text-blue">$${showPsf(d)}</td>
                <td>${fmtNum(d.totalTransactions)}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      </div>
      <div>
        <div class="section-title">Top by Price (Median PSF)</div>
        <div class="table-wrap">
          <table>
            <tr><th>District</th><th>Name</th><th>Median PSF</th><th>Sector</th></tr>
            ${activeDists.sort((a,b)=>b.medianPsf-a.medianPsf).slice(0,10).map(d => `
              <tr onclick="navigate('/district/${d.district}')" style="cursor:pointer">
                <td class="text-gold">D${d.district}</td>
                <td>${d.name}</td>
                <td class="text-blue">$${fmtNum(d.medianPsf)}</td>
                <td><span class="tag ${d.sector.toLowerCase()}">${d.sector}</span></td>
              </tr>
            `).join('')}
          </table>
        </div>
      </div>
    </div>
  `;
}

// ── District detail view ──
export function renderDistrict(d) {
  const data = state.districtsData.find(x => x.district === parseInt(d));
  if (!data) {
    document.getElementById('main').innerHTML = `<div class="error">District D${d} not found</div>`;
    return;
  }

  const projects = state.projectsIndex.filter(p => p.district === data.district);

  document.getElementById('main').innerHTML = `
    <div class="project-hero">
      <a href="javascript:void(0)" onclick="navigate('/private')" style="font-size:13px">&larr; Back to Private</a>
      <h1>D${data.district} — ${data.name}</h1>
      <div class="sub">${data.sector} · ${data.projectCount} projects · ${fmtNum(data.totalTransactions)} transactions</div>
      <div class="project-meta">
        <div class="pm"><div class="pv">$${fmtNum(data.medianPsf)}</div><div class="pl">Median PSF</div></div>
        <div class="pm"><div class="pv">$${fmtNum(data.avgPsf1y || data.avgPsf)}</div><div class="pl">1yr Avg PSF</div></div>
        <div class="pm"><div class="pv">$${fmtNum(data.minPsf)}</div><div class="pl">Min PSF</div></div>
        <div class="pm"><div class="pv">$${fmtNum(data.maxPsf)}</div><div class="pl">Max PSF</div></div>
        ${data.rental ? `<div class="pm"><div class="pv">$${fmtNum(data.rental.median)}</div><div class="pl">Rental Median</div></div>` : ''}
        ${data.grossYieldPct != null ? `<div class="pm"><div class="pv" style="color:var(--gold)">${data.grossYieldPct.toFixed(1)}%</div><div class="pl">Gross Yield</div></div>` : ''}
        ${data.appreciation5y != null ? `<div class="pm"><div class="pv ${data.appreciation5y >= 0 ? 'text-red' : 'text-green'}">${data.appreciation5y >= 0 ? '+' : ''}${data.appreciation5y.toFixed(1)}%</div><div class="pl">5yr Appreciation</div></div>` : ''}
      </div>
      ${data.byYear ? `<div class="byyear-chips">${Object.entries(data.byYear).sort(([a],[b]) => a.localeCompare(b)).map(([y, v]) => `<span class="tag">${y}: $${fmtNum(v.avgPsf)}</span>`).join('')}</div>` : ''}
    </div>

    <div class="section-title">Projects in D${d} (${projects.length})</div>
    <div class="card-grid">
      ${projects.sort((a, b) => b.totalTxns - a.totalTxns).map(p => `
        <div class="card" onclick="navigate('/project/${p.id}')">
          <h3>${p.name}</h3>
          <div class="meta">${p.street || ''} ${p.avgPsf ? '· 1yr $' + showPsf(p) + ' psf' : ''}</div>
          <div class="stat">
            <span>PSF: <span class="stat-gold">$${showPsf(p)}</span></span>
            <span>Txns: <span class="stat-gold">${p.totalTxns}</span></span>
            <span>${p.years?.[0] || ''} - ${p.years?.[p.years.length-1] || ''}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
