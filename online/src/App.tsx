import MapView from './map/MapView';
import Sidebar from './core/components/Sidebar';
import { exportPng, saveProject, loadProject } from './map/ExportButton';
import { flyTo } from './map/useMapRef';
import './core/components/Sidebar.css';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <Sidebar
        onFlyTo={flyTo}
        onExport={exportPng}
        onSave={saveProject}
        onLoad={loadProject}
      />
      <div className="map-container">
        <MapView />
      </div>
    </div>
  );
}
