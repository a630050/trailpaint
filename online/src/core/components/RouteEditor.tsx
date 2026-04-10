import type { Route } from '../models/routes';
import { ROUTE_COLORS } from '../models/routes';
import { useProjectStore } from '../store/useProjectStore';
import { polylineDistance, formatDistance, elevationStats, estimateTime } from '../utils/geo';
import ElevationProfile from './ElevationProfile';
import { t } from '../../i18n';

interface RouteEditorProps {
  route: Route;
  onClose: () => void;
}

export default function RouteEditor({ route, onClose }: RouteEditorProps) {
  const setRouteColor = useProjectStore((s) => s.setRouteColor);
  const deleteRoute = useProjectStore((s) => s.deleteRoute);
  const distKm = polylineDistance(route.pts);
  const hasEle = !!route.elevations;
  const stats = hasEle ? elevationStats(route.elevations!) : null;
  const time = stats ? estimateTime(distKm, stats.ascent) : null;

  return (
    <div className="route-editor">
      <div className="route-editor__header">
        <span className="route-editor__title">{t('route.editTitle')}</span>
        <button className="spot-editor__close" onClick={onClose}>✕</button>
      </div>

      <div className="route-editor__info">
        {formatDistance(distKm)} · {route.pts.length} {t('route.points')}
        {time && <> · ⏱️ {time}</>}
      </div>

      {stats && (
        <div className="route-editor__ele-stats">
          <span>↗ {stats.ascent}m</span>
          <span>↘ {stats.descent}m</span>
          <span>▲ {stats.max}m</span>
          <span>▼ {stats.min}m</span>
        </div>
      )}

      {/* Elevation profile chart */}
      <ElevationProfile route={route} />

      <div className="spot-editor__label">{t('route.color')}</div>
      <div className="route-editor__colors">
        {ROUTE_COLORS.map((c) => (
          <button
            key={c.id}
            className={`route-editor__color-btn${route.color === c.id ? ' route-editor__color-btn--active' : ''}`}
            style={{ background: c.stroke }}
            title={c.label}
            onClick={() => setRouteColor(route.id, c.id)}
          />
        ))}
      </div>

      <div className="route-editor__hint">{t('route.editHint')}</div>

      <button
        className="spot-editor__btn spot-editor__btn--danger"
        onClick={() => {
          if (confirm(t('route.deleteConfirm'))) deleteRoute(route.id);
        }}
      >
        {t('route.delete')}
      </button>
    </div>
  );
}
