/* === Project detail views (private + HDB) === */
import { state } from '../state.js';
import { fmtNum, fmtPrice, saleTypeLabel, showPsf, psfLabel } from '../utils.js';
import { fetchProject } from '../data.js';
import { renderPriceChart, renderHdbChart, renderLeaseScatter } from '../charts.js';

const PAGE_SIZE = 25;

// ── Private project detail view ──
export async function renderProject(id) {
  const p = await fetchProject(id);
  const t = p.transactions || [];

  // Stats
  const txPage = (state.txPages && state.txPages[p.id]) || 0;
  const pageStart = txPage * PAGE_SIZE;
  const pageRows = t.slice(pageStart, pageStart + PAGE_SIZE);
  const totalPages = Math.ceil(t.length / PAGE_SIZE);
  const byType = {};
  t.forEach(x => {
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
        <div class="pm"><div class="pv">$${fmtNum(p.stats.avgPsf1y || p.stats.avgPsf)}</div><div class="pl">${psfLabel(p.stats)}</div></div>
        <div class="pm"><div class="pv">$${fmtNum(p.stats.minPsf)}</div><div class="pl">Min PSF</div></div>
        <div class="pm"><div class="pv">$${fmtNum(p.stats.maxPsf)}</div><div class="pl">Max PSF</div></div>
        <div class="pm"><div class="pv">${fmtNum(p.stats.totalTransactions)}</div><div class="pl">Transactions</div></div>
        <div class="pm"><div class="pv">${p.fmtLastDate || p.stats.dateRange?.max?.substring(0,7) || 'N/A'}</div><div class="pl">Latest</div></div>
        <div class="pm"><div class="pv">${p.fmtFirstDate || p.stats.dateRange?.min?.substring(0,7) || 'N/A'}</div><div class="pl">Earliest</div></div>
      </div>
      <div>${(p.stats.propertyTypes || []).map(t => `<span class="tag">${t}</span>`).join('')}
      ${(p.stats.districts || []).map(d => `<span class="tag ccr">D${d}</span>`).join('')}
      ${(p.stats.tenureTypes || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
      ${p.proximity ? `
      <div class="proximity-box">
        <span class="prox-item">🚇 Nearest MRT: <strong>${p.proximity.nearestMrt}</strong> <span class="text-muted">(${fmtNum(p.proximity.nearestMrtDistM)}m)</span></span>
        <span class="prox-item">🏫 ${p.proximity.schoolCount1km} schools within 1km</span>
        ${p.proximity.schools1km?.length ? `<span class="prox-item">${p.proximity.schools1km.map(s => `<span class="tag">${s.replace(/\s+PRIMARY\s+SCHOOL$/i, '')}</span>`).join(' ')}</span>` : ''}
      </div>` : ''}
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

  // Map: do NOT render here — #projectMap lives in a display:none tab, and
  // Leaflet can't measure a hidden container (produces grey tiles).
  // Defer to switchTab('map'), which initializes the map once the tab is visible.
  if (state.map.projectMap) { state.map.projectMap.remove(); state.map.projectMap = null; }
  state.pendingProjectMap = p.coord ? { coord: p.coord, name: p.name } : null;
}

// ── HDB project detail view ──
export async function renderHdbProject(id) {
  const p = state.projectsIndex.find(x => x.id === id) || state.hdbIndex.find(x => x.id === id);
  if (!p) { document.getElementById('main').innerHTML = '<div class="error">⚠️ Project not found</div>'; return; }

  try {
    const data = await fetchProject(id);
    const tx = data.transactions || [];
    const st = data.stats;
    const blockRent = state.hdbRentals?.byBlock?.[id];

    // Pagination
    let currentPage = parseInt(new URLSearchParams(window.location.hash.split('?')[1]).get('page')) || 0;

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
        ${data.demolished ? `
        <div class="demolished-banner">
          ⚠️ 该楼可能已拆除或重建（不在 HDB 现行建筑数据库中），以下仅包含历史成交记录
        </div>` : ''}
        <div class="project-meta">
          <div class="pm"><div class="pv">${fmtNum(st.totalTransactions)}</div><div class="pl">Total Transactions</div></div>
          <div class="pm"><div class="pv">$${fmtNum(st.avgPsf1y || st.avgPsf)}</div><div class="pl">${psfLabel(st)}</div></div>
          <div class="pm"><div class="pv">$${fmtNum(st.minPsf)}</div><div class="pl">Min PSF</div></div>
          <div class="pm"><div class="pv">$${fmtNum(st.maxPsf)}</div><div class="pl">Max PSF</div></div>
          <div class="pm"><div class="pv">${fmtPrice(st.minPrice)}</div><div class="pl">Min Price</div></div>
          <div class="pm"><div class="pv">${fmtPrice(st.maxPrice)}</div><div class="pl">Max Price</div></div>
        </div>
        ${data.proximity ? `
        <div class="proximity-box">
          <span class="prox-item">🚇 Nearest MRT: <strong>${data.proximity.nearestMrt}</strong> <span class="text-muted">(${fmtNum(data.proximity.nearestMrtDistM)}m)</span></span>
          <span class="prox-item">🏫 ${data.proximity.schoolCount1km} schools within 1km</span>
          ${data.proximity.schools1km?.length ? `<span class="prox-item">${data.proximity.schools1km.map(s => `<span class="tag">${s.replace(/\s+PRIMARY\s+SCHOOL$/i, '')}</span>`).join(' ')}</span>` : ''}
        </div>` : ''}
        ${blockRent ? `
        <div class="proximity-box">
          <span class="prox-item">🏠 近 12 月租金中位: <strong>$${fmtNum(blockRent.median)}</strong> <span class="text-muted">(${blockRent.count} 笔 · $${fmtNum(blockRent.min)} - $${fmtNum(blockRent.max)})</span></span>
        </div>` : ''}
        <div class="flat-tags">
          ${(data.flatTypes || []).map(f => `<span class="tag">${f}</span>`).join(' ')}
          ${(data.flatModels || []).slice(0, 3).map(m => `<span class="tag tag-model">${m}</span>`).join(' ')}
        </div>
      </div>

      <div class="tab-bar">
        <span class="tab active" onclick="switchTab(this,'txns')">Transactions (${fmtNum(tx.length)})</span>
        <span class="tab" onclick="switchTab(this,'chart')">Price Trend</span>
        <span class="tab" onclick="switchTab(this,'lease')">租约 vs 价格</span>
        ${data.coord ? `<span class="tab" onclick="switchTab(this,'map')">Location</span>` : ''}
      </div>

      <div id="tab-txns" class="tab-content active">
        ${renderTable(currentPage)}
      </div>

      <div id="tab-chart" class="tab-content">
        <div class="chart-wrap">
          <canvas id="priceChart"></canvas>
        </div>
      </div>

      <div id="tab-lease" class="tab-content">
        <div class="chart-wrap" style="height:300px"><canvas id="leaseScatter"></canvas></div>
        <div class="text-muted" style="font-size:12px;margin-top:6px">每笔成交的剩余租约 vs 成交 PSF——租约越短，单价通常越低（99 年租约折价）。</div>
      </div>

      ${data.coord ? `
      <div id="tab-map" class="tab-content">
        <div class="map-container" id="projectMap"></div>
      </div>` : ''}
    `;

    // Render charts
    const sorted = [...tx].filter(x => x.sortDate).sort((a, b) => a.sortDate.localeCompare(b.sortDate));
    renderHdbChart(sorted);
    renderLeaseScatter(tx);

    // Map: defer to switchTab('map') like private projects (hidden container issue)
    if (state.map.projectMap) { state.map.projectMap.remove(); state.map.projectMap = null; }
    state.pendingProjectMap = data.coord ? { coord: data.coord, name: data.name } : null;
  } catch (e) {
    document.getElementById('main').innerHTML = `<div class="error">⚠️ ${e.message}</div>`;
  }
}
