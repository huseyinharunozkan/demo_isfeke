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
  topExporters: { name: string; volume: number; value: number; companyCountry: string }[];
  exportCompanies: string[];
  topBuyers: { name: string; volume: number; value: number; companyCountry: string }[];
  avgExportPrice: number;
  totalExportVolume: number;
  totalExportValue: number;

  // Alıcı olarak
  topImporters: { name: string; volume: number; value: number; companyCountry: string }[];
  importCompanies: string[];
  topSellers: { name: string; volume: number; value: number; companyCountry: string }[];
  avgImportPrice: number;
  totalImportVolume: number;
  totalImportValue: number;

  // Genel
  topDestinations: { country: string; volume: number; value: number }[];
  topSources: { country: string; volume: number; value: number }[];
  exitPorts: { port: string; count: number }[];
  entryPorts: { port: string; count: number }[];
  tradeBalance: number;
  tradeCount: number;

  // Yıllık ticaret özeti (backend API'den gelir)
  yearlyTrade: { year: number; exportValue: number; importValue: number }[];

  // Ham veriler (Excel modunda dolu, API modunda boş)
  rawExports: TradeData[];
  rawImports: TradeData[];
}

export interface Contact {
  id: number;
  contactName: string;
  position: string;
  email: string;
  phone: string;
  linkedinUrl: string;
}

export interface CompanyStats {
  companyName: string;
  countryName: string;
  address: string;
  website: string;
  contacts: Contact[];
  totalExportVolume: number;
  totalExportValue: number;
  totalImportVolume: number;
  totalImportValue: number;
  topCustomers: { name: string; volume: number; value: number }[];
  topDestinationCountries: { country: string; volume: number; value: number }[];
  yearlyExports: { year: number; exportVolume: number; exportValue: number }[];
  topSuppliers: { name: string; volume: number; value: number }[];
  topSourceCountries: { country: string; volume: number; value: number }[];
  yearlyImports: { year: number; importVolume: number; importValue: number }[];
}

export interface MapCountry {
  id: string;
  name: string;
  exportVolume: number;
  importVolume: number;
  totalTrade: number;
}
