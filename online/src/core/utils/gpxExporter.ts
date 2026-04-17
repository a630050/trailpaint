import type { Route } from '../models/routes';
import type { Spot } from '../models/types';

/**
 * Generates a GPX XML string from routes and spots
 */
export function generateGpx(projectName: string, routes: Route[], spots: Spot[]): string {
  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TrailPaint" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(projectName)}</name>
    <time>${new Date().toISOString()}</time>
  </metadata>`;
  
  const gpxFooter = '</gpx>';

  // Waypoints (Spots)
  const waypointsXml = spots.map(s => `
  <wpt lat="${s.latlng[0]}" lon="${s.latlng[1]}">
    <name>${escapeXml(s.title || 'Spot')}</name>
    ${s.desc ? `<desc>${escapeXml(s.desc)}</desc>` : ''}
    <type>${escapeXml(s.iconId)}</type>
  </wpt>`).join('');

  // Tracks (Routes)
  const tracksXml = routes.map(r => `
  <trk>
    <name>${escapeXml(r.name || 'Route')}</name>
    <trkseg>
      ${r.pts.map((pt, i) => `
      <trkpt lat="${pt[0]}" lon="${pt[1]}">
        ${r.elevations && r.elevations[i] !== undefined ? `<ele>${r.elevations[i]}</ele>` : ''}
      </trkpt>`).join('')}
    </trkseg>
  </trk>`).join('');

  return gpxHeader + waypointsXml + tracksXml + gpxFooter;
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return c;
    }
  });
}
