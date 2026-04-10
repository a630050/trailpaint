import { toPng } from 'html-to-image';
import { useProjectStore } from '../core/store/useProjectStore';
import { parseGpx } from '../core/utils/gpxParser';
import { polylineDistance, formatDistance, elevationStats, estimateTime } from '../core/utils/geo';
import { t } from '../i18n';

function drawExportBorder(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const lw = Math.max(2, Math.round(Math.min(w, h) * 0.005));
  const p1 = lw * 3;
  const p2 = p1 + lw * 4;
  ctx.strokeStyle = 'rgba(80,110,140,0.38)';
  ctx.lineWidth = lw;
  ctx.strokeRect(p1, p1, w - p1 * 2, h - p1 * 2);
  ctx.strokeStyle = 'rgba(80,110,140,0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(p2, p2, w - p2 * 2, h - p2 * 2);
}

function drawStatsOverlay(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const state = useProjectStore.getState();
  const routes = state.project.routes;
  if (routes.length === 0) return;

  // Aggregate stats across all routes
  let totalDist = 0;
  let totalAscent = 0;
  let totalDescent = 0;
  let hasEle = false;

  for (const r of routes) {
    totalDist += polylineDistance(r.pts);
    if (r.elevations) {
      hasEle = true;
      const s = elevationStats(r.elevations);
      totalAscent += s.ascent;
      totalDescent += s.descent;
    }
  }

  const parts: string[] = [];
  parts.push(`📏 ${formatDistance(totalDist)}`);
  if (hasEle) {
    parts.push(`⏱️ ${estimateTime(totalDist, totalAscent)}`);
    parts.push(`↗${totalAscent}m ↘${totalDescent}m`);
  }

  const text = parts.join('  ');
  const fs = Math.round(Math.min(w, h) * 0.022);
  const pad = Math.round(fs * 0.8);

  ctx.save();
  ctx.font = `${fs}px Georgia, serif`;
  const metrics = ctx.measureText(text);
  const boxW = metrics.width + pad * 2;
  const boxH = fs + pad * 2;
  const x = w - boxW - pad;
  const y = h - boxH - pad;

  // Background pill
  ctx.fillStyle = 'rgba(253,248,239,0.85)';
  ctx.beginPath();
  ctx.roundRect(x, y, boxW, boxH, fs * 0.3);
  ctx.fill();
  ctx.strokeStyle = 'rgba(180,130,60,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Text
  ctx.fillStyle = '#78350f';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + pad, y + boxH / 2);
  ctx.restore();
}

export type ExportFormat = '1:1' | '9:16' | '4:3' | 'full';

export function exportPng(pixelRatio = 2, format: ExportFormat = 'full') {
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

      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve) => { img.onload = () => resolve(); });

      // Calculate crop for format
      let cropX = 0, cropY = 0, cropW = img.width, cropH = img.height;
      if (format !== 'full') {
        const ratios: Record<string, number> = { '1:1': 1, '9:16': 9 / 16, '4:3': 4 / 3 };
        const targetRatio = ratios[format] ?? 1;
        const currentRatio = img.width / img.height;
        if (currentRatio > targetRatio) {
          cropW = Math.round(img.height * targetRatio);
          cropX = Math.round((img.width - cropW) / 2);
        } else {
          cropH = Math.round(img.width / targetRatio);
          cropY = Math.round((img.height - cropH) / 2);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      drawExportBorder(ctx, cropW, cropH);
      drawStatsOverlay(ctx, cropW, cropH);

      const finalUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      const suffix = format === 'full' ? '' : `-${format.replace(':', 'x')}`;
      link.download = `trailpaint-${projectName}-${date}${suffix}.png`;
      link.href = finalUrl;
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
