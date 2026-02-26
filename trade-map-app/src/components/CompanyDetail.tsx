import { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { CompanyStats } from '../types/index.js';
import { formatCurrency, formatNumber } from '../utils/dataAnalysis';

interface CompanyDetailProps {
  stats: CompanyStats;
  onBack: () => void;
  onClose: () => void;
  onCompanyClick: (name: string) => void;
  onBackToCompany?: () => void;
}

const INITIAL_SHOW      = 5;
const VIRTUAL_ITEM_H    = 72;
const VIRTUAL_THRESHOLD = 10;

// Sanal scroll listesi — büyük listeler için (müşteriler, tedarikçiler)
function VirtualTradeList({
  items,
  colorClass = 'bg-gray-50',
  showPrice = true,
  valueColor = 'text-green-600',
  onCompanyClick,
}: {
  items: { name: string; volume: number; value: number }[];
  colorClass?: string;
  showPrice?: boolean;
  valueColor?: string;
  onCompanyClick?: (name: string) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => VIRTUAL_ITEM_H,
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className="overflow-y-auto rounded border border-gray-100"
      style={{ height: Math.min(items.length * VIRTUAL_ITEM_H, 400) + 'px' }}
    >
      <div style={{ height: virtualizer.getTotalSize() + 'px', position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualItem => {
          const c         = items[virtualItem.index];
          const unitPrice = c.volume > 0 ? c.value / c.volume : 0;
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
              <div className={`${colorClass} rounded p-3 h-full flex items-center`}>
                <div className="flex justify-between items-start w-full">
                  <div className="flex-1 min-w-0">
                    {onCompanyClick ? (
                      <button
                        onClick={() => onCompanyClick(c.name)}
                        className="font-semibold text-blue-700 hover:underline text-left text-sm"
                      >
                        {c.name}
                      </button>
                    ) : (
                      <div className="font-semibold text-gray-800 text-sm">{c.name}</div>
                    )}
                    <div className="text-xs text-gray-600 mt-0.5">
                      {formatNumber(c.volume)} kg
                      {showPrice && unitPrice > 0 && ` · $${unitPrice.toFixed(2)}/kg`}
                    </div>
                  </div>
                  <div className="text-right ml-2 shrink-0">
                    <div className={`font-bold text-sm ${valueColor}`}>{formatCurrency(c.value)}</div>
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

export const CompanyDetail = ({ stats, onBack, onClose, onCompanyClick, onBackToCompany }: CompanyDetailProps) => {
  const [showAllDestCountries,   setShowAllDestCountries]   = useState(false);
  const [showAllSourceCountries, setShowAllSourceCountries] = useState(false);
  const [showAllCustomers,       setShowAllCustomers]       = useState(false);
  const [showAllSuppliers,       setShowAllSuppliers]       = useState(false);

  const tradeBalance      = stats.totalExportValue - stats.totalImportValue;
  const tradeBalanceColor = tradeBalance >= 0 ? 'text-green-600' : 'text-red-600';
  const avgImportPrice    = stats.totalImportVolume > 0 ? stats.totalImportValue / stats.totalImportVolume : 0;
  const avgExportPrice    = stats.totalExportVolume > 0 ? stats.totalExportValue / stats.totalExportVolume : 0;

  // Yıllık sevkiyat hesaplama
  const hasYearlyData = (stats.yearlyExports?.length ?? 0) > 0 || (stats.yearlyImports?.length ?? 0) > 0;
  const yearSet = new Set<number>();
  (stats.yearlyExports ?? []).forEach(e => yearSet.add(e.year));
  (stats.yearlyImports ?? []).forEach(i => yearSet.add(i.year));
  const yearlyShipmentYears = Array.from(yearSet).sort();
  const exportByYear = new Map((stats.yearlyExports ?? []).map(e => [e.year, e]));
  const importByYear = new Map((stats.yearlyImports ?? []).map(i => [i.year, i]));
  const totalExportShipments = (stats.yearlyExports ?? []).reduce((s, e) => s + (e.shipmentCount ?? 0), 0);
  const totalImportShipments = (stats.yearlyImports ?? []).reduce((s, i) => s + (i.shipmentCount ?? 0), 0);
  const avgExportPerYear = yearlyShipmentYears.length > 0 ? Math.round(totalExportShipments / yearlyShipmentYears.length) : 0;
  const avgImportPerYear = yearlyShipmentYears.length > 0 ? Math.round(totalImportShipments / yearlyShipmentYears.length) : 0;

  return (
    <div className="fixed right-0 top-0 h-full w-full md:w-2/5 bg-white shadow-2xl overflow-y-auto z-10">
      <div className="sticky top-0 bg-indigo-700 text-white p-4 flex justify-between items-center">
        <div>
          {onBackToCompany && (
            <button
              onClick={onBackToCompany}
              className="text-indigo-200 hover:text-white text-sm mb-1 flex items-center gap-1"
            >
              ← Firmaya Dön
            </button>
          )}
          <button
            onClick={onBack}
            className="text-indigo-200 hover:text-white text-sm mb-1 flex items-center gap-1"
          >
            ← Ülkeye Dön
          </button>
          <h2 className="text-xl font-bold leading-tight">{stats.companyName}</h2>
          <p className="text-indigo-200 text-sm">{stats.countryName}</p>
          {stats.address && (
            <p className="text-indigo-300 text-xs mt-0.5">{stats.address}</p>
          )}
          {stats.website && (
            <a
              href={stats.website.startsWith('http') ? stats.website : `https://${stats.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-200 hover:text-white text-xs underline mt-0.5 block"
            >
              {stats.website}
            </a>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 text-3xl font-bold self-start"
        >
          ×
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Ticaret Özeti */}
        <section className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Ticaret Özeti</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded p-3 shadow">
              <div className="text-sm text-gray-600">İhracat Hacmi</div>
              <div className="text-xl font-bold text-green-600">
                {formatNumber(stats.totalExportVolume)} kg
              </div>
              <div className="text-sm text-gray-500">{formatCurrency(stats.totalExportValue)}</div>
              {avgExportPrice > 0 && (
                <div className="text-xs text-gray-400 mt-1">Ort. ${avgExportPrice.toFixed(2)}/kg</div>
              )}
            </div>
            <div className="bg-white rounded p-3 shadow">
              <div className="text-sm text-gray-600">İthalat Hacmi</div>
              <div className="text-xl font-bold text-blue-600">
                {formatNumber(stats.totalImportVolume)} kg
              </div>
              <div className="text-sm text-gray-500">{formatCurrency(stats.totalImportValue)}</div>
              {avgImportPrice > 0 && (
                <div className="text-xs text-gray-400 mt-1">Ort. ${avgImportPrice.toFixed(2)}/kg</div>
              )}
            </div>
          </div>
          <div className="mt-4 bg-white rounded p-3 shadow">
            <div className="text-sm text-gray-600 mb-1">Ticaret Dengesi</div>
            <div className={`text-2xl font-bold ${tradeBalanceColor}`}>
              {formatCurrency(tradeBalance)}
            </div>
          </div>

        </section>

        {/* Top Müşteriler — virtual scroll için */}
        {(stats.topCustomers?.length ?? 0) > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              🤝 Müşteriler ({stats.topCustomers.length})
            </h3>
            {stats.topCustomers.length > VIRTUAL_THRESHOLD ? (
              <VirtualTradeList
                items={stats.topCustomers}
                colorClass="bg-gray-50"
                valueColor="text-green-600"
                onCompanyClick={onCompanyClick}
              />
            ) : (
              <>
                <div className="space-y-2">
                  {(showAllCustomers ? stats.topCustomers : stats.topCustomers.slice(0, INITIAL_SHOW)).map((c, idx) => {
                    const unitPrice = c.volume > 0 ? c.value / c.volume : 0;
                    return (
                      <div key={idx} className="bg-gray-50 rounded p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <button
                              onClick={() => onCompanyClick(c.name)}
                              className="font-semibold text-blue-700 hover:underline text-left"
                            >
                              {c.name}
                            </button>
                            <div className="text-sm text-gray-600">
                              {formatNumber(c.volume)} kg &middot; ${unitPrice.toFixed(2)}/kg
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="font-bold text-green-600">{formatCurrency(c.value)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {stats.topCustomers.length > INITIAL_SHOW && (
                  <button
                    onClick={() => setShowAllCustomers(v => !v)}
                    className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    {showAllCustomers ? '▲ Gizle' : `▼ Tümünü Gör (${stats.topCustomers.length - INITIAL_SHOW} daha)`}
                  </button>
                )}
              </>
            )}
          </section>
        )}

        {/* İhracat Yapılan Ülkeler */}
        {(stats.topDestinationCountries?.length ?? 0) > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              🌍 İhracat Yapılan Ülkeler ({stats.topDestinationCountries.length})
            </h3>
            <div className="space-y-2">
              {(showAllDestCountries ? stats.topDestinationCountries : stats.topDestinationCountries.slice(0, INITIAL_SHOW)).map((d, idx) => (
                <div key={idx} className="bg-gray-50 rounded p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{d.country}</div>
                      <div className="text-sm text-gray-600">{formatNumber(d.volume)} kg</div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="font-bold text-green-600">{formatCurrency(d.value)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {stats.topDestinationCountries.length > INITIAL_SHOW && (
              <button
                onClick={() => setShowAllDestCountries(v => !v)}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {showAllDestCountries ? '▲ Gizle' : `▼ Tümünü Gör (${stats.topDestinationCountries.length - INITIAL_SHOW} daha)`}
              </button>
            )}
          </section>
        )}

        {/* Tedarikçiler — virtual scroll */}
        {(stats.topSuppliers?.length ?? 0) > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              🛒 Tedarikçiler ({stats.topSuppliers.length})
            </h3>
            {stats.topSuppliers.length > VIRTUAL_THRESHOLD ? (
              <VirtualTradeList
                items={stats.topSuppliers}
                colorClass="bg-blue-50"
                showPrice
                valueColor="text-blue-600"
                onCompanyClick={onCompanyClick}
              />
            ) : (
              <>
                <div className="space-y-2">
                  {(showAllSuppliers ? stats.topSuppliers : stats.topSuppliers.slice(0, INITIAL_SHOW)).map((c, idx) => {
                    const unitPrice = c.volume > 0 ? c.value / c.volume : 0;
                    return (
                      <div key={idx} className="bg-blue-50 rounded p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <button
                              onClick={() => onCompanyClick(c.name)}
                              className="font-semibold text-blue-700 hover:underline text-left"
                            >
                              {c.name}
                            </button>
                            <div className="text-sm text-gray-600">{formatNumber(c.volume)} kg</div>
                            <div className="text-xs font-medium text-blue-700 mt-0.5">
                              Ort. fiyat: ${unitPrice.toFixed(2)}/kg
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="font-bold text-blue-600">{formatCurrency(c.value)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {stats.topSuppliers.length > INITIAL_SHOW && (
                  <button
                    onClick={() => setShowAllSuppliers(v => !v)}
                    className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    {showAllSuppliers ? '▲ Gizle' : `▼ Tümünü Gör (${stats.topSuppliers.length - INITIAL_SHOW} daha)`}
                  </button>
                )}
              </>
            )}
          </section>
        )}

        {/* İthalat Yapılan Ülkeler */}
        {(stats.topSourceCountries?.length ?? 0) > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              🌍 İthalat Yapılan Ülkeler ({stats.topSourceCountries.length})
            </h3>
            <div className="space-y-2">
              {(showAllSourceCountries ? stats.topSourceCountries : stats.topSourceCountries.slice(0, INITIAL_SHOW)).map((d, idx) => (
                <div key={idx} className="bg-blue-50 rounded p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{d.country}</div>
                      <div className="text-sm text-gray-600">{formatNumber(d.volume)} kg</div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="font-bold text-blue-600">{formatCurrency(d.value)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {stats.topSourceCountries.length > INITIAL_SHOW && (
              <button
                onClick={() => setShowAllSourceCountries(v => !v)}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {showAllSourceCountries ? '▲ Gizle' : `▼ Tümünü Gör (${stats.topSourceCountries.length - INITIAL_SHOW} daha)`}
              </button>
            )}
          </section>
        )}

        {/* Yıllık Sevkiyatlar */}
        {hasYearlyData && (
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3">📅 Yıllık Sevkiyatlar</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-left">
                    <th className="px-3 py-2 rounded-tl">Yıl</th>
                    <th className="px-3 py-2 text-green-700">İhracat</th>
                    <th className="px-3 py-2 text-blue-700 rounded-tr">İthalat</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyShipmentYears.map(year => {
                    const exp = exportByYear.get(year);
                    const imp = importByYear.get(year);
                    return (
                      <tr key={year} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 font-semibold text-gray-800">{year}</td>
                        <td className="px-3 py-2 text-green-600 font-medium">
                          {exp ? `${exp.shipmentCount ?? '—'} sevkiyat` : '—'}
                        </td>
                        <td className="px-3 py-2 text-blue-600 font-medium">
                          {imp ? `${imp.shipmentCount ?? '—'} sevkiyat` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {yearlyShipmentYears.length > 1 && (totalExportShipments > 0 || totalImportShipments > 0) && (
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold text-gray-700 border-t-2 border-gray-200">
                      <td className="px-3 py-2">Ort./yıl</td>
                      <td className="px-3 py-2 text-green-700">
                        {avgExportPerYear > 0 ? avgExportPerYear : '—'}
                      </td>
                      <td className="px-3 py-2 text-blue-700">
                        {avgImportPerYear > 0 ? avgImportPerYear : '—'}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>
        )}

        {/* Çıkış Limanları */}
        {(stats.exitPorts?.length ?? 0) > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3">⚓ Çıkış Limanları</h3>
            <div className="flex flex-wrap gap-2">
              {stats.exitPorts.map((p, idx) => (
                <span key={idx} className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-full px-3 py-1">
                  {p.port} <span className="text-green-500 font-medium">({p.count})</span>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Varış Limanları */}
        {(stats.entryPorts?.length ?? 0) > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3">🏁 Varış Limanları</h3>
            <div className="flex flex-wrap gap-2">
              {stats.entryPorts.map((p, idx) => (
                <span key={idx} className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-full px-3 py-1">
                  {p.port} <span className="text-blue-500 font-medium">({p.count})</span>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* İletişim Bilgileri */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 mb-3">👤 İletişim Bilgileri</h3>
          {(stats.contacts?.length ?? 0) === 0 ? (
            <p className="text-gray-500 text-sm italic bg-gray-50 rounded p-4">
              Bu firma için henüz iletişim bilgisi eklenmemiş.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-left">
                    <th className="px-3 py-2 rounded-tl">İsim</th>
                    <th className="px-3 py-2">Pozisyon</th>
                    <th className="px-3 py-2">LinkedIn</th>
                    <th className="px-3 py-2 rounded-tr">E-posta</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.contacts.map(contact => (
                    <tr key={contact.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 font-semibold text-gray-800">
                        {contact.contactName}
                        {contact.phone && (
                          <div className="text-xs text-gray-500 font-normal">{contact.phone}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-indigo-600">{contact.position || '—'}</td>
                      <td className="px-3 py-2">
                        {contact.linkedinUrl ? (
                          <a
                            href={contact.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            LinkedIn
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {contact.email ? (
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {contact.email}
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
