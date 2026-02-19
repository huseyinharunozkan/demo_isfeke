import { useState, useEffect } from 'react';
import { WorldMap } from './components/WorldMap';
import { CountryDetail } from './components/CountryDetail';
import { CompanyDetail } from './components/CompanyDetail';
import type { MapCountry, CountryStats, CompanyStats } from './types/index.js';
import './App.css';

const API_BASE = 'http://localhost:3001/api';

function App() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [mapCountries, setMapCountries]   = useState<MapCountry[]>([]);
  const [countryStats, setCountryStats]   = useState<CountryStats | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyStats | null>(null);
  const [loadingMap, setLoadingMap]       = useState(true);
  const [loadingStats, setLoadingStats]   = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  // Harita verilerini yükle
  useEffect(() => {
    fetch(`${API_BASE}/countries`)
      .then(r => r.json())
      .then((data: MapCountry[]) => {
        setMapCountries(data);
        console.log(`✅ ${data.length} ülke yüklendi`);
      })
      .catch(err => {
        console.error('API bağlantı hatası:', err);
        setError('Backend API\'ye bağlanılamadı. http://localhost:3001 çalışıyor mu?');
      })
      .finally(() => setLoadingMap(false));
  }, []);

  const handleCountryClick = async (countryName: string) => {
    setSelectedCountry(countryName);
    setShowInstructions(false);
    setLoadingStats(true);
    setCountryStats(null);

    try {
      const res  = await fetch(`${API_BASE}/countries/${encodeURIComponent(countryName)}/stats`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Bilinmeyen hata');
      setCountryStats(data as CountryStats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Stats hatası:', msg);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleCompanyClick = async (companyName: string) => {
    setLoadingStats(true);
    try {
      const res  = await fetch(`${API_BASE}/companies/${encodeURIComponent(companyName)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Bilinmeyen hata');
      setSelectedCompany(data as CompanyStats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Company stats hatası:', msg);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedCountry(null);
    setCountryStats(null);
    setSelectedCompany(null);
  };

  if (loadingMap) {
    return (
      <div className="w-screen h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📊</div>
          <h2 className="text-2xl font-bold text-gray-800">Veriler Yükleniyor...</h2>
          <p className="text-gray-600 mt-2">Supabase'den ülke verileri çekiliyor</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md bg-white rounded-xl shadow-lg p-8">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Bağlantı Hatası</h2>
          <p className="text-gray-600 text-sm">{error}</p>
          <code className="block mt-4 bg-gray-100 rounded p-2 text-xs text-left">
            cd backend && npm run dev
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">🌍 Dünya Ticaret Haritası</h1>
              <p className="text-blue-100 text-sm mt-1">
                Ülkelere tıklayarak detaylı ticaret istatistiklerini görüntüleyin
              </p>
            </div>
            <div className="bg-blue-800 px-4 py-2 rounded-lg">
              <div className="text-sm text-blue-200">Ülke Sayısı</div>
              <div className="text-2xl font-bold">{mapCountries.filter(c => c.totalTrade > 0).length}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative" style={{ height: 'calc(100vh - 80px)' }}>
        <div className="w-full h-full">
          <WorldMap
            countries={mapCountries}
            onCountryClick={handleCountryClick}
            selectedCountry={selectedCountry}
          />
        </div>

        {/* Instructions Overlay */}
        {showInstructions && !selectedCountry && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl p-8 max-w-md z-20">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Hoş Geldiniz!</h2>
              <p className="text-gray-600 mb-4">
                Harita üzerindeki <span className="text-green-600 font-semibold">renkli ülkelere</span> tıklayarak detaylı ticaret bilgilerini görüntüleyebilirsiniz.
              </p>
              <div className="bg-gray-50 rounded p-4 text-left text-sm space-y-2">
                {['En çok satan firmalar', 'En büyük müşteriler', 'Fiyat ortalamaları', 'Ticaret dengesi', 'Yıllık trend'].map(item => (
                  <div key={item} className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
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
            {[
              { color: 'bg-blue-600',  label: 'Seçili Ülke' },
              { color: 'bg-green-400', label: 'Yüksek Ticaret' },
              { color: 'bg-green-100', label: 'Düşük Ticaret' },
              { color: 'bg-gray-300',  label: 'Veri Yok' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center">
                <div className={`w-4 h-4 rounded mr-2 ${color}`}></div>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats yüklenirken spinner */}
        {loadingStats && (
          <div className="absolute right-0 top-0 h-full w-full md:w-2/5 bg-white shadow-2xl flex items-center justify-center z-10">
            <div className="text-center">
              <div className="text-4xl mb-3 animate-spin">⏳</div>
              <p className="text-gray-600">Veriler çekiliyor...</p>
            </div>
          </div>
        )}

        {/* Company Detail Panel */}
        {!loadingStats && selectedCompany && (
          <CompanyDetail
            stats={selectedCompany}
            onBack={() => setSelectedCompany(null)}
            onClose={handleCloseDetail}
          />
        )}

        {/* Country Detail Panel */}
        {!loadingStats && !selectedCompany && countryStats && (
          <CountryDetail
            stats={countryStats}
            onClose={handleCloseDetail}
            onCompanyClick={handleCompanyClick}
          />
        )}
      </div>
    </div>
  );
}

export default App;
