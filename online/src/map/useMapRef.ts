import type L from 'leaflet';

// Lightweight ref holder for the Leaflet map instance, shared via context-free callback
let mapInstance: L.Map | null = null;

export function setMapInstance(map: L.Map) {
  mapInstance = map;
}

export function flyTo(latlng: [number, number], zoom?: number) {
  if (mapInstance) {
    mapInstance.flyTo(latlng, zoom ?? mapInstance.getZoom(), { duration: 0.6 });
  }
}
