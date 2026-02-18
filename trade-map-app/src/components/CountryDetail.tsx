import type { CountryStats } from '../types/index.js';
import { formatCurrency, formatNumber } from '../utils/dataAnalysis';

interface CountryDetailProps {
  stats: CountryStats;
  onClose: () => void;
}

export const CountryDetail = ({ stats, onClose }: CountryDetailProps) => {
  const tradeBalanceColor = stats.tradeBalance >= 0 ? 'text-green-600' : 'text-red-600';

  // Yıllık satış hacmi hesapla
  const getYearlySales = () => {
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

        {/* En Çok Satan Firmalar */}
        {stats.topExporters.length > 0 && (
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-3">🏭 En Çok Satan Firmalar</h3>
            <div className="space-y-2">
              {stats.topExporters.slice(0, 5).map((company, idx) => {
                const unitPrice = company.volume > 0 ? company.value / company.volume : 0;
                return (
                  <div key={idx} className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{company.name}</div>
                        <div className="text-sm text-gray-600">
                          {formatNumber(company.volume)} kg / ${unitPrice.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{formatCurrency(company.value)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* En Büyük Müşteriler */}
        {stats.topBuyers.length > 0 && (
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-3">👥 En Büyük Müşteriler</h3>
            <div className="space-y-2">
              {stats.topBuyers.slice(0, 5).map((buyer, idx) => {
                const unitPrice = buyer.volume > 0 ? buyer.value / buyer.volume : 0;
                return (
                  <div key={idx} className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{buyer.name}</div>
                        <div className="text-sm text-gray-600">
                          {formatNumber(buyer.volume)} kg / ${unitPrice.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{formatCurrency(buyer.value)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* En Çok Gönderdiği Ülkeler */}
        {stats.topDestinations.length > 0 && (
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-3">🌍 En Çok Gönderdiği Ülkeler</h3>
            <div className="space-y-2">
              {stats.topDestinations.map((dest, idx) => (
                <div key={idx} className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{dest.country}</div>
                      <div className="text-sm text-gray-600">
                        {formatNumber(dest.volume)} kg
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{formatCurrency(dest.value)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* En Çok Aldığı Ülkeler */}
        {stats.topSources.length > 0 && (
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-3">📦 En Çok Aldığı Ülkeler</h3>
            <div className="space-y-2">
              {stats.topSources.map((source, idx) => (
                <div key={idx} className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{source.country}</div>
                      <div className="text-sm text-gray-600">
                        {formatNumber(source.volume)} kg
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">{formatCurrency(source.value)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* En Çok Alan Firmalar */}
        {stats.topImporters.length > 0 && (
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-3">🏢 Bu Ülkeden En Çok Alan Firmalar</h3>
            <div className="space-y-2">
              {stats.topImporters.slice(0, 5).map((importer, idx) => {
                const unitPrice = importer.volume > 0 ? importer.value / importer.volume : 0;
                return (
                  <div key={idx} className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{importer.name}</div>
                        <div className="text-sm text-gray-600">
                          {formatNumber(importer.volume)} kg / ${unitPrice.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{formatCurrency(importer.value)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Tüm Firmalar */}
        {stats.exportCompanies.length > 0 && (
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-3">📋 Tüm İhracatçı Firmalar</h3>
            <div className="bg-gray-50 rounded p-3 max-h-60 overflow-y-auto">
              <ul className="space-y-1">
                {stats.exportCompanies.map((company, idx) => (
                  <li key={idx} className="text-sm text-gray-700">• {company}</li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
