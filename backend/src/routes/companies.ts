import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

export const companiesRouter = Router();

// ── GET /api/companies/:name — firma detay paneli ──────────────────────────
companiesRouter.get('/:name', async (req: Request, res: Response) => {
  const name = decodeURIComponent(req.params.name as string);

  // Firma kaydını address + website ile birlikte getir
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, name, address, website, countries(name)')
    .eq('name', name)
    .maybeSingle();

  if (companyError) return res.status(500).json({ error: companyError.message });
  if (!company) return res.status(404).json({ error: `'${name}' firması bulunamadı.` });

  const companyId = (company as any).id as number;
  const countriesRaw = (company as any).countries as unknown;
  const countryName = Array.isArray(countriesRaw)
    ? ((countriesRaw[0] as { name: string })?.name ?? '')
    : ((countriesRaw as { name: string } | null)?.name ?? '');

  const [
    contactsRes,
    exportsRes,
    importsRes,
  ] = await Promise.all([
    supabase
      .from('contacts')
      .select('id, contact_name, position, email, phone, linkedin_url')
      .eq('company_id', companyId),
    supabase
      .from('trades')
      .select('quantity_kg, total_value_usd, trade_date, buyer_company_id, destination_country_id')
      .eq('seller_company_id', companyId),
    supabase
      .from('trades')
      .select('quantity_kg, total_value_usd, trade_date, seller_company_id, origin_country_id')
      .eq('buyer_company_id', companyId),
  ]);

  const exportTrades = exportsRes.data ?? [];
  const importTrades = importsRes.data ?? [];

  const totalExportVolume = exportTrades.reduce((s, r) => s + Number(r.quantity_kg), 0);
  const totalExportValue  = exportTrades.reduce((s, r) => s + Number(r.total_value_usd), 0);
  const totalImportVolume = importTrades.reduce((s, r) => s + Number(r.quantity_kg), 0);
  const totalImportValue  = importTrades.reduce((s, r) => s + Number(r.total_value_usd), 0);

  // Batch-lookup IDs
  const buyerIds        = [...new Set(exportTrades.map(r => (r as any).buyer_company_id).filter(Boolean))];
  const destCountryIds  = [...new Set(exportTrades.map(r => (r as any).destination_country_id).filter(Boolean))];
  const sellerIds       = [...new Set(importTrades.map(r => (r as any).seller_company_id).filter(Boolean))];
  const originCountryIds = [...new Set(importTrades.map(r => (r as any).origin_country_id).filter(Boolean))];

  const [buyerNamesRes, destCountryNamesRes, sellerNamesRes, originCountryNamesRes] = await Promise.all([
    buyerIds.length > 0
      ? supabase.from('companies').select('id, name').in('id', buyerIds)
      : Promise.resolve({ data: [] as { id: number; name: string }[] }),
    destCountryIds.length > 0
      ? supabase.from('countries').select('id, name').in('id', destCountryIds)
      : Promise.resolve({ data: [] as { id: number; name: string }[] }),
    sellerIds.length > 0
      ? supabase.from('companies').select('id, name').in('id', sellerIds)
      : Promise.resolve({ data: [] as { id: number; name: string }[] }),
    originCountryIds.length > 0
      ? supabase.from('countries').select('id, name').in('id', originCountryIds)
      : Promise.resolve({ data: [] as { id: number; name: string }[] }),
  ]);

  const buyerNameMap = new Map<number, string>();
  (buyerNamesRes.data ?? []).forEach((c: any) => buyerNameMap.set(c.id, c.name));

  const destCountryNameMap = new Map<number, string>();
  (destCountryNamesRes.data ?? []).forEach((c: any) => destCountryNameMap.set(c.id, c.name));

  const sellerNameMap = new Map<number, string>();
  (sellerNamesRes.data ?? []).forEach((c: any) => sellerNameMap.set(c.id, c.name));

  const originCountryNameMap = new Map<number, string>();
  (originCountryNamesRes.data ?? []).forEach((c: any) => originCountryNameMap.set(c.id, c.name));

  // Aggregate: top customers (buyers)
  const customerMap = new Map<string, { volume: number; value: number }>();
  exportTrades.forEach(r => {
    const buyerName = (r as any).buyer_company_id
      ? (buyerNameMap.get((r as any).buyer_company_id) ?? '')
      : '';
    if (!buyerName) return;
    const existing = customerMap.get(buyerName) ?? { volume: 0, value: 0 };
    customerMap.set(buyerName, {
      volume: existing.volume + Number(r.quantity_kg),
      value:  existing.value  + Number(r.total_value_usd),
    });
  });
  const topCustomers = [...customerMap.entries()]
    .map(([cname, { volume, value }]) => ({ name: cname, volume, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Aggregate: top destination countries
  const destMap = new Map<string, { volume: number; value: number }>();
  exportTrades.forEach(r => {
    const destName = (r as any).destination_country_id
      ? (destCountryNameMap.get((r as any).destination_country_id) ?? '')
      : '';
    if (!destName) return;
    const existing = destMap.get(destName) ?? { volume: 0, value: 0 };
    destMap.set(destName, {
      volume: existing.volume + Number(r.quantity_kg),
      value:  existing.value  + Number(r.total_value_usd),
    });
  });
  const topDestinationCountries = [...destMap.entries()]
    .map(([country, { volume, value }]) => ({ country, volume, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Aggregate: yearly exports
  const yearMap = new Map<number, { exportVolume: number; exportValue: number }>();
  exportTrades.forEach(r => {
    const dateStr = (r as any).trade_date as string | null;
    if (!dateStr) return;
    const year = new Date(dateStr).getFullYear();
    const existing = yearMap.get(year) ?? { exportVolume: 0, exportValue: 0 };
    yearMap.set(year, {
      exportVolume: existing.exportVolume + Number(r.quantity_kg),
      exportValue:  existing.exportValue  + Number(r.total_value_usd),
    });
  });
  const yearlyExports = [...yearMap.entries()]
    .map(([year, { exportVolume, exportValue }]) => ({ year, exportVolume, exportValue }))
    .sort((a, b) => a.year - b.year);

  // Aggregate: top suppliers (sellers on import side)
  const supplierMap = new Map<string, { volume: number; value: number }>();
  importTrades.forEach(r => {
    const sellerName = (r as any).seller_company_id
      ? (sellerNameMap.get((r as any).seller_company_id) ?? '')
      : '';
    if (!sellerName) return;
    const existing = supplierMap.get(sellerName) ?? { volume: 0, value: 0 };
    supplierMap.set(sellerName, {
      volume: existing.volume + Number(r.quantity_kg),
      value:  existing.value  + Number(r.total_value_usd),
    });
  });
  const topSuppliers = [...supplierMap.entries()]
    .map(([sname, { volume, value }]) => ({ name: sname, volume, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Aggregate: top source countries (import side)
  const sourceMap = new Map<string, { volume: number; value: number }>();
  importTrades.forEach(r => {
    const originName = (r as any).origin_country_id
      ? (originCountryNameMap.get((r as any).origin_country_id) ?? '')
      : '';
    if (!originName) return;
    const existing = sourceMap.get(originName) ?? { volume: 0, value: 0 };
    sourceMap.set(originName, {
      volume: existing.volume + Number(r.quantity_kg),
      value:  existing.value  + Number(r.total_value_usd),
    });
  });
  const topSourceCountries = [...sourceMap.entries()]
    .map(([country, { volume, value }]) => ({ country, volume, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Aggregate: yearly imports
  const importYearMap = new Map<number, { importVolume: number; importValue: number }>();
  importTrades.forEach(r => {
    const dateStr = (r as any).trade_date as string | null;
    if (!dateStr) return;
    const year = new Date(dateStr).getFullYear();
    const existing = importYearMap.get(year) ?? { importVolume: 0, importValue: 0 };
    importYearMap.set(year, {
      importVolume: existing.importVolume + Number(r.quantity_kg),
      importValue:  existing.importValue  + Number(r.total_value_usd),
    });
  });
  const yearlyImports = [...importYearMap.entries()]
    .map(([year, { importVolume, importValue }]) => ({ year, importVolume, importValue }))
    .sort((a, b) => a.year - b.year);

  res.json({
    companyName:  name,
    countryName,
    address:  (company as any).address  ?? '',
    website:  (company as any).website  ?? '',
    contacts: (contactsRes.data ?? []).map(c => ({
      id:          (c as any).id,
      contactName: (c as any).contact_name  ?? '',
      position:    (c as any).position      ?? '',
      email:       (c as any).email         ?? '',
      phone:       (c as any).phone         ?? '',
      linkedinUrl: (c as any).linkedin_url  ?? '',
    })),
    totalExportVolume,
    totalExportValue,
    totalImportVolume,
    totalImportValue,
    topCustomers,
    topDestinationCountries,
    yearlyExports,
    topSuppliers,
    topSourceCountries,
    yearlyImports,
  });
});
