import type { TradeData, CountryStats } from '../types/index.js';

export const analyzeCountryData = (
  countryName: string,
  allData: TradeData[]
): CountryStats | null => {
  // Bu ülkenin gönderdiği ve aldığı veriler
  const exports = allData.filter(d => d['GÖNDERİCİ ÜLKE'] === countryName);
  const imports = allData.filter(d => d['ALICI ÜLKE'] === countryName);

  if (exports.length === 0 && imports.length === 0) {
    return null;
  }

  // İhracat analizi
  const exporterStats = new Map<string, { volume: number; value: number }>();
  exports.forEach(trade => {
    const company = trade['GÖNDERİCİ FİRMA'];
    const volume = trade['ÜRÜN MİKTARI (KG)'];
    const value = volume * trade['ÜRÜN FİYATI (USD)'];

    const existing = exporterStats.get(company) || { volume: 0, value: 0 };
    exporterStats.set(company, {
      volume: existing.volume + volume,
      value: existing.value + value
    });
  });

  const topExporters = Array.from(exporterStats.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // En büyük müşteriler (bu ülkeden alanlar)
  const buyerStats = new Map<string, { volume: number; value: number }>();
  exports.forEach(trade => {
    const company = trade['ALICI FİRMA'];
    const volume = trade['ÜRÜN MİKTARI (KG)'];
    const value = volume * trade['ÜRÜN FİYATI (USD)'];

    const existing = buyerStats.get(company) || { volume: 0, value: 0 };
    buyerStats.set(company, {
      volume: existing.volume + volume,
      value: existing.value + value
    });
  });

  const topBuyers = Array.from(buyerStats.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // İthalat analizi
  const importerStats = new Map<string, { volume: number; value: number }>();
  imports.forEach(trade => {
    const company = trade['ALICI FİRMA'];
    const volume = trade['ÜRÜN MİKTARI (KG)'];
    const value = volume * trade['ÜRÜN FİYATI (USD)'];

    const existing = importerStats.get(company) || { volume: 0, value: 0 };
    importerStats.set(company, {
      volume: existing.volume + volume,
      value: existing.value + value
    });
  });

  const topImporters = Array.from(importerStats.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // En büyük satıcılar (bu ülkeye satanlar)
  const sellerStats = new Map<string, { volume: number; value: number }>();
  imports.forEach(trade => {
    const company = trade['GÖNDERİCİ FİRMA'];
    const volume = trade['ÜRÜN MİKTARI (KG)'];
    const value = volume * trade['ÜRÜN FİYATI (USD)'];

    const existing = sellerStats.get(company) || { volume: 0, value: 0 };
    sellerStats.set(company, {
      volume: existing.volume + volume,
      value: existing.value + value
    });
  });

  const topSellers = Array.from(sellerStats.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Hedef ülkeler (en çok gönderilen ülkeler)
  const destinationStats = new Map<string, { volume: number; value: number }>();
  exports.forEach(trade => {
    const country = trade['ALICI ÜLKE'];
    const volume = trade['ÜRÜN MİKTARI (KG)'];
    const value = volume * trade['ÜRÜN FİYATI (USD)'];

    const existing = destinationStats.get(country) || { volume: 0, value: 0 };
    destinationStats.set(country, {
      volume: existing.volume + volume,
      value: existing.value + value
    });
  });

  const topDestinations = Array.from(destinationStats.entries())
    .map(([country, data]) => ({ country, ...data }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Kaynak ülkeler (en çok alınan ülkeler)
  const sourceStats = new Map<string, { volume: number; value: number }>();
  imports.forEach(trade => {
    const country = trade['GÖNDERİCİ ÜLKE'];
    const volume = trade['ÜRÜN MİKTARI (KG)'];
    const value = volume * trade['ÜRÜN FİYATI (USD)'];

    const existing = sourceStats.get(country) || { volume: 0, value: 0 };
    sourceStats.set(country, {
      volume: existing.volume + volume,
      value: existing.value + value
    });
  });

  const topSources = Array.from(sourceStats.entries())
    .map(([country, data]) => ({ country, ...data }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Limanlar
  const exitPortStats = new Map<string, number>();
  exports.forEach(trade => {
    const port = trade['ÇIKIŞ LİMANI'];
    exitPortStats.set(port, (exitPortStats.get(port) || 0) + 1);
  });

  const exitPorts = Array.from(exitPortStats.entries())
    .map(([port, count]) => ({ port, count }))
    .sort((a, b) => b.count - a.count);

  const entryPortStats = new Map<string, number>();
  imports.forEach(trade => {
    const port = trade['VARIŞ LİMANI'];
    entryPortStats.set(port, (entryPortStats.get(port) || 0) + 1);
  });

  const entryPorts = Array.from(entryPortStats.entries())
    .map(([port, count]) => ({ port, count }))
    .sort((a, b) => b.count - a.count);

  // Ortalama fiyatlar ve hacimler
  const totalExportVolume = exports.reduce((sum, t) => sum + t['ÜRÜN MİKTARI (KG)'], 0);
  const totalExportValue = exports.reduce(
    (sum, t) => sum + t['ÜRÜN MİKTARI (KG)'] * t['ÜRÜN FİYATI (USD)'],
    0
  );
  const avgExportPrice = totalExportVolume > 0 ? totalExportValue / totalExportVolume : 0;

  const totalImportVolume = imports.reduce((sum, t) => sum + t['ÜRÜN MİKTARI (KG)'], 0);
  const totalImportValue = imports.reduce(
    (sum, t) => sum + t['ÜRÜN MİKTARI (KG)'] * t['ÜRÜN FİYATI (USD)'],
    0
  );
  const avgImportPrice = totalImportVolume > 0 ? totalImportValue / totalImportVolume : 0;

  const tradeBalance = totalExportValue - totalImportValue;

  // Firma listeleri
  const exportCompanies = Array.from(new Set(exports.map(t => t['GÖNDERİCİ FİRMA'])));
  const importCompanies = Array.from(new Set(imports.map(t => t['ALICI FİRMA'])));

  return {
    countryName,
    countryCode: getCountryCode(countryName),
    topExporters,
    exportCompanies,
    topBuyers,
    avgExportPrice,
    totalExportVolume,
    totalExportValue,
    topImporters,
    importCompanies,
    topSellers,
    avgImportPrice,
    totalImportVolume,
    totalImportValue,
    topDestinations,
    topSources,
    exitPorts,
    entryPorts,
    tradeBalance,
    rawExports: exports,
    rawImports: imports
  };
};

export const getAllCountries = (data: TradeData[]) => {
  const countries = new Set<string>();
  data.forEach(trade => {
    countries.add(trade['GÖNDERİCİ ÜLKE']);
    countries.add(trade['ALICI ÜLKE']);
  });
  return Array.from(countries);
};

// Ülke isimlerini ISO kodlarına çevir
const countryCodeMap: Record<string, string> = {
  'Uruguay': 'URY',
  'China': 'CHN',
  'Russia': 'RUS',
  'Brazil': 'BRA',
  'Argentina': 'ARG',
  'USA': 'USA',
  'Turkey': 'TUR',
  'Netherlands': 'NLD',
  'Nigeria': 'NGA',
  'United Kingdom': 'GBR',
  'Germany': 'DEU',
  'Japan': 'JPN',
  'Australia': 'AUS',
  'India': 'IND',
  'United Arab Emirates': 'ARE',
  'France': 'FRA',
  'South Korea': 'KOR',
  'Canada': 'CAN',
  'Spain': 'ESP',
  'Thailand': 'THA',
  'Mexico': 'MEX',
  'Vietnam': 'VNM',
  'Sweden': 'SWE',
  'Italy': 'ITA'
};

export const getCountryCode = (countryName: string): string => {
  return countryCodeMap[countryName] || countryName.substring(0, 3).toUpperCase();
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
};
