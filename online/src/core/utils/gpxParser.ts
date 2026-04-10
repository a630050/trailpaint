export interface GpxTrackPoint {
  latlng: [number, number];
  ele: number | null;
}

export interface GpxData {
  tracks: GpxTrackPoint[][];
  waypoints: { latlng: [number, number]; name: string }[];
}

export function parseGpx(xmlString: string): GpxData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('非有效 XML 檔案');
  }

  const tracks: GpxTrackPoint[][] = [];
  const waypoints: { latlng: [number, number]; name: string }[] = [];

  doc.querySelectorAll('trk').forEach((trk) => {
    trk.querySelectorAll('trkseg').forEach((seg) => {
      const pts: GpxTrackPoint[] = [];
      seg.querySelectorAll('trkpt').forEach((pt) => {
        const lat = parseFloat(pt.getAttribute('lat') ?? '');
        const lon = parseFloat(pt.getAttribute('lon') ?? '');
        if (!isNaN(lat) && !isNaN(lon)) {
          const eleEl = pt.querySelector('ele');
          const ele = eleEl ? parseFloat(eleEl.textContent ?? '') : null;
          pts.push({ latlng: [lat, lon], ele: ele !== null && !isNaN(ele) ? ele : null });
        }
      });
      if (pts.length >= 2) {
        tracks.push(simplifyTrackIfNeeded(pts, 500));
      }
    });
  });

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

// Douglas-Peucker simplification preserving elevation
function simplifyTrackIfNeeded(pts: GpxTrackPoint[], maxPoints: number): GpxTrackPoint[] {
  if (pts.length <= maxPoints) return pts;

  const coords = pts.map((p) => p.latlng);
  const lats = coords.map((c) => c[0]);
  const lngs = coords.map((c) => c[1]);
  const diagonal = Math.sqrt(
    Math.pow(Math.max(...lats) - Math.min(...lats), 2) +
    Math.pow(Math.max(...lngs) - Math.min(...lngs), 2)
  );

  let tolerance = diagonal / 10000;
  let indices = dpIndices(coords, tolerance);
  let iterations = 0;
  while (indices.length > maxPoints && iterations < 20) {
    tolerance *= 2;
    indices = dpIndices(coords, tolerance);
    iterations++;
  }
  if (indices.length > maxPoints) {
    indices = indices.slice(0, maxPoints);
  }
  return indices.map((i) => pts[i]);
}

function dpIndices(pts: [number, number][], tolerance: number): number[] {
  if (pts.length <= 2) return pts.map((_, i) => i);

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
    const left = dpIndices(pts.slice(0, maxIdx + 1), tolerance);
    const right = dpIndices(pts.slice(maxIdx), tolerance).map((i) => i + maxIdx);
    return [...left.slice(0, -1), ...right];
  }

  return [0, pts.length - 1];
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
