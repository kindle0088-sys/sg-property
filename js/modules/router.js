/* === Router: navigation, routing, tabs, pagination === */
import { state } from './state.js';
import { loadData, loadHdbIndex, loadHdbSearchIndex, showLoading } from './data.js';
import { setFilter, searchProjects, clearSearch } from './search.js';
import { renderOverview } from './views/overview.js';
import { renderPrivateDashboard, renderDistrict } from './views/private.js';
import { renderHdbDashboard, renderTown } from './views/hdb.js';
import { renderProject, renderHdbProject } from './views/project.js';
import { renderMapView, renderProjectMap, filterMapMarkers, toggleMapFullscreen, setMapTypeFilter, setMapYear, updateYearPreview, setMapColorMode } from './views/map.js';
import { renderCompareView, compareSuggest, selectCompare } from './views/compare.js';

// ── Navigation ──
export function navigate(path) {
  const clean = path.replace(/^\/+/, '');
  // Dedup: record route, set hash (triggers hashchange → router), then render once
  state._lastRoute = clean;
  location.hash = '#' + clean;
  routeTo(clean);
}

// Router for hashchange (back/forward buttons, manual URL edits)
export function router() {
  const hash = (location.hash.slice(1) || '/').replace(/^\/+/, '');
  if (hash === state._lastRoute) return; // already handled by navigate()
  state._lastRoute = hash;
  routeTo(hash);
}

// Route to a path directly (no hash dependency)
export async function routeTo(path) {
  const parts = path.replace(/^\/+/, '').split('/');
  const p = parts[0] || '';
  const r = parts.slice(1);

  try {
    // If on initial load, show a loading state
    if (!state.projectsIndex.length) {
      showLoading();
      await loadData();
      if (!state.projectsIndex.length) {
        document.getElementById('main').innerHTML =
          `<div class="error">⚠️ Failed to load property data. Please check your network connection and try refreshing.</div>`;
        return;
      }
    }

    // Update nav active state
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('nav-active'));
    const pages = { overview:0, private:1, hdb:2, map:3, compare:4 };
    const navIdx = pages[p];
    if (navIdx !== undefined) {
      document.querySelectorAll('nav a')[navIdx]?.classList.add('nav-active');
    }

    // HDB 索引懒加载：town 详情才拉完整 6.6MB 索引；hdb 概览/地图/对比/楼栋详情用轻量 search-index
    const page = p.split('?')[0];
    if (page === 'town') {
      await loadHdbIndex().catch(() => {});
    } else if (page === 'hdb' || page === 'map' || page === 'compare' || (page === 'project' && r[0]?.startsWith('hdb-'))) {
      await loadHdbSearchIndex().catch(() => {});
    }

    if (p === 'project' && r[0]) {
      // 剥离分页 query（pageHdb 用 /project/<id>?page=N 传页号），否则 id 会
      // 变成 "hdb-xxx?page=2" 导致 find() 永远匹配不上 → "Project not found"
      const id = r[0].split('?')[0];
      const isHdb = id.startsWith('hdb-');
      if (isHdb) await renderHdbProject(id);
      else await renderProject(id);
    } else if (page === 'compare') {
      // #/compare?a=xxx&b=yyy（URL 参数可分享）
      const sp = new URLSearchParams(p.split('?')[1] || '');
      renderCompareView({ a: sp.get('a') || '', b: sp.get('b') || '' });
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
export function switchTab(el, id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const tc = document.getElementById('tab-' + id);
  if (tc) tc.classList.add('active');

  // Location tab: initialize the deferred project map now that the container
  // is visible (Leaflet needs measurable dimensions), or refresh an existing
  // map's size after the container became visible.
  if (id === 'map') {
    const pending = state.pendingProjectMap;
    if (pending) {
      renderProjectMap(pending.coord, pending.name);
      state.pendingProjectMap = null;
    } else if (state.map.projectMap) {
      setTimeout(() => state.map.projectMap.invalidateSize(), 60);
    }
  }
}

// ── Pagination ──
export function pageTxns(projectId, page) {
  state.txPages[projectId] = page;
  renderProject(projectId);
}

export function pageHdb(projectId, page) {
  navigate('/project/' + projectId + '?page=' + page);
}

// ── Expose to window for inline onclick handlers ──
// (Legacy template strings use onclick="navigate(...)", etc.)
export function exposeGlobals() {
  window.navigate = navigate;
  window.setFilter = setFilter;
  window.searchProjects = searchProjects;
  window.clearSearch = clearSearch;
  window.switchTab = switchTab;
  window.pageTxns = pageTxns;
  window.pageHdb = pageHdb;
  window.filterMapMarkers = filterMapMarkers;
  window.setMapTypeFilter = setMapTypeFilter;
  window.setMapYear = setMapYear;
  window.setMapColorMode = setMapColorMode;
  window.updateYearPreview = updateYearPreview;
  window.toggleMapFullscreen = toggleMapFullscreen;
  window.compareSuggest = compareSuggest;
  window.selectCompare = selectCompare;
}
