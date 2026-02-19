import type { CompanyStats } from '../types/index.js';
import { formatCurrency, formatNumber } from '../utils/dataAnalysis';

interface CompanyDetailProps {
  stats: CompanyStats;
  onBack: () => void;
  onClose: () => void;
}

export const CompanyDetail = ({ stats, onBack, onClose }: CompanyDetailProps) => {
  const tradeBalance = stats.totalExportValue - stats.totalImportValue;
  const tradeBalanceColor = tradeBalance >= 0 ? 'text-green-600' : 'text-red-600';
  const avgImportPrice = stats.totalImportVolume > 0 ? stats.totalImportValue / stats.totalImportVolume : 0;
  const avgExportPrice = stats.totalExportVolume > 0 ? stats.totalExportValue / stats.totalExportVolume : 0;

  return (
    <div className="fixed right-0 top-0 h-full w-full md:w-2/5 bg-white shadow-2xl overflow-y-auto z-10">
      <div className="sticky top-0 bg-indigo-700 text-white p-4 flex justify-between items-center">
        <div>
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

        {/* Top Müşteriler */}
        {(stats.topCustomers?.length ?? 0) > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3">🤝 Top Müşteriler</h3>
            <div className="space-y-2">
              {stats.topCustomers.map((c, idx) => {
                const unitPrice = c.volume > 0 ? c.value / c.volume : 0;
                return (
                  <div key={idx} className="bg-gray-50 rounded p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{c.name}</div>
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
          </section>
        )}

        {/* En Çok İhracat Yapılan Ülkeler */}
        {(stats.topDestinationCountries?.length ?? 0) > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3">🌍 En Çok İhracat Yapılan Ülkeler</h3>
            <div className="space-y-2">
              {stats.topDestinationCountries.map((d, idx) => (
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
          </section>
        )}

        {/* Yıllık İhracat */}
        {(stats.yearlyExports?.length ?? 0) > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3">📅 Yıllık İhracat</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-left">
                    <th className="px-3 py-2 rounded-tl">Yıl</th>
                    <th className="px-3 py-2">Miktar (kg)</th>
                    <th className="px-3 py-2 rounded-tr">Değer (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.yearlyExports.map(y => (
                    <tr key={y.year} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 font-semibold text-gray-700">{y.year}</td>
                      <td className="px-3 py-2 text-gray-600">{formatNumber(y.exportVolume)}</td>
                      <td className="px-3 py-2 font-bold text-purple-600">{formatCurrency(y.exportValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Aldığı Top Şirketler */}
        {(stats.topSuppliers?.length ?? 0) > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3">🛒 En Çok Satın Aldığı Firmalar</h3>
            <div className="space-y-2">
              {stats.topSuppliers.map((c, idx) => {
                const unitPrice = c.volume > 0 ? c.value / c.volume : 0;
                return (
                  <div key={idx} className="bg-blue-50 rounded p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{c.name}</div>
                        <div className="text-sm text-gray-600">
                          {formatNumber(c.volume)} kg
                        </div>
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
          </section>
        )}

        {/* En Çok Aldığı Ülkeler */}
        {(stats.topSourceCountries?.length ?? 0) > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3">🌍 En Çok Aldığı Ülkeler</h3>
            <div className="space-y-2">
              {stats.topSourceCountries.map((d, idx) => (
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
          </section>
        )}

        {/* Yıllık İthalat */}
        {(stats.yearlyImports?.length ?? 0) > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-3">📅 Yıllık Alış Hacmi</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-left">
                    <th className="px-3 py-2 rounded-tl">Yıl</th>
                    <th className="px-3 py-2">Miktar (kg)</th>
                    <th className="px-3 py-2 rounded-tr">Değer (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.yearlyImports.map(y => (
                    <tr key={y.year} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 font-semibold text-gray-700">{y.year}</td>
                      <td className="px-3 py-2 text-gray-600">{formatNumber(y.importVolume)}</td>
                      <td className="px-3 py-2 font-bold text-blue-600">{formatCurrency(y.importValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
