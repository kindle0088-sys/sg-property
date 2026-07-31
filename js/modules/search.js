/* === Search + property type filter === */
import { state } from './state.js';
import { fmtNum, showPsf, highlight } from './utils.js';

// ── Property type filter (All / Private / HDB) ──
export function setFilter(type) {
  state.propertyFilter = type;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === type));
  // Re-run current search with the new filter
  const q = document.getElementById('search-input')?.value || '';
  searchProjects(q);
}

// ── Search ──
export function searchProjects(q) {
  const el = document.getElementById('search-results');
  if (!el) return;
  const ql = (q || '').toLowerCase().trim();
  if (!ql) { el.innerHTML = ''; hideClear(); return; }
  showClear();

  const results = state.projectsIndex
    .filter(p => {
      if (state.propertyFilter === 'Private') return (p.type || 'Private') !== 'HDB';
      if (state.propertyFilter === 'HDB') return p.type === 'HDB';
      return true;
    })
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
      <div class="sr-meta">${isHDB ? p.town : 'D' + p.district} · $${showPsf(p)} psf · ${fmtNum(p.totalTxns)} txns ${p.years?.length ? '· ' + p.years[0] + '-' + p.years[p.years.length-1] : ''}</div>
    </div>`;
  }).join('');
}

// ── Clear button (shown when search input has content) ──
function showClear() {
  const btn = document.getElementById('search-clear');
  if (btn) btn.classList.add('visible');
}
function hideClear() {
  const btn = document.getElementById('search-clear');
  if (btn) btn.classList.remove('visible');
}
export function clearSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;
  input.value = '';
  const el = document.getElementById('search-results');
  if (el) el.innerHTML = '';
  hideClear();
  input.focus();
}
