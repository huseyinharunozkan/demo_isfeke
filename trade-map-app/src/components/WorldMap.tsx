import { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import type { TradeData } from '../types/index.js';

interface WorldMapProps {
  data: TradeData[];
  onCountryClick: (countryName: string) => void;
  selectedCountry: string | null;
}

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

export const WorldMap = ({ data, onCountryClick, selectedCountry }: WorldMapProps) => {
  const [tooltipContent, setTooltipContent] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Ülke bazında ticaret hacmini hesapla
  const getCountryTradeVolume = (countryName: string) => {
    const exports = data.filter(d => d['GÖNDERİCİ ÜLKE'] === countryName);
    const imports = data.filter(d => d['ALICI ÜLKE'] === countryName);

    const exportVolume = exports.reduce((sum, t) => sum + t['ÜRÜN MİKTARI (KG)'], 0);
    const importVolume = imports.reduce((sum, t) => sum + t['ÜRÜN MİKTARI (KG)'], 0);

    return exportVolume + importVolume;
  };

  // Ülke adı eşleştirmesi
  const matchCountryName = (geoName: string): string => {
    const nameMap: Record<string, string> = {
      'United States of America': 'USA',
      'United Kingdom': 'United Kingdom',
      'Türkiye': 'Turkey',
      'Korea': 'South Korea',
      'Viet Nam': 'Vietnam'
    };

    return nameMap[geoName] || geoName;
  };

  const getFillColor = (countryName: string) => {
    const matchedName = matchCountryName(countryName);
    const volume = getCountryTradeVolume(matchedName);

    if (matchedName === selectedCountry) {
      return '#2563eb'; // Seçili ülke - mavi
    }

    if (volume === 0) {
      return '#e5e7eb'; // Ticaret yok - gri
    }

    // Ticaret hacmine göre renk gradyanı (yeşil tonları)
    const maxVolume = Math.max(...data.map(d => d['ÜRÜN MİKTARI (KG)'])) * 5;
    const intensity = Math.min(volume / maxVolume, 1);

    const r = Math.round(220 - intensity * 150);
    const g = Math.round(252 - intensity * 30);
    const b = Math.round(220 - intensity * 130);

    return `rgb(${r}, ${g}, ${b})`;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="relative w-full h-full" onMouseMove={handleMouseMove}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 120
        }}
      >
        <ZoomableGroup center={[0, 20]} zoom={1}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryName = matchCountryName(geo.properties.name);
                const volume = getCountryTradeVolume(countryName);

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
                        fill: volume > 0 ? '#f59e0b' : '#d1d5db',
                        outline: 'none',
                        cursor: volume > 0 ? 'pointer' : 'default'
                      },
                      pressed: { outline: 'none' }
                    }}
                    onMouseEnter={() => {
                      if (volume > 0) {
                        setTooltipContent(
                          `${countryName}\nToplam: ${(volume / 1000).toFixed(0)} ton`
                        );
                      }
                    }}
                    onMouseLeave={() => {
                      setTooltipContent('');
                    }}
                    onClick={() => {
                      if (volume > 0) {
                        onCountryClick(countryName);
                      }
                    }}
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
          style={{
            left: position.x + 10,
            top: position.y + 10
          }}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
};
