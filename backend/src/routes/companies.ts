import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

export const companiesRouter = Router();

// ── GET /api/companies/:name — firma detay paneli ──────────────────────────
companiesRouter.get('/:name', async (req: Request, res: Response) => {
  const name = decodeURIComponent(req.params.name as string);

  // 1. Firma meta bilgisi
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

  // 2. Contacts + SQL aggregation — paralel
  const [contactsRes, statsRes] = await Promise.all([
    supabase
      .from('contacts')
      .select('id, contact_name, position, email, phone, linkedin_url')
      .eq('company_id', companyId),
    supabase.rpc('get_company_stats', { p_company_id: companyId }),
  ]);

  if (statsRes.error) return res.status(500).json({ error: statsRes.error.message });

  const stats = statsRes.data as {
    totalExportVolume: number;
    totalExportValue: number;
    totalImportVolume: number;
    totalImportValue: number;
    topCustomers: { name: string; volume: number; value: number }[];
    topSuppliers: { name: string; volume: number; value: number }[];
    topDestinationCountries: { country: string; volume: number; value: number }[];
    topSourceCountries: { country: string; volume: number; value: number }[];
    yearlyExports: { year: number; exportVolume: number; exportValue: number; shipmentCount: number }[];
    yearlyImports: { year: number; importVolume: number; importValue: number; shipmentCount: number }[];
    exitPorts: { port: string; count: number }[];
    entryPorts: { port: string; count: number }[];
  };

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
    totalExportVolume: Number(stats.totalExportVolume),
    totalExportValue:  Number(stats.totalExportValue),
    totalImportVolume: Number(stats.totalImportVolume),
    totalImportValue:  Number(stats.totalImportValue),
    topCustomers:             stats.topCustomers             ?? [],
    topDestinationCountries:  stats.topDestinationCountries  ?? [],
    yearlyExports:            stats.yearlyExports            ?? [],
    topSuppliers:             stats.topSuppliers             ?? [],
    topSourceCountries:       stats.topSourceCountries       ?? [],
    yearlyImports:            stats.yearlyImports            ?? [],
    exitPorts:                stats.exitPorts                ?? [],
    entryPorts:               stats.entryPorts               ?? [],
  });
});
