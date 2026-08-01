/* === Map view + map helpers (Leaflet global from CDN) === */
import { state } from '../state.js';
import { showPsf } from '../utils.js';

// 类型 → 颜色/文案
const TYPE_META = {
  Private: { color: '#3b82f6', label: 'Private' },
  EC:      { color: '#a855f7', label: 'EC' },
  HDB:     { color: '#f59e0b', label: 'HDB' }
};

// 判定项目类型（property-index 已带 type: Private/EC/HDB，兜底判断）
function mapType(p) {
  if (p.type === 'EC') return 'EC';
  if (p.type === 'HDB') return 'HDB';
  return 'Private';
}

// ── Map view ──
export function renderMapView() {
  const withCoord = [...state.projectsIndex, ...state.hdbIndex].filter(p => p.coord).length;
  document.getElementById('main').innerHTML = `
    <div class="project-hero">
      <a href="#" onclick="navigate('/private');return false" style="font-size:13px">&larr; Back to Private</a>
      <h1>Project Map</h1>
      <div class="sub" id="map-subtitle">${withCoord} projects with coordinates</div>
    </div>
    <div class="map-toolbar">
      <div class="map-type-filter" id="map-type-filter">
        <button class="filter-btn active" data-type="All" onclick="setMapTypeFilter('All')">All</button>
        <button class="filter-btn" data-type="Private" onclick="setMapTypeFilter('Private')">Private</button>
        <button class="filter-btn" data-type="EC" onclick="setMapTypeFilter('EC')">EC</button>
        <button class="filter-btn" data-type="HDB" onclick="setMapTypeFilter('HDB')">HDB</button>
      </div>
      <div class="map-search-wrap">
        <input type="text" id="map-search-input" class="map-search" placeholder="Search projects on map..." oninput="filterMapMarkers(this.value)">
        <span class="map-search-icon">🔍</span>
      </div>
      <button class="map-fullscreen-btn" onclick="toggleMapFullscreen()" title="Toggle fullscreen">⛶ Fullscreen</button>
    </div>
    <div class="map-time-filter">
      <span class="map-time-label">成交年份:</span>
      <button class="filter-btn" id="map-year-all" onclick="setMapYear('All')">All</button>
      <input type="range" id="map-year-slider" min="1990" max="2026" value="2026" step="1" oninput="updateYearPreview(this.value)" onchange="setMapYear(this.value)">
      <span class="map-year-val" id="map-year-label">全部</span>
    </div>
    <div class="map-legend">
      <span><i style="background:#3b82f6"></i>Private</span>
      <span><i style="background:#a855f7"></i>EC</span>
      <span><i style="background:#f59e0b"></i>HDB</span>
    </div>
    <div class="map-container" id="fullMap" style="height:520px"></div>
    <div id="map-status" class="text-muted" style="text-align:center;padding:6px;font-size:12px"></div>
  `;
  try {
    renderFullMap();
  } catch (e) {
    document.getElementById('main').innerHTML +=
      `<div class="error" style="margin-top:12px">⚠️ Map failed to load: ${e.message}</div>`;
  }
}

// ── 年份时间轴 ──
export function setMapYear(year) {
  state.map.year = year;
  document.getElementById('map-year-label').textContent = year === 'All' ? '全部' : String(year);
  document.getElementById('map-year-all').classList.toggle('active', year === 'All');
  const q = document.getElementById('map-search-input')?.value || '';
  filterMapMarkers(q);
}

// 拖动过程中只更新预览，松手（onchange）才真正过滤，避免卡顿
export function updateYearPreview(v) {
  const label = document.getElementById('map-year-label');
  if (label) label.textContent = v;
}

// ── Type filter (All / Private / EC / HDB) ──
export function setMapTypeFilter(type) {
  state.map.typeFilter = type;
  document.querySelectorAll('#map-type-filter .filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.type === type));
  const map = state.map.fullMap;
  if (!map || !state.map.clusters) return;
  for (const [t, cluster] of Object.entries(state.map.clusters)) {
    if (type === 'All' || t === type) map.addLayer(cluster);
    else map.removeLayer(cluster);
  }
  // 重新叠加搜索过滤
  const q = document.getElementById('map-search-input')?.value || '';
  filterMapMarkers(q);
}

// ── Map search filtering (叠加类型 + 年份筛选) ──
export function filterMapMarkers(q) {
  const ql = (q || '').toLowerCase().trim();
  const markers = state.map.markers;
  if (!markers.length) return;
  const typeFilter = state.map.typeFilter || 'All';
  const yearFilter = state.map.year || 'All';
  let visible = 0;
  const total = markers.length;
  markers.forEach(m => {
    const match = !ql || m.name.toLowerCase().includes(ql) || (m.street || '').toLowerCase().includes(ql);
    const showType = typeFilter === 'All' || m.type === typeFilter;
    const showYear = yearFilter === 'All' || (m.years && m.years.includes(String(yearFilter)));
    const show = match && showType && showYear;
    const cluster = state.map.clusters[m.type];
    if (!cluster) return;
    if (show) {
      if (!m.onMap) { cluster.addLayer(m.marker); m.onMap = true; }
      visible++;
    } else if (m.onMap) {
      cluster.removeLayer(m.marker);
      m.onMap = false;
    }
  });
  const typeLabel = typeFilter === 'All' ? '' : ` · ${typeFilter}`;
  const yearLabel = yearFilter === 'All' ? '' : ` · ${yearFilter}`;
  document.getElementById('map-subtitle').textContent = ql
    ? `${visible} of ${total} match "${ql}"${typeLabel}${yearLabel}`
    : `${total} projects with coordinates${typeLabel}${yearLabel}`;
  document.getElementById('map-status').textContent = `${visible} markers visible${typeLabel}${yearLabel}`;
}

// ── Map fullscreen ──
export function toggleMapFullscreen() {
  const el = document.getElementById('fullMap');
  if (!el) return;
  if (!document.fullscreenElement) {
    el.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

// ── Single project map (in project detail tab) ──
export function renderProjectMap(coord, name) {
  const el = document.getElementById('projectMap');
  if (!el) return;
  if (typeof L === 'undefined') { el.innerHTML = '<div class="text-muted">Map library not loaded</div>'; return; }
  if (state.map.projectMap) { state.map.projectMap.remove(); state.map.projectMap = null; }
  const map = L.map(el, { zoomControl: true }).setView([coord.lat, coord.lng], 15);
  state.map.projectMap = map;
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  L.marker([coord.lat, coord.lng]).addTo(map)
    .bindPopup(`<b>${name}</b>`).openPopup();
}

// ── Popup 内容（带类型徽章） ──
function popupHtml(p, type) {
  const meta = TYPE_META[type] || TYPE_META.Private;
  const badge = `<span style="display:inline-block;padding:1px 7px;border-radius:4px;font-size:11px;font-weight:600;color:#fff;background:${meta.color};vertical-align:middle">${meta.label}</span>`;
  const loc = type === 'HDB' ? p.town : `D${p.district || '?'}`;
  return `
    <div style="min-width:180px">
      ${badge} <b>${p.name}</b><br>
      <span style="color:#94a3b8">${loc} · 1yr $${showPsf(p)} psf · ${p.totalTxns} txns</span><br>
      <a href="#/project/${p.id}" style="color:#fbbf24;font-size:12px;margin-top:6px;display:inline-block">→ View Details</a>
    </div>
  `;
}

// ── Full project map（三类型三层 cluster） ──
export function renderFullMap() {
  const el = document.getElementById('fullMap');
  if (!el) return;
  if (typeof L === 'undefined') { el.innerHTML = '<div class="text-muted">Map library (Leaflet) not loaded. Check your network or ad-blocker.</div>'; return; }
  if (state.map.fullMap) { state.map.fullMap.remove(); state.map.fullMap = null; }
  const map = L.map(el, { zoomControl: true }).setView([1.3521, 103.8198], 11);
  state.map.fullMap = map;
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  // 每类型一个 cluster 层（cluster 颜色按内部主要类型染色）
  state.map.clusters = {};
  for (const t of Object.keys(TYPE_META)) {
    state.map.clusters[t] = L.markerClusterGroup({
      chunkedLoading: true,
      showCoverageOnHover: false,
      maxClusterRadius: 60,
      iconCreateFunction: (c) => {
        const counts = { Private: 0, EC: 0, HDB: 0 };
        for (const m of c.getAllChildMarkers()) counts[m._mapType]++;
        const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
        const color = TYPE_META[dominant].color;
        return L.divIcon({
          html: `<div style="background:${color}"><span>${c.getChildCount()}</span></div>`,
          className: 'marker-cluster marker-cluster-custom',
          iconSize: L.point(40, 40)
        });
      }
    });
  }
  state.map.markers = [];
  state.map.typeFilter = state.map.typeFilter || 'All';
  state.map.year = state.map.year || 'All';

  let count = 0;
  const counts = { Private: 0, EC: 0, HDB: 0 };
  let minYear = 9999, maxYear = 0;
  const all = [...state.projectsIndex, ...state.hdbIndex];
  all.forEach(p => {
    if (!p.coord) return;
    const type = mapType(p);
    const meta = TYPE_META[type];
    const m = L.circleMarker([p.coord.lat, p.coord.lng], {
      radius: type === 'HDB' ? 4 : 5,
      color: meta.color,
      fillColor: meta.color,
      fillOpacity: 0.85,
      weight: 1,
      opacity: 1
    });
    m._mapType = type; // 让 cluster iconCreateFunction 能识别
    m.bindPopup(popupHtml(p, type));
    m.on('click', () => m.openPopup());
    state.map.clusters[type].addLayer(m);
    state.map.markers.push({
      marker: m, name: p.name,
      street: p.street || p.town || '',
      id: p.id, type,
      years: p.years || [],
      onMap: true
    });
    for (const y of p.years || []) {
      const n = parseInt(y, 10);
      if (n && !isNaN(n)) { if (n < minYear) minYear = n; if (n > maxYear) maxYear = n; }
    }
    counts[type]++;
    count++;
  });

  // 年份 slider 范围（动态）
  if (minYear < 9999 && maxYear > 0) {
    const slider = document.getElementById('map-year-slider');
    if (slider) {
      slider.min = String(minYear);
      slider.max = String(maxYear);
      slider.value = String(maxYear);
    }
  }

  // 默认 All：三层全挂
  const typeFilter = state.map.typeFilter;
  for (const [t, cluster] of Object.entries(state.map.clusters)) {
    if (typeFilter === 'All' || t === typeFilter) map.addLayer(cluster);
  }

  document.getElementById('map-subtitle').textContent =
    `${count} projects with coordinates (Private ${counts.Private} · EC ${counts.EC} · HDB ${counts.HDB})`;
  document.getElementById('map-status').textContent = `${count} markers visible`;

  document.querySelector('#fullMap + .leaflet-control')?.remove();
}
