import { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import type { MapCountry } from '../types/index.js';

interface WorldMapProps {
  countries: MapCountry[];
  onCountryClick: (countryName: string) => void;
  selectedCountry: string | null;
}

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// GeoJSON adı → veri tabanındaki ülke adı eşleştirmesi
const nameMap: Record<string, string> = {
  'United States of America': 'USA',
  'United Kingdom': 'United Kingdom',
  'Türkiye': 'Turkey',
  'Korea': 'South Korea',
  'Viet Nam': 'Vietnam',
};

export const WorldMap = ({ countries, onCountryClick, selectedCountry }: WorldMapProps) => {
  const [tooltipContent, setTooltipContent] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // İsim → MapCountry hızlı erişim
  const countryMap = new Map(countries.map(c => [c.name, c]));

  const matchName = (geoName: string) => nameMap[geoName] ?? geoName;

  const getFillColor = (geoName: string) => {
    const name    = matchName(geoName);
    const country = countryMap.get(name);

    if (name === selectedCountry) return '#2563eb';
    if (!country || country.totalTrade === 0) return '#e5e7eb';

    const maxTrade  = Math.max(...countries.map(c => c.totalTrade));
    const intensity = Math.min(country.totalTrade / maxTrade, 1);

    const r = Math.round(220 - intensity * 150);
    const g = Math.round(252 - intensity * 30);
    const b = Math.round(220 - intensity * 130);
    return `rgb(${r},${g},${b})`;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="relative w-full h-full" onMouseMove={handleMouseMove}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 120 }}
      >
        <ZoomableGroup center={[0, 20]} zoom={1}>
          <Geographies geography={geoUrl}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => {
                const name    = matchName(geo.properties.name);
                const country = countryMap.get(name);
                const hasData = country && country.totalTrade > 0;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getFillColor(geo.properties.name)}
                    stroke="#ffffff"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: {
                        fill:    hasData ? '#f59e0b' : '#d1d5db',
                        outline: 'none',
                        cursor:  hasData ? 'pointer' : 'default',
                      },
                      pressed: { outline: 'none' },
                    }}
                    onMouseEnter={() => {
                      if (hasData) {
                        setTooltipContent(
                          `${name}\nToplam: ${((country.totalTrade) / 1000).toFixed(0)} ton`
                        );
                      }
                    }}
                    onMouseLeave={() => setTooltipContent('')}
                    onClick={() => { if (hasData) onCountryClick(name); }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {tooltipContent && (
        <div
          className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded text-sm pointer-events-none whitespace-pre-line"
          style={{ left: position.x + 10, top: position.y + 10 }}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
};
