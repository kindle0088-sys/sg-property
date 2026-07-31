/* === Project detail views (private + HDB) === */
import { state } from '../state.js';
import { fmtNum, fmtPrice, saleTypeLabel, showPsf } from '../utils.js';
import { fetchProject } from '../data.js';
import { renderPriceChart, renderHdbChart } from '../charts.js';
import { renderProjectMap } from './map.js';

const PAGE_SIZE = 25;

// ── Private project detail view ──
export async function renderProject(id) {
  const p = await fetchProject(id);
  const t = p.transactions || [];

  // Stats
  const psfArr = t.map(x => x.pricePsf).filter(Boolean);
  const txPage = (state.txPages && state.txPages[p.id]) || 0;
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
        <div class="pm"><div class="pv">$${fmtNum(p.stats.avgPsf1y || p.stats.avgPsf)}</div><div class="pl">1yr Avg PSF</div></div>
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

// ── HDB project detail view ──
export async function renderHdbProject(id) {
  const p = state.projectsIndex.find(x => x.id === id);
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
    let currentPage = parseInt(new URLSearchParams(window.location.hash.split('?')[1]).get('page')) || 0;

    function goToPage(page) {
      currentPage = page;
      window.navigate('/project/' + id + '?page=' + page);
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
          <div class="pm"><div class="pv">$${fmtNum(st.avgPsf1y || st.avgPsf)}</div><div class="pl">1yr Avg PSF</div></div>
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
