-- ==========================================================
-- Mock Contact & Company Data Seed
-- Supabase SQL Editor'da çalıştırın
-- Mevcut boş contact'ları temizleyip yeniden doldurur
-- ==========================================================

-- Önce temizle (idempotent çalıştırmak için)
TRUNCATE TABLE contacts RESTART IDENTITY;

-- Companies: address ve website sıfırla
UPDATE companies SET address = NULL, website = NULL;

-- ──────────────────────────────────────────────────────────
DO $$
DECLARE
  comp   RECORD;
  n      INT;
  fn     TEXT;
  ln     TEXT;
  pos    TEXT;
  slug   TEXT;
  efn    TEXT;   -- email-safe first name
  eln    TEXT;   -- email-safe last name
  i      INT;

  first_names TEXT[] := ARRAY[
    'James','John','Robert','Michael','William','David','Richard','Joseph','Thomas','Charles',
    'Sarah','Emily','Jessica','Anna','Laura','Emma','Olivia','Sophie','Claire','Rachel',
    'Ahmet','Mehmet','Ali','Mustafa','Hasan','Ibrahim','Fatma','Ayse','Elif','Zeynep',
    'Wei','Li','Zhang','Chen','Wang','Jing','Fang','Ming','Ying','Xia',
    'Pavel','Dmitri','Ivan','Alexei','Natasha','Elena','Irina','Marina','Olga','Tatyana',
    'Carlos','Juan','Miguel','Fernando','Rosa','Carmen','Ana','Isabel','Sofia','Diego',
    'Hans','Klaus','Peter','Franz','Maria','Petra','Monika','Greta','Heinrich','Lukas',
    'Kenji','Hiroshi','Yuki','Sakura','Takeshi','Naomi','Ryota','Aiko','Daisuke','Yumi'
  ];

  last_names TEXT[] := ARRAY[
    'Smith','Johnson','Williams','Brown','Jones','Miller','Davis','Wilson','Taylor','Anderson',
    'Yilmaz','Kaya','Demir','Celik','Sahin','Yildiz','Ozturk','Arslan','Dogan','Kilic',
    'Li','Wang','Zhang','Chen','Liu','Yang','Huang','Zhou','Wu','Sun',
    'Ivanov','Petrov','Sidorov','Smirnov','Kuznetsov','Popov','Novikov','Morozov','Volkov','Sokolov',
    'Garcia','Rodriguez','Martinez','Lopez','Gonzalez','Hernandez','Perez','Sanchez','Ramirez','Torres',
    'Mueller','Schmidt','Schneider','Fischer','Weber','Meyer','Wagner','Becker','Schulz','Hoffmann',
    'Tanaka','Suzuki','Sato','Watanabe','Ito','Yamamoto','Nakamura','Kobayashi','Kato','Abe',
    'Kim','Lee','Park','Choi','Jung','Kang','Yoon','Lim','Han','Oh'
  ];

  senior_pos TEXT[] := ARRAY[
    'CEO','CFO','COO','General Manager','Managing Director',
    'President','Commercial Director','Executive Director','Partner','Board Member'
  ];
  mid_pos TEXT[] := ARRAY[
    'Export Manager','Import Manager','Trade Manager','Sales Manager','Purchasing Manager',
    'Logistics Manager','Supply Chain Manager','Operations Manager','Business Development Manager',
    'Regional Director','Country Manager','Head of Exports','Head of Imports','Sales Director','VP Sales'
  ];
  junior_pos TEXT[] := ARRAY[
    'Export Coordinator','Import Coordinator','Trade Analyst','Sales Representative',
    'Logistics Coordinator','Purchasing Specialist','Senior Trade Analyst',
    'Export Specialist','Import Specialist','Account Manager'
  ];

  phone_prefixes TEXT[] := ARRAY[
    '+1','+44','+49','+33','+34','+39','+31','+46','+47','+45',
    '+90','+7','+86','+81','+82','+91','+55','+52','+27','+20',
    '+61','+64','+966','+971','+65','+60','+48','+420','+36','+40'
  ];

BEGIN
  FOR comp IN
    SELECT c.id, c.name, co.name AS country_name
    FROM   companies c
    LEFT   JOIN countries co ON co.id = c.country_id
    ORDER  BY c.id
  LOOP
    -- URL-safe slug (yalnızca a-z0-9)
    slug := lower(regexp_replace(comp.name, '[^a-zA-Z0-9]', '', 'g'));
    slug := substring(slug, 1, 18);
    IF length(slug) < 2 THEN slug := 'global'; END IF;

    -- Website ve adres güncelle
    UPDATE companies
    SET
      website = 'https://www.' || slug || '.com',
      address = (floor(random() * 899 + 100)::int)::text
                || ' Commerce Avenue, '
                || COALESCE(comp.country_name, 'International')
    WHERE id = comp.id;

    -- Her şirkete 1 ya da 2 kişi ekle
    n := 1 + floor(random() * 2)::int;

    FOR i IN 1..n LOOP
      fn  := first_names [1 + floor(random() * array_length(first_names,  1))::int];
      ln  := last_names  [1 + floor(random() * array_length(last_names,   1))::int];

      -- Pozisyon: 1. kişi kıdemli, 2. kişi orta
      IF    i = 1 THEN pos := senior_pos[1 + floor(random() * array_length(senior_pos, 1))::int];
      ELSIF i = 2 THEN pos := mid_pos   [1 + floor(random() * array_length(mid_pos,    1))::int];
      ELSE              pos := junior_pos[1 + floor(random() * array_length(junior_pos, 1))::int];
      END IF;

      -- E-posta için Türkçe/özel karakter temizle
      efn := lower(translate(fn, 'ÇçĞğİıÖöŞşÜü', 'CcGgIiOoSsUu'));
      eln := lower(translate(ln, 'ÇçĞğİıÖöŞşÜü', 'CcGgIiOoSsUu'));

      INSERT INTO contacts (company_id, contact_name, position, email, phone, linkedin_url)
      VALUES (
        comp.id,
        fn || ' ' || ln,
        pos,
        efn || '.' || eln || '@' || slug || '.com',
        phone_prefixes[1 + floor(random() * array_length(phone_prefixes, 1))::int]
          || ' ' || (floor(random() * 900 + 100)::int)::text
          || ' ' || (floor(random() * 9000000 + 1000000)::int)::text,
        'https://www.linkedin.com/in/' || efn || '-' || eln
          || '-' || (floor(random() * 90000 + 10000)::int)::text
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Seed tamamlandı — % şirket güncellendi.', (SELECT count(*) FROM companies);
END;
$$;

-- Özet kontrol
SELECT
  (SELECT count(*) FROM companies WHERE website IS NOT NULL) AS companies_with_website,
  (SELECT count(*) FROM contacts)                            AS total_contacts;
