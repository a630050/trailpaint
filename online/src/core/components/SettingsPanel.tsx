import { useProjectStore } from '../store/useProjectStore';
import { t } from '../../i18n';

export default function SettingsPanel() {
  const handDrawn = useProjectStore((s) => s.handDrawn);
  const watermark = useProjectStore((s) => s.watermark);
  const toggleHandDrawn = useProjectStore((s) => s.toggleHandDrawn);
  const toggleWatermark = useProjectStore((s) => s.toggleWatermark);

  return (
    <div className="settings-panel">
      <div className="settings-panel__title">{t('settings.title')}</div>
      <label className="settings-panel__toggle">
        <input type="checkbox" checked={handDrawn} onChange={toggleHandDrawn} />
        <span>{t('settings.handDrawn')}</span>
      </label>
      <label className="settings-panel__toggle">
        <input type="checkbox" checked={watermark} onChange={toggleWatermark} />
        <span>{t('settings.watermark')}</span>
      </label>
    </div>
  );
}
