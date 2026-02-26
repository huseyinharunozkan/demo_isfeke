import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

export const searchRouter = Router();

// ── GET /api/search?q=...&type=company|product|all&limit=20 ───────────────
searchRouter.get('/', async (req: Request, res: Response) => {
  const q     = (req.query.q as string ?? '').trim();
  const type  = (req.query.type as string ?? 'all');
  const limit = Math.min(parseInt(req.query.limit as string ?? '20', 10), 50);

  if (q.length < 2) {
    return res.json({ companies: [], products: [] });
  }

  const pattern = `%${q}%`;

  // PostgrestFilterBuilder is thenable but not typed as Promise — use any[]
  const promises: any[] = [];

  // Company search
  if (type === 'all' || type === 'company') {
    promises.push(
      supabase
        .from('companies')
        .select('name, countries(name)')
        .ilike('name', pattern)
        .limit(limit)
    );
  } else {
    promises.push(Promise.resolve({ data: [] }));
  }

  // Product search
  if (type === 'all' || type === 'product') {
    promises.push(
      supabase
        .from('trades')
        .select('product_description, hs_code')
        .ilike('product_description', pattern)
        .not('product_description', 'is', null)
        .limit(limit * 3) // fetch more to dedupe
    );
  } else {
    promises.push(Promise.resolve({ data: [] }));
  }

  const [companiesRes, productsRes] = await Promise.all(promises);

  // Map companies
  const companies = (companiesRes.data ?? []).map((c: any) => {
    const cr = c.countries;
    const countryName = Array.isArray(cr)
      ? ((cr[0] as { name: string })?.name ?? '')
      : ((cr as { name: string } | null)?.name ?? '');
    return { name: c.name as string, countryName };
  });

  // Dedupe products by (product_description, hs_code)
  const seen = new Set<string>();
  const products: { productDescription: string; hsCode: string | null }[] = [];
  for (const row of (productsRes.data ?? [])) {
    const key = `${row.product_description}|${row.hs_code ?? ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      products.push({
        productDescription: row.product_description as string,
        hsCode: row.hs_code as string | null,
      });
      if (products.length >= limit) break;
    }
  }

  res.json({ companies, products });
});
