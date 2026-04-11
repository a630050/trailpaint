import { useProjectStore } from '../store/useProjectStore';
import { t } from '../../i18n';

export default function SettingsPanel() {
  const handDrawn = useProjectStore((s) => s.handDrawn);
  const watermark = useProjectStore((s) => s.watermark);
  const toggleHandDrawn = useProjectStore((s) => s.toggleHandDrawn);
  const toggleWatermark = useProjectStore((s) => s.toggleWatermark);

  return (
    <div className="settings-panel">
      {/* Quick guide */}
      <div className="settings-panel__title">{t('info.guide')}</div>
      <div className="settings-panel__guide">
        <p>📍 {t('info.step1')}</p>
        <p>🖊️ {t('info.step2')}</p>
        <p>📷 {t('info.step3')}</p>
      </div>

      {/* Settings */}
      <div className="settings-panel__title">{t('settings.title')}</div>
      <label className="settings-panel__toggle">
        <input type="checkbox" checked={handDrawn} onChange={toggleHandDrawn} />
        <span>{t('settings.handDrawn')}</span>
      </label>
      <label className="settings-panel__toggle">
        <input type="checkbox" checked={watermark} onChange={toggleWatermark} />
        <span>{t('settings.watermark')}</span>
      </label>

      {/* About */}
      <div className="settings-panel__title">{t('info.about')}</div>
      <div className="settings-panel__about">
        <p>🌿 TrailPaint {t('info.tagline')}</p>
        <p>
          <a href="https://github.com/notoriouslab/trailpaint" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          {' · '}
          © {new Date().getFullYear()} notoriouslab
        </p>
      </div>
    </div>
  );
}
