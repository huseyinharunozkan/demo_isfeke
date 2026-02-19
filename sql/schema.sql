-- ===========================================
-- Dünya Ticaret Haritası — Veritabanı Şeması
-- Supabase SQL Editor'da çalıştırın
-- ===========================================

-- Tablolar
CREATE TABLE IF NOT EXISTS countries (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(10),
    continent VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS companies (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(255) UNIQUE NOT NULL,
    country_id INT REFERENCES countries(id),
    address    VARCHAR(500),
    website    VARCHAR(500)
);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address VARCHAR(500);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website VARCHAR(500);

CREATE TABLE IF NOT EXISTS trades (
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
    unit_price             NUMERIC(20,4),   -- USD per kg
    quantity_kg            NUMERIC(20,2),   -- kg
    total_value_usd        NUMERIC(20,2)    -- unit_price * quantity_kg
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_trades_origin      ON trades(origin_country_id);
CREATE INDEX IF NOT EXISTS idx_trades_destination ON trades(destination_country_id);
CREATE INDEX IF NOT EXISTS idx_trades_seller      ON trades(seller_company_id);
CREATE INDEX IF NOT EXISTS idx_trades_buyer       ON trades(buyer_company_id);
CREATE INDEX IF NOT EXISTS idx_trades_date        ON trades(trade_date);

-- ===========================================
-- View'lar
-- ===========================================

-- Harita için ülke bazlı özet
CREATE OR REPLACE VIEW v_country_trade_summary AS
SELECT
    c.name AS country_name,
    COALESCE(SUM(CASE WHEN t.origin_country_id      = c.id THEN t.quantity_kg     END), 0)::NUMERIC(20,2) AS total_export_kg,
    COALESCE(SUM(CASE WHEN t.origin_country_id      = c.id THEN t.total_value_usd END), 0)::NUMERIC(20,2) AS total_export_usd,
    COALESCE(SUM(CASE WHEN t.destination_country_id = c.id THEN t.quantity_kg     END), 0)::NUMERIC(20,2) AS total_import_kg,
    COALESCE(SUM(CASE WHEN t.destination_country_id = c.id THEN t.total_value_usd END), 0)::NUMERIC(20,2) AS total_import_usd,
    COUNT(DISTINCT t.id) AS trade_count
FROM countries c
LEFT JOIN trades t ON t.origin_country_id = c.id OR t.destination_country_id = c.id
GROUP BY c.name;

-- En çok ihracat yapan firmalar (ülke = kaynak)
CREATE OR REPLACE VIEW v_top_exporters AS
SELECT
    c.name    AS country_name,
    comp.name AS company_name,
    SUM(t.quantity_kg)    ::NUMERIC(20,2) AS total_kg,
    SUM(t.total_value_usd)::NUMERIC(20,2) AS total_usd
FROM trades t
JOIN countries c  ON c.id    = t.origin_country_id
JOIN companies comp ON comp.id = t.seller_company_id
GROUP BY c.name, comp.name;

-- Bu ülkeden en çok alan firmalar (alıcı taraf)
CREATE OR REPLACE VIEW v_top_buyers AS
SELECT
    c.name    AS country_name,
    comp.name AS company_name,
    SUM(t.quantity_kg)    ::NUMERIC(20,2) AS total_kg,
    SUM(t.total_value_usd)::NUMERIC(20,2) AS total_usd
FROM trades t
JOIN countries  c    ON c.id    = t.origin_country_id
JOIN companies comp ON comp.id = t.buyer_company_id
GROUP BY c.name, comp.name;

-- Bu ülkede en çok ithalat yapan firmalar (ülke = hedef)
CREATE OR REPLACE VIEW v_top_importers AS
SELECT
    c.name    AS country_name,
    comp.name AS company_name,
    SUM(t.quantity_kg)    ::NUMERIC(20,2) AS total_kg,
    SUM(t.total_value_usd)::NUMERIC(20,2) AS total_usd
FROM trades t
JOIN countries  c    ON c.id    = t.destination_country_id
JOIN companies comp ON comp.id = t.buyer_company_id
GROUP BY c.name, comp.name;

-- Bu ülkeye en çok ihracat yapan firmalar
CREATE OR REPLACE VIEW v_top_sellers AS
SELECT
    c.name    AS country_name,
    comp.name AS company_name,
    SUM(t.quantity_kg)    ::NUMERIC(20,2) AS total_kg,
    SUM(t.total_value_usd)::NUMERIC(20,2) AS total_usd
FROM trades t
JOIN countries  c    ON c.id    = t.destination_country_id
JOIN companies comp ON comp.id = t.seller_company_id
GROUP BY c.name, comp.name;

-- En çok ihracat yapılan ülkeler
CREATE OR REPLACE VIEW v_top_destinations AS
SELECT
    c_orig.name AS country_name,
    c_dest.name AS destination_country,
    SUM(t.quantity_kg)    ::NUMERIC(20,2) AS total_kg,
    SUM(t.total_value_usd)::NUMERIC(20,2) AS total_usd
FROM trades t
JOIN countries c_orig ON c_orig.id = t.origin_country_id
JOIN countries c_dest ON c_dest.id = t.destination_country_id
GROUP BY c_orig.name, c_dest.name;

-- En çok ithalat yapılan kaynak ülkeler
CREATE OR REPLACE VIEW v_top_sources AS
SELECT
    c_dest.name AS country_name,
    c_orig.name AS source_country,
    SUM(t.quantity_kg)    ::NUMERIC(20,2) AS total_kg,
    SUM(t.total_value_usd)::NUMERIC(20,2) AS total_usd
FROM trades t
JOIN countries c_dest ON c_dest.id = t.destination_country_id
JOIN countries c_orig ON c_orig.id = t.origin_country_id
GROUP BY c_dest.name, c_orig.name;

-- Yıllık ticaret verileri
CREATE OR REPLACE VIEW v_yearly_trade AS
SELECT
    c.name AS country_name,
    EXTRACT(YEAR FROM t.trade_date)::INT AS year,
    SUM(CASE WHEN t.origin_country_id      = c.id THEN t.total_value_usd ELSE 0 END)::NUMERIC(20,2) AS export_usd,
    SUM(CASE WHEN t.destination_country_id = c.id THEN t.total_value_usd ELSE 0 END)::NUMERIC(20,2) AS import_usd,
    SUM(CASE WHEN t.origin_country_id      = c.id THEN t.quantity_kg     ELSE 0 END)::NUMERIC(20,2) AS export_kg,
    SUM(CASE WHEN t.destination_country_id = c.id THEN t.quantity_kg     ELSE 0 END)::NUMERIC(20,2) AS import_kg
FROM countries c
JOIN trades t ON (t.origin_country_id = c.id OR t.destination_country_id = c.id)
WHERE t.trade_date IS NOT NULL
GROUP BY c.name, EXTRACT(YEAR FROM t.trade_date);

-- Tüm ihracatçı firmalar (ülke bazlı, unique)
CREATE OR REPLACE VIEW v_export_companies AS
SELECT DISTINCT
    c.name    AS country_name,
    comp.name AS company_name
FROM trades t
JOIN countries  c    ON c.id    = t.origin_country_id
JOIN companies comp ON comp.id = t.seller_company_id;

-- Tüm ithalatçı firmalar (ülke bazlı, unique)
CREATE OR REPLACE VIEW v_import_companies AS
SELECT DISTINCT
    c.name    AS country_name,
    comp.name AS company_name
FROM trades t
JOIN countries  c    ON c.id    = t.destination_country_id
JOIN companies comp ON comp.id = t.buyer_company_id;

-- Firma iletişim bilgileri
CREATE TABLE IF NOT EXISTS contacts (
    id            SERIAL PRIMARY KEY,
    company_id    INT REFERENCES companies(id) ON DELETE CASCADE,
    contact_name  VARCHAR(200),
    position      VARCHAR(200),
    email         VARCHAR(200),
    phone         VARCHAR(50),
    linkedin_url  VARCHAR(500),
    created_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);

-- ===========================================
-- Yetkilendirme (anon key için okuma izni)
-- ===========================================
GRANT SELECT ON countries, companies, trades, contacts TO anon, authenticated;
GRANT SELECT ON
    v_country_trade_summary,
    v_top_exporters,
    v_top_buyers,
    v_top_importers,
    v_top_sellers,
    v_top_destinations,
    v_top_sources,
    v_yearly_trade,
    v_export_companies,
    v_import_companies
TO anon, authenticated;
