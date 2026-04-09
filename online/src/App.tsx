import MapView from './map/MapView';
import Sidebar from './core/components/Sidebar';
import { exportPng, saveProject, loadProject, importGpxFile } from './map/ExportButton';
import { flyTo } from './map/useMapRef';
import { useUndoRedoKeys } from './core/hooks/useUndoRedo';
import './core/components/Sidebar.css';
import './App.css';

export default function App() {
  useUndoRedoKeys();

  return (
    <div className="app">
      <Sidebar
        onFlyTo={flyTo}
        onExport={exportPng}
        onSave={saveProject}
        onLoad={loadProject}
        onImportGpx={importGpxFile}
      />
      <div className="map-container">
        <MapView />
      </div>
    </div>
  );
}
