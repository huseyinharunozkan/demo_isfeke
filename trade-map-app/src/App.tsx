import { useState, useEffect, useRef, useCallback } from 'react';
import { WorldMap } from './components/WorldMap';
import { CountryDetail } from './components/CountryDetail';
import { CompanyDetail } from './components/CompanyDetail';
import type { MapCountry, CountryStats, CompanyStats } from './types/index.js';
import './App.css';

const API_BASE = '/api';
const CACHE_TTL = 5 * 60 * 1000; // 5 dakika

interface CacheEntry<T> { data: T; ts: number; }

function App() {
  const [selectedCountry, setSelectedCountry]   = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [mapCountries, setMapCountries]         = useState<MapCountry[]>([]);
  const [countryStats, setCountryStats]         = useState<CountryStats | null>(null);
  const [selectedCompany, setSelectedCompany]   = useState<CompanyStats | null>(null);
  const [companyHistory, setCompanyHistory]     = useState<CompanyStats[]>([]);
  const [loadingMap, setLoadingMap]             = useState(true);
  const [loadingStats, setLoadingStats]         = useState(false);
  const [error, setError]                       = useState<string | null>(null);

  // TTL cache'ler
  const countryCache = useRef(new Map<string, CacheEntry<CountryStats>>());
  const companyCache = useRef(new Map<string, CacheEntry<CompanyStats>>());

  // AbortController ref'leri — uçuştaki istekleri iptal etmek için
  const countryAbortRef = useRef<AbortController | null>(null);
  const companyAbortRef = useRef<AbortController | null>(null);

  // Güncel selectedCompany'ye ref üzerinden erişim — callback'lerin stale closure'ını önler
  const selectedCompanyRef = useRef<CompanyStats | null>(null);
  useEffect(() => { selectedCompanyRef.current = selectedCompany; }, [selectedCompany]);

  // Harita verilerini yükle (uygulama başlangıcında bir kez)
  useEffect(() => {
    fetch(`${API_BASE}/countries`)
      .then(r => r.json())
      .then((data: MapCountry[]) => {
        setMapCountries(data);
        console.log(`✅ ${data.length} ülke yüklendi`);
      })
      .catch(err => {
        console.error('API bağlantı hatası:', err);
        setError("Backend API'ye bağlanılamadı. http://localhost:3001 çalışıyor mu?");
      })
      .finally(() => setLoadingMap(false));
  }, []);

  const handleCountryClick = useCallback(async (countryName: string) => {
    setSelectedCountry(countryName);
    setShowInstructions(false);
    setSelectedCompany(null);
    setCompanyHistory([]);

    // Cache kontrolü
    const cached = countryCache.current.get(countryName);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setCountryStats(cached.data);
      return;
    }

    setLoadingStats(true);
    setCountryStats(null);

    countryAbortRef.current?.abort();
    const ctrl = new AbortController();
    countryAbortRef.current = ctrl;

    try {
      const res  = await fetch(`${API_BASE}/countries/${encodeURIComponent(countryName)}/stats`, { signal: ctrl.signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Bilinmeyen hata');
      const stats = data as CountryStats;
      countryCache.current.set(countryName, { data: stats, ts: Date.now() });
      setCountryStats(stats);
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      console.error('Stats hatası:', err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const handleCompanyClick = useCallback(async (companyName: string) => {
    // Firma içinden firmaya geçişte mevcut firmayı geçmişe ekle
    if (selectedCompanyRef.current) {
      setCompanyHistory(prev => [...prev, selectedCompanyRef.current!]);
    } else {
      setCompanyHistory([]);
    }

    // Cache kontrolü
    const cached = companyCache.current.get(companyName);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setSelectedCompany(cached.data);
      return;
    }

    setLoadingStats(true);

    companyAbortRef.current?.abort();
    const ctrl = new AbortController();
    companyAbortRef.current = ctrl;

    try {
      const res  = await fetch(`${API_BASE}/companies/${encodeURIComponent(companyName)}`, { signal: ctrl.signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Bilinmeyen hata');
      const stats = data as CompanyStats;
      companyCache.current.set(companyName, { data: stats, ts: Date.now() });
      setSelectedCompany(stats);
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      console.error('Company stats hatası:', err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const handleBackToCompany = useCallback(() => {
    setCompanyHistory(prev => {
      const newHistory = [...prev];
      const previous   = newHistory.pop();
      if (previous) setSelectedCompany(previous);
      return newHistory;
    });
  }, []);

  const handleCloseDetail = () => {
    setSelectedCountry(null);
    setCountryStats(null);
    setSelectedCompany(null);
    setCompanyHistory([]);
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
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center gap-4">
            <div className="shrink-0">
              <h1 className="text-2xl font-bold">🌍 Dünya Ticaret Haritası</h1>
              <p className="text-blue-100 text-xs mt-0.5 hidden sm:block">
                Ülkelere tıklayarak ticaret istatistiklerini görüntüleyin
              </p>
            </div>

            <div className="bg-blue-800 px-3 py-2 rounded-lg shrink-0">
              <div className="text-xs text-blue-200">Ülke</div>
              <div className="text-xl font-bold">{mapCountries.filter(c => c.totalTrade > 0).length}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative" style={{ height: 'calc(100vh - 72px)' }}>
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
                Harita üzerindeki <span className="text-green-600 font-semibold">renkli ülkelere</span> tıklayarak
                detaylı ticaret bilgilerini görüntüleyebilirsiniz.
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
            onBack={() => { setSelectedCompany(null); setCompanyHistory([]); }}
            onClose={handleCloseDetail}
            onCompanyClick={handleCompanyClick}
            onBackToCompany={companyHistory.length > 0 ? handleBackToCompany : undefined}
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
