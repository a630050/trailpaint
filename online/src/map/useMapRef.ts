import type L from 'leaflet';

let mapInstance: L.Map | null = null;

export function setMapInstance(map: L.Map | null) {
  mapInstance = map;
}

export function flyTo(latlng: [number, number], zoom?: number) {
  if (mapInstance) {
    try {
      mapInstance.flyTo(latlng, zoom ?? mapInstance.getZoom(), { duration: 0.6 });
    } catch {
      // Map may have been destroyed during mode switch
    }
  }
}
