import { toPng } from 'html-to-image';
import { useProjectStore } from '../core/store/useProjectStore';
import { parseGpx } from '../core/utils/gpxParser';
import { t } from '../i18n';

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '_').slice(0, 100) || 'Untitled';
}

/**
 * Inline tile <img> src as base64 data URLs so html-to-image's SVG foreignObject
 * can render them on iOS Safari/WebKit (which blocks cross-origin images in foreignObject
 * even when crossOrigin is set). Returns a restore function to put original URLs back.
 */
function inlineTileImages(container: HTMLElement): () => void {
  const originals: [HTMLImageElement, string][] = [];
  const tiles = container.querySelectorAll<HTMLImageElement>('.leaflet-tile-pane img');

  for (const tile of tiles) {
    if (!tile.complete || !tile.naturalWidth) continue;
    originals.push([tile, tile.src]);
    try {
      const c = document.createElement('canvas');
      c.width = tile.naturalWidth;
      c.height = tile.naturalHeight;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(tile, 0, 0);
      tile.src = c.toDataURL();
    } catch {
      // Canvas tainted — skip, tile will be missing (same as before)
    }
  }

  return () => {
    for (const [tile, src] of originals) tile.src = src;
  };
}

/**
 * Capture the map as an HTMLImageElement at the given pixelRatio.
 * Used by App.tsx → ExportPreview for base image + re-capture.
 */
export async function captureMap(pixelRatio = 2): Promise<HTMLImageElement> {
  const mapEl = document.querySelector('.leaflet-container') as HTMLElement;
  if (!mapEl) throw new Error('Map element not found');

  // Inline tiles as base64 for iOS Safari compatibility
  const restoreTiles = inlineTileImages(mapEl);

  try {
    const dataUrl = await toPng(mapEl, {
      cacheBust: true,
      pixelRatio,
      filter: (node) => {
        const el = node as HTMLElement;
        if (el.classList?.contains('leaflet-control-container')) return false;
        if (el.classList?.contains('watermark')) return false;
        return true;
      },
    });

    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image load failed'));
    });
    return img;
  } finally {
    restoreTiles();
  }
}

export function saveProject() {
  const json = useProjectStore.getState().exportJSON();
  const projectName = useProjectStore.getState().project.name;
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${sanitizeFilename(projectName)}.trailpaint.json`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export function loadProject() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      useProjectStore.getState().importJSON(text);
    } catch {
      alert(t('import.failed'));
    }
  };
  input.click();
}

export function importGpxFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.gpx';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = parseGpx(text);
      useProjectStore.getState().importGpx(data);
    } catch (err) {
      alert(`${t('gpx.importFailed')}: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  input.click();
}
