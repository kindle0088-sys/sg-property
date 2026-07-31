// Verify: project map defers initialization until Location tab opens
const calls = [];
globalThis.window = { addEventListener: () => {} };
const mapObj = { remove: () => {}, invalidateSize: () => calls.push('invalidateSize') };
globalThis.L = {
  map: () => ({ setView: () => mapObj, remove: () => {} }),
  markerClusterGroup: () => ({ addLayer: () => {} }),
  tileLayer: () => ({ addTo: () => {} }),
  marker: () => { const m = { bindPopup: () => ({ openPopup: () => {}, on: () => {} }), addTo: () => m }; return m; }
};

const { state } = await import('file:///C:/Users/jiali/WorkBuddy/Claw/property-dashboard/js/modules/state.js');
const { renderProjectMap } = await import('file:///C:/Users/jiali/WorkBuddy/Claw/property-dashboard/js/modules/views/map.js');
const { renderProject } = await import('file:///C:/Users/jiali/WorkBuddy/Claw/property-dashboard/js/modules/views/project.js');
const { switchTab } = await import('file:///C:/Users/jiali/WorkBuddy/Claw/property-dashboard/js/modules/router.js');

globalThis.fetch = async () => ({ ok: true, json: async () => ({
  name: 'Test Proj', street: '1 Test St', coord: { lat: 1.3, lng: 103.8 },
  stats: { avgPsf: 2000, minPsf: 1000, maxPsf: 3000, totalTransactions: 10, dateRange: {} },
  transactions: [{ pricePsf: 2000, price: 2000000, sortDate: '2026-01', contractDate: '0126' }]
}) });

let mainHtml = '';
globalThis.document = {
  getElementById: (id) => {
    if (id === 'main') return { innerHTML: '', set innerHTML(v) { mainHtml = v; } };
    if (id === 'priceChart') return { getContext: () => ({}) };
    if (id === 'projectMap') return { innerHTML: '' };
    if (id === 'tab-map') return { classList: { add: () => {} } };
    return null;
  },
  querySelectorAll: () => [],
  querySelector: () => null
};
globalThis.Chart = class { constructor() { this.destroy = () => {}; } };
state.projectsIndex = [{ id: 'test-proj', name: 'Test Proj' }];

let fail = 0;
await renderProject('test-proj');
if (state.pendingProjectMap?.coord?.lat !== 1.3) { console.error('FAIL: pendingProjectMap not set after render'); fail++; }
if (state.map.projectMap !== null) { console.error('FAIL: map initialized too early'); fail++; }

const fakeTab = { classList: { add: () => {} } };
switchTab(fakeTab, 'map');
if (state.map.projectMap === null) { console.error('FAIL: map not initialized after tab switch'); fail++; }
if (state.pendingProjectMap !== null) { console.error('FAIL: pending not cleared'); fail++; }

console.log(fail === 0 ? 'LAZY MAP TEST PASSED' : fail + ' FAILURES');
process.exit(fail === 0 ? 0 : 1);
