/* === Data loading layer === */
import { state } from './state.js';

const DATA = 'data/';

async function fetchJSON(file) {
  const resp = await fetch(DATA + file);
  if (!resp.ok) throw new Error(`Failed to load ${file}: ${resp.status}`);
  return resp.json();
}

/**
 * 核心数据（首屏）：URA 项目索引 + 聚合统计 + HDB 元数据
 * 不加载 8MB 的 HDB 完整索引——进入 HDB/地图/楼栋路由时才懒加载（loadHdbIndex）
 */
export async function loadData() {
  const [idx, dists, summ, hdbTowns, hdbRentals, hdbLeaseCurve] = await Promise.all([
    fetchJSON('projects-index.json'),
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
  state.hdbIndex = []; // HDB 索引懒加载

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

// HDB 索引懒加载（幂等：只拉一次）
let _hdbPromise = null;
export function loadHdbIndex() {
  if (state.hdbIndex.length) return Promise.resolve(state.hdbIndex);
  if (!_hdbPromise) {
    _hdbPromise = fetchJSON('hdb-index.json')
      .then(idx => { state.hdbIndex = idx; return idx; })
      .catch(err => { _hdbPromise = null; throw err; });
  }
  return _hdbPromise;
}

// 轻量搜索索引（~1MB）：搜索/地图/对比/HDB 概览用，避免拉 6.6MB 完整版
let _hdbSearchPromise = null;
export function loadHdbSearchIndex() {
  if (state.hdbSearchIndex.length) return Promise.resolve(state.hdbSearchIndex);
  if (!_hdbSearchPromise) {
    _hdbSearchPromise = fetchJSON('hdb-search-index.json')
      .then(idx => { state.hdbSearchIndex = idx; return idx; })
      .catch(err => { _hdbSearchPromise = null; throw err; });
  }
  return _hdbSearchPromise;
}

// 项目详情缓存：翻页走 navigate() 全量重渲染，避免每次翻页重复 fetch 同一 JSON
const _projectCache = new Map();
export async function fetchProject(id) {
  if (_projectCache.has(id)) return _projectCache.get(id);
  // HDB projects are in data/hdb/ directory
  const prefix = id.startsWith('hdb-') ? 'hdb/' : 'projects/';
  const resp = await fetch(`${DATA}${prefix}${id}.json`);
  if (!resp.ok) throw new Error(`Project not found: ${id}`);
  const json = await resp.json();
  _projectCache.set(id, json);
  return json;
}

export function showLoading() {
  document.getElementById('main').innerHTML =
    `<div class="loading"><div class="spinner"></div>Loading...</div>`;
}
