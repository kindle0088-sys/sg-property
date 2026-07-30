/* === Singapore Property Dashboard — SPA App === */

const DATA = 'data/';
let projectsIndex = [];
let districtsData = [];
let marketSummary = null;
let hdbIndex = [];
let hdbTownsData = {};

// ── Page router (hashchange handler) ──
function router() {
  const hash = (location.hash.slice(1) || '/').replace(/^\/+/, '');
  routeTo(hash);
}

// ── Load data ──
async function loadData() {
  const [idx, dists, summ, hdbTowns] = await Promise.all([
    fetchJSON('property-index.json'),
    fetchJSON('districts.json'),
    fetchJSON('market-summary.json'),
    fetchJSON('hdb-towns.json').catch(() => ({}))
  ]);
  projectsIndex = idx;
  districtsData = dists;
  marketSummary = summ;
  hdbTownsData = hdbTowns;
  hdbIndex = idx.filter(p => p.type === 'HDB');
}

async function fetchJSON(file) {
  const resp = await fetch(DATA + file);
  if (!resp.ok) throw new Error(`Failed to load ${file}: ${resp.status}`);
  return resp.json();
}

async function fetchProject(id) {
  // HDB projects are in data/hdb/ directory
  const prefix = id.startsWith('hdb-') ? 'hdb/' : 'projects/';
  const resp = await fetch(`${DATA}${prefix}${id}.json`);
  if (!resp.ok) throw new Error(`Project not found: ${id}`);
  return resp.json();
}

function showLoading() {
  document.getElementById('main').innerHTML =
    `<div class="loading"><div class="spinner"></div>Loading...</div>`;
}

// ── Private Dashboard view ──
function renderPrivateDashboard() {
  const dists = districtsData;
  const sm = marketSummary;
  const hdbCount = hdbIndex.length;
  const hdbTxns = hdbIndex.reduce((s, p) => s + (p.totalTxns || 0), 0);
  const activeDists = dists.filter(d => d.projectCount > 0);

  // Top gainers/losers - projects sorted by avg psf change (approximate from district data)
  const topByVol = [...dists].sort((a, b) => b.totalTransactions - a.totalTransactions).slice(0, 5);
  const topByPsf = [...dists].filter(d => d.avgPsf > 0).sort((a, b) => b.avgPsf - a.avgPsf).slice(0, 5);

  document.getElementById('main').innerHTML = `
    <div class="hero">
      <h1>Singapore Property Dashboard</h1>
      <p>URA private condos &amp; landed properties · ${sm.totalProjects} projects · ${fmtNum(sm.totalTransactions)} transactions</p>
      <div class="kpi-row">
        <div class="kpi"><div class="val">${sm.totalProjects}</div><div class="lbl">Private Projects</div></div>
        <div class="kpi"><div class="val">${fmtNum(hdbCount)}</div><div class="lbl">HDB Blocks</div></div>
        <div class="kpi"><div class="val">${fmtNum(sm.totalTransactions)}</div><div class="lbl">Private Txns</div></div>
        <div class="kpi"><div class="val">${fmtNum(hdbTxns)}</div><div class="lbl">HDB Txns</div></div>
        <div class="kpi"><div class="val">$${fmtNum(sm.overallAvgPsf)}</div><div class="lbl">Private Avg PSF</div></div>
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
      <input type="text" id="search-input" placeholder="Search by project name, street, or district..." oninput="searchProjects(this.value)">
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
          <div class="d-psf">$${fmtNum(d.medianPsf)}</div>
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
                <td class="text-blue">$${fmtNum(d.avgPsf)}</td>
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

// ── Overview (compact landing) ──
function renderOverview() {
  const sm = marketSummary;
  const hdbCount = hdbIndex.length;
  const hdbTxns = hdbIndex.reduce((s, p) => s + (p.totalTxns || 0), 0);
  const hdbTownsArr = Object.keys(hdbTownsData);
  const hdbAvg = sm.hdbAvgPsf || 0;
  const dists = districtsData.filter(d => d.projectCount > 0);

  document.getElementById('main').innerHTML = `
    <div class="hero">
      <h1>Singapore Property Dashboard</h1>
      <p>Private properties (URA) + HDB resale (data.gov.sg)</p>
      <div class="kpi-row">
        <div class="kpi"><div class="val">${sm.totalProjects}</div><div class="lbl">Private Projects</div></div>
        <div class="kpi"><div class="val">${fmtNum(hdbCount)}</div><div class="lbl">HDB Blocks</div></div>
        <div class="kpi"><div class="val">${fmtNum(sm.totalTransactions)}</div><div class="lbl">Private Txns</div></div>
        <div class="kpi"><div class="val">${fmtNum(hdbTxns)}</div><div class="lbl">HDB Txns</div></div>
        <div class="kpi"><div class="val">$${fmtNum(sm.overallAvgPsf)}</div><div class="lbl">Private Avg PSF</div></div>
        <div class="kpi"><div class="val">$${fmtNum(hdbAvg)}</div><div class="lbl">HDB Avg PSF</div></div>
        <div class="kpi"><div class="val">${dists.length}</div><div class="lbl">Districts</div></div>
        <div class="kpi"><div class="val">${hdbTownsArr.length}</div><div class="lbl">Towns</div></div>
      </div>
    </div>

    <div class="section-title">Search All Projects</div>
    <div class="search-bar">
      <input type="text" id="search-input" placeholder="Search by project name, street, or town..." oninput="searchProjects(this.value)">
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

// ── HDB Dashboard view ──
function renderHdbDashboard() {
  const sm = marketSummary;
  const towns = hdbTownsData;
  const townEntries = Object.entries(towns);
  const hdbCount = hdbIndex.length;
  const hdbTxns = hdbIndex.reduce((s, p) => s + (p.totalTxns || 0), 0);
  const hdbAvg = sm.hdbAvgPsf || 0;

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
      <input type="text" id="search-input" placeholder="Search by block name, street, or town..." oninput="searchProjects(this.value)">
    </div>
    <div id="search-results" class="search-results"></div>

    <div class="section-title">Towns Overview</div>
    <div class="town-row">
      ${sortedTowns.map(([name, t]) => `
        <div class="town-card" onclick="navigate('/town/${name.toLowerCase().replace(/\\s+/g, '-')}')">
          <div class="t-header">
            <span class="t-name">${name}</span>
          </div>
          <div class="t-psf">$${fmtNum(t.avgPsf)}</div>
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
              <tr onclick="navigate('/town/${name.toLowerCase().replace(/\\s+/g, '-')}')" style="cursor:pointer">
                <td class="text-gold">${name}</td>
                <td>${fmtNum(t.blocks)}</td>
                <td class="text-blue">$${fmtNum(t.avgPsf)}</td>
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
            ${[...townEntries].sort((a, b) => b[1].avgPsf - a[1].avgPsf).slice(0, 10).map(([name, t]) => `
              <tr onclick="navigate('/town/${name.toLowerCase().replace(/\\s+/g, '-')}')" style="cursor:pointer">
                <td class="text-gold">${name}</td>
                <td class="text-blue">$${fmtNum(t.avgPsf)}</td>
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
function renderTown(townSlug) {
  // Find town from slug (lowercase, hyphens)
  const townName = Object.keys(hdbTownsData).find(
    k => k.toLowerCase().replace(/\\s+/g, '-') === townSlug
  );
  if (!townName) {
    document.getElementById('main').innerHTML = `<div class="error">⚠️ Town "${townSlug}" not found</div>`;
    return;
  }
  const data = hdbTownsData[townName];
  const blocks = hdbIndex.filter(p => p.town === townName);

  document.getElementById('main').innerHTML = `
    <div class="project-hero">
      <a href="javascript:void(0)" onclick="navigate('/hdb')" style="font-size:13px">&larr; Back to HDB</a>
      <h1>${townName}</h1>
      <div class="sub">${fmtNum(data.blocks)} blocks · ${fmtNum(data.totalTransactions)} transactions · ${data.years[0] || '?'} - ${data.years[data.years.length-1] || '?'}</div>
      <div class="project-meta">
        <div class="pm"><div class="pv">${fmtNum(data.blocks)}</div><div class="pl">Blocks</div></div>
        <div class="pm"><div class="pv">$${fmtNum(data.avgPsf)}</div><div class="pl">Avg PSF</div></div>
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
          <h3>${p.name}</h3>
          <div class="meta">${p.street || ''} ${p.avgPsf ? '· avg $' + fmtNum(p.avgPsf) + ' psf' : ''}</div>
          <div class="stat">
            <span>PSF: <span class="stat-gold">$${fmtNum(p.avgPsf) || '-'}</span></span>
            <span>Txns: <span class="stat-gold">${fmtNum(p.totalTxns)}</span></span>
            <span>${p.years?.[0] || ''} - ${p.years?.[p.years.length-1] || ''}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Project detail view ──
async function renderProject(id) {
  const p = await fetchProject(id);
  const t = p.transactions || [];

  // Stats
  const psfArr = t.map(x => x.pricePsf).filter(Boolean);
  const PAGE_SIZE = 25;
  const txPage = (window._txPages && window._txPages[p.id]) || 0;
  const pageStart = txPage * PAGE_SIZE;
  const pageRows = t.slice(pageStart, pageStart + PAGE_SIZE);
  const totalPages = Math.ceil(t.length / PAGE_SIZE);
  const byType = {};
  const byYear = {};
  t.forEach(x => {
    const yr = (x.sortDate || '').substring(0, 4) || (x.contractDate || '').substring(0, 4);
    if (yr) { byYear[yr] = (byYear[yr] || 0) + 1; }
    const pt = x.propertyType || 'Unknown';
    if (!byType[pt]) byType[pt] = { count: 0, sumPsf: 0 };
    byType[pt].count++;
    byType[pt].sumPsf += x.pricePsf || 0;
  });

  document.getElementById('main').innerHTML = `
    <div class="project-hero">
      <a href="javascript:void(0)" onclick="navigate('/private')" style="font-size:13px">&larr; Back to Private</a>
      <h1>${p.name}</h1>
      <div class="sub">${p.street}${p.marketSegment ? ' · ' + p.marketSegment : ''}</div>
      <div class="project-meta">
        <div class="pm"><div class="pv">$${fmtNum(p.stats.avgPsf)}</div><div class="pl">Avg PSF</div></div>
        <div class="pm"><div class="pv">$${fmtNum(p.stats.minPsf)}</div><div class="pl">Min PSF</div></div>
        <div class="pm"><div class="pv">$${fmtNum(p.stats.maxPsf)}</div><div class="pl">Max PSF</div></div>
        <div class="pm"><div class="pv">${fmtNum(p.stats.totalTransactions)}</div><div class="pl">Transactions</div></div>
        <div class="pm"><div class="pv">${p.fmtLastDate || p.stats.dateRange?.max?.substring(0,7) || 'N/A'}</div><div class="pl">Latest</div></div>
        <div class="pm"><div class="pv">${p.fmtFirstDate || p.stats.dateRange?.min?.substring(0,7) || 'N/A'}</div><div class="pl">Earliest</div></div>
      </div>
      <div>${(p.stats.propertyTypes || []).map(t => `<span class="tag">${t}</span>`).join('')}
      ${(p.stats.districts || []).map(d => `<span class="tag ccr">D${d}</span>`).join('')}
      ${(p.stats.tenureTypes || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
    </div>

    <div class="tabs">
      <div class="tab active" onclick="switchTab(this,'txns')">Transactions</div>
      <div class="tab" onclick="switchTab(this,'chart')">Price Trend</div>
      <div class="tab" onclick="switchTab(this,'map')">Location</div>
    </div>

    <div id="tab-txns" class="tab-content active">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Type</th><th>Area (sqf)</th><th>PSF</th><th>Price</th><th>Floor</th><th>Sale Type</th></tr></thead>
          <tbody>
            ${pageRows.map(x => `
              <tr>
                <td class="text-muted">${x.fmtDate || x.contractDate || '-'}</td>
                <td>${x.propertyType || '-'}</td>
                <td>${x.areaSqf || '-'}</td>
                <td class="${x.pricePsf > p.stats.avgPsf ? 'text-red' : 'text-green'}">$${fmtNum(x.pricePsf)}</td>
                <td>${fmtPrice(x.price)}</td>
                <td class="text-muted">${x.floorRange || '-'}</td>
                <td>${saleTypeLabel(x.typeOfSale)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${t.length > PAGE_SIZE ? `
        <div class="pagination">
          <button class="page-btn" onclick="pageTxns('${p.id}', ${txPage - 1})" ${txPage === 0 ? 'disabled' : ''}>&larr; Prev</button>
          <span class="page-info">Page ${txPage + 1} of ${totalPages} · ${t.length} transactions</span>
          <button class="page-btn" onclick="pageTxns('${p.id}', ${txPage + 1})" ${txPage >= totalPages - 1 ? 'disabled' : ''}>Next &rarr;</button>
        </div>
        ` : t.length > 0 ? `<div class="text-muted" style="text-align:center;padding:8px;font-size:12px">${t.length} transaction${t.length > 1 ? 's' : ''}</div>` : ''}
      </div>
    </div>

    <div id="tab-chart" class="tab-content">
      <div class="chart-container"><canvas id="priceChart"></canvas></div>
      <div class="highlight-box">
        <strong>Unit Distribution:</strong>
        ${Object.entries(byType).map(([k, v]) => `${k}: ${v.count} units`).join(' · ')}
      </div>
    </div>

    <div id="tab-map" class="tab-content">
      <div class="map-container" id="projectMap"></div>
    </div>
  `;

  // Render chart — sort by sortDate (yyyy-mm) for proper cross-year ordering
  const sorted = [...t].filter(x => x.sortDate).sort((a, b) => a.sortDate.localeCompare(b.sortDate));
  renderPriceChart(sorted);

  // Render map
  if (p.coord) renderProjectMap(p.coord, p.name);
}

// ── District view ──
function renderDistrict(d) {
  const data = districtsData.find(x => x.district === parseInt(d));
  if (!data) {
    document.getElementById('main').innerHTML = `<div class="error">District D${d} not found</div>`;
    return;
  }

  const projects = projectsIndex.filter(p => p.district === data.district);

  document.getElementById('main').innerHTML = `
    <div class="project-hero">
      <a href="javascript:void(0)" onclick="navigate('/private')" style="font-size:13px">&larr; Back to Private</a>
      <h1>D${data.district} — ${data.name}</h1>
      <div class="sub">${data.sector} · ${data.projectCount} projects · ${fmtNum(data.totalTransactions)} transactions</div>
      <div class="project-meta">
        <div class="pm"><div class="pv">$${fmtNum(data.medianPsf)}</div><div class="pl">Median PSF</div></div>
        <div class="pm"><div class="pv">$${fmtNum(data.avgPsf)}</div><div class="pl">Avg PSF</div></div>
        <div class="pm"><div class="pv">$${fmtNum(data.minPsf)}</div><div class="pl">Min PSF</div></div>
        <div class="pm"><div class="pv">$${fmtNum(data.maxPsf)}</div><div class="pl">Max PSF</div></div>
        ${data.rental ? `<div class="pm"><div class="pv">$${fmtNum(data.rental.median)}</div><div class="pl">Rental Median</div></div>` : ''}
      </div>
    </div>

    <div class="section-title">Projects in D${d} (${projects.length})</div>
    <div class="card-grid">
      ${projects.sort((a, b) => b.totalTxns - a.totalTxns).map(p => `
        <div class="card" onclick="navigate('/project/${p.id}')">
          <h3>${p.name}</h3>
          <div class="meta">${p.street || ''} ${p.avgPsf ? '· avg $' + fmtNum(p.avgPsf) + ' psf' : ''}</div>
          <div class="stat">
            <span>PSF: <span class="stat-gold">$${fmtNum(p.avgPsf) || '-'}</span></span>
            <span>Txns: <span class="stat-gold">${p.totalTxns}</span></span>
            <span>${p.years?.[0] || ''} - ${p.years?.[p.years.length-1] || ''}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Map view ──
function renderMapView() {
  document.getElementById('main').innerHTML = `
    <div class="project-hero">
      <a href="#" onclick="navigate('/private');return false" style="font-size:13px">&larr; Back to Private</a>
      <h1>Project Map</h1>
      <div class="sub" id="map-subtitle">${projectsIndex.filter(p=>p.coord).length} projects with coordinates</div>
    </div>
    <div class="map-toolbar">
      <div class="map-search-wrap">
        <input type="text" id="map-search-input" class="map-search" placeholder="Search projects on map..." oninput="filterMapMarkers(this.value)">
        <span class="map-search-icon">🔍</span>
      </div>
      <button class="map-fullscreen-btn" onclick="toggleMapFullscreen()" title="Toggle fullscreen">⛶ Fullscreen</button>
    </div>
    <div class="map-container" id="fullMap" style="height:550px"></div>
    <div id="map-status" class="text-muted" style="text-align:center;padding:6px;font-size:12px"></div>
  `;
  try {
    renderFullMap();
  } catch (e) {
    document.getElementById('main').innerHTML +=
      `<div class="error" style="margin-top:12px">⚠️ Map failed to load: ${e.message}</div>`;
  }
}

// ── HDB project detail view ──
async function renderHdbProject(id) {
  const p = projectsIndex.find(x => x.id === id);
  if (!p) { document.getElementById('main').innerHTML = '<div class="error">⚠️ Project not found</div>'; return; }

  try {
    const data = await fetchProject(id);
    const tx = data.transactions || [];
    const st = data.stats;

    // Stats
    const psfArr = tx.map(x => x.pricePsf).filter(Boolean);
    const byYear = {};
    tx.forEach(x => {
      const yr = (x.month || '').substring(0, 4);
      if (yr) byYear[yr] = (byYear[yr] || 0) + 1;
    });

    // Pagination
    const PAGE_SIZE = 25;
    let currentPage = parseInt(new URLSearchParams(window.location.hash.split('?')[1]).get('page')) || 0;

    function goToPage(page) {
      currentPage = page;
      navigate('/project/' + id + '?page=' + page);
    }

    function renderTable(page) {
      const start = page * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const pageTx = tx.slice(start, end);
      const totalPages = Math.ceil(tx.length / PAGE_SIZE);
      return `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Month</th><th>Type</th><th>Area (sqf)</th><th>PSF</th><th>Price</th><th>Storey</th><th>Rem Lease</th></tr></thead>
            <tbody>
              ${pageTx.map(x => `
                <tr>
                  <td class="text-muted">${x.fmtDate || x.contractDate || '-'}</td>
                  <td>${x.flatType || '-'}</td>
                  <td>${x.floorAreaSqf || '-'}</td>
                  <td class="${x.pricePsf > st.avgPsf ? 'text-red' : 'text-green'}">$${fmtNum(x.pricePsf)}</td>
                  <td>${fmtPrice(x.resalePrice)}</td>
                  <td class="text-muted">${x.storeyRange || '-'}</td>
                  <td class="text-muted">${x.remainingLease != null ? x.remainingLease + ' yrs' : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ${tx.length > PAGE_SIZE ? `
        <div class="pagination">
          <button ${page === 0 ? 'disabled' : ''} onclick="pageHdb('${id}', ${page-1})">&larr; Prev</button>
          <span>Page ${page+1} of ${totalPages} · ${fmtNum(tx.length)} transactions</span>
          <button ${page >= totalPages-1 ? 'disabled' : ''} onclick="pageHdb('${id}', ${page+1})">Next &rarr;</button>
        </div>` : ''}
      `;
    }

    document.getElementById('main').innerHTML = `
      <div class="project-hero">
        <a href="#" onclick="navigate('/hdb')" style="font-size:13px">&larr; Back to HDB</a>
        <h1><span class="tag-hdb" style="font-size:14px;vertical-align:middle;margin-right:8px">HDB</span>${data.name}</h1>
        <div class="sub">${data.town} · ${data.street} · Block ${data.block} · ${st.years[0] || '?'} - ${st.years[st.years.length-1] || '?'}</div>
        <div class="project-meta">
          <div class="pm"><div class="pv">${fmtNum(st.totalTransactions)}</div><div class="pl">Total Transactions</div></div>
          <div class="pm"><div class="pv">$${fmtNum(st.avgPsf)}</div><div class="pl">Avg PSF</div></div>
          <div class="pm"><div class="pv">$${fmtNum(st.minPsf)}</div><div class="pl">Min PSF</div></div>
          <div class="pm"><div class="pv">$${fmtNum(st.maxPsf)}</div><div class="pl">Max PSF</div></div>
          <div class="pm"><div class="pv">${fmtPrice(st.minPrice)}</div><div class="pl">Min Price</div></div>
          <div class="pm"><div class="pv">${fmtPrice(st.maxPrice)}</div><div class="pl">Max Price</div></div>
        </div>
        <div class="flat-tags">
          ${(data.flatTypes || []).map(f => `<span class="tag">${f}</span>`).join(' ')}
          ${(data.flatModels || []).slice(0, 3).map(m => `<span class="tag tag-model">${m}</span>`).join(' ')}
        </div>
      </div>

      <div class="tab-bar">
        <span class="tab active" onclick="switchTab(this,'txns')">Transactions (${fmtNum(tx.length)})</span>
        <span class="tab" onclick="switchTab(this,'chart')">Price Trend</span>
      </div>

      <div id="tab-txns" class="tab-content active">
        ${renderTable(currentPage)}
      </div>

      <div id="tab-chart" class="tab-content">
        <div class="chart-wrap">
          <canvas id="priceChart"></canvas>
        </div>
      </div>
    `;

    // Render chart
    const sorted = [...tx].filter(x => x.sortDate).sort((a, b) => a.sortDate.localeCompare(b.sortDate));
    renderHdbChart(sorted);
  } catch (e) {
    document.getElementById('main').innerHTML = `<div class="error">⚠️ ${e.message}</div>`;
  }
}

function renderHdbChart(transactions) {
  // Group by month — use sortDate (yyyy-mm) for proper ordering
  const byMonth = {};
  transactions.forEach(t => {
    const m = t.sortDate || '';
    if (!m) return;
    if (!byMonth[m]) byMonth[m] = { prices: [], psfs: [], count: 0 };
    byMonth[m].prices.push(t.resalePrice);
    byMonth[m].psfs.push(t.pricePsf);
    byMonth[m].count++;
  });

  const labels = Object.keys(byMonth).sort();
  const avgPsfData = labels.map(m => {
    const arr = byMonth[m].psfs.filter(Boolean);
    return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  });
  const countData = labels.map(m => byMonth[m].count);

  try {
    const ctx = document.getElementById('priceChart')?.getContext('2d');
    if (!ctx) return;
    if (window._priceChart) window._priceChart.destroy();
    window._priceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'HDB Resale Price (bar)', data: countData, backgroundColor: 'rgba(34,197,94,0.3)', order: 2, yAxisID: 'y1' },
          { label: 'Avg PSF', data: avgPsfData, borderColor: '#fbbf24', backgroundColor: '#fbbf24', type: 'line', order: 1, yAxisID: 'y', tension: 0.3, pointRadius: 3 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
        scales: {
          x: { ticks: { color: '#64748b', maxRotation: 45, maxTicksLimit: 20 } },
          y: { position: 'left', ticks: { color: '#64748b', callback: v => '$' + v } },
          y1: { position: 'right', grid: { display: false }, ticks: { color: '#64748b' } }
        }
      }
    });
  } catch(e) { /* chart fail silently */ }
}

// ── Map search filtering ──
function filterMapMarkers(q) {
  const ql = (q || '').toLowerCase().trim();
  if (!window._mapMarkers) return;
  let visible = 0;
  const total = window._mapMarkers.length;
  window._mapMarkers.forEach(m => {
    const match = !ql || m.name.toLowerCase().includes(ql) || (m.street || '').toLowerCase().includes(ql);
    if (match) {
      if (m.marker) m.marker.addTo(window._mapCluster || window._map);
      visible++;
    } else {
      if (m.marker && window._mapCluster) window._mapCluster.removeLayer(m.marker);
      else if (m.marker && window._map) m.marker.remove();
    }
  });
  document.getElementById('map-subtitle').textContent = ql
    ? visible + ' of ' + total + ' projects match "' + ql + '"'
    : total + ' projects with coordinates';
  document.getElementById('map-status').textContent = visible + ' markers visible';
}

// ── Map fullscreen ──
function toggleMapFullscreen() {
  const el = document.getElementById('fullMap');
  if (!el) return;
  if (!document.fullscreenElement) {
    el.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

// ── Search ──
function searchProjects(q) {
  const el = document.getElementById('search-results');
  if (!el) return;
  const ql = (q || '').toLowerCase().trim();
  if (!ql) { el.innerHTML = ''; return; }

  const results = projectsIndex
    .filter(p => p.name?.toLowerCase().includes(ql) || (p.street || p.town || '').toLowerCase().includes(ql))
    .slice(0, 20);

  if (!results.length) {
    el.innerHTML = '<div class="text-muted" style="padding:8px;font-size:13px">No results found</div>';
    return;
  }

  el.innerHTML = results.map(p => {
    const isHDB = p.type === 'HDB';
    return `
    <div class="search-result-item" onclick="navigate('/project/${p.id}')">
      <div class="sr-name">${isHDB ? '<span class="tag-hdb">HDB</span> ' : ''}${highlight(p.name, ql)}</div>
      <div class="sr-meta">${isHDB ? p.town : 'D' + p.district} · $${fmtNum(p.avgPsf) || '-'} psf · ${fmtNum(p.totalTxns)} txns ${p.years?.length ? '· ' + p.years[0] + '-' + p.years[p.years.length-1] : ''}</div>
    </div>`;
  }).join('');
}

function highlight(text, query) {
  if (!text || !query) return text || '';
  const idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return text;
  return text.slice(0, idx) + '<strong style="color:var(--gold)">' + text.slice(idx, idx + query.length) + '</strong>' + text.slice(idx + query.length);
}

// ── Navigation ──
function navigate(path) {
  // Set hash for bookmarkability
  location.hash = '#' + path;
  // Directly call the router (reliable across all browsers)
  routeTo(path);
}

// Route to a path directly (no hash dependency)
async function routeTo(path) {
  const parts = path.replace(/^\/+/, '').split('/');
  const p = parts[0] || '';
  const r = parts.slice(1);

  try {
    // If on initial load, show a loading state
    if (!projectsIndex.length) {
      document.getElementById('main').innerHTML =
        `<div class="loading"><div class="spinner"></div>Loading...</div>`;
      await loadData();
      if (!projectsIndex.length) {
        document.getElementById('main').innerHTML =
          `<div class="error">⚠️ Failed to load property data. Please check your network connection and try refreshing.</div>`;
        return;
      }
    }

    // Update nav active state
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('nav-active'));
    const pages = { overview:0, private:1, hdb:2, map:3 };
    const navIdx = pages[p];
    if (navIdx !== undefined) {
      document.querySelectorAll('nav a')[navIdx]?.classList.add('nav-active');
    }

    if (p === 'project' && r[0]) {
      const isHdb = r[0].startsWith('hdb-');
      if (isHdb) await renderHdbProject(r[0]);
      else await renderProject(r[0]);
    } else if (p === 'district' && r[0]) {
      renderDistrict(r[0]);
    } else if (p === 'town' && r[0]) {
      renderTown(r[0]);
    } else if (p === 'map') {
      renderMapView();
    } else if (p === 'private') {
      renderPrivateDashboard();
    } else if (p === 'hdb') {
      renderHdbDashboard();
    } else {
      renderOverview();
    }
  } catch (err) {
    console.error('Route error:', err);
    document.getElementById('main').innerHTML =
      `<div class="error">⚠️ ${err.message}</div>`;
  }
}
// ── Tab switching ──
function switchTab(el, id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const tc = document.getElementById('tab-' + id);
  if (tc) tc.classList.add('active');
}

// ── Pagination ──
function pageTxns(projectId, page) {
  // Store page in a global map
  if (!window._txPages) window._txPages = {};
  window._txPages[projectId] = page;
  renderProject(projectId);
}

function pageHdb(projectId, page) {
  navigate('/project/' + projectId + '?page=' + page);
}

// ── Charts ──
function renderPriceChart(transactions) {
  const canvas = document.getElementById('priceChart');
  if (!canvas) return;

  // Group by month — use sortDate (yyyy-mm) for proper ordering
  const byMonth = {};
  transactions.forEach(t => {
    const m = (t.sortDate || '').substring(0, 7);
    if (!m) return;
    if (!byMonth[m]) byMonth[m] = { prices: [], psfs: [], count: 0 };
    byMonth[m].prices.push(t.price);
    byMonth[m].psfs.push(t.pricePsf);
    byMonth[m].count++;
  });

  const labels = Object.keys(byMonth).sort();
  const avgPsf = labels.map(m => {
    const d = byMonth[m];
    return Math.round(d.psfs.reduce((a, b) => a + b, 0) / d.psfs.length);
  });
  const volumes = labels.map(m => byMonth[m].count);

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Avg PSF',
          data: avgPsf,
          type: 'line',
          borderColor: '#fbbf24',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#fbbf24',
          tension: 0.3,
          yAxisID: 'y'
        },
        {
          label: 'Transactions',
          data: volumes,
          backgroundColor: 'rgba(96,165,250,0.3)',
          borderColor: 'rgba(96,165,250,0.5)',
          borderWidth: 1,
          borderRadius: 2,
          yAxisID: 'y1'
        }
      ]
    },
    options: chartOptions
  });
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      labels: { color: '#94a3b8', font: { size: 11 } }
    }
  },
  scales: {
    x: {
      ticks: { color: '#64748b', font: { size: 10 }, maxTicksLimit: 20 },
      grid: { color: 'rgba(42,58,84,0.5)' }
    },
    y: {
      beginAtZero: false,
      position: 'left',
      ticks: { color: '#fbbf24', font: { size: 10 }, callback: v => '$' + v },
      grid: { color: 'rgba(42,58,84,0.3)' }
    },
    y1: {
      beginAtZero: true,
      position: 'right',
      ticks: { color: '#60a5fa', font: { size: 10 } },
      grid: { display: false }
    }
  }
};

// ── Maps ──
function renderProjectMap(coord, name) {
  const el = document.getElementById('projectMap');
  if (!el) return;
  if (typeof L === 'undefined') { el.innerHTML = '<div class="text-muted">Map library not loaded</div>'; return; }
  const map = L.map(el, { zoomControl: true }).setView([coord.lat, coord.lng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  L.marker([coord.lat, coord.lng]).addTo(map)
    .bindPopup(`<b>${name}</b>`).openPopup();
}

function renderFullMap() {
  const el = document.getElementById('fullMap');
  if (!el) return;
  if (typeof L === 'undefined') { el.innerHTML = '<div class="text-muted">Map library (Leaflet) not loaded. Check your network or ad-blocker.</div>'; return; }
  const map = L.map(el, { zoomControl: true }).setView([1.3521, 103.8198], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  const markers = L.markerClusterGroup({ chunkedLoading: true });
  window._map = map;
  window._mapCluster = markers;
  window._mapMarkers = [];
  let count = 0;
  projectsIndex.forEach(p => {
    if (!p.coord) return;
    const m = L.marker([p.coord.lat, p.coord.lng]);
    const pid = p.id;
    m.bindPopup(`
      <div style="min-width:180px">
        <b>${p.name}</b><br>
        <span style="color:#94a3b8">D${p.district || '?'} · Avg $${fmtNum(p.avgPsf) || '-'} psf · ${p.totalTxns} txns</span><br>
        <a href="#/project/${pid}" style="color:#fbbf24;font-size:12px;margin-top:6px;display:inline-block">→ View Details</a>
      </div>
    `);
    m.on('click', () => { navigate('/project/' + pid); });
    markers.addLayer(m);
    window._mapMarkers.push({ marker: m, name: p.name, street: p.street, id: pid });
    count++;
  });
  map.addLayer(markers);

  document.querySelector('#fullMap + .leaflet-control')?.remove();
}

// ── Formatters ──
function fmtNum(n) {
  const v = Number(n);
  if (v == null || isNaN(v)) return '-';
  return v.toLocaleString();
}

function fmtPrice(n) {
  const v = Number(n);
  if (v == null || isNaN(v)) return '-';
  return '$' + v.toLocaleString();
}

function saleTypeLabel(t) {
  switch (t) {
    case 1: return '<span class="stat-green">New Sale</span>';
    case 2: return '<span class="stat-gold">Sub Sale</span>';
    case 3: return '<span class="stat-red">Resale</span>';
    default: return '-';
  }
}

// ── Init ──
window.addEventListener('hashchange', router);
window.addEventListener('load', router);
