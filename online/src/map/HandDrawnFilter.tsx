import { useMap } from 'react-leaflet';
import { useEffect, useRef } from 'react';

export default function HandDrawnFilter() {
  const map = useMap();
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.innerHTML = `
      <defs>
        <filter id="hand-drawn" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="2" result="noise" seed="1" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
        </filter>
      </defs>
    `;
    map.getContainer().appendChild(svg);
    svgRef.current = svg;

    return () => {
      svg.remove();
      svgRef.current = null;
    };
  }, [map]);

  return null;
}
