export interface TradeData {
  'GÖNDERİCİ ÜLKE': string;
  'GÖNDERİCİ FİRMA': string;
  'ÜRÜN TARİFE KODU / HS CODE / GTİP': number;
  'ÜRÜN AÇIKLAMA': string;
  'ÜRÜN MİKTARI (KG)': number;
  'TARİH': string;
  'ÜRÜN FİYATI (USD)': number;
  'ALICI FİRMA': string;
  'ALICI ÜLKE': string;
  'ÇIKIŞ LİMANI': string;
  'VARIŞ LİMANI': string;
}

export interface CountryStats {
  countryName: string;
  countryCode: string;

  // Gönderici olarak
  topExporters: { name: string; volume: number; value: number }[];
  exportCompanies: string[];
  topBuyers: { name: string; volume: number; value: number }[];
  avgExportPrice: number;
  totalExportVolume: number;
  totalExportValue: number;

  // Alıcı olarak
  topImporters: { name: string; volume: number; value: number }[];
  importCompanies: string[];
  topSellers: { name: string; volume: number; value: number }[];
  avgImportPrice: number;
  totalImportVolume: number;
  totalImportValue: number;

  // Genel
  topDestinations: { country: string; volume: number; value: number }[];
  topSources: { country: string; volume: number; value: number }[];
  exitPorts: { port: string; count: number }[];
  entryPorts: { port: string; count: number }[];
  tradeBalance: number;

  // Ham veriler
  rawExports: TradeData[];
  rawImports: TradeData[];
}

export interface MapCountry {
  id: string;
  name: string;
  exportVolume: number;
  importVolume: number;
  totalTrade: number;
}
