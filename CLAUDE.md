# CLAUDE.md — Dünya Ticaret Haritası Projesi

## Proje Özeti

Gümrük/ticaret verilerini dünya haritası üzerinde görselleştiren bir web uygulaması.
Kullanıcı bir ülkeye tıklar, o ülkenin ihracat/ithalat istatistiklerini detaylı görebilir.

---

## Mevcut Durum: Prototip (Demo)

> **ÖNEMLİ:** Bu aşama bir protiptir. Veri kaynağı olarak Excel dosyası kullanılmaktadır.
> Hedef mimari PostgreSQL + Node.js + Next.js'dir (aşağıda detaylar mevcut).

---

## Proje Dosya Yapısı (Mevcut)

```
demo_isfeke/
├── analyze-excel.js                    # Excel veri yapısını analiz etmek için tek seferlik script
├── package.json                        # Kök bağımlılıkları (xlsx okuma için)
└── trade-map-app/                      # Ana uygulama (React + Vite + TypeScript)
    ├── public/
    │   └── Ornek_Veri_Seti_final.xlsx  # Ham veri dosyası (geçici, SQL'e taşınacak)
    ├── src/
    │   ├── App.tsx                     # Ana bileşen — Excel yükleme + state yönetimi
    │   ├── App.css
    │   ├── main.tsx
    │   ├── index.css
    │   ├── components/
    │   │   ├── WorldMap.tsx            # react-simple-maps dünya haritası
    │   │   └── CountryDetail.tsx       # Ülkeye tıklanınca açılan panel
    │   ├── data/
    │   │   └── mockData.ts             # Excel yüklenemediğinde fallback verisi
    │   ├── types/
    │   │   └── index.ts                # TypeScript arayüzleri (TradeData, CountryStats, MapCountry)
    │   └── utils/
    │       └── dataAnalysis.ts         # Analiz fonksiyonları + yardımcı formatlayıcılar
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── tsconfig.json
```

---

## Veri Seti Yapısı

### Excel Sütunları

| Sütun Adı | Tip | Açıklama |
|-----------|-----|----------|
| `GÖNDERİCİ ÜLKE` | string | İhracat yapan ülke |
| `GÖNDERİCİ FİRMA` | string | İhracat yapan firma |
| `ÜRÜN AÇIKLAMA` | string | Ürünün açıklaması |
| `ALICI ÜLKE` | string | İthalat yapan ülke |
| `ALICI FİRMA` | string | İthalat yapan firma |
| `ÇIKIŞ LİMANI` | string | Gemi çıkış limanı (kaldırıldı, UI'da gösterilmiyor) |
| `VARIŞ LİMANI` | string | Gemi varış limanı (kaldırıldı, UI'da gösterilmiyor) |
| `ÜRÜN TARİFE KODU / HS CODE / GTİP` | number | Gümrük tarife kodu |
| `ÜRÜN MİKTARI (KG)` | number | Miktar (kilogram) |
| `ÜRÜN FİYATI (USD)` | number | Birim fiyat (USD/kg) |
| `TARİH` | date string | İşlem tarihi (YYYY-MM-DD) |

---

## Mevcut Tech Stack (Prototip)

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 19 + Vite + TypeScript |
| Harita | react-simple-maps 3.x |
| UI Stili | Tailwind CSS 3.x |
| Veri Okuma | xlsx 0.18.x (Excel parse, browser'da çalışır) |
| Grafik | recharts (kurulu ama kullanılmıyor, kaldırılabilir) |

---

## Import Kalıpları (Mevcut Kod)

> Proje `"type": "module"` kullandığı için TypeScript tip importlarında `.js` uzantısı gerekir.

```typescript
// Tip importları (zorunlu: .js uzantısı ile)
import type { TradeData, CountryStats } from '../types/index.js';

// Bileşen importları
import { WorldMap } from './components/WorldMap';
import { CountryDetail } from './components/CountryDetail';

// Util importları
import { analyzeCountryData, formatCurrency, formatNumber } from './utils/dataAnalysis';

// Veri importları
import { mockTradeData } from './data/mockData';

// Dış kütüphaneler
import * as XLSX from 'xlsx';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
```

---

## Tamamlanan Özellikler ✅

### Harita ve Görselleştirme
- [x] react-simple-maps ile dünya haritası render
- [x] Ülkelerin ticaret hacmine göre renklendirmesi (yeşil gradyan)
- [x] Seçili ülke mavi renkle işaretlenir
- [x] Hover tooltip (ülke adı + toplam ton)
- [x] ZoomableGroup ile zoom desteği
- [x] Ülke ismi eşleştirmesi (ör. "United States of America" → "USA")

### Ülke Detay Paneli (CountryDetail.tsx)
- [x] Sağ panelde açılır/kapanır detay görünümü
- [x] **Genel Bakış**: İhracat/İthalat hacmi (kg + USD)
- [x] **Ortalama ihracat/ithalat fiyatı** (USD/kg)
- [x] **Ticaret dengesi** (ihracat - ithalat, yeşil/kırmızı renk)
- [x] **Yıllık satış hacmi** — tüm yıllar ayrı ayrı gösterilir
- [x] **En Çok Satan Firmalar** (top 5) — format: `{kg} kg / ${birim_fiyat}` + sağda toplam `$X,XXX,XXX`
- [x] **En Büyük Müşteriler** (top 5) — aynı format
- [x] **En Çok Gönderdiği Ülkeler** (tümü)
- [x] **En Çok Aldığı Ülkeler** (tümü)
- [x] **Bu Ülkeden En Çok Alan Firmalar** (top 5)
- [x] **Tüm İhracatçı Firmalar** (scrollable liste)

### Veri Yükleme
- [x] Excel dosyası (`public/Ornek_Veri_Seti_final.xlsx`) browser'da fetch + xlsx ile parse ediliyor
- [x] Excel yüklenemezse mockData.ts'e fallback
- [x] Yüklenme ekranı (loading state)

### Düzeltilen Hatalar
- [x] **Boş ekran sorunu** — birkaç kez yaşandı, React render akışı düzeltildi
- [x] **TypeScript export hatası** — `dataAnalysis.ts:1 Uncaught SyntaxError: The requested module '/src/types/index.ts' does not provide an export named 'CountryStats'`
  _Çözüm: `.js` uzantısı import yoluna eklendi (`../types/index.js`)_

### Kaldırılan Özellikler (İstek Üzerine)
- [x] Grafik/chart bileşenleri kaldırıldı (recharts kurulu ama kullanılmıyor)
- [x] Liman bilgileri (`ÇIKIŞ LİMANI`, `VARIŞ LİMANI`) UI'dan tamamen kaldırıldı

---

## Tespit Edilen Mimari Hatalar ⚠️

### 1. Veri Kaynağı: Excel (Kritik)
**Sorun:** Veriler Excel dosyasından okunuyor ve tüm analiz browser'da JavaScript'te yapılıyor.

**Neden yanlış:**
- Büyük veri setlerinde performans sorunu yaratır
- Veri tutarlılığı sağlanamaz (birden fazla Excel versiyonu olabilir)
- Filtreleme, sorgulama ve raporlama SQL ile çok daha verimli
- Çok kullanıcılı senaryoda paylaşım imkânsız

**Doğru yaklaşım:** Veriler PostgreSQL'e aktarılmalı, analiz sorguları SQL View'ları ve backend API üzerinden yapılmalı.

### 2. Frontend: React + Vite (Geçici)
**Sorun:** Hedef Next.js 14'tür ama şu an React + Vite kullanılıyor.

**Neden değiştirilmeli:** Next.js SSR/SSG, API routes ve Vercel optimizasyonları sağlar.

### 3. shadcn/ui Eksik
**Sorun:** Tailwind var ama shadcn/ui henüz eklenmedi. UI bileşenleri (card, badge, table vs.) elle yazılıyor.

---

## Yapılacaklar (Sonraki Faz) 🔜

### Altyapı Kurulumu
- [ ] Next.js 14 + TypeScript projesine geçiş (`create-next-app`)
- [ ] shadcn/ui kurulumu (`npx shadcn-ui@latest init`)
- [ ] Supabase projesi oluştur (PostgreSQL)
- [ ] Supabase MCP bağlantısı
- [ ] Shadcn MCP bağlantısı
- [ ] Vercel deploy pipeline hazırla

### Veritabanı (PostgreSQL / Supabase)
- [ ] Tabloları oluştur (aşağıdaki SQL şemasına göre)
- [ ] Excel verisini PostgreSQL'e aktar (migration script)
- [ ] View'ları oluştur

### Backend (Node.js + Express + TypeScript)
- [ ] Express + TypeScript projesi kur
- [ ] Supabase client bağlantısı
- [ ] API endpoint'leri yaz:
  - `GET /api/countries` — haritada renklendirilecek ülkeler + hacimler
  - `GET /api/countries/:name/stats` — ülke detayları
  - `GET /api/companies/:id` — firma detayı
- [ ] Prisma ORM entegrasyonu (isteğe bağlı, aşağıda not)

### Frontend (Next.js'e Taşıma)
- [ ] WorldMap bileşenini taşı (react-simple-maps Next.js'te çalışır, `"use client"` direktifi gerekir)
- [ ] CountryDetail bileşenini shadcn/ui Card, Badge, Table ile yeniden yaz
- [ ] API çağrıları için `fetch` veya TanStack Query kullan
- [ ] Excel yükleme mantığını kaldır, backend API'ye bağla

---

## Hedef Veritabanı Şeması (PostgreSQL)

```sql
CREATE TABLE countries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    code CHAR(2),  -- ISO 2 kodu (TR, US, DE...)
    continent VARCHAR(50)
);

CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    address TEXT,
    website VARCHAR(255),
    country_id INT REFERENCES countries(id)  -- firmanın kendi ülkesi
);

CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    company_id INT REFERENCES companies(id),
    full_name VARCHAR(255),
    linkedin_url VARCHAR(255),
    email VARCHAR(255)
);

CREATE TABLE trades (
    id SERIAL PRIMARY KEY,
    seller_company_id INT REFERENCES companies(id),
    buyer_company_id INT REFERENCES companies(id),
    origin_country_id INT REFERENCES countries(id),
    destination_country_id INT REFERENCES countries(id),
    trade_date DATE,
    sale_price NUMERIC(15,2),
    purchase_price NUMERIC(15,2),
    quantity NUMERIC(15,2)
);

-- En büyük müşteriler için view
CREATE VIEW company_top_customers AS
SELECT
    seller_company_id,
    buyer_company_id,
    COUNT(*) AS trade_count,
    AVG(sale_price) AS avg_price,
    SUM(sale_price * quantity) AS total_volume
FROM trades
GROUP BY seller_company_id, buyer_company_id;

-- En çok gönderilen ülkeler için view
CREATE VIEW company_top_destinations AS
SELECT
    seller_company_id,
    destination_country_id,
    COUNT(*) AS shipment_count
FROM trades
GROUP BY seller_company_id, destination_country_id;
```

---

## Hedef Tech Stack (Sonraki Faz)

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 14 + TypeScript |
| Harita | react-simple-maps (`"use client"`) |
| UI | Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma (isteğe bağlı, sonradan eklenebilir) |
| Veritabanı | PostgreSQL (Supabase üzerinde) |
| DB Hosting | Supabase |
| App Hosting | Vercel |
| MCP | Shadcn MCP, Supabase MCP |

---

## Prisma Hakkında Not

> **Soru:** Prisma sonradan eklesek sorun olur mu?

**Cevap: Hayır, sorun olmaz.**

Prisma, mevcut PostgreSQL şemasına sonradan kolayca eklenir:
1. `npm install prisma @prisma/client`
2. `npx prisma init` — `schema.prisma` dosyası oluşur
3. `npx prisma db pull` — mevcut tablolar Prisma şemasına çekilir (introspection)
4. `npx prisma generate` — tip-güvenli client oluşturulur

Prisma eklemek için veritabanı şemasını ya da mevcut kodun çalışmasını bozmak gerekmez. İstersen raw SQL ile başlayıp Prisma'yı daha sonra ekleyebilirsin.

---

## Hedef Import Kalıpları (Next.js Sonrası)

```typescript
// Next.js app router'da istemci bileşeni
'use client';

// shadcn/ui bileşenleri
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

// Supabase client
import { createClient } from '@/lib/supabase/client';

// react-simple-maps (Next.js'te "use client" zorunlu)
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

// Prisma (backend'de)
import { prisma } from '@/lib/prisma';

// API route (Next.js app router)
// app/api/countries/route.ts
import { NextResponse } from 'next/server';
```

---

## Geliştirme Komutları (Mevcut)

```bash
# Uygulamayı başlat
cd trade-map-app
npm run dev

# Build
npm run build

# Önizleme
npm run preview
```

---

## Önemli Notlar

- Harita verisi CDN'den çekiliyor: `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json`
- Ülke isim eşleştirmesi `WorldMap.tsx` içindeki `nameMap`'te yapılıyor (yeni ülkeler eklenirse burası güncellenmeli)
- Ürün fiyatı hesaplaması: `toplam_değer = ÜRÜN MİKTARI (KG) × ÜRÜN FİYATI (USD)` şeklinde yapılıyor — bu birim fiyat × miktar hesabıdır
- `recharts` paketi kurulu ama kullanılmıyor, gereksiz bundle weight'i için silinebilir
