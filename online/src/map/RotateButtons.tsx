import { useProjectStore } from '../core/store/useProjectStore';
import { t } from '../i18n';

export default function RotateButtons() {
  const rotation = useProjectStore((s) => s.rotation);
  const rotateMap = useProjectStore((s) => s.rotateMap);
  const resetRotation = useProjectStore((s) => s.resetRotation);

  return (
    <div className="rotate-buttons">
      <button
        className="rotate-buttons__btn"
        onClick={() => rotateMap(30)}
        title={t('map.rotateCW')}
      >
        ⤵️
      </button>
      <button
        className={`rotate-buttons__btn${rotation !== 0 ? ' rotate-buttons__btn--active' : ''}`}
        onClick={resetRotation}
        title={t('map.rotateReset')}
        disabled={rotation === 0}
      >
        ⬆️
      </button>
    </div>
  );
}
