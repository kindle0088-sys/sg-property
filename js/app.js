/* === Singapore Property Dashboard — SPA App === */

const DATA = 'data/';
let projectsIndex = [];
let districtsData = [];
let marketSummary = null;

// ── Page router (hashchange handler) ──
function router() {
  const hash = (location.hash.slice(1) || '/').replace(/^\/+/, '');
  routeTo(hash);
}

// ── Load data ──
async function loadData() {
  const [idx, dists, summ] = await Promise.all([
    fetchJSON('projects-index.json'),
    fetchJSON('districts.json'),
    fetchJSON('market-summary.json')
  ]);
  projectsIndex = idx;
  districtsData = dists;
  marketSummary = summ;
}

async function fetchJSON(file) {
  const resp = await fetch(DATA + file);
  if (!resp.ok) throw new Error(`Failed to load ${file}: ${resp.status}`);
  return resp.json();
}

async function fetchProject(id) {
  const resp = await fetch(`${DATA}projects/${id}.json`);
  if (!resp.ok) throw new Error(`Project not found: ${id}`);
  return resp.json();
}

function showLoading() {
  document.getElementById('main').innerHTML =
    `<div class="loading"><div class="spinner"></div>Loading...</div>`;
}

// ── Dashboard view ──
function renderDashboard() {
  const dists = districtsData;
  const sm = marketSummary;
  const activeDists = dists.filter(d => d.projectCount > 0);

  // Top gainers/losers - projects sorted by avg psf change (approximate from district data)
  const topByVol = [...dists].sort((a, b) => b.totalTransactions - a.totalTransactions).slice(0, 5);
  const topByPsf = [...dists].filter(d => d.avgPsf > 0).sort((a, b) => b.avgPsf - a.avgPsf).slice(0, 5);

  document.getElementById('main').innerHTML = `
    <div class="hero">
      <h1>Singapore Property Dashboard</h1>
      <p>URA transaction data · ${sm.totalProjects} projects · ${fmtNum(sm.totalTransactions)} transactions</p>
      <div class="kpi-row">
        <div class="kpi"><div class="val">${sm.totalProjects}</div><div class="lbl">Projects</div></div>
        <div class="kpi"><div class="val">${fmtNum(sm.totalTransactions)}</div><div class="lbl">Transactions</div></div>
        <div class="kpi"><div class="val">$${fmtNum(sm.overallAvgPsf)}</div><div class="lbl">Avg PSF</div></div>
        <div class="kpi"><div class="val">$${fmtNum(sm.bySegment.CCR.avgPsf)}</div><div class="lbl">CCR Avg PSF</div></div>
        <div class="kpi"><div class="val">$${fmtNum(sm.bySegment.RCR.avgPsf)}</div><div class="lbl">RCR Avg PSF</div></div>
        <div class="kpi"><div class="val">$${fmtNum(sm.bySegment.OCR.avgPsf)}</div><div class="lbl">OCR Avg PSF</div></div>
        <div class="kpi"><div class="val">${activeDists.length}</div><div class="lbl">Districts Active</div></div>
      </div>
    </div>

    <div class="section-title">Search Projects</div>
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
      <a href="javascript:void(0)" onclick="navigate('/')" style="font-size:13px">&larr; Back to Dashboard</a>
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
      <a href="javascript:void(0)" onclick="navigate('/')" style="font-size:13px">&larr; Back to Dashboard</a>
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
      <a href="#" onclick="navigate('/');return false" style="font-size:13px">&larr; Back to Dashboard</a>
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
    .filter(p => p.name.toLowerCase().includes(ql) || (p.street || '').toLowerCase().includes(ql))
    .slice(0, 20);

  if (!results.length) {
    el.innerHTML = '<div class="text-muted" style="padding:8px;font-size:13px">No results found</div>';
    return;
  }

  el.innerHTML = results.map(p => `
    <div class="search-result-item" onclick="navigate('/project/${p.id}')">
      <div class="sr-name">${highlight(p.name, ql)}</div>
      <div class="sr-meta">D${p.district || '?'} · $${fmtNum(p.avgPsf) || '-'} psf · ${p.totalTxns} txns ${p.years?.length ? '· ' + p.years[0] + '-' + p.years[p.years.length-1] : ''}</div>
    </div>
  `).join('');
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

    if (p === 'project' && r[0]) {
      await renderProject(r[0]);
    } else if (p === 'district' && r[0]) {
      renderDistrict(r[0]);
    } else if (p === 'map') {
      renderMapView();
    } else {
      renderDashboard();
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
  if (n == null || isNaN(n)) return '-';
  return n.toLocaleString();
}

function fmtPrice(n) {
  if (n == null || isNaN(n)) return '-';
  return '$' + n.toLocaleString();
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
