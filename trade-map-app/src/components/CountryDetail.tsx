import { useState } from 'react';
import type { CountryStats } from '../types/index.js';
import { formatCurrency, formatNumber } from '../utils/dataAnalysis';

interface CountryDetailProps {
  stats: CountryStats;
  onClose: () => void;
  onCompanyClick: (name: string) => void;
}

export const CountryDetail = ({ stats, onClose, onCompanyClick }: CountryDetailProps) => {
  const tradeBalanceColor = stats.tradeBalance >= 0 ? 'text-green-600' : 'text-red-600';

  const [showAllExporters, setShowAllExporters] = useState(false);
  const [showAllImporters, setShowAllImporters] = useState(false);

  // Yıllık satış hacmi hesapla
  const getYearlySales = () => {
    if (stats.yearlyTrade && stats.yearlyTrade.length > 0) {
      return stats.yearlyTrade.map(y => ({ year: y.year, value: y.exportValue }));
    }
    const salesByYear = new Map<number, number>();
    stats.rawExports.forEach(trade => {
      const year = new Date(trade['TARİH']).getFullYear();
      const value = trade['ÜRÜN MİKTARI (KG)'] * trade['ÜRÜN FİYATI (USD)'];
      salesByYear.set(year, (salesByYear.get(year) || 0) + value);
    });
    return Array.from(salesByYear.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, value]) => ({ year, value }));
  };

  const yearlySales = getYearlySales();

  const renderCompanyCard = (company: { name: string; volume: number; value: number; companyCountry: string }, idx: number) => {
    const unitPrice = company.volume > 0 ? company.value / company.volume : 0;
    return (
      <div key={idx} className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => onCompanyClick(company.name)}
                className="font-semibold text-blue-700 hover:underline text-left"
              >
                {company.name}
              </button>
            </div>
            <div className="text-sm text-gray-600">
              {formatNumber(company.volume)} kg &middot; ${unitPrice.toFixed(2)}/kg
            </div>
          </div>
          <div className="text-right ml-2">
            <div className="font-bold text-green-600">{formatCurrency(company.value)}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderToggle = (show: boolean, setShow: (v: boolean) => void, total: number) => {
    if (total <= 5) return null;
    return (
      <button
        onClick={() => setShow(!show)}
        className="mt-2 text-sm text-blue-600 hover:underline"
      >
        {show ? 'Gizle' : `Tümünü Göster (${total})`}
      </button>
    );
  };

  return (
    <div className="fixed right-0 top-0 h-full w-full md:w-2/5 bg-white shadow-2xl overflow-y-auto z-10">
      <div className="sticky top-0 bg-blue-600 text-white p-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold">{stats.countryName}</h2>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 text-3xl font-bold"
        >
          ×
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Genel Bakış */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Genel Bakış</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded p-3 shadow">
              <div className="text-sm text-gray-600">İhracat Hacmi</div>
              <div className="text-xl font-bold text-green-600">
                {formatNumber(stats.totalExportVolume)} kg
              </div>
              <div className="text-sm text-gray-500">
                {formatCurrency(stats.totalExportValue)}
              </div>
            </div>
            <div className="bg-white rounded p-3 shadow">
              <div className="text-sm text-gray-600">İthalat Hacmi</div>
              <div className="text-xl font-bold text-blue-600">
                {formatNumber(stats.totalImportVolume)} kg
              </div>
              <div className="text-sm text-gray-500">
                {formatCurrency(stats.totalImportValue)}
              </div>
            </div>
            <div className="bg-white rounded p-3 shadow">
              <div className="text-sm text-gray-600">Ort. İhracat Fiyatı</div>
              <div className="text-lg font-bold text-gray-800">
                ${stats.avgExportPrice.toFixed(2)}/kg
              </div>
            </div>
            <div className="bg-white rounded p-3 shadow">
              <div className="text-sm text-gray-600">Ort. İthalat Fiyatı</div>
              <div className="text-lg font-bold text-gray-800">
                ${stats.avgImportPrice.toFixed(2)}/kg
              </div>
            </div>
          </div>
          {stats.tradeCount > 0 && (
            <div className="mt-4 bg-white rounded p-3 shadow">
              <div className="text-sm text-gray-600">Toplam İşlem Sayısı</div>
              <div className="text-xl font-bold text-indigo-600">
                {formatNumber(stats.tradeCount)} kayıt
              </div>
            </div>
          )}
          <div className="mt-4 bg-white rounded p-3 shadow">
            <div className="text-sm text-gray-600 mb-2">Ticaret Dengesi</div>
            <div className={`text-2xl font-bold ${tradeBalanceColor}`}>
              {formatCurrency(stats.tradeBalance)}
            </div>
          </div>
          {yearlySales.length > 0 && (
            <div className="mt-4 bg-white rounded p-3 shadow">
              <div className="text-sm text-gray-600 mb-3">Yıllık Satış Hacmi</div>
              <div className="space-y-2">
                {yearlySales.map(({ year, value }) => (
                  <div key={year} className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">{year}</span>
                    <span className="font-bold text-purple-600">{formatCurrency(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* En Çok İhracat Yapan Firmalar */}
        {stats.topExporters.length > 0 && (
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-3">🏭 En Çok İhracat Yapan Firmalar</h3>
            <div className="space-y-2">
              {stats.topExporters
                .slice(0, showAllExporters ? undefined : 5)
                .map((company, idx) => renderCompanyCard(company, idx))}
            </div>
            {renderToggle(showAllExporters, setShowAllExporters, stats.topExporters.length)}
          </section>
        )}

        {/* En Çok İthalat Yapan Firmalar */}
        {stats.topImporters.length > 0 && (
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-3">🏢 En Çok İthalat Yapan Firmalar</h3>
            <div className="space-y-2">
              {stats.topImporters
                .slice(0, showAllImporters ? undefined : 5)
                .map((importer, idx) => renderCompanyCard(importer, idx))}
            </div>
            {renderToggle(showAllImporters, setShowAllImporters, stats.topImporters.length)}
          </section>
        )}

      </div>
    </div>
  );
};
