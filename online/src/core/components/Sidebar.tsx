import { useProjectStore } from '../store/useProjectStore';
import SpotList from './SpotList';
import SpotEditor from './SpotEditor';
import SearchBox from './SearchBox';
import { t } from '../../i18n';

interface SidebarProps {
  onFlyTo: (latlng: [number, number], zoom?: number) => void;
  onExport: () => void;
  onSave: () => void;
  onLoad: () => void;
}

export default function Sidebar({ onFlyTo, onExport, onSave, onLoad }: SidebarProps) {
  const spots = useProjectStore((s) => s.project.spots);
  const selectedSpotId = useProjectStore((s) => s.selectedSpotId);
  const sidebarOpen = useProjectStore((s) => s.sidebarOpen);
  const setSidebarOpen = useProjectStore((s) => s.setSidebarOpen);
  const setSelectedSpot = useProjectStore((s) => s.setSelectedSpot);
  const updateSpot = useProjectStore((s) => s.updateSpot);
  const removeSpot = useProjectStore((s) => s.removeSpot);
  const swapSpots = useProjectStore((s) => s.swapSpots);

  const selectedSpot = spots.find((s) => s.id === selectedSpotId) ?? null;

  const handleSelect = (id: string) => {
    setSelectedSpot(id);
    const spot = spots.find((s) => s.id === id);
    if (spot) onFlyTo(spot.latlng);
  };

  const handleSearchSelect = (latlng: [number, number]) => {
    onFlyTo(latlng, 14);
  };

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? '◀' : '▶'}
      </button>

      <div className={`sidebar${sidebarOpen ? '' : ' sidebar--closed'}`}>
        <div className="sidebar__header">
          <span className="sidebar__logo">🌿</span>
          <h1 className="sidebar__title">TrailPaint</h1>
        </div>

        {/* Toolbar */}
        <div className="sidebar__toolbar">
          <button className="sidebar__tool-btn" onClick={onExport}>{t('app.export')}</button>
          <button className="sidebar__tool-btn" onClick={onSave}>{t('app.save')}</button>
          <button className="sidebar__tool-btn" onClick={onLoad}>{t('app.load')}</button>
        </div>

        {/* Search */}
        <SearchBox onSelect={handleSearchSelect} />

        {/* Content */}
        {selectedSpot ? (
          <SpotEditor
            spot={selectedSpot}
            onUpdate={(patch) => updateSpot(selectedSpot.id, patch)}
            onDelete={() => removeSpot(selectedSpot.id)}
            onClose={() => setSelectedSpot(null)}
          />
        ) : (
          <SpotList
            spots={spots}
            selectedSpotId={selectedSpotId}
            onSelect={handleSelect}
            onSwap={swapSpots}
          />
        )}
      </div>
    </>
  );
}
