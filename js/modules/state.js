/* === Shared application state (replaces scattered globals) === */

export const state = {
  projectsIndex: [],
  districtsData: [],
  marketSummary: null,
  hdbIndex: [],         // 完整索引（6.6MB，仅 town 详情懒加载）
  hdbSearchIndex: [],   // 轻量索引（~1MB，搜索/地图/对比/HDB 概览懒加载）
  hdbTownsData: {},
  hdbRentals: null,     // data/hdb-rentals.json（town + 楼栋租金）
  hdbLeaseCurve: null,  // data/hdb-lease-curve.json（剩余租约折价曲线）
  propertyFilter: 'All',
  _lastRoute: null,
  // map state (kept out of window.*, now module-local)
  map: {
    fullMap: null,
    cluster: null,
    markers: [],
    projectMap: null
  },
  // deferred project map — Leaflet can't measure a display:none container,
  // so the project map is initialized lazily when the Location tab opens.
  pendingProjectMap: null,
  // A/B compare state
  compare: { A: null, B: null },
  // pagination state
  txPages: {}
};

export function setState(patch) {
  Object.assign(state, patch);
}

