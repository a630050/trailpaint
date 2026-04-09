export interface GpxData {
  tracks: [number, number][][];
  waypoints: { latlng: [number, number]; name: string }[];
}

export function parseGpx(xmlString: string): GpxData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('非有效 XML 檔案');
  }

  const tracks: [number, number][][] = [];
  const waypoints: { latlng: [number, number]; name: string }[] = [];

  // Parse tracks
  doc.querySelectorAll('trk').forEach((trk) => {
    trk.querySelectorAll('trkseg').forEach((seg) => {
      const pts: [number, number][] = [];
      seg.querySelectorAll('trkpt').forEach((pt) => {
        const lat = parseFloat(pt.getAttribute('lat') ?? '');
        const lon = parseFloat(pt.getAttribute('lon') ?? '');
        if (!isNaN(lat) && !isNaN(lon)) {
          pts.push([lat, lon]);
        }
      });
      if (pts.length >= 2) {
        tracks.push(simplifyIfNeeded(pts, 500));
      }
    });
  });

  // Parse waypoints
  doc.querySelectorAll('wpt').forEach((wpt) => {
    const lat = parseFloat(wpt.getAttribute('lat') ?? '');
    const lon = parseFloat(wpt.getAttribute('lon') ?? '');
    if (!isNaN(lat) && !isNaN(lon)) {
      const nameEl = wpt.querySelector('name');
      waypoints.push({
        latlng: [lat, lon],
        name: nameEl?.textContent?.trim() ?? '',
      });
    }
  });

  if (tracks.length === 0 && waypoints.length === 0) {
    throw new Error('找不到軌跡或航點');
  }

  return { tracks, waypoints };
}

// Douglas-Peucker simplification
function simplifyIfNeeded(pts: [number, number][], maxPoints: number): [number, number][] {
  if (pts.length <= maxPoints) return pts;

  // Calculate bounding box diagonal for initial tolerance
  const lats = pts.map((p) => p[0]);
  const lngs = pts.map((p) => p[1]);
  const diagonal = Math.sqrt(
    Math.pow(Math.max(...lats) - Math.min(...lats), 2) +
    Math.pow(Math.max(...lngs) - Math.min(...lngs), 2)
  );

  let tolerance = diagonal / 10000;
  let result = douglasPeucker(pts, tolerance);

  // Iterate until we have <= maxPoints
  let iterations = 0;
  while (result.length > maxPoints && iterations < 20) {
    tolerance *= 2;
    result = douglasPeucker(pts, tolerance);
    iterations++;
  }

  return result;
}

function douglasPeucker(pts: [number, number][], tolerance: number): [number, number][] {
  if (pts.length <= 2) return pts;

  let maxDist = 0;
  let maxIdx = 0;

  const start = pts[0];
  const end = pts[pts.length - 1];

  for (let i = 1; i < pts.length - 1; i++) {
    const dist = perpendicularDistance(pts[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > tolerance) {
    const left = douglasPeucker(pts.slice(0, maxIdx + 1), tolerance);
    const right = douglasPeucker(pts.slice(maxIdx), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [start, end];
}

function perpendicularDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
  const dx = lineEnd[1] - lineStart[1];
  const dy = lineEnd[0] - lineStart[0];
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return Math.sqrt(
    Math.pow(point[0] - lineStart[0], 2) +
    Math.pow(point[1] - lineStart[1], 2)
  );
  return Math.abs(
    dy * (lineStart[1] - point[1]) - dx * (lineStart[0] - point[0])
  ) / len;
}
