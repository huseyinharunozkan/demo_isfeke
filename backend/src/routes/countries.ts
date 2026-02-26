import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

export const countriesRouter = Router();

const countryCodeMap: Record<string, string> = {
  Uruguay: 'URY', China: 'CHN', Russia: 'RUS', Brazil: 'BRA', Argentina: 'ARG',
  'United States': 'USA', Turkey: 'TUR', Netherlands: 'NLD', Nigeria: 'NGA',
  'United Kingdom': 'GBR', Germany: 'DEU', Japan: 'JPN', Australia: 'AUS',
  India: 'IND', 'United Arab Emirates': 'ARE', France: 'FRA',
  'South Korea': 'KOR', Canada: 'CAN', Spain: 'ESP', Thailand: 'THA',
  Mexico: 'MEX', Vietnam: 'VNM', Sweden: 'SWE', Italy: 'ITA',
};

function getCountryCode(name: string): string {
  return countryCodeMap[name] ?? name.substring(0, 3).toUpperCase();
}

// ── In-process cache for GET /api/countries (5 min TTL) ───────────────────
let countriesCache: { data: unknown; ts: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

// ── GET /api/countries — harita renklendirme için tüm ülkeler ──────────────
countriesRouter.get('/', async (_req: Request, res: Response) => {
  if (countriesCache && Date.now() - countriesCache.ts < CACHE_TTL_MS) {
    return res.json(countriesCache.data);
  }

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

  countriesCache = { data: mapped, ts: Date.now() };
  res.json(mapped);
});

// ── GET /api/countries/:name/stats — ülke detay paneli ────────────────────
countriesRouter.get('/:name/stats', async (req: Request, res: Response) => {
  const name = decodeURIComponent(req.params.name as string);

  const [
    summaryRes,
    topExportersRes,
    topImportersRes,
    topSellersRes,
    yearlyRes,
  ] = await Promise.all([
    supabase.from('v_country_trade_summary').select('*').eq('country_name', name).maybeSingle(),
    supabase.from('v_top_exporters').select('*').eq('country_name', name).order('total_usd', { ascending: false }).limit(50),
    supabase.from('v_top_importers').select('*').eq('country_name', name).order('total_usd', { ascending: false }).limit(50),
    supabase.from('v_top_sellers').select('*').eq('country_name', name).order('total_usd', { ascending: false }).limit(50),
    supabase.from('v_yearly_trade').select('*').eq('country_name', name).order('year'),
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

  const mapCompany = (r: any) => ({
    name:   r.company_name as string,
    volume: Number(r.total_kg),
    value:  Number(r.total_usd),
    companyCountry: '',
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
    topBuyers:     [],
    topImporters:  (topImportersRes.data ?? []).map(mapCompany),
    topSellers:    (topSellersRes.data ?? []).map(mapCompany),

    topDestinations: [],
    topSources:      [],

    yearlyTrade: (yearlyRes.data ?? []).map(r => ({
      year:        r.year,
      exportValue: Number(r.export_usd),
      importValue: Number(r.import_usd),
    })),

    exitPorts:  [],
    entryPorts: [],

    exportCompanies: [],
    importCompanies: [],

    rawExports: [],
    rawImports: [],
  });
});
