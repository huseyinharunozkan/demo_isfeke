/**
 * Excel → Supabase migration scripti
 * Çalıştır: node scripts/import-to-supabase.js
 */

require('dotenv').config();
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL     = process.env.SUPABASE_URL;
const SUPABASE_KEY     = process.env.SUPABASE_SERVICE_KEY;
const EXCEL_PATH       = './trade-map-app/public/Ornek_Veri_Seti_final.xlsx';
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
  const rows     = XLSX.utils.sheet_to_json(ws);
  console.log(`   ${rows.length} satır bulundu.`);

  // ── 1. ÜLKELER ────────────────────────────────────────────────────────────
  const countryNames = new Set();
  rows.forEach(r => {
    if (r['GÖNDERİCİ ÜLKE']) countryNames.add(r['GÖNDERİCİ ÜLKE']);
    if (r['ALICI ÜLKE'])     countryNames.add(r['ALICI ÜLKE']);
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
    if (r['GÖNDERİCİ FİRMA'] && !companyCountry.has(r['GÖNDERİCİ FİRMA']))
      companyCountry.set(r['GÖNDERİCİ FİRMA'], r['GÖNDERİCİ ÜLKE']);
    if (r['ALICI FİRMA'] && !companyCountry.has(r['ALICI FİRMA']))
      companyCountry.set(r['ALICI FİRMA'], r['ALICI ÜLKE']);
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
    return {
      seller_company_id:      companyMap[r['GÖNDERİCİ FİRMA']] || null,
      buyer_company_id:       companyMap[r['ALICI FİRMA']]      || null,
      origin_country_id:      countryMap[r['GÖNDERİCİ ÜLKE']]  || null,
      destination_country_id: countryMap[r['ALICI ÜLKE']]       || null,
      product_description:    r['ÜRÜN AÇIKLAMA']                || null,
      hs_code:                r['ÜRÜN TARİFE KODU / HS CODE / GTİP']?.toString() || null,
      exit_port:              r['ÇIKIŞ LİMANI']                 || null,
      entry_port:             r['VARIŞ LİMANI']                 || null,
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
