import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { CountryStats } from '../types/index.js';
import { formatCurrency, formatNumber } from '../utils/dataAnalysis';

interface CountryDetailProps {
  stats: CountryStats;
  onClose: () => void;
  onCompanyClick: (name: string) => void;
}

// Sabit yükseklikli sanal scroll listesi — 400px konteyner, sadece görünen öğeler render edilir
const VIRTUAL_ITEM_HEIGHT = 72; // px — her firma kartının yaklaşık yüksekliği
const VIRTUAL_THRESHOLD   = 10; // bu sayının üzerinde virtual scroll devreye girer

function VirtualCompanyList({
  items,
  onCompanyClick,
}: {
  items: { name: string; volume: number; value: number; companyCountry: string }[];
  onCompanyClick: (name: string) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => VIRTUAL_ITEM_HEIGHT,
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className="overflow-y-auto rounded border border-gray-100"
      style={{ height: Math.min(items.length * VIRTUAL_ITEM_HEIGHT, 400) + 'px' }}
    >
      <div style={{ height: virtualizer.getTotalSize() + 'px', position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualItem => {
          const company   = items[virtualItem.index];
          const unitPrice = company.volume > 0 ? company.value / company.volume : 0;
          return (
            <div
              key={virtualItem.key}
              style={{
                position:  'absolute',
                top:       0,
                left:      0,
                width:     '100%',
                height:    virtualItem.size + 'px',
                transform: `translateY(${virtualItem.start}px)`,
                padding:   '0 0 4px 0',
              }}
            >
              <div className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition h-full flex items-center">
                <div className="flex justify-between items-start w-full">
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => onCompanyClick(company.name)}
                      className="font-semibold text-blue-700 hover:underline text-left text-sm"
                    >
                      {company.name}
                    </button>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatNumber(company.volume)} kg &middot; ${unitPrice.toFixed(2)}/kg
                    </div>
                  </div>
                  <div className="text-right ml-2 shrink-0">
                    <div className="font-bold text-green-600 text-sm">{formatCurrency(company.value)}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const CountryDetail = ({ stats, onClose, onCompanyClick }: CountryDetailProps) => {
  const tradeBalanceColor = stats.tradeBalance >= 0 ? 'text-green-600' : 'text-red-600';

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
              <div className="text-sm text-gray-500">{formatCurrency(stats.totalExportValue)}</div>
            </div>
            <div className="bg-white rounded p-3 shadow">
              <div className="text-sm text-gray-600">İthalat Hacmi</div>
              <div className="text-xl font-bold text-blue-600">
                {formatNumber(stats.totalImportVolume)} kg
              </div>
              <div className="text-sm text-gray-500">{formatCurrency(stats.totalImportValue)}</div>
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

        </section>

        {/* En Çok İhracat Yapan Firmalar */}
        {stats.topExporters.length > 0 && (
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              🏭 En Çok İhracat Yapan Firmalar ({stats.topExporters.length})
            </h3>
            {stats.topExporters.length > VIRTUAL_THRESHOLD ? (
              <VirtualCompanyList items={stats.topExporters} onCompanyClick={onCompanyClick} />
            ) : (
              <div className="space-y-2">
                {stats.topExporters.map((company, idx) => {
                  const unitPrice = company.volume > 0 ? company.value / company.volume : 0;
                  return (
                    <div key={idx} className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => onCompanyClick(company.name)}
                            className="font-semibold text-blue-700 hover:underline text-left"
                          >
                            {company.name}
                          </button>
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
                })}
              </div>
            )}
          </section>
        )}

        {/* En Çok İthalat Yapan Firmalar */}
        {stats.topImporters.length > 0 && (
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              🏢 En Çok İthalat Yapan Firmalar ({stats.topImporters.length})
            </h3>
            {stats.topImporters.length > VIRTUAL_THRESHOLD ? (
              <VirtualCompanyList items={stats.topImporters} onCompanyClick={onCompanyClick} />
            ) : (
              <div className="space-y-2">
                {stats.topImporters.map((company, idx) => {
                  const unitPrice = company.volume > 0 ? company.value / company.volume : 0;
                  return (
                    <div key={idx} className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => onCompanyClick(company.name)}
                            className="font-semibold text-blue-700 hover:underline text-left"
                          >
                            {company.name}
                          </button>
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
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
