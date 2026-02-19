# CLAUDE.md — Dünya Ticaret Haritası Projesi

## Proje Özeti

Gümrük/ticaret verilerini dünya haritası üzerinde görselleştiren bir web uygulaması.
Kullanıcı bir ülkeye tıklar, o ülkenin ihracat/ithalat istatistiklerini detaylı görebilir.

---

## Mevcut Durum: Faz 2 — Supabase + Express Backend

> **Veri kaynağı:** Excel'den Supabase (PostgreSQL) + Express API'ye taşındı.
> **Frontend:** React + Vite (Next.js geçişi sonraki fazda).

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
│           └── companies.ts            # GET /api/companies/:name
│
└── trade-map-app/                      # Frontend (React + Vite + TypeScript)
    ├── public/
    │   └── Ornek_Veri_Seti_final.xlsx  # Ham veri (sadece migration için, artık kullanılmıyor)
    └── src/
        ├── App.tsx                     # API'den veri çeker, Excel kodu kaldırıldı
        ├── App.css
        ├── main.tsx
        ├── index.css
        ├── react-simple-maps.d.ts      # Tip tanımı (react-simple-maps'in @types'ı yok)
        ├── components/
        │   ├── WorldMap.tsx            # MapCountry[] alır (TradeData[] değil)
        │   ├── CountryDetail.tsx       # yearlyTrade kullanır (rawExports değil), onCompanyClick prop
        │   └── CompanyDetail.tsx       # firma detay paneli (contacts + ticaret özeti)
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
  topCustomers: { name, volume, value }[];             // ihracat tarafı — alıcı firmalar (top 5)
  topDestinationCountries: { country, volume, value }[]; // ihracat tarafı — hedef ülkeler (top 5)
  yearlyExports: { year, exportVolume, exportValue }[];  // ihracat tarafı — yıllık özet
  topSuppliers: { name, volume, value }[];             // ithalat tarafı — tedarikçi firmalar (top 5)
  topSourceCountries: { country, volume, value }[];    // ithalat tarafı — kaynak ülkeler (top 5)
  yearlyImports: { year, importVolume, importValue }[]; // ithalat tarafı — yıllık özet
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

---

## Yapılacaklar (Sonraki Faz) 🔜

### Kısa Vadeli
- [x] **SQL şemasını Supabase'e uygula** — tamamlandı
- [x] **Migration'ı çalıştır** — tamamlandı (36 ülke, 182 firma, 103 kayıt)
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
- [ ] Arama/filtreleme: ürün kategorisi, tarih aralığı, HS kodu

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
- Navigasyon akışı: `selectedCountry` → CountryDetail; firma tıklanınca `selectedCompany` → CompanyDetail; "← Ülkeye Dön" → `setSelectedCompany(null)`; "×" → her ikisini null yapar
- `recharts` paketi trade-map-app'te kurulu ama kullanılmıyor — kaldırılabilir
- `.env` dosyaları `.gitignore`'da — Supabase key'leri commit edilmemeli
- Backend `service_role` key kullanıyor (RLS bypass) — frontend'e açılmamalı
- Supabase'e otomatik SQL uygulamak için Management API PAT gerekli (service key yeterli değil); DDL için SQL Editor kullan
