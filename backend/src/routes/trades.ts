import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

export const tradesRouter = Router();

// ── GET /api/trades/export — CSV download (önce register etmeli, /export :id'den önce) ──
tradesRouter.get('/export', async (req: Request, res: Response) => {
  const filters = buildFilters(req);

  let query = supabase
    .from('trades')
    .select(`
      id, trade_date, product_description, hs_code, quantity_kg, total_value_usd, unit_price, exit_port, entry_port,
      seller:companies!seller_company_id(name),
      buyer:companies!buyer_company_id(name),
      origin:countries!origin_country_id(name),
      destination:countries!destination_country_id(name)
    `)
    .order('trade_date', { ascending: false });

  query = applyFilters(query, filters);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const rows = (data ?? []).map(toTradeRecord);

  // CSV output
  const headers = ['Tarih','Gönderici','Alıcı','Kaynak Ülke','Hedef Ülke','Ürün','HS Kodu','Miktar (kg)','Toplam (USD)','Birim Fiyat','Çıkış Limanı','Varış Limanı'];
  const csvLines = [
    headers.join(','),
    ...rows.map(r => [
      r.tradeDate,
      csvEscape(r.sellerCompany),
      csvEscape(r.buyerCompany),
      csvEscape(r.originCountry),
      csvEscape(r.destinationCountry),
      csvEscape(r.productDescription),
      r.hsCode ?? '',
      r.quantityKg,
      r.totalValueUsd,
      r.unitPrice ?? '',
      csvEscape(r.exitPort ?? ''),
      csvEscape(r.entryPort ?? ''),
    ].join(',')),
  ];

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="trades.csv"');
  res.send('\uFEFF' + csvLines.join('\r\n')); // BOM for Excel Turkish chars
});

// ── GET /api/trades — sayfalanmış işlem listesi ────────────────────────────
tradesRouter.get('/', async (req: Request, res: Response) => {
  const page  = Math.max(1, parseInt(req.query.page  as string ?? '1',  10));
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string ?? '50', 10)));
  const from  = (page - 1) * limit;
  const to    = from + limit - 1;

  const filters = buildFilters(req);

  // Count query (no range)
  let countQuery = supabase
    .from('trades')
    .select('id', { count: 'exact', head: true });
  countQuery = applyFilters(countQuery, filters);

  // Data query
  let dataQuery = supabase
    .from('trades')
    .select(`
      id, trade_date, product_description, hs_code, quantity_kg, total_value_usd, unit_price, exit_port, entry_port,
      seller:companies!seller_company_id(name),
      buyer:companies!buyer_company_id(name),
      origin:countries!origin_country_id(name),
      destination:countries!destination_country_id(name)
    `)
    .order(filters.sortBy, { ascending: filters.sortDir === 'asc' })
    .range(from, to);
  dataQuery = applyFilters(dataQuery, filters);

  const [countRes, dataRes] = await Promise.all([countQuery, dataQuery]);

  if (dataRes.error)  return res.status(500).json({ error: dataRes.error.message });
  if (countRes.error) return res.status(500).json({ error: countRes.error.message });

  const total      = countRes.count ?? 0;
  const totalPages = Math.ceil(total / limit);
  const trades     = (dataRes.data ?? []).map(toTradeRecord);

  res.json({
    trades,
    pagination: { page, limit, total, totalPages },
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────

interface TradeFilters {
  dateFrom?:      string;
  dateTo?:        string;
  hsCode?:        string;
  sellerCountry?: string;
  buyerCountry?:  string;
  sellerCompany?: string;
  buyerCompany?:  string;
  minValue?:      number;
  maxValue?:      number;
  sortBy:         string;
  sortDir:        'asc' | 'desc';
  productSearch?: string;
}

function buildFilters(req: Request): TradeFilters {
  const q = req.query as Record<string, string>;
  return {
    dateFrom:      q.dateFrom      || undefined,
    dateTo:        q.dateTo        || undefined,
    hsCode:        q.hsCode        || undefined,
    sellerCountry: q.sellerCountry || undefined,
    buyerCountry:  q.buyerCountry  || undefined,
    sellerCompany: q.sellerCompany || undefined,
    buyerCompany:  q.buyerCompany  || undefined,
    minValue:      q.minValue  ? parseFloat(q.minValue)  : undefined,
    maxValue:      q.maxValue  ? parseFloat(q.maxValue)  : undefined,
    productSearch: q.product   || undefined,
    sortBy:        ['trade_date', 'total_value_usd', 'quantity_kg'].includes(q.sortBy) ? q.sortBy : 'trade_date',
    sortDir:       q.sortDir === 'asc' ? 'asc' : 'desc',
  };
}

function applyFilters(query: any, f: TradeFilters): any {
  if (f.dateFrom)      query = query.gte('trade_date', f.dateFrom);
  if (f.dateTo)        query = query.lte('trade_date', f.dateTo);
  if (f.hsCode)        query = query.ilike('hs_code', `${f.hsCode}%`);
  if (f.productSearch) query = query.ilike('product_description', `%${f.productSearch}%`);
  if (f.minValue !== undefined) query = query.gte('total_value_usd', f.minValue);
  if (f.maxValue !== undefined) query = query.lte('total_value_usd', f.maxValue);

  // Seller/buyer company filters: need subquery via RPC or filter on joined name
  // Supabase supports filtering on embedded relationships with `eq` on the relation name
  if (f.sellerCompany) query = query.ilike('seller.name', `%${f.sellerCompany}%`);
  if (f.buyerCompany)  query = query.ilike('buyer.name',  `%${f.buyerCompany}%`);
  if (f.sellerCountry) query = query.ilike('origin.name', `%${f.sellerCountry}%`);
  if (f.buyerCountry)  query = query.ilike('destination.name', `%${f.buyerCountry}%`);

  return query;
}

function toTradeRecord(row: any) {
  return {
    id:                 row.id as number,
    tradeDate:          row.trade_date as string,
    sellerCompany:      (Array.isArray(row.seller) ? row.seller[0]?.name : row.seller?.name) ?? '',
    buyerCompany:       (Array.isArray(row.buyer)  ? row.buyer[0]?.name  : row.buyer?.name)  ?? '',
    originCountry:      (Array.isArray(row.origin) ? row.origin[0]?.name : row.origin?.name) ?? '',
    destinationCountry: (Array.isArray(row.destination) ? row.destination[0]?.name : row.destination?.name) ?? '',
    productDescription: row.product_description as string ?? '',
    hsCode:             row.hs_code as string | null,
    quantityKg:         Number(row.quantity_kg),
    totalValueUsd:      Number(row.total_value_usd),
    unitPrice:          row.unit_price != null ? Number(row.unit_price) : null,
    exitPort:           row.exit_port  as string | null,
    entryPort:          row.entry_port as string | null,
  };
}

function csvEscape(v: string): string {
  if (!v) return '';
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
