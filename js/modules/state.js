/* === Shared application state (replaces scattered globals) === */

export const state = {
  projectsIndex: [],
  districtsData: [],
  marketSummary: null,
  hdbIndex: [],
  hdbTownsData: {},
  propertyFilter: 'All',
  _lastRoute: null,
  // map state (kept out of window.*, now module-local)
  map: {
    fullMap: null,
    cluster: null,
    markers: [],
    projectMap: null
  },
  // pagination state
  txPages: {}
};

export function setState(patch) {
  Object.assign(state, patch);
}

export function getHdbIndex() {
  return state.hdbIndex;
}
