/* === Router: navigation, routing, tabs, pagination === */
import { state } from './state.js';
import { loadData, showLoading } from './data.js';
import { setFilter, searchProjects, clearSearch } from './search.js';
import { renderOverview } from './views/overview.js';
import { renderPrivateDashboard, renderDistrict } from './views/private.js';
import { renderHdbDashboard, renderTown } from './views/hdb.js';
import { renderProject, renderHdbProject } from './views/project.js';
import { renderMapView, filterMapMarkers, toggleMapFullscreen } from './views/map.js';

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
export function switchTab(el, id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const tc = document.getElementById('tab-' + id);
  if (tc) tc.classList.add('active');
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
  window.toggleMapFullscreen = toggleMapFullscreen;
}
