/**
 * Excel → Supabase migration scripti
 * Çalıştır: node scripts/import-to-supabase.js
 */

require('dotenv').config();
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL     = process.env.SUPABASE_URL;
const SUPABASE_KEY     = process.env.SUPABASE_SERVICE_KEY;
const EXCEL_PATH       = './trade-map-app/public/Kullanılacak 410150.xlsx';
const BATCH_SIZE       = 200;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Hata: .env dosyasında SUPABASE_URL ve SUPABASE_SERVICE_KEY tanımlı olmalı.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Excel'deki tarih değerini YYYY-MM-DD string'e çevir
function parseDate(raw) {
  if (!raw) return null;
  if (typeof raw === 'number') {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(raw);
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const str = String(raw).trim();
  // "DD.MM.YYYY" → "YYYY-MM-DD"
  const dotMatch = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotMatch) return `${dotMatch[3]}-${dotMatch[2].padStart(2,'0')}-${dotMatch[1].padStart(2,'0')}`;
  return str; // zaten YYYY-MM-DD veya benzer format
}

async function main() {
  console.log('📖 Excel okunuyor...');
  const workbook = XLSX.readFile(EXCEL_PATH);
  const ws       = workbook.Sheets[workbook.SheetNames[0]];
  const allRows  = XLSX.utils.sheet_to_json(ws, { defval: null });
  console.log(`   ${allRows.length} satır bulundu.`);

  // Herhangi bir kolonu boş veya "-" olan satırları at
  const isEmpty = v => v === null || v === '' || v === undefined || String(v).trim() === '-';
  const rows = allRows.filter(r => Object.values(r).every(v => !isEmpty(v)));
  console.log(`   ${rows.length} satır tamamen dolu (${allRows.length - rows.length} satır atlandı).`);

  // Excel sütun adı normalizasyonu (Excel'deki gerçek adlar)
  // GÖNDRİCİ ÜLKE  → typo (eksik E), Çıkış Limanı / Varış Limanı → küçük harf
  const COL = {
    SELLER_COUNTRY: 'GÖNDRİCİ ÜLKE',
    SELLER_COMPANY: 'GÖNDERİCİ FİRMA',
    BUYER_COUNTRY:  'ALICI ÜLKE',
    BUYER_COMPANY:  'ALICI FİRMA',
    EXIT_PORT:      'Çıkış Limanı',
    ENTRY_PORT:     'Varış Limanı',
  };

  // ── 1. ÜLKELER ────────────────────────────────────────────────────────────
  const countryNames = new Set();
  rows.forEach(r => {
    const sc = r[COL.SELLER_COUNTRY];
    const bc = r[COL.BUYER_COUNTRY];
    // "-" geçersiz ülke adını atla
    if (sc && sc !== '-') countryNames.add(sc);
    if (bc && bc !== '-') countryNames.add(bc);
  });

  const countryList = [...countryNames].map(name => ({ name }));
  console.log(`\n🌍 ${countryList.length} benzersiz ülke ekleniyor...`);

  const { error: cErr } = await supabase
    .from('countries')
    .upsert(countryList, { onConflict: 'name' });
  if (cErr) throw new Error('countries upsert: ' + cErr.message);

  const { data: countries } = await supabase.from('countries').select('id, name');
  const countryMap = {};
  countries.forEach(c => (countryMap[c.name] = c.id));
  console.log('   Ülkeler tamam.');

  // ── 2. FİRMALAR ──────────────────────────────────────────────────────────
  // Firma adı → ülke adı (ilk görülen ülke kazanır)
  const companyCountry = new Map();
  rows.forEach(r => {
    const sf = r[COL.SELLER_COMPANY];
    const bf = r[COL.BUYER_COMPANY];
    const sc = r[COL.SELLER_COUNTRY];
    const bc = r[COL.BUYER_COUNTRY];
    if (sf && !companyCountry.has(sf))
      companyCountry.set(sf, (sc && sc !== '-') ? sc : null);
    if (bf && !companyCountry.has(bf))
      companyCountry.set(bf, (bc && bc !== '-') ? bc : null);
  });

  const companyList = [...companyCountry.entries()].map(([name, country]) => ({
    name,
    country_id: countryMap[country] || null,
  }));
  console.log(`\n🏢 ${companyList.length} benzersiz firma ekleniyor...`);

  for (let i = 0; i < companyList.length; i += BATCH_SIZE) {
    const { error } = await supabase
      .from('companies')
      .upsert(companyList.slice(i, i + BATCH_SIZE), { onConflict: 'name' });
    if (error) throw new Error(`companies upsert (batch ${i}): ` + error.message);
  }

  const { data: companies } = await supabase.from('companies').select('id, name');
  const companyMap = {};
  companies.forEach(c => (companyMap[c.name] = c.id));
  console.log('   Firmalar tamam.');

  // ── 3. TİCARET KAYITLARI ─────────────────────────────────────────────────
  const trades = rows.map(r => {
    const quantity  = parseFloat(r['ÜRÜN MİKTARI (KG)'])  || 0;
    const unitPrice = parseFloat(r['ÜRÜN FİYATI (USD)'])   || 0;
    const sc = r[COL.SELLER_COUNTRY];
    const bc = r[COL.BUYER_COUNTRY];
    // Liman değeri "-" ise null yap
    const exitPort  = r[COL.EXIT_PORT]  && r[COL.EXIT_PORT]  !== '-' ? r[COL.EXIT_PORT]  : null;
    const entryPort = r[COL.ENTRY_PORT] && r[COL.ENTRY_PORT] !== '-' ? r[COL.ENTRY_PORT] : null;
    return {
      seller_company_id:      companyMap[r[COL.SELLER_COMPANY]] || null,
      buyer_company_id:       companyMap[r[COL.BUYER_COMPANY]]  || null,
      origin_country_id:      (sc && sc !== '-') ? (countryMap[sc] || null) : null,
      destination_country_id: (bc && bc !== '-') ? (countryMap[bc] || null) : null,
      product_description:    r['ÜRÜN AÇIKLAMA']                || null,
      hs_code:                r['ÜRÜN TARİFE KODU / HS CODE / GTİP']?.toString() || null,
      exit_port:              exitPort,
      entry_port:             entryPort,
      trade_date:             parseDate(r['TARİH']),
      unit_price:             unitPrice,
      quantity_kg:            quantity,
      total_value_usd:        Math.round(quantity * unitPrice * 100) / 100,
    };
  });

  console.log(`\n📦 ${trades.length} ticaret kaydı ekleniyor...`);
  for (let i = 0; i < trades.length; i += BATCH_SIZE) {
    const { error } = await supabase
      .from('trades')
      .insert(trades.slice(i, i + BATCH_SIZE));
    if (error) throw new Error(`trades insert (batch ${i}): ` + error.message);
    process.stdout.write(`   ${Math.min(i + BATCH_SIZE, trades.length)} / ${trades.length}\r`);
  }

  console.log('\n\n✅ Migration tamamlandı!');
  console.log(`   Ülkeler : ${countryList.length}`);
  console.log(`   Firmalar: ${companyList.length}`);
  console.log(`   Kayıtlar: ${trades.length}`);
}

main().catch(err => {
  console.error('\n❌', err.message);
  process.exit(1);
});
