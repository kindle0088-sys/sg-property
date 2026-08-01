/* === Data loading layer === */
import { state } from './state.js';

const DATA = 'data/';

async function fetchJSON(file) {
  const resp = await fetch(DATA + file);
  if (!resp.ok) throw new Error(`Failed to load ${file}: ${resp.status}`);
  return resp.json();
}

export async function loadData() {
  const [idx, dists, summ, hdbTowns, hdbRentals, hdbLeaseCurve] = await Promise.all([
    fetchJSON('property-index.json'),
    fetchJSON('districts.json'),
    fetchJSON('market-summary.json'),
    fetchJSON('hdb-towns.json').catch(() => ({})),
    fetchJSON('hdb-rentals.json').catch(() => null),
    fetchJSON('hdb-lease-curve.json').catch(() => null)
  ]);
  state.projectsIndex = idx;
  state.districtsData = dists;
  state.marketSummary = summ;
  state.hdbTownsData = hdbTowns;
  state.hdbRentals = hdbRentals;
  state.hdbLeaseCurve = hdbLeaseCurve;
  state.hdbIndex = idx.filter(p => p.type === 'HDB');

  // Footer: 显示数据更新时间（buildTime 是 UTC ISO，转新加坡时间 SGT）
  if (summ?.buildTime) {
    const el = document.getElementById('data-updated');
    if (el) {
      const d = new Date(summ.buildTime);
      const sgt = new Date(d.getTime() + 8 * 3600 * 1000);
      const iso = sgt.toISOString().slice(0, 16).replace('T', ' ');
      el.textContent = 'Data updated ' + iso + ' SGT';
    }
  }
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
