/* === Data loading layer === */
import { state } from './state.js';

const DATA = 'data/';

async function fetchJSON(file) {
  const resp = await fetch(DATA + file);
  if (!resp.ok) throw new Error(`Failed to load ${file}: ${resp.status}`);
  return resp.json();
}

export async function loadData() {
  const [idx, dists, summ, hdbTowns] = await Promise.all([
    fetchJSON('property-index.json'),
    fetchJSON('districts.json'),
    fetchJSON('market-summary.json'),
    fetchJSON('hdb-towns.json').catch(() => ({}))
  ]);
  state.projectsIndex = idx;
  state.districtsData = dists;
  state.marketSummary = summ;
  state.hdbTownsData = hdbTowns;
  state.hdbIndex = idx.filter(p => p.type === 'HDB');
}

export async function fetchProject(id) {
  // HDB projects are in data/hdb/ directory
  const prefix = id.startsWith('hdb-') ? 'hdb/' : 'projects/';
  const resp = await fetch(`${DATA}${prefix}${id}.json`);
  if (!resp.ok) throw new Error(`Project not found: ${id}`);
  return resp.json();
}

export function showLoading() {
  document.getElementById('main').innerHTML =
    `<div class="loading"><div class="spinner"></div>Loading...</div>`;
}
