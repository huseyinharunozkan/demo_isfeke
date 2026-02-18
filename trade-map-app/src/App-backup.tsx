import { useState } from 'react';
import { WorldMap } from './components/WorldMap';
import { CountryDetail } from './components/CountryDetail';
import { mockTradeData } from './data/mockData';
import { analyzeCountryData } from './utils/dataAnalysis';
import './App.css';

function App() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  const handleCountryClick = (countryName: string) => {
    setSelectedCountry(countryName);
    setShowInstructions(false);
  };

  const handleCloseDetail = () => {
    setSelectedCountry(null);
  };

  const countryStats = selectedCountry
    ? analyzeCountryData(selectedCountry, mockTradeData)
    : null;

  return (
    <div className="w-screen h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold">🌍 Dünya Ticaret Haritası</h1>
          <p className="text-blue-100 text-sm mt-1">
            Ülkelere tıklayarak detaylı ticaret istatistiklerini görüntüleyin
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Map */}
        <div className="w-full h-full">
          <WorldMap
            data={mockTradeData}
            onCountryClick={handleCountryClick}
            selectedCountry={selectedCountry}
          />
        </div>

        {/* Instructions Overlay */}
        {showInstructions && !selectedCountry && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl p-8 max-w-md z-20">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Hoş Geldiniz!
              </h2>
              <p className="text-gray-600 mb-4">
                Harita üzerindeki <span className="text-green-600 font-semibold">renkli ülkelere</span> tıklayarak detaylı ticaret bilgilerini görüntüleyebilirsiniz.
              </p>
              <div className="bg-gray-50 rounded p-4 text-left text-sm space-y-2">
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>En çok satan firmalar</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>En büyük müşteriler</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Fiyat ortalamaları</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Ticaret dengesi</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Liman bilgileri</span>
                </div>
              </div>
              <button
                onClick={() => setShowInstructions(false)}
                className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Başlayalım
              </button>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10">
          <h3 className="font-bold text-gray-800 mb-2">Lejant</h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded mr-2 bg-blue-600"></div>
              <span>Seçili Ülke</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded mr-2 bg-green-400"></div>
              <span>Yüksek Ticaret</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded mr-2 bg-green-100"></div>
              <span>Düşük Ticaret</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded mr-2 bg-gray-300"></div>
              <span>Veri Yok</span>
            </div>
          </div>
        </div>

        {/* Country Detail Panel */}
        {countryStats && (
          <CountryDetail stats={countryStats} onClose={handleCloseDetail} />
        )}
      </div>
    </div>
  );
}

export default App;
