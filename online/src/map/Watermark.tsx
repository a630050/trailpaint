import { useProjectStore } from '../core/store/useProjectStore';

export default function Watermark() {
  const show = useProjectStore((s) => s.watermark);

  if (!show) return null;

  return (
    <div className="watermark">
      <span className="watermark__icon">🌿</span>
      <span className="watermark__text">TrailPaint 路小繪</span>
      <span className="watermark__sub">notoriouslab</span>
    </div>
  );
}
