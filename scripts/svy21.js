/**
 * SVY21 to WGS84 coordinate conversion for Singapore
 *
 * Uses PROJ4 with EPSG:3414 (SVY21 / Singapore TM) definition
 * SVY21 is a Transverse Mercator projection:
 *   Central Meridian : 103°50' E (103.833333°)
 *   False Easting    : 28001.642 m
 *   False Northing   : 38744.572 m
 *   Scale Factor     : 1.0
 *   Datum            : WGS84 (EPSG:3414 treats SVY21 as WGS84-based)
 */

import proj4 from 'proj4';

// Define SVY21 (EPSG:3414) projection
proj4.defs('EPSG:3414', '+proj=tmerc +lat_0=1.366666666666667 +lon_0=103.8333333333333 +k=1 +x_0=28001.642 +y_0=38744.572 +ellps=WGS84 +units=m +no_defs');

// WGS84 geographic (EPSG:4326)
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');

const converter = proj4('EPSG:3414', 'EPSG:4326');

/**
 * Convert SVY21 easting/northing to WGS84 lat/lng
 * @param {number|string} x - Easting (metres)
 * @param {number|string} y - Northing (metres)
 * @returns {{ lat: number, lng: number } | null}
 */
export function svy21ToWgs84(x, y) {
  if (x == null || y == null) return null;

  const ex = Number(x);
  const ny = Number(y);

  if (isNaN(ex) || isNaN(ny) || ex === 0 || ny === 0) return null;

  try {
    // PROJ4 forward: [easting, northing] → [longitude, latitude]
    const result = converter.forward([ex, ny]);
    return {
      lat: parseFloat(result[1].toFixed(6)),
      lng: parseFloat(result[0].toFixed(6))
    };
  } catch (e) {
    return null;
  }
}

/**
 * Create a URL-safe slug from a project name
 */
export function projectSlug(name) {
  if (!name) return 'unknown';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
