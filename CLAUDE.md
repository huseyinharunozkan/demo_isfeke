# CLAUDE.md — Dünya Ticaret Haritası Projesi

---

# Workflow Orchestration

## 1. Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

## 2. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

## 3. Self-Improvement Loop

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

## 4. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

## 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

## 6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

---

# Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

---

# Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

---

## Proje Özeti

Gümrük/ticaret verilerini dünya haritası üzerinde görselleştiren bir web uygulaması.
Kullanıcı bir ülkeye tıklar, o ülkenin ihracat/ithalat istatistiklerini detaylı görebilir.

---

## Mevcut Durum: Faz 3 — Frontend Performans

> **Veri kaynağı:** Excel'den Supabase (PostgreSQL) + Express API'ye taşındı.
> **Frontend:** React + Vite (Next.js geçişi sonraki fazda).
> **Son commit:** `56d0cea` — feat: Faz 2 tamamlandı — Supabase backend + CompanyDetail sayfası (2026-02-19, pushed to main)
> **Son değişiklikler (2026-02-20):** CompanyDetail ülke bölümleri yeniden adlandırıldı + toggle eklendi; CARGILL Hindistan + ELECTROBRAS Güney Kore trade verisi eklendi
> **Son değişiklikler (2026-02-21):** Faz 3 frontend performans iyileştirmeleri — Vite proxy (WSL2 fix), arama çubuğu, client cache, AbortController, log scale, @tanstack/react-virtual sanal scroll; recharts grafikleri kaldırıldı (CountryDetail BarChart + CompanyDetail LineChart); CompanyDetail Müşteriler + Tedarikçiler bölümlerinde `+X daha` → `▼ Tümünü Gör` toggle butonu
> **Son değişiklikler (2026-02-21 — sonrası):** Arama çubuğu `App.tsx`'ten kaldırıldı — `SearchResult` interface, `useDebounce` hook, search state'leri, `searchAbortRef`, arama `useEffect`'leri ve header input/dropdown JSX tamamen silindi
> **Son değişiklikler (2026-02-21 — Brezilya mock verisi):** Brezilya ihracatçı firmaları 7 → 14'e çıkarıldı; 7 yeni firma eklendi (MARFRIG GLOBAL FOODS SA, BRF SA, FIBRIA CELULOSE SA, GERDAU SA, BRASKEM SA, AMBEV SA, RAIZEN ENERGIA SA); sanal scroll `VIRTUAL_THRESHOLD=10` aşıldığından "En Çok İhracat Yapan Firmalar" listesi artık kaydırmalı gösterilir
> **Son değişiklikler (2026-02-23):** CompanyDetail tıklanabilir firma adları + Yıllık Sevkiyatlar — Müşteriler + Tedarikçiler listelerinde firma adları mavi tıklanabilir buton (hem normal hem virtual list); `onCompanyClick` prop `App.tsx`'ten geçirildi; "📅 Yıllık Sevkiyatlar" section eklendi (yıl × ihracat/ithalat sevkiyat sayısı tablosu + ort./yıl footer); Supabase RPC `get_company_stats`'a `shipmentCount` (COUNT) eklendi; TypeScript tipleri güncellendi
> **Son değişiklikler (2026-02-23 — Firmaya Dön):** Firma içinden müşteri/tedarikçi firmasına geçildiğinde başlıkta "← Firmaya Dön" butonu eklendi; `App.tsx`'te `companyHistory: CompanyStats[]` stack state + `selectedCompanyRef` (stale closure önlemi) + `handleBackToCompany` fonksiyonu eklendi; çok kademeli navigasyon desteklenir (A→B→C→D zincirinde her adımda bir önceki firmaya dönülebilir); `CompanyDetail`'e `onBackToCompany?: () => void` prop eklendi
> **Son değişiklikler (2026-02-25 — DB Temizlendi):** Supabase DB tamamen sıfırlandı — `TRUNCATE contacts, trades, companies, countries RESTART IDENTITY CASCADE;` ile tüm mock veriler silindi (36 ülke, 204 firma, 125 trade, 278 contact). DB gerçek Excel verisi için hazır. Import sonrası `seed-mock-contacts.sql` yeniden çalıştırılabilir.
> **Son değişiklikler (2026-02-26 — Gerçek Veri İmport Edildi):** `Kullanılacak 410150.xlsx` (7.648 satır) Supabase'e aktarıldı. `import-to-supabase.js` güncellendi: Excel typo'ları düzeltildi (`GÖNDRİCİ ÜLKE`, `Çıkış Limanı`, `Varış Limanı`), `-` geçersiz ülke/liman değerleri null'a dönüştürüldü. Sonuç: 124 ülke, 1.395 firma, 7.648 ticaret kaydı.
> **Son değişiklikler (2026-02-26 — Veri Temizlendi):** Herhangi bir kolonu boş veya `"-"` olan satırlar import dışı bırakıldı. `import-to-supabase.js`'e `isEmpty` filtresi eklendi: tüm kolonları tam dolu olan satırlar alınır (2.194 satır), eksik içerenler atlanır (5.454 satır). DB yeniden sıfırlanıp re-import yapıldı. Güncel sonuç: **70 ülke, 532 firma, 2.194 ticaret kaydı.**
> **Son değişiklikler (2026-02-26 — Temizlik):** `scripts/fill-missing-data.js` ve `scripts/Temizlenmis_410150.xlsx` silindi — tahmini veri doldurma yönteminden vazgeçildi. `scripts/` klasöründe artık yalnızca `import-to-supabase.js` mevcut.

---

## Proje Dosya Yapısı (Güncel)

```
demo_isfeke/
├── .env                                # Supabase URL + key'ler (commit edilmez)
├── .gitignore
├── package.json                        # Kök bağımlılıkları (xlsx, @supabase/supabase-js, dotenv)
├── analyze-excel.js                    # Tek seferlik Excel analiz scripti (arşiv)
│
├── sql/
│   ├── schema.sql                      # DB şeması: tablolar + 10 view — Supabase SQL Editor'da çalıştır
│   └── seed-mock-contacts.sql          # Tüm şirketlere rastgele contact/website/address ekler (idempotent)
│
├── scripts/
│   └── import-to-supabase.js          # Excel → Supabase migration scripti (tek seferlik)
│
├── backend/                            # Express + TypeScript API
│   ├── .env                            # SUPABASE_URL, SUPABASE_SERVICE_KEY, PORT=3001
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                    # Express sunucu (port 3001)
│       ├── lib/
│       │   └── supabase.ts             # Supabase client (service_role key)
│       └── routes/
│           ├── countries.ts            # GET /api/countries, GET /api/countries/:name/stats
│           ├── companies.ts            # GET /api/companies/:name, GET /api/companies/top-exporters
│           └── search.ts               # GET /api/search?q=...&type=company|all&limit=20
│
└── trade-map-app/                      # Frontend (React + Vite + TypeScript)
    ├── public/
    │   └── Kullanılacak 410150.xlsx     # Gerçek veri seti (7.648 satır, 2026-02-26'da import edildi)
    └── src/
        ├── App.tsx                     # API/proxy, TTL cache, AbortController
        ├── App.css
        ├── main.tsx
        ├── index.css
        ├── react-simple-maps.d.ts      # Tip tanımı (react-simple-maps'in @types'ı yok)
        ├── components/
        │   ├── WorldMap.tsx            # MapCountry[] alır; logaritmik renk scale (Math.log1p)
        │   ├── CountryDetail.tsx       # virtual scroll (@tanstack/react-virtual); grafiksiz
        │   ├── CompanyDetail.tsx       # virtual scroll; contacts tablo; grafiksiz
        │   └── GlobalLeaderboard.tsx   # PLANLI — global ihracat sıralaması (ülke + firma)
        ├── data/
        │   └── mockData.ts             # Artık kullanılmıyor (arşiv)
        ├── types/
        │   └── index.ts                # TradeData, CountryStats (+ yearlyTrade), MapCountry
        └── utils/
            └── dataAnalysis.ts         # analyzeCountryData artık kullanılmıyor, formatCurrency/formatNumber hâlâ aktif
```

---

## Supabase Proje Bilgileri

| Alan | Değer |
|------|-------|
| Project URL | `https://jgqvudrxxpibxjnltbml.supabase.co` |
| Project Ref | `jgqvudrxxpibxjnltbml` |
| Anon Key | `.env` dosyasında `SUPABASE_ANON_KEY` |
| Service Role Key | `.env` dosyasında `SUPABASE_SERVICE_KEY` (gizli, commit edilmez) |

---

## Veri Seti Yapısı

### Excel Sütunları (orijinal kaynak)

| Sütun Adı | Tip | Açıklama |
|-----------|-----|----------|
| `GÖNDERİCİ ÜLKE` | string | İhracat yapan ülke |
| `GÖNDERİCİ FİRMA` | string | İhracat yapan firma |
| `ÜRÜN AÇIKLAMA` | string | Ürünün açıklaması |
| `ALICI ÜLKE` | string | İthalat yapan ülke |
| `ALICI FİRMA` | string | İthalat yapan firma |
| `ÇIKIŞ LİMANI` | string | Gemi çıkış limanı |
| `VARIŞ LİMANI` | string | Gemi varış limanı |
| `ÜRÜN TARİFE KODU / HS CODE / GTİP` | number | Gümrük tarife kodu |
| `ÜRÜN MİKTARI (KG)` | number | Miktar (kilogram) |
| `ÜRÜN FİYATI (USD)` | number | Birim fiyat (USD/kg) |
| `TARİH` | date string | İşlem tarihi (YYYY-MM-DD) |

---

## Mevcut Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 19 + Vite + TypeScript |
| Harita | react-simple-maps 3.x |
| Grafik | ~~recharts~~ (kaldırıldı 2026-02-21) |
| Sanal Scroll | @tanstack/react-virtual |
| UI Stili | Tailwind CSS 3.x |
| Backend | Node.js + Express + TypeScript (port 3001) |
| Veritabanı | PostgreSQL — Supabase üzerinde |
| DB Client | @supabase/supabase-js ^2.47.0 |
| Migration | xlsx + @supabase/supabase-js (tek seferlik script) |

---

## Veritabanı Şeması (Uygulanan)

### Tablolar

```sql
CREATE TABLE countries (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) UNIQUE NOT NULL,
    code       VARCHAR(10),
    continent  VARCHAR(50)
);

CREATE TABLE companies (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(255) UNIQUE NOT NULL,
    country_id INT REFERENCES countries(id)
);

CREATE TABLE trades (
    id                     SERIAL PRIMARY KEY,
    seller_company_id      INT REFERENCES companies(id),
    buyer_company_id       INT REFERENCES companies(id),
    origin_country_id      INT REFERENCES countries(id),
    destination_country_id INT REFERENCES countries(id),
    product_description    TEXT,
    hs_code                VARCHAR(20),
    exit_port              VARCHAR(100),
    entry_port             VARCHAR(100),
    trade_date             DATE,
    unit_price             NUMERIC(20,4),  -- USD per kg
    quantity_kg            NUMERIC(20,2),  -- kg
    total_value_usd        NUMERIC(20,2)   -- unit_price * quantity_kg
);

CREATE TABLE contacts (
    id            SERIAL PRIMARY KEY,
    company_id    INT REFERENCES companies(id) ON DELETE CASCADE,
    contact_name  VARCHAR(200),
    position      VARCHAR(200),
    email         VARCHAR(200),
    phone         VARCHAR(50),
    created_at    TIMESTAMPTZ DEFAULT now()
);
```

### View'lar (10 adet)

| View Adı | Açıklama |
|----------|----------|
| `v_country_trade_summary` | Harita renklendirme — ülke başına toplam ihracat/ithalat kg + USD |
| `v_top_exporters` | Ülke = kaynak; en çok ihracat yapan firmalar |
| `v_top_buyers` | Ülke = kaynak; bu ülkeden en çok alan firmalar |
| `v_top_importers` | Ülke = hedef; en çok ithalat yapan firmalar |
| `v_top_sellers` | Ülke = hedef; bu ülkeye en çok ihracat yapan firmalar |
| `v_top_destinations` | Ülke = kaynak; en çok ihracat yapılan hedef ülkeler |
| `v_top_sources` | Ülke = hedef; en çok ithalat yapılan kaynak ülkeler |
| `v_yearly_trade` | Yıllık ihracat/ithalat USD ve kg değerleri |
| `v_export_companies` | Ülke başına tüm benzersiz ihracatçı firmalar |
| `v_import_companies` | Ülke başına tüm benzersiz ithalatçı firmalar |
| `v_global_top_exporters` | PLANLI — tüm DB'de firma + kaynak ülke bazında SUM(total_value_usd) sıralaması |

Tam SQL: `sql/schema.sql`

---

## Backend API Endpoint'leri

**Base URL:** `http://localhost:3001/api`

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/health` | Sunucu durumu |
| GET | `/countries` | Tüm ülkeler + ticaret hacimleri (harita için) |
| GET | `/countries/:name/stats` | Ülke detayları (panel için) |
| GET | `/companies/:name` | Firma detayları: contacts + ihracat/ithalat toplamları |
| GET | `/companies/top-exporters?limit=N` | Global en çok ihracat yapan firmalar (PLANLI — `v_global_top_exporters` view gerektirir) |
| GET | `/search?q=...&type=company\|all&limit=20` | Firma + ürün arama (autocomplete) |

### GET /countries yanıt formatı (`MapCountry[]`)
```typescript
{
  id: string;           // ülke adı
  name: string;
  exportVolume: number; // kg
  importVolume: number; // kg
  totalTrade: number;   // kg (harita rengi için)
  exportValue: number;  // USD
  importValue: number;  // USD
}
```

### GET /countries/:name/stats yanıt formatı (`CountryStats`)
```typescript
{
  countryName: string;
  countryCode: string;
  totalExportVolume: number;   totalExportValue: number;
  totalImportVolume: number;   totalImportValue: number;
  avgExportPrice: number;      avgImportPrice: number;
  tradeBalance: number;
  topExporters:    { name, volume, value }[];
  topBuyers:       { name, volume, value }[];
  topImporters:    { name, volume, value }[];
  topSellers:      { name, volume, value }[];
  topDestinations: { country, volume, value }[];
  topSources:      { country, volume, value }[];
  yearlyTrade:     { year, exportValue, importValue }[];
  exportCompanies: string[];
  importCompanies: string[];
  exitPorts:  [];   // ileride doldurulabilir
  entryPorts: [];
  rawExports: [];   // artık boş (eski Excel modu artefaktı)
  rawImports: [];
}
```

### GET /companies/:name yanıt formatı (`CompanyStats`)
```typescript
{
  companyName: string;
  countryName: string;
  address: string;
  website: string;
  contacts: {
    id: number;
    contactName: string;
    position: string;
    email: string;
    phone: string;
    linkedinUrl: string;
  }[];
  totalExportVolume: number;  // kg
  totalExportValue: number;   // USD
  totalImportVolume: number;  // kg
  totalImportValue: number;   // USD
  topCustomers: { name, volume, value }[];             // ihracat tarafı — tüm alıcı firmalar (sıralı, tıklanabilir)
  topDestinationCountries: { country, volume, value }[]; // ihracat tarafı — tüm hedef ülkeler (sıralı, frontend pagination)
  yearlyExports: { year, exportVolume, exportValue, shipmentCount }[];  // ihracat tarafı — yıllık özet + sevkiyat sayısı
  topSuppliers: { name, volume, value }[];             // ithalat tarafı — tüm tedarikçi firmalar (sıralı, tıklanabilir)
  topSourceCountries: { country, volume, value }[];    // ithalat tarafı — tüm kaynak ülkeler (sıralı, frontend pagination)
  yearlyImports: { year, importVolume, importValue, shipmentCount }[]; // ithalat tarafı — yıllık özet + sevkiyat sayısı
  exitPorts: { port, count }[];  // çıkış limanları (ihracat + ithalat trade'lerinden)
  entryPorts: { port, count }[]; // varış limanları (ihracat + ithalat trade'lerinden)
}
```

---

## Import Kalıpları

```typescript
// Frontend — tip importları (.js uzantısı zorunlu, "type": "module")
import type { MapCountry, CountryStats, CompanyStats, Contact } from '../types/index.js';

// Frontend — bileşenler
import { WorldMap }      from './components/WorldMap';
import { CountryDetail } from './components/CountryDetail';
import { CompanyDetail } from './components/CompanyDetail';

// Frontend — yardımcılar (hâlâ aktif)
import { formatCurrency, formatNumber } from './utils/dataAnalysis';

// Backend — Supabase client
import { supabase } from '../lib/supabase';

// Backend — route'lar
import { countriesRouter } from './routes/countries';
import { companiesRouter } from './routes/companies';
```

---

## Tamamlanan Özellikler ✅

### Faz 1 — Prototip (Excel tabanlı)
- [x] react-simple-maps ile dünya haritası render
- [x] Ülkelerin ticaret hacmine göre renklendirmesi (yeşil gradyan)
- [x] Seçili ülke mavi renkle işaretlenir
- [x] Hover tooltip (ülke adı + toplam ton)
- [x] ZoomableGroup ile zoom desteği
- [x] Ülke ismi eşleştirmesi (ör. "United States of America" → "USA")
- [x] Ülke detay paneli: ihracat/ithalat, ortalama fiyat, ticaret dengesi
- [x] Yıllık satış hacmi, top firmalar, top ülkeler, tüm firmalar listesi
- [x] Excel dosyasından browser'da parse

### Faz 2 — Supabase + Express Backend
- [x] **Supabase projesi** kuruldu (jgqvudrxxpibxjnltbml)
- [x] **SQL şeması** oluşturuldu — 3 tablo + 10 view (`sql/schema.sql`)
- [x] **Migration scripti** yazıldı (`scripts/import-to-supabase.js`)
- [x] **Express backend** kuruldu (`backend/` — TypeScript, port 3001)
- [x] **API endpoint'leri** yazıldı (`/api/countries`, `/api/countries/:name/stats`)
- [x] **Frontend güncellendi:**
  - App.tsx: Excel kodu kaldırıldı, backend API'ye bağlandı
  - WorldMap.tsx: `TradeData[]` → `MapCountry[]`
  - CountryDetail.tsx: `rawExports` → `yearlyTrade` (yıllık data)
  - types/index.ts: `yearlyTrade` alanı eklendi

### Faz 2 Ek — Firma Detay Sayfası
- [x] **`contacts` tablosu** oluşturuldu — Supabase'e uygulandı
- [x] **`GET /api/companies/:name`** endpoint'i — `backend/src/routes/companies.ts`
- [x] **`CompanyStats` + `Contact` tipleri** — `types/index.ts`
- [x] **`CompanyDetail.tsx`** bileşeni — firma adı, ülke, ihracat/ithalat özeti, contacts listesi
- [x] **`CountryDetail.tsx`** güncellendi — firma adları tıklanabilir (`onCompanyClick` prop)
- [x] **`App.tsx`** güncellendi — `selectedCompany` state, `handleCompanyClick`, navigasyon mantığı
- [x] Navigasyon akışı: Harita → CountryDetail → CompanyDetail (← Ülkeye Dön butonu)

### Düzeltilen Hatalar
- [x] TypeScript export hatası → `.js` uzantısı ile düzeltildi
- [x] `react-simple-maps` tip hatası → `react-simple-maps.d.ts` eklendi
- [x] `trades` tablosunda numeric overflow → `NUMERIC(15,x)` → `NUMERIC(20,x)` olarak güncellendi (veri setinde 2.7 katrilyon USD değerli satır mevcut)
  - Supabase'de: view'lar drop → ALTER TABLE → view'lar yeniden oluşturuldu
  - `sql/schema.sql` güncellendi
- [x] Chrome DevTools 404 gürültüsü → `backend/src/index.ts`'e `/.well-known/appspecific/com.chrome.devtools.json` handler eklendi
- [x] `req.params.name` TypeScript hatası → `as string` cast ile düzeltildi (`countries.ts` + `companies.ts`)
- [x] `WorldMap.tsx` implicit any hatası → render prop parametrelerine explicit `: any` eklendi
- [x] `App-backup.tsx` derleme hataları → `tsconfig.app.json`'a `exclude` eklendi
- [x] `CompanyDetail.tsx` crash — firma tıklanınca beyaz ekran; `topSuppliers`, `topCustomers`, `topDestinationCountries`, `topSourceCountries`, `yearlyExports`, `yearlyImports`, `contacts` alanlarına `?.` optional chaining eklendi (backend bazen bu alanları undefined döndürüyor)
- [x] `CountryDetail.tsx` firma kartındaki ülke etiketi kaldırıldı — o ülkeye zaten tıklanmış olduğundan `companyCountry` badge'i gereksizdi
- [x] WSL2 ağ sorunu — Windows tarayıcısı `localhost:3001`'e ulaşamıyor; `App.tsx`'teki `API_BASE` WSL2 IP adresiyle güncellendi (`http://172.20.131.139:3001/api`). **Not:** WSL2 IP her Windows yeniden başlatmasında değişir, değişirse `API_BASE` güncellenmelidir.
- [x] Firma kartı açıkken başka ülkeye tıklanınca kart ekranda kalıyordu → `App.tsx` `handleCountryClick`'e `setSelectedCompany(null)` eklendi
- [x] United States haritada görünmüyordu — DB'de ülke adı `"United States"` iken `WorldMap.tsx` `nameMap`'te `'United States of America': 'USA'` yazıyordu (`"USA"` DB'de yok); `'United States of America': 'United States'` yapıldı; `countries.ts` `countryCodeMap`'te de `USA: 'USA'` → `'United States': 'USA'` düzeltildi

---

## Yapılacaklar (Sonraki Faz) 🔜

### Kısa Vadeli
- [x] **SQL şemasını Supabase'e uygula** — tamamlandı
- [x] **Migration'ı çalıştır** — tamamlandı (36 ülke, 195 firma, 116 kayıt → 2026-02-26: **gerçek veri** 124 ülke, 1.395 firma, 7.648 kayıt → **temizlendi:** 70 ülke, 532 firma, 2.194 kayıt — sadece tamamen dolu satırlar)
- [x] **Backend testleri** — backend + frontend ayağa kaldırıldı, uygulama çalışıyor doğrulandı

### Orta Vadeli
- [x] `contacts` tablosu — firma iletişim bilgileri (sql/schema.sql — Supabase'de çalıştır)
- [x] `GET /api/companies/:name` endpoint — firma detay paneli (CompanyDetail.tsx)
- [x] `tradeCount` (toplam işlem sayısı) — `v_country_trade_summary` view'una eklendi + CountryDetail panelinde gösteriliyor
- [x] `companyCountry` (firma ülkesi) — eklendi sonra kaldırıldı (zaten o ülkeye tıklanmış olduğundan gereksiz)
- [x] Show-all toggle — topExporters/topImporters listelerinde "Tümünü Göster / Gizle" butonu
- [x] `contacts.linkedin_url`, `companies.address`, `companies.website` — yeni kolonlar + CompanyDetail'da gösterim
- [x] `topCustomers`, `topDestinationCountries`, `yearlyExports` — CompanyDetail'a ihracat tarafı bölümleri eklendi
- [x] Contacts → tablo formatı: İsim | Pozisyon | LinkedIn | E-posta
- [x] **Manuel Supabase adımı tamamlandı:** `linkedin_url`, `address`, `website` kolonları + `v_country_trade_summary` view güncellendi (trade_count eklendi)
- [x] `topSuppliers`, `topSourceCountries`, `yearlyImports` — CompanyDetail'a ithalat tarafı bölümleri eklendi ("Aldığı Top Şirketler", "En Çok Aldığı Ülkeler", "Yıllık İthalat")
- [x] `sql/seed-mock-contacts.sql` — tüm şirketlere rastgele contact (isim, pozisyon, e-posta, telefon, LinkedIn) + website + address eklenir; Supabase SQL Editor'da çalıştırılır (idempotent, tekrar çalıştırılabilir)
- [x] CountryDetail temizlendi — 4 section kaldırıldı: "En Büyük Müşteriler" (topBuyers), "En Çok Gönderdiği Ülkeler" (topDestinations), "En Çok Aldığı Ülkeler" (topSources), "Tüm İhracatçı Firmalar" (exportCompanies); `showAllBuyers` state de kaldırıldı
- [x] CountryDetail başlıkları güncellendi: "En Çok Satan Firmalar" → "En Çok İhracat Yapan Firmalar", "Bu Ülkeden En Çok Alan Firmalar" → "En Çok İthalat Yapan Firmalar"
- [x] CompanyDetail ithalat bölümleri güncellendi: "Aldığı Top Şirketler" → "En Çok Satın Aldığı Firmalar", "Yıllık İthalat" → "Yıllık Alış Hacmi"; Ticaret Özeti kartlarına ortalama fiyat ($/kg) eklendi; her tedarikçi kartta "Ort. fiyat: X$/kg" gösteriliyor — doğrulandı ✅
- [x] CompanyDetail — "Tümünü Gör" toggle: Müşteriler ve Tedarikçiler listeleri ilk 5'i gösterir, altındaki butonla tümü açılır/kapanır; başlıkta toplam sayı gösterilir (2026-02-21: `+X daha` statik yazısı `▼ Tümünü Gör / ▲ Gizle` toggle butonuyla değiştirildi)
- [x] CompanyDetail — Çıkış Limanları (⚓) + Varış Limanları (🏁) bölümleri eklendi; her ikisi de firmanın tüm trade'lerinden (ihracat + ithalat) toplanır, frekansa göre sıralı badge olarak gösterilir
- [x] Backend `topCustomers` ve `topSuppliers` — `.slice(0, 5)` kaldırıldı, tüm liste döndürülüyor (frontend pagination yapıyor)
- [x] Backend `exitPorts` ve `entryPorts` — ihracat ve ithalat trade'lerinden birleşik olarak hesaplanıp response'a eklendi; `CompanyStats` tipine de eklendi 
- [x] **Mock trade verisi genişletildi** — Supabase MCP migration ile eklendi (2026-02-20):
  - CARGILL AGRICOLA SA: müşteri sayısı 2 → 8 (JAPAN GRAIN IMPORTERS CO, ROTTERDAM AGRI BV, SHANGHAI PACIFIC FOODS, SOUTH KOREA FEED CORP, MIDWEST GRAIN TRADING LLC, EUROGRAINS SA)
  - ELECTROBRAS BRASIL: tedarikçi sayısı 1 → 8 (SIEMENS ENERGY AG, ABB POWER SYSTEMS, GENERAL ELECTRIC POWER, ALSTOM POWER SA, SCHNEIDER ELECTRIC SE, MITSUBISHI ELECTRIC CORP, TOSHIBA ENERGY SYSTEMS)
- [x] CompanyDetail ülke bölümleri güncellendi (2026-02-20):
  - "En Çok İhracat Yapılan Ülkeler" → "İhracat Yapılan Ülkeler" + ilk 5 gösterim + "Tümünü Gör" toggle + başlıkta toplam sayı
  - "En Çok Aldığı Ülkeler" → "İthalat Yapılan Ülkeler" + ilk 5 gösterim + "Tümünü Gör" toggle + başlıkta toplam sayı
  - Backend `topDestinationCountries` ve `topSourceCountries`'teki `.slice(0, 5)` kaldırıldı — tüm liste gelir, pagination frontend yapıyor
- [x] **Mock trade verisi genişletildi** — Supabase MCP migration ile eklendi (2026-02-20):
  - CARGILL AGRICOLA SA: hedef ülke eklendi → INDIA GRAIN TRADERS LTD (Hindistan) — toplam 8 hedef ülke
  - ELECTROBRAS BRASIL: kaynak ülke eklendi → LS ELECTRIC CO (Güney Kore) — toplam 7 kaynak ülke
- [x] **Faz 3 — 40K Veri Performans İyileştirmeleri (2026-02-21):**
  - WSL2 IP sorunu kalıcı çözüldü — Vite proxy (`/api → localhost:3001`); `App.tsx`'teki hardcoded IP kaldırıldı, `API_BASE = '/api'` yapıldı; `vite.config.ts`'e `server.host: true` + proxy eklendi
  - ~~Arama çubuğu~~ — eklendi sonra kaldırıldı (2026-02-21)
  - `GET /api/search` backend route'u mevcut (`search.ts`), frontend'de kullanılmıyor
  - İstemci TTL önbelleği — `App.tsx`'te `useRef(Map)` ile 5 dakikalık country/company cache; aynı ülkeye 2. tıklamada network isteği yapılmaz
  - AbortController — ülke/firma tıklamalarında önceki uçuştaki istek iptal edilir (race condition önlendi)
  - Logaritmik harita renk scale — `WorldMap.tsx`'te `Math.log1p()` ile dominant ülke diğerlerini soldurmaz; `maxTrade` render başında bir kez hesaplanır
  - Sanal scroll (`@tanstack/react-virtual`) — `CountryDetail` + `CompanyDetail`'da 10+ öğeli listeler için 400px sabit yükseklikli virtual list; sadece görünen öğeler DOM'a render edilir (60 FPS korunur)
- [x] **recharts grafikleri kaldırıldı (2026-02-21):** `CountryDetail` BarChart + `CompanyDetail` LineChart; recharts import'ları ve ilgili useMemo'lar temizlendi
- [x] **Brezilya mock verisi genişletildi (2026-02-21):** İhracatçı firma sayısı 7 → 14; 7 yeni firma eklendi: MARFRIG GLOBAL FOODS SA (et, China), BRF SA (kanatlı, China), FIBRIA CELULOSE SA (selüloz, Netherlands), GERDAU SA (çelik, Germany), BRASKEM SA (polietilen, Germany), AMBEV SA (bira, Netherlands), RAIZEN ENERGIA SA (etanol, Netherlands); "En Çok İhracat Yapan Firmalar" artık sanal scroll ile gösterilir (14 > VIRTUAL_THRESHOLD=10)
- [x] **CompanyDetail tıklanabilir firma adları (2026-02-23):** Müşteriler + Tedarikçiler listelerinde firma adları mavi tıklanabilir `<button>` — hem normal liste hem `VirtualTradeList` pathinde; `onCompanyClick` prop eklendi (`CompanyDetail` + `App.tsx`); `handleCompanyClick` zaten mevcut olduğundan sıfır yeni logic
- [x] **"📅 Yıllık Sevkiyatlar" section (2026-02-23):** `yearlyExports` + `yearlyImports` yılları birleştirilip tablo olarak gösterilir (yıl | ihracat sevkiyat sayısı | ithalat sevkiyat sayısı); birden fazla yıl varsa footer'da ort./yıl gösterilir; Supabase RPC `get_company_stats`'a `COUNT(*)::int AS "shipmentCount"` eklendi; backend + frontend TypeScript tipleri güncellendi
- [x] **"← Firmaya Dön" butonu (2026-02-23):** Firma içinden müşteri/tedarikçiye tıklanınca başlıkta "← Firmaya Dön" + "← Ülkeye Dön" butonları yan yana gösterilir; `App.tsx`'te `companyHistory` stack + `selectedCompanyRef` (stale closure önlemi) + `handleBackToCompany` eklendi; `CompanyDetail`'e `onBackToCompany?` prop eklendi; çok kademeli geri navigasyon desteklenir
- [ ] **Global Sıralama Paneli** — hiçbir ülke seçili değilken sağ panel boş kalmak yerine global ihracat sıralamasını gösterir:
  - "En Çok İhracat Yapan Ülkeler" — `mapCountries` state'inden sort+slice, sıfır yeni API çağrısı
  - "En Çok İhracat Yapan Firmalar" — yeni endpoint: `GET /api/companies/top-exporters?limit=10`
  - Yeni view: `v_global_top_exporters` (company + origin country + SUM total_value_usd)
  - Yeni bileşen: `GlobalLeaderboard.tsx`; yeni tip: `TopCompanyEntry`
  - Listedeki ülke/firmaya tıklanınca CountryDetail/CompanyDetail'e geçer; "×" ile kapanınca geri döner
- [ ] Filtreleme paneli: tarih aralığı (yıl dropdown), HS kodu prefix, liman filtresi; API `?year=&hs_prefix=` desteği
- [ ] Sunucu taraflı pagination: `?page=&limit=` + infinite scroll
- [ ] URL tabanlı navigasyon: `react-router-dom`, `/country/:name`, `/company/:name`

### Uzun Vadeli — Next.js Geçişi
- [ ] Next.js 14 + TypeScript projesine geçiş (`create-next-app`)
- [ ] shadcn/ui kurulumu (`npx shadcn-ui@latest init`)
- [ ] WorldMap → `"use client"` direktifi
- [ ] CountryDetail → shadcn/ui Card, Badge, Table
- [ ] API çağrıları → TanStack Query
- [ ] Vercel deploy pipeline
- [ ] Supabase MCP + Shadcn MCP bağlantısı

---

## Prisma Hakkında Not

Prisma, mevcut PostgreSQL şemasına sonradan kolayca eklenir:
1. `npm install prisma @prisma/client`
2. `npx prisma init`
3. `npx prisma db pull` — mevcut tablolar Prisma şemasına çekilir
4. `npx prisma generate` — tip-güvenli client oluşturulur

---

## Excel Verisi Yükleme

### Beklenen Sütun Adları (tam bu isimler olmalı)

| Sütun | Örnek |
|-------|-------|
| `GÖNDERİCİ ÜLKE` | Brazil |
| `GÖNDERİCİ FİRMA` | CARGILL SA |
| `ÜRÜN AÇIKLAMA` | Soybeans |
| `ALICI ÜLKE` | China |
| `ALICI FİRMA` | CHINA GRAIN CO |
| `ÇIKIŞ LİMANI` | Santos |
| `VARIŞ LİMANI` | Shanghai |
| `ÜRÜN TARİFE KODU / HS CODE / GTİP` | 1201 |
| `ÜRÜN MİKTARI (KG)` | 50000 |
| `ÜRÜN FİYATI (USD)` | 0.45 |
| `TARİH` | 2024-01-15 |

### Adımlar

1. Excel dosyasını şuraya koy: `trade-map-app/public/Kullanılacak 410150.xlsx`
2. (İsteğe bağlı) Mevcut trade kayıtlarını temizle — Supabase SQL Editor'da:
   ```sql
   TRUNCATE trades RESTART IDENTITY CASCADE;
   ```
3. Migration scriptini çalıştır:
   ```bash
   cd /home/user/projects/demo_isfeke
   node scripts/import-to-supabase.js
   ```

### Notlar
- Script idempotent: ülke + firma `upsert` (çift yazılmaz), trade `insert` (TRUNCATE gerekirse adım 2'yi uygula)
- Sütun adları farklıysa `scripts/import-to-supabase.js` içindeki alan adları güncellenmeli

---

## Geliştirme Komutları

```bash
# 1. DB şemasını uygula (tek seferlik)
# → Supabase SQL Editor'a sql/schema.sql içeriğini yapıştır ve çalıştır

# 2. Excel verisini Supabase'e aktar (tek seferlik)
node scripts/import-to-supabase.js

# 3. Backend başlat (port 3001)
cd backend
npm run dev

# 4. Frontend başlat (port 5173)
cd trade-map-app
npm run dev

# Build (frontend)
cd trade-map-app && npm run build

# Build (backend)
cd backend && npm run build
```

---

## Önemli Notlar

- Harita verisi CDN'den çekiliyor: `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json`
- Ülke isim eşleştirmesi iki yerde: `WorldMap.tsx`'teki `nameMap` + `backend/src/routes/countries.ts`'teki `countryCodeMap`
- Ürün fiyatı: `total_value_usd = unit_price × quantity_kg` (birim fiyat × miktar)
- Navigasyon akışı: `selectedCountry` → CountryDetail; firma tıklanınca `selectedCompany` → CompanyDetail; firma içinden firmaya geçilince `companyHistory` stack'e push; "← Firmaya Dön" → stack'ten pop (çok kademeli); "← Ülkeye Dön" → `setSelectedCompany(null)` + stack temizle; "×" → her şeyi null/temizle
- `@tanstack/react-virtual` virtual list: 10+ öğeli listelerde 400px konteyner, sadece görünen öğeler render edilir
- `.env` dosyaları `.gitignore`'da — Supabase key'leri commit edilmemeli
- Backend `service_role` key kullanıyor (RLS bypass) — frontend'e açılmamalı
- Supabase'e otomatik SQL uygulamak için Management API PAT gerekli (service key yeterli değil); DDL için SQL Editor kullan
- **WSL2 ağ notu (çözüldü):** `vite.config.ts`'te `/api → localhost:3001` proxy var; `App.tsx`'te `API_BASE = '/api'` sabit, IP'ye bağlı değil. Frontend Vite `server.host: true` ile `*:5173`'te dinliyor. Windows yeniden başlatılsa da çalışmaya devam eder.
- `GET /api/search` backend endpoint'i mevcut (`backend/src/routes/search.ts`) ancak frontend'de kullanılmıyor
- Cache TTL: 5 dakika (ülke + firma); aynı ülkeye 2. tıklamada network isteği yoktur
- AbortController: `countryAbortRef` + `companyAbortRef` — her yeni istekte önceki iptal edilir
