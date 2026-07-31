/* === Overview (compact landing) view === */
import { state } from '../state.js';
import { fmtNum } from '../utils.js';

export function renderOverview() {
  const sm = state.marketSummary;
  const hdbCount = state.hdbIndex.length;
  const hdbTxns = state.hdbIndex.reduce((s, p) => s + (p.totalTxns || 0), 0);
  const hdbTownsArr = Object.keys(state.hdbTownsData);
  const hdbAvg = sm.hdbAvgPsf1y || sm.hdbAvgPsf || 0;
  const dists = state.districtsData.filter(d => d.projectCount > 0);

  document.getElementById('main').innerHTML = `
    <div class="hero">
      <h1>Singapore Property Dashboard</h1>
      <p>Private properties (URA) + HDB resale (data.gov.sg)</p>
      <div class="kpi-row">
        <div class="kpi"><div class="val">${sm.totalProjects}</div><div class="lbl">Private Projects</div></div>
        <div class="kpi"><div class="val">${fmtNum(hdbCount)}</div><div class="lbl">HDB Blocks</div></div>
        <div class="kpi"><div class="val">${fmtNum(sm.totalTransactions)}</div><div class="lbl">Private Txns</div></div>
        <div class="kpi"><div class="val">${fmtNum(hdbTxns)}</div><div class="lbl">HDB Txns</div></div>
        <div class="kpi"><div class="val">$${fmtNum(sm.overallAvgPsf1y || sm.overallAvgPsf)}</div><div class="lbl">1yr Avg PSF</div></div>
        <div class="kpi"><div class="val">$${fmtNum(hdbAvg)}</div><div class="lbl">HDB Avg PSF</div></div>
        <div class="kpi"><div class="val">${dists.length}</div><div class="lbl">Districts</div></div>
        <div class="kpi"><div class="val">${hdbTownsArr.length}</div><div class="lbl">Towns</div></div>
      </div>
    </div>

    <div class="section-title">Search All Projects</div>
    <div class="search-bar">
      <div class="search-wrap">
        <input type="text" id="search-input" placeholder="Search by project name, street, or town..." autocomplete="off" oninput="searchProjects(this.value)">
        <button class="search-clear" id="search-clear" onclick="clearSearch()" title="Clear search" aria-label="Clear search">✕</button>
      </div>
    </div>
    <div id="search-results" class="search-results"></div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:28px">
      <div class="overview-card" onclick="navigate('/private')" style="cursor:pointer">
        <div class="overview-icon" style="background:linear-gradient(135deg,#1e3a5f,#0f1f3a)">🏢</div>
        <h2>Private Properties</h2>
        <div class="ov-stat"><span class="ov-label">Projects</span><span class="ov-val">${sm.totalProjects}</span></div>
        <div class="ov-stat"><span class="ov-label">Transactions</span><span class="ov-val">${fmtNum(sm.totalTransactions)}</span></div>
        <div class="ov-stat"><span class="ov-label">Avg PSF</span><span class="ov-val">$${fmtNum(sm.overallAvgPsf)}</span></div>
        <div class="ov-stat"><span class="ov-label">Data Span</span><span class="ov-val">5 years (URA API)</span></div>
        <div class="ov-stat"><span class="ov-label">Districts</span><span class="ov-val">${dists.length} (D01-D28)</span></div>
        <div class="overview-btn" style="background:linear-gradient(135deg,#3b82f6,#1d4ed8)">Explore Private &rarr;</div>
      </div>
      <div class="overview-card" onclick="navigate('/hdb')" style="cursor:pointer">
        <div class="overview-icon" style="background:linear-gradient(135deg,#1a3a2a,#0f281a)">🏘️</div>
        <h2>HDB Resale</h2>
        <div class="ov-stat"><span class="ov-label">Blocks</span><span class="ov-val">${fmtNum(hdbCount)}</span></div>
        <div class="ov-stat"><span class="ov-label">Transactions</span><span class="ov-val">${fmtNum(hdbTxns)}</span></div>
        <div class="ov-stat"><span class="ov-label">Avg PSF</span><span class="ov-val">$${fmtNum(hdbAvg)}</span></div>
        <div class="ov-stat"><span class="ov-label">Data Span</span><span class="ov-val">35 years (1990-2026)</span></div>
        <div class="ov-stat"><span class="ov-label">Towns</span><span class="ov-val">${hdbTownsArr.length}</span></div>
        <div class="overview-btn" style="background:linear-gradient(135deg,#22c55e,#15803d)">Explore HDB &rarr;</div>
      </div>
    </div>
  `;
}
