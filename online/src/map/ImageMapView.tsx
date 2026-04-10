import { MapContainer, ImageOverlay, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useProjectStore } from '../core/store/useProjectStore';
import { useEffect } from 'react';
import SpotMarker from './SpotMarker';
import RouteLayer from './RouteLayer';
import DrawingPreview from './DrawingPreview';
import HandDrawnFilter from './HandDrawnFilter';
import Watermark from './Watermark';
import { setMapInstance } from './useMapRef';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

function ImageClickHandler() {
  const mode = useProjectStore((s) => s.mode);
  const addSpot = useProjectStore((s) => s.addSpot);
  const addDrawingPoint = useProjectStore((s) => s.addDrawingPoint);
  const setSelectedSpot = useProjectStore((s) => s.setSelectedSpot);
  const setSelectedRoute = useProjectStore((s) => s.setSelectedRoute);

  useMapEvents({
    click(e) {
      const latlng: [number, number] = [e.latlng.lat, e.latlng.lng];
      switch (mode) {
        case 'select':
          setSelectedSpot(null);
          setSelectedRoute(null);
          break;
        case 'addSpot':
          addSpot(latlng);
          break;
        case 'drawRoute':
          addDrawingPoint(latlng);
          break;
      }
    },
  });
  return null;
}

function ImageMapSync() {
  const map = useMap();
  useEffect(() => {
    setMapInstance(map);
    return () => { setMapInstance(null); };
  }, [map]);
  return null;
}

function SpotMarkers() {
  const spots = useProjectStore((s) => s.project.spots);
  return <>{spots.map((spot) => <SpotMarker key={spot.id} spot={spot} />)}</>;
}

export default function ImageMapView() {
  const bgImage = useProjectStore((s) => s.bgImage);
  const bgImageSize = useProjectStore((s) => s.bgImageSize);

  if (!bgImage || !bgImageSize) return null;

  const { w, h } = bgImageSize;
  const bounds: L.LatLngBoundsExpression = [[0, 0], [h, w]];

  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={bounds}
      maxBounds={bounds}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
      minZoom={-2}
      maxZoom={4}
      attributionControl={false}
    >
      <ImageOverlay url={bgImage} bounds={bounds} />
      <HandDrawnFilter />
      <ImageClickHandler />
      <ImageMapSync />
      <RouteLayer />
      <DrawingPreview />
      <SpotMarkers />
      <Watermark />
    </MapContainer>
  );
}
