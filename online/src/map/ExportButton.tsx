import { toPng } from 'html-to-image';
import { useProjectStore } from '../core/store/useProjectStore';
import { parseGpx } from '../core/utils/gpxParser';
import { t } from '../i18n';

export function exportPng(pixelRatio = 2) {
  const projectName = useProjectStore.getState().project.name;
  const mapEl = document.querySelector('.leaflet-container') as HTMLElement | null;
  if (!mapEl) return;

  if (pixelRatio >= 3 && !confirm(t('export.3xWarn'))) return;

  setTimeout(async () => {
    try {
      const dataUrl = await toPng(mapEl, {
        cacheBust: true,
        pixelRatio,
        filter: (node) => {
          const el = node as HTMLElement;
          if (el.classList?.contains('leaflet-control-container')) return false;
          return true;
        },
      });
      const link = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      link.download = `trailpaint-${projectName}-${date}-${pixelRatio}x.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert(t('export.failed'));
    }
  }, 300);
}

export function saveProject() {
  const json = useProjectStore.getState().exportJSON();
  const projectName = useProjectStore.getState().project.name;
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${projectName}.trailpaint.json`;
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
      alert(`${t('gpx.importFailed')}: ${(err as Error).message}`);
    }
  };
  input.click();
}
