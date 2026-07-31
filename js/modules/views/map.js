/* === Map view + map helpers (Leaflet global from CDN) === */
import { state } from '../state.js';
import { showPsf } from '../utils.js';

// ── Map view ──
export function renderMapView() {
  document.getElementById('main').innerHTML = `
    <div class="project-hero">
      <a href="#" onclick="navigate('/private');return false" style="font-size:13px">&larr; Back to Private</a>
      <h1>Project Map</h1>
      <div class="sub" id="map-subtitle">${state.projectsIndex.filter(p=>p.coord).length} projects with coordinates</div>
    </div>
    <div class="map-toolbar">
      <div class="map-search-wrap">
        <input type="text" id="map-search-input" class="map-search" placeholder="Search projects on map..." oninput="filterMapMarkers(this.value)">
        <span class="map-search-icon">🔍</span>
      </div>
      <button class="map-fullscreen-btn" onclick="toggleMapFullscreen()" title="Toggle fullscreen">⛶ Fullscreen</button>
    </div>
    <div class="map-container" id="fullMap" style="height:550px"></div>
    <div id="map-status" class="text-muted" style="text-align:center;padding:6px;font-size:12px"></div>
  `;
  try {
    renderFullMap();
  } catch (e) {
    document.getElementById('main').innerHTML +=
      `<div class="error" style="margin-top:12px">⚠️ Map failed to load: ${e.message}</div>`;
  }
}

// ── Map search filtering ──
export function filterMapMarkers(q) {
  const ql = (q || '').toLowerCase().trim();
  const markers = state.map.markers;
  if (!markers.length) return;
  let visible = 0;
  const total = markers.length;
  markers.forEach(m => {
    const match = !ql || m.name.toLowerCase().includes(ql) || (m.street || '').toLowerCase().includes(ql);
    if (match) {
      if (m.marker) m.marker.addTo(state.map.cluster || state.map.fullMap);
      visible++;
    } else {
      if (m.marker && state.map.cluster) state.map.cluster.removeLayer(m.marker);
      else if (m.marker && state.map.fullMap) m.marker.remove();
    }
  });
  document.getElementById('map-subtitle').textContent = ql
    ? visible + ' of ' + total + ' projects match "' + ql + '"'
    : total + ' projects with coordinates';
  document.getElementById('map-status').textContent = visible + ' markers visible';
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

// ── Full project map ──
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

  const markers = L.markerClusterGroup({ chunkedLoading: true });
  state.map.cluster = markers;
  state.map.markers = [];
  let count = 0;
  state.projectsIndex.forEach(p => {
    if (!p.coord) return;
    const m = L.marker([p.coord.lat, p.coord.lng]);
    const pid = p.id;
    m.bindPopup(`
      <div style="min-width:180px">
        <b>${p.name}</b><br>
        <span style="color:#94a3b8">D${p.district || '?'} · 1yr $${showPsf(p)} psf · ${p.totalTxns} txns</span><br>
        <a href="#/project/${pid}" style="color:#fbbf24;font-size:12px;margin-top:6px;display:inline-block">→ View Details</a>
      </div>
    `);
    m.on('click', () => { window.navigate('/project/' + pid); });
    markers.addLayer(m);
    state.map.markers.push({ marker: m, name: p.name, street: p.street, id: pid });
    count++;
  });
  map.addLayer(markers);

  document.querySelector('#fullMap + .leaflet-control')?.remove();
}
