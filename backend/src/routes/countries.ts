import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

export const countriesRouter = Router();

const countryCodeMap: Record<string, string> = {
  Uruguay: 'URY', China: 'CHN', Russia: 'RUS', Brazil: 'BRA', Argentina: 'ARG',
  USA: 'USA', Turkey: 'TUR', Netherlands: 'NLD', Nigeria: 'NGA',
  'United Kingdom': 'GBR', Germany: 'DEU', Japan: 'JPN', Australia: 'AUS',
  India: 'IND', 'United Arab Emirates': 'ARE', France: 'FRA',
  'South Korea': 'KOR', Canada: 'CAN', Spain: 'ESP', Thailand: 'THA',
  Mexico: 'MEX', Vietnam: 'VNM', Sweden: 'SWE', Italy: 'ITA',
};

function getCountryCode(name: string): string {
  return countryCodeMap[name] ?? name.substring(0, 3).toUpperCase();
}

// ── GET /api/countries — harita renklendirme için tüm ülkeler ──────────────
countriesRouter.get('/', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('v_country_trade_summary')
    .select('*');

  if (error) return res.status(500).json({ error: error.message });

  const mapped = (data ?? []).map(row => ({
    id:            row.country_name as string,
    name:          row.country_name as string,
    exportVolume:  Number(row.total_export_kg),
    importVolume:  Number(row.total_import_kg),
    totalTrade:    Number(row.total_export_kg) + Number(row.total_import_kg),
    exportValue:   Number(row.total_export_usd),
    importValue:   Number(row.total_import_usd),
  }));

  res.json(mapped);
});

// ── GET /api/countries/:name/stats — ülke detay paneli ────────────────────
countriesRouter.get('/:name/stats', async (req: Request, res: Response) => {
  const name = decodeURIComponent(req.params.name as string);

  const [
    summaryRes,
    topExportersRes,
    topBuyersRes,
    topImportersRes,
    topSellersRes,
    topDestRes,
    topSourcesRes,
    yearlyRes,
    exportCompRes,
    importCompRes,
  ] = await Promise.all([
    supabase.from('v_country_trade_summary').select('*').eq('country_name', name).maybeSingle(),
    supabase.from('v_top_exporters').select('*').eq('country_name', name).order('total_usd', { ascending: false }).limit(10),
    supabase.from('v_top_buyers')   .select('*').eq('country_name', name).order('total_usd', { ascending: false }).limit(10),
    supabase.from('v_top_importers').select('*').eq('country_name', name).order('total_usd', { ascending: false }).limit(10),
    supabase.from('v_top_sellers')  .select('*').eq('country_name', name).order('total_usd', { ascending: false }).limit(10),
    supabase.from('v_top_destinations').select('*').eq('country_name', name).order('total_usd', { ascending: false }).limit(20),
    supabase.from('v_top_sources')  .select('*').eq('country_name', name).order('total_usd', { ascending: false }).limit(20),
    supabase.from('v_yearly_trade') .select('*').eq('country_name', name).order('year'),
    supabase.from('v_export_companies').select('company_name').eq('country_name', name),
    supabase.from('v_import_companies').select('company_name').eq('country_name', name),
  ]);

  if (!summaryRes.data) {
    return res.status(404).json({ error: `'${name}' için veri bulunamadı.` });
  }

  const s = summaryRes.data as any;
  const totalExportVolume = Number(s.total_export_kg);
  const totalExportValue  = Number(s.total_export_usd);
  const totalImportVolume = Number(s.total_import_kg);
  const totalImportValue  = Number(s.total_import_usd);
  const tradeCount        = Number(s.trade_count ?? 0);

  // Batch-lookup company home countries for all top-company lists
  const allCompanyNames = [
    ...(topExportersRes.data ?? []).map(r => r.company_name as string),
    ...(topBuyersRes.data   ?? []).map(r => r.company_name as string),
    ...(topImportersRes.data ?? []).map(r => r.company_name as string),
    ...(topSellersRes.data  ?? []).map(r => r.company_name as string),
  ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

  const companyCountryMap = new Map<string, string>();
  if (allCompanyNames.length > 0) {
    const { data: companyCountryData } = await supabase
      .from('companies')
      .select('name, countries(name)')
      .in('name', allCompanyNames);

    (companyCountryData ?? []).forEach((c: any) => {
      const cr = c.countries;
      const cName = Array.isArray(cr)
        ? ((cr[0] as { name: string })?.name ?? '')
        : ((cr as { name: string } | null)?.name ?? '');
      companyCountryMap.set(c.name as string, cName);
    });
  }

  const mapCompany = (r: any) => ({
    name:          r.company_name as string,
    volume:        Number(r.total_kg),
    value:         Number(r.total_usd),
    companyCountry: companyCountryMap.get(r.company_name as string) ?? '',
  });

  res.json({
    countryName:       name,
    countryCode:       getCountryCode(name),
    totalExportVolume,
    totalExportValue,
    totalImportVolume,
    totalImportValue,
    avgExportPrice:    totalExportVolume > 0 ? totalExportValue / totalExportVolume : 0,
    avgImportPrice:    totalImportVolume > 0 ? totalImportValue / totalImportVolume : 0,
    tradeBalance:      totalExportValue - totalImportValue,
    tradeCount,

    topExporters:  (topExportersRes.data ?? []).map(mapCompany),
    topBuyers:     (topBuyersRes.data   ?? []).map(mapCompany),
    topImporters:  (topImportersRes.data ?? []).map(mapCompany),
    topSellers:    (topSellersRes.data  ?? []).map(mapCompany),

    topDestinations: (topDestRes.data    ?? []).map(r => ({ country: r.destination_country, volume: Number(r.total_kg), value: Number(r.total_usd) })),
    topSources:      (topSourcesRes.data ?? []).map(r => ({ country: r.source_country,      volume: Number(r.total_kg), value: Number(r.total_usd) })),

    yearlyTrade:     (yearlyRes.data ?? []).map(r => ({ year: r.year, exportValue: Number(r.export_usd), importValue: Number(r.import_usd) })),

    exitPorts:  [],
    entryPorts: [],

    exportCompanies: (exportCompRes.data ?? []).map(r => r.company_name as string),
    importCompanies: (importCompRes.data ?? []).map(r => r.company_name as string),

    rawExports: [],
    rawImports: [],
  });
});
