// Smoke test: verify module graph loads and key functions work with DOM stubs
const noop = () => {};
globalThis.window = { addEventListener: noop, _priceChart: null };
globalThis.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  querySelector: () => null
};
globalThis.Chart = class { constructor(){ this.destroy=noop; } };
globalThis.L = { map: () => ({ setView: () => ({}) }), markerClusterGroup: () => ({ addLayer: noop }), tileLayer: () => ({ addTo: noop }), marker: () => ({ bindPopup: () => ({ openPopup: noop, on: noop }) }) };

const { router, navigate, exposeGlobals, switchTab, pageTxns, pageHdb } = await import('file:///C:/Users/jiali/WorkBuddy/Claw/property-dashboard/js/modules/router.js');
const { state } = await import('file:///C:/Users/jiali/WorkBuddy/Claw/property-dashboard/js/modules/state.js');
const { fmtNum, fmtPrice, slugifyTown, showPsf, highlight } = await import('file:///C:/Users/jiali/WorkBuddy/Claw/property-dashboard/js/modules/utils.js');
const { loadData, fetchProject, showLoading } = await import('file:///C:/Users/jiali/WorkBuddy/Claw/property-dashboard/js/modules/data.js');
const { renderPriceChart, renderHdbChart } = await import('file:///C:/Users/jiali/WorkBuddy/Claw/property-dashboard/js/modules/charts.js');
const { searchProjects, setFilter, clearSearch } = await import('file:///C:/Users/jiali/WorkBuddy/Claw/property-dashboard/js/modules/search.js');
const { renderOverview } = await import('file:///C:/Users/jiali/WorkBuddy/Claw/property-dashboard/js/modules/views/overview.js');
const { renderPrivateDashboard, renderDistrict } = await import('file:///C:/Users/jiali/WorkBuddy/Claw/property-dashboard/js/modules/views/private.js');
const { renderHdbDashboard, renderTown } = await import('file:///C:/Users/jiali/WorkBuddy/Claw/property-dashboard/js/modules/views/hdb.js');
const { renderProject, renderHdbProject } = await import('file:///C:/Users/jiali/WorkBuddy/Claw/property-dashboard/js/modules/views/project.js');
const { renderMapView, renderFullMap, renderProjectMap, filterMapMarkers, toggleMapFullscreen, setMapTypeFilter } = await import('file:///C:/Users/jiali/WorkBuddy/Claw/property-dashboard/js/modules/views/map.js');

// Verify all exports are functions
const exports = { router, navigate, exposeGlobals, switchTab, pageTxns, pageHdb, loadData, fetchProject, showLoading, renderPriceChart, renderHdbChart, searchProjects, setFilter, clearSearch, renderOverview, renderPrivateDashboard, renderDistrict, renderHdbDashboard, renderTown, renderProject, renderHdbProject, renderMapView, renderFullMap, renderProjectMap, filterMapMarkers, toggleMapFullscreen, setMapTypeFilter };
let fail = 0;
for (const [name, fn] of Object.entries(exports)) {
  if (typeof fn !== 'function') { console.error('NOT A FUNCTION:', name); fail++; }
}

// Verify utils behave
if (fmtNum(12345) !== '12,345') { console.error('fmtNum fail'); fail++; }
if (fmtPrice(999) !== '$999') { console.error('fmtPrice fail'); fail++; }
if (slugifyTown('Ang Mo Kio') !== 'ang-mo-kio') { console.error('slugifyTown fail'); fail++; }
if (showPsf({avgPsf1y: 2345}) !== '2,345') { console.error('showPsf fail'); fail++; }
if (!highlight('Marina Bay', 'bay').includes('<strong')) { console.error('highlight fail'); fail++; }

// exposeGlobals should attach to window
exposeGlobals();
if (typeof window.navigate !== 'function' || typeof window.setFilter !== 'function' || typeof window.searchProjects !== 'function' || typeof window.switchTab !== 'function' || typeof window.pageTxns !== 'function' || typeof window.pageHdb !== 'function' || typeof window.filterMapMarkers !== 'function' || typeof window.toggleMapFullscreen !== 'function' || typeof window.setMapTypeFilter !== 'function' || typeof window.clearSearch !== 'function') {
  console.error('window globals missing'); fail++;
}

// Verify views render into a fake main element
let fakeHtml = '';
globalThis.document.getElementById = (id) => id === 'main' ? { innerHTML: '', set innerHTML(v) { fakeHtml = v; } } : null;
globalThis.document.querySelectorAll = () => [];
state.marketSummary = { totalProjects: 100, totalTransactions: 2000, overallAvgPsf: 1200, hdbAvgPsf: 600 };
state.projectsIndex = [];
state.districtsData = [{ district: 1, name: 'Marina', projectCount: 5, totalTransactions: 50, avgPsf: 1500, medianPsf: 1400, sector: 'CCR' }];
state.hdbIndex = [];
state.hdbTownsData = {};
renderOverview();
if (!fakeHtml.includes('Singapore Property Dashboard')) { console.error('renderOverview fail'); fail++; }

state.marketSummary.overallAvgPsf1y = 1300;
renderPrivateDashboard();
if (!fakeHtml.includes('Search Projects')) { console.error('renderPrivateDashboard fail'); fail++; }

state.hdbTownsData = { 'Ang Mo Kio': { blocks: 10, totalTransactions: 100, avgPsf: 500, flatTypes: ['3 Room'], years: [2000, 2026] } };
state.projectsIndex.push({ id: 'hdb-x', type: 'HDB', town: 'Ang Mo Kio', name: 'AMK Blk 100', totalTxns: 5, years: [2000,2026] });
state.hdbIndex = state.projectsIndex;
renderHdbDashboard();
if (!fakeHtml.includes('HDB Resale Market')) { console.error('renderHdbDashboard fail'); fail++; }
renderTown('ang-mo-kio');
if (!fakeHtml.includes('Ang Mo Kio')) { console.error('renderTown fail'); fail++; }
renderDistrict('1');
if (!fakeHtml.includes('D1')) { console.error('renderDistrict fail'); fail++; }

console.log(fail === 0 ? 'ALL SMOKE TESTS PASSED' : `${fail} TESTS FAILED`);
process.exit(fail === 0 ? 0 : 1);
