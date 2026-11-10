-- ============================================================================
-- CIMOFOOD E-COMMERCE RESELLER & SISTEM OPERASIONAL UMKM CIMORING
-- Database Schema & Initial Seed Data (Supabase PostgreSQL)
-- Single Source of Truth: PRD.md
-- ============================================================================

-- Enable UUID generation extension if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ADMIN', 'RESELLER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_channel AS ENUM ('ONLINE_WEB', 'OFFLINE_POS', 'RESELLER_WEB');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    '1_CHECKOUT_CREATED',
    '2_WAITING_STOCK_CONFIRMATION',
    '3_WAITING_PAYMENT',
    '4_PAID_VERIFIED',
    '5_PICKED_FROM_PRODUCER',
    '6_PACKED_SOP_VERIFIED',
    '7_SHIPPED',
    '8_COMPLETED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE courier_type AS ENUM ('ANTERAJA', 'JNT', 'JNE', 'COD_MANDIRI', 'AMBIL_DI_TEMPAT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. PROFILES & RESELLERS TABLES (Admin & Mitra Reseller)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone_whatsapp TEXT NOT NULL,
  role user_role DEFAULT 'RESELLER',
  referral_code TEXT UNIQUE,
  address TEXT,
  monthly_target_amount NUMERIC DEFAULT 1000000,
  bonus_percentage NUMERIC DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standalone resellers table for flexible Reseller Portal & Seed Data without auth.users constraint
CREATE TABLE IF NOT EXISTS resellers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone_whatsapp TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Bandung',
  address TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  tier_level TEXT DEFAULT 'MITRA_AKTIF', -- 'PEMULA', 'MITRA_AKTIF', 'SULTAN_CIMORING'
  monthly_target_amount NUMERIC NOT NULL DEFAULT 1500000,
  current_month_sales NUMERIC NOT NULL DEFAULT 0,
  bonus_percentage NUMERIC NOT NULL DEFAULT 5.0,
  total_orders_referred INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. PRODUCTS TABLE (6 Varian Rasa Cimoring & 2 Paket Hampers Lebaran)
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  flavor_category TEXT NOT NULL, -- 'Original', 'Pedas', 'Balado', 'Barbecue', 'Balado Asin', 'Ekstra Pedas', 'Hampers'
  spicy_level INTEGER DEFAULT 0 CHECK (spicy_level >= 0 AND spicy_level <= 5),
  description TEXT,
  image_url TEXT,
  badge_text TEXT,
  is_hampers BOOLEAN DEFAULT FALSE,
  is_sensitive_packaging BOOLEAN DEFAULT FALSE, -- TRUE untuk varian Original (plastik tanpa bumbu lebih tipis)
  pirt_number TEXT DEFAULT 'P-IRT 2063205011245-27',
  is_halal_certified BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. PRODUCT VARIANTS TABLE (Ukuran 200g, 250g, 500g, Bal 2kg, Hampers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  sku TEXT UNIQUE,
  size_label TEXT NOT NULL, -- '200g', '250g', '500g', 'Bal 2kg', 'Paket Hampers'
  weight_grams INTEGER NOT NULL,
  base_price NUMERIC NOT NULL,     -- Harga dasar setor ke produsen Cimoring (P_dasar)
  web_price NUMERIC NOT NULL,      -- Harga jual eceran web CimoFood (P_web <= P_shopee)
  shopee_price NUMERIC NOT NULL,   -- Harga referensi di Shopee untuk transparansi hemat
  reseller_price NUMERIC NOT NULL, -- Harga khusus Reseller tanpa minimal order (P_reseller)
  stock_qty INTEGER DEFAULT 25,
  is_ready_stock BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_web_lte_shopee CHECK (web_price <= shopee_price)
);

-- ============================================================================
-- 5. ORDERS TABLE (Mendukung 8 Tahap Pesanan + POS Offline)
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_code TEXT UNIQUE NOT NULL, -- Contoh: 'CMF-20261110-001'
  channel order_channel DEFAULT 'ONLINE_WEB',
  status order_status DEFAULT '1_CHECKOUT_CREATED',
  
  -- Data Pembeli
  customer_name TEXT NOT NULL,
  customer_whatsapp TEXT NOT NULL,
  customer_city TEXT,
  shipping_address TEXT,
  
  -- Relasi Reseller (Opsional)
  reseller_id UUID REFERENCES resellers(id) ON DELETE SET NULL,
  referral_code_used TEXT,
  
  -- Pengiriman & SOP Kemasan 4 Lapis
  courier courier_type DEFAULT 'JNT',
  tracking_number TEXT,
  has_sensitive_original_item BOOLEAN DEFAULT FALSE,
  sop_sealer_checked BOOLEAN DEFAULT FALSE,
  sop_cardboard_layered BOOLEAN DEFAULT FALSE,
  sop_bubble_wrap_checked BOOLEAN DEFAULT FALSE,
  packing_photo_url TEXT, -- Bukti foto kemasan 4 lapis
  
  -- Keuangan Pesanan
  subtotal_base_price NUMERIC NOT NULL DEFAULT 0, -- Total setor ke produsen Cimoring
  subtotal_selling_price NUMERIC NOT NULL DEFAULT 0,
  packing_fee NUMERIC NOT NULL DEFAULT 2500,
  packaging_material_cost NUMERIC NOT NULL DEFAULT 1500, -- Modal bahan kardus & bubble wrap (M_kemasan)
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  net_profit_cimofood NUMERIC NOT NULL DEFAULT 0, -- L_cimofood = sum((P_item - P_dasar)*Q) + (C_packing - M_kemasan)
  
  -- Pembayaran
  payment_method TEXT DEFAULT 'QRIS', -- 'QRIS', 'TRANSFER_BANK', 'TUNAI_POS'
  payment_proof_url TEXT,
  paid_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. ORDER ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE RESTRICT NOT NULL,
  product_name_snapshot TEXT NOT NULL,
  size_label_snapshot TEXT NOT NULL,
  is_sensitive_snapshot BOOLEAN DEFAULT FALSE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_base_price NUMERIC NOT NULL,
  unit_selling_price NUMERIC NOT NULL,
  subtotal_base NUMERIC NOT NULL,
  subtotal_selling NUMERIC NOT NULL
);

-- ============================================================================
-- 7. GIVEAWAY PARTICIPANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS giveaway_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  instagram_username TEXT NOT NULL,
  tiktok_username TEXT NOT NULL,
  shopee_username TEXT NOT NULL,
  followed_all_proof_url TEXT,
  coupon_code TEXT UNIQUE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. PERFORMANCE INDEXES & ROW LEVEL SECURITY (RLS)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_code ON orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_reseller_id ON orders(reseller_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_resellers_referral_code ON resellers(referral_code);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE giveaway_participants ENABLE ROW LEVEL SECURITY;

-- Public & App Storefront Access Policies
CREATE POLICY "Public read products" ON products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin modify products" ON products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read product_variants" ON product_variants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin modify product_variants" ON product_variants FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read resellers" ON resellers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Manage resellers" ON resellers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Read orders" ON orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Create and update orders" ON orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Read order_items" ON order_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Create order_items" ON order_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Read and join giveaway" ON giveaway_participants FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 9. SEED DATA: 6 VARIAN RASA CIMORING (4 UKURAN) + 2 PAKET HAMPERS LEBARAN
-- ============================================================================

-- 9.1 Insert 6 Varian Rasa + 2 Paket Hampers Lebaran
INSERT INTO products (
  id, name, slug, flavor_category, spicy_level, description, image_url, badge_text, is_hampers, is_sensitive_packaging, pirt_number, is_halal_certified, is_active
) VALUES
  (
    '11111111-1111-4111-8111-111111111101',
    'Cimoring Original Gurih Kencur',
    'cimoring-original-gurih',
    'Original',
    0,
    'Renyah gurih otentik dengan aroma bawang dan kencur pilihan khas resep asli sejak 2017. Tanpa taburan bumbu tebal sehingga teksturnya super kriuk dan ramah untuk anak-anak maupun keluarga.',
    'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=800&q=80',
    'Resep Asli 2017',
    FALSE,
    TRUE, -- WAJIB PERHATIAN SOP: Kemasan plastik tanpa lapisan bumbu lebih tipis/rawan jepot
    'P-IRT 2063205011245-27',
    TRUE,
    TRUE
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    'Cimoring Pedas Cabai Asli',
    'cimoring-pedas-cabai-asli',
    'Pedas',
    3,
    'Varian favorit sepanjang masa! Perpaduan kriuk cimol kering tipis dengan bumbu cabai merah giling asli yang pedasnya pas, gurih, dan bikin susah berhenti ngunyah.',
    'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=800&q=80',
    'Terlaris #1',
    FALSE,
    FALSE,
    'P-IRT 2063205011245-27',
    TRUE,
    TRUE
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    'Cimoring Balado Manis Pedas',
    'cimoring-balado-manis-pedas',
    'Balado',
    2,
    'Balutan bumbu balado merah merona dengan sensasi manis-pedas-gurih yang memanjakan lidah. Bumbu melimpah menempel sempurna di setiap kepingan cimoring renyah.',
    'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=800&q=80',
    'Favorit Keluarga',
    FALSE,
    FALSE,
    'P-IRT 2063205011245-27',
    TRUE,
    TRUE
  ),
  (
    '11111111-1111-4111-8111-111111111104',
    'Cimoring Barbecue (BBQ) Smokey',
    'cimoring-barbecue-smokey',
    'Barbecue',
    1,
    'Cita rasa daging panggang BBQ yang smokey, gurih manis, dan kaya rempah modern. Cocok untuk teman nonton, kerja di depan laptop, atau camilan santai sore hari.',
    'https://images.unsplash.com/photo-1613919113640-25732ec5e61f?auto=format&fit=crop&w=800&q=80',
    'Rasa Premium',
    FALSE,
    FALSE,
    'P-IRT 2063205011245-27',
    TRUE,
    TRUE
  ),
  (
    '11111111-1111-4111-8111-111111111105',
    'Cimoring Balado Asin Gurih',
    'cimoring-balado-asin-gurih',
    'Balado Asin',
    2,
    'Inovasi rasa balado dengan sentuhan asin gurih yang lebih tegas tanpa rasa manis berlebih. Pilihan tepat bagi pecinta camilan savory yang nagih di setiap gigitan.',
    'https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&w=800&q=80',
    'Gurih Nagih',
    FALSE,
    FALSE,
    'P-IRT 2063205011245-27',
    TRUE,
    TRUE
  ),
  (
    '11111111-1111-4111-8111-111111111106',
    'Cimoring Ekstra Pedas Daun Jeruk',
    'cimoring-ekstra-pedas-daun-jeruk',
    'Ekstra Pedas',
    5,
    'Ledakan cabai rawit ekstra pedas berpadu dengan irisan daun jeruk purut asli yang wangi segar! Sensasi pedas nampol yang langsung membangkitkan semangat.',
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
    'Pedas Nampol 🔥',
    FALSE,
    FALSE,
    'P-IRT 2063205011245-27',
    TRUE,
    TRUE
  ),
  (
    '11111111-1111-4111-8111-111111111107',
    'Hampers Lebaran Silaturahmi (Isi 4 Pouch 250g)',
    'hampers-lebaran-silaturahmi-4pouch',
    'Hampers',
    2,
    'Paket hantaran eksklusif Hari Raya berisi 4 Pouch Cimoring 250g (Original, Pedas, Balado, BBQ) lengkap dengan Box Edisi Lebaran, Kartu Ucapan Custom, dan Pita Satin.',
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
    'Edisi Spesial Lebaran',
    TRUE,
    TRUE, -- Mengandung varian Original di dalam bundling
    'P-IRT 2063205011245-27',
    TRUE,
    TRUE
  ),
  (
    '11111111-1111-4111-8111-111111111108',
    'Hampers Sultan Keluarga Raya (6 Rasa Lengkap + Box Eksklusif)',
    'hampers-sultan-keluarga-raya-6rasa',
    'Hampers',
    3,
    'Paket parsel kebanggaan keluarga besar! Berisi lengkap 6 Varian Rasa Cimoring ukuran 250g + 1 Pouch Spesial 500g Pedas Daun Jeruk dalam Hardbox Edisi Hari Raya & Kartu Ucapan.',
    'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=800&q=80',
    'Best Value Hampers',
    TRUE,
    TRUE, -- Mengandung varian Original di dalam bundling
    'P-IRT 2063205011245-27',
    TRUE,
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- 9.2 Insert Product Variants (4 Ukuran: 200g, 250g, 500g, Bal 2kg untuk 6 Varian Rasa + Varian Hampers)
-- Struktur Harga 3 Tingkat (PRD Section 3.1):
--   200g    : base_price = 8000,  reseller_price = 9000,  web_price = 10000, shopee_price = 12000
--   250g    : base_price = 10500, reseller_price = 12000, web_price = 13500, shopee_price = 15500
--   500g    : base_price = 18500, reseller_price = 20500, web_price = 23000, shopee_price = 26500
--   Bal 2kg : base_price = 35000, reseller_price = 38500, web_price = 42000, shopee_price = 47500

INSERT INTO product_variants (
  id, product_id, sku, size_label, weight_grams, base_price, web_price, shopee_price, reseller_price, stock_qty, is_ready_stock
) VALUES
  -- 1. ORIGINAL GURIH KENCUR
  ('22222222-2222-4222-8222-222222220101', '11111111-1111-4111-8111-111111111101', 'CMF-ORI-200', '200g', 200, 8000, 10000, 12000, 9000, 35, TRUE),
  ('22222222-2222-4222-8222-222222220102', '11111111-1111-4111-8111-111111111101', 'CMF-ORI-250', '250g', 250, 10500, 13000, 15000, 11500, 28, TRUE),
  ('22222222-2222-4222-8222-222222220103', '11111111-1111-4111-8111-111111111101', 'CMF-ORI-500', '500g', 500, 18000, 22500, 25500, 20000, 20, TRUE),
  ('22222222-2222-4222-8222-222222220104', '11111111-1111-4111-8111-111111111101', 'CMF-ORI-2KG', 'Bal 2kg', 2000, 34000, 41000, 46000, 37500, 12, TRUE),

  -- 2. PEDAS CABAI ASLI
  ('22222222-2222-4222-8222-222222220201', '11111111-1111-4111-8111-111111111102', 'CMF-PDS-200', '200g', 200, 8000, 10500, 12500, 9200, 45, TRUE),
  ('22222222-2222-4222-8222-222222220202', '11111111-1111-4111-8111-111111111102', 'CMF-PDS-250', '250g', 250, 10500, 13500, 15500, 12000, 40, TRUE),
  ('22222222-2222-4222-8222-222222220203', '11111111-1111-4111-8111-111111111102', 'CMF-PDS-500', '500g', 500, 18500, 23500, 26500, 20500, 25, TRUE),
  ('22222222-2222-4222-8222-222222220204', '11111111-1111-4111-8111-111111111102', 'CMF-PDS-2KG', 'Bal 2kg', 2000, 35000, 42500, 48000, 38500, 15, TRUE),

  -- 3. BALADO MANIS PEDAS
  ('22222222-2222-4222-8222-222222220301', '11111111-1111-4111-8111-111111111103', 'CMF-BLD-200', '200g', 200, 8000, 10500, 12500, 9200, 38, TRUE),
  ('22222222-2222-4222-8222-222222220302', '11111111-1111-4111-8111-111111111103', 'CMF-BLD-250', '250g', 250, 10500, 13500, 15500, 12000, 32, TRUE),
  ('22222222-2222-4222-8222-222222220303', '11111111-1111-4111-8111-111111111103', 'CMF-BLD-500', '500g', 500, 18500, 23500, 26500, 20500, 22, TRUE),
  ('22222222-2222-4222-8222-222222220304', '11111111-1111-4111-8111-111111111103', 'CMF-BLD-2KG', 'Bal 2kg', 2000, 35000, 42500, 48000, 38500, 10, TRUE),

  -- 4. BARBECUE (BBQ) SMOKEY
  ('22222222-2222-4222-8222-222222220401', '11111111-1111-4111-8111-111111111104', 'CMF-BBQ-200', '200g', 200, 8500, 11000, 13000, 9500, 30, TRUE),
  ('22222222-2222-4222-8222-222222220402', '11111111-1111-4111-8111-111111111104', 'CMF-BBQ-250', '250g', 250, 11000, 14000, 16000, 12500, 26, TRUE),
  ('22222222-2222-4222-8222-222222220403', '11111111-1111-4111-8111-111111111104', 'CMF-BBQ-500', '500g', 500, 19000, 24000, 27000, 21000, 18, TRUE),
  ('22222222-2222-4222-8222-222222220404', '11111111-1111-4111-8111-111111111104', 'CMF-BBQ-2KG', 'Bal 2kg', 2000, 36000, 43500, 49000, 39500, 8, TRUE),

  -- 5. BALADO ASIN GURIH
  ('22222222-2222-4222-8222-222222220501', '11111111-1111-4111-8111-111111111105', 'CMF-BLA-200', '200g', 200, 8000, 10500, 12500, 9200, 28, TRUE),
  ('22222222-2222-4222-8222-222222220502', '11111111-1111-4111-8111-111111111105', 'CMF-BLA-250', '250g', 250, 10500, 13500, 15500, 12000, 24, TRUE),
  ('22222222-2222-4222-8222-222222220503', '11111111-1111-4111-8111-111111111105', 'CMF-BLA-500', '500g', 500, 18500, 23500, 26500, 20500, 16, TRUE),
  ('22222222-2222-4222-8222-222222220504', '11111111-1111-4111-8111-111111111105', 'CMF-BLA-2KG', 'Bal 2kg', 2000, 35000, 42500, 48000, 38500, 9, TRUE),

  -- 6. EKSTRA PEDAS DAUN JERUK
  ('22222222-2222-4222-8222-222222220601', '11111111-1111-4111-8111-111111111106', 'CMF-XPD-200', '200g', 200, 8500, 11000, 13500, 9500, 42, TRUE),
  ('22222222-2222-4222-8222-222222220602', '11111111-1111-4111-8111-111111111106', 'CMF-XPD-250', '250g', 250, 11000, 14500, 16500, 12500, 36, TRUE),
  ('22222222-2222-4222-8222-222222220603', '11111111-1111-4111-8111-111111111106', 'CMF-XPD-500', '500g', 500, 19500, 24500, 28000, 21500, 24, TRUE),
  ('22222222-2222-4222-8222-222222220604', '11111111-1111-4111-8111-111111111106', 'CMF-XPD-2KG', 'Bal 2kg', 2000, 36500, 44500, 50000, 40000, 14, TRUE),

  -- 7. PAKET HAMPERS LEBARAN SILATURAHMI (4 x 250g + Box Hari Raya)
  ('22222222-2222-4222-8222-222222220701', '11111111-1111-4111-8111-111111111107', 'CMF-HMP-SLT', 'Paket 4 Pouch (1kg)', 1150, 45000, 56000, 65000, 50000, 20, TRUE),

  -- 8. PAKET HAMPERS SULTAN KELUARGA RAYA (6 x 250g + 1 x 500g + Hardbox)
  ('22222222-2222-4222-8222-222222220801', '11111111-1111-4111-8111-111111111108', 'CMF-HMP-SLT6', 'Paket Sultan (2kg)', 2200, 85000, 105000, 122000, 93000, 15, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 9.3 Insert Initial Resellers Seed Data
INSERT INTO resellers (
  id, full_name, phone_whatsapp, city, address, referral_code, tier_level, monthly_target_amount, current_month_sales, bonus_percentage, total_orders_referred, is_active
) VALUES
  (
    '33333333-3333-4333-8333-333333330001',
    'Teh Rina Kartika',
    '6281223344556',
    'Bandung',
    'Jl. Buah Batu No. 118, Lengkong, Kota Bandung',
    'RINACIMO',
    'SULTAN_CIMORING',
    2000000,
    1680000,
    5.0,
    24,
    TRUE
  ),
  (
    '33333333-3333-4333-8333-333333330002',
    'Kang Dedi Pratama',
    '6281398765432',
    'Garut',
    'Jl. Cimanuk No. 45, Tarogong Kidul, Garut',
    'DEDIKRIUK',
    'MITRA_AKTIF',
    1500000,
    920000,
    5.0,
    14,
    TRUE
  ),
  (
    '33333333-3333-4333-8333-333333330003',
    'Neng Siti Nurhaliza',
    '6285711223344',
    'Bekasi',
    'Perum Grand Galaxy City Blok RGA No. 12, Bekasi Selatan',
    'SITIHOT',
    'MITRA_AKTIF',
    1000000,
    1050000,
    5.0,
    18,
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- 9.4 Insert Sample Orders across 8 Stages so Admin & Tracking can be tested immediately
INSERT INTO orders (
  id, order_code, channel, status, customer_name, customer_whatsapp, customer_city, shipping_address,
  reseller_id, referral_code_used, courier, tracking_number, has_sensitive_original_item,
  sop_sealer_checked, sop_cardboard_layered, sop_bubble_wrap_checked, packing_photo_url,
  subtotal_base_price, subtotal_selling_price, packing_fee, packaging_material_cost, shipping_cost,
  discount_amount, grand_total, net_profit_cimofood, payment_method, payment_proof_url, notes, created_at
) VALUES
  (
    '44444444-4444-4444-8444-444444440001',
    'CMF-20261110-001',
    'ONLINE_WEB',
    '2_WAITING_STOCK_CONFIRMATION',
    'Budi Santoso',
    '6281234567890',
    'Jakarta Selatan',
    'Jl. Kemang Raya No. 24, Bangka, Mampang Prapatan, Jakarta Selatan 12730',
    NULL,
    NULL,
    'JNT',
    NULL,
    TRUE, -- Mengandung Varian Original!
    FALSE,
    FALSE,
    FALSE,
    NULL,
    45000,
    56500,
    2500,
    1500,
    0,
    0,
    59000,
    12500,
    'QRIS',
    NULL,
    'Tolong pastikan kemasan Original aman ya kak, buat oleh-oleh keluarga.',
    NOW() - INTERVAL '25 minutes'
  ),
  (
    '44444444-4444-4444-8444-444444440002',
    'CMF-20261110-002',
    'ONLINE_WEB',
    '3_WAITING_PAYMENT',
    'Siti Rahmawati',
    '6281322446688',
    'Depok',
    'Jl. Margonda Raya Gg. Kober No. 8, Pondok Cina, Beji, Kota Depok 16424',
    '33333333-3333-4333-8333-333333330001',
    'RINACIMO',
    'ANTERAJA',
    NULL,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    NULL,
    40500,
    51500,
    2500,
    1500,
    12000,
    2000,
    64000,
    12000,
    'QRIS',
    NULL,
    'Pakai kode promo dari Teh Rina.',
    NOW() - INTERVAL '2 hours'
  ),
  (
    '44444444-4444-4444-8444-444444440003',
    'CMF-20261110-003',
    'ONLINE_WEB',
    '6_PACKED_SOP_VERIFIED',
    'Dimas Anggara',
    '6285678901234',
    'Surabaya',
    'Jl. Raya Darmo Permai III No. 15, Sukomanunggal, Surabaya 60188',
    NULL,
    NULL,
    'JNE',
    NULL,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    80000,
    98500,
    2500,
    1500,
    18000,
    0,
    119000,
    19500,
    'TRANSFER_BANK',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80',
    'Kirim ke kantor jam kerja.',
    NOW() - INTERVAL '5 hours'
  ),
  (
    '44444444-4444-4444-8444-444444440004',
    'CMF-20261109-004',
    'ONLINE_WEB',
    '8_COMPLETED',
    'Hj. Lilis Suryani',
    '6281122334455',
    'Bandung',
    'Komp. Permata Biru Blok D2 No. 9, Cinunuk, Cileunyi, Bandung',
    '33333333-3333-4333-8333-333333330001',
    'RINACIMO',
    'JNT',
    'JP8839201942',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    85000,
    105000,
    2500,
    1500,
    10000,
    0,
    117500,
    21000,
    'QRIS',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80',
    'Alhamdulillah paket hampers sampai dengan utuh dan rapi.',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- 9.5 Insert Sample Order Items
INSERT INTO order_items (
  id, order_id, variant_id, product_name_snapshot, size_label_snapshot, is_sensitive_snapshot, quantity, unit_base_price, unit_selling_price, subtotal_base, subtotal_selling
) VALUES
  (
    '55555555-5555-4555-8555-555555550001',
    '44444444-4444-4444-8444-444444440001',
    '22222222-2222-4222-8222-222222220103',
    'Cimoring Original Gurih Kencur',
    '500g',
    TRUE,
    1,
    18000,
    22500,
    18000,
    22500
  ),
  (
    '55555555-5555-4555-8555-555555550002',
    '44444444-4444-4444-8444-444444440001',
    '22222222-2222-4222-8222-222222220202',
    'Cimoring Pedas Cabai Asli',
    '250g',
    FALSE,
    2,
    10500,
    13500,
    21000,
    27000
  ),
  (
    '55555555-5555-4555-8555-555555550003',
    '44444444-4444-4444-8444-444444440002',
    '22222222-2222-4222-8222-222222220602',
    'Cimoring Ekstra Pedas Daun Jeruk',
    '250g',
    FALSE,
    2,
    11000,
    14500,
    22000,
    29000
  ),
  (
    '55555555-5555-4555-8555-555555550004',
    '44444444-4444-4444-8444-444444440002',
    '22222222-2222-4222-8222-222222220303',
    'Cimoring Balado Manis Pedas',
    '500g',
    FALSE,
    1,
    18500,
    22500,
    18500,
    22500
  ),
  (
    '55555555-5555-4555-8555-555555550005',
    '44444444-4444-4444-8444-444444440003',
    '22222222-2222-4222-8222-222222220701',
    'Hampers Lebaran Silaturahmi (Isi 4 Pouch 250g)',
    'Paket 4 Pouch (1kg)',
    TRUE,
    1,
    45000,
    56000,
    45000,
    56000
  ),
  (
    '55555555-5555-4555-8555-555555550006',
    '44444444-4444-4444-8444-444444440003',
    '22222222-2222-4222-8222-222222220204',
    'Cimoring Pedas Cabai Asli',
    'Bal 2kg',
    FALSE,
    1,
    35000,
    42500,
    35000,
    42500
  ),
  (
    '55555555-5555-4555-8555-555555550007',
    '44444444-4444-4444-8444-444444440004',
    '22222222-2222-4222-8222-222222220801',
    'Hampers Sultan Keluarga Raya (6 Rasa Lengkap + Box Eksklusif)',
    'Paket Sultan (2kg)',
    TRUE,
    1,
    85000,
    105000,
    85000,
    105000
  )
ON CONFLICT (id) DO NOTHING;

-- 9.6 Insert Sample Giveaway Participants
INSERT INTO giveaway_participants (
  id, full_name, whatsapp, instagram_username, tiktok_username, shopee_username, followed_all_proof_url, coupon_code, is_verified
) VALUES
  (
    '66666666-6666-4666-8666-666666660001',
    'Anisa Fitriani',
    '6281299887766',
    '@anisafitri_id',
    '@anisakriuk',
    'anisa_shop99',
    'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=500&q=80',
    'GWCIMO-2026-8841',
    TRUE
  ),
  (
    '66666666-6666-4666-8666-666666660002',
    'Reza Oktavian',
    '6285788990011',
    '@rezaokt_bdg',
    '@rezangemil',
    'reza_bdg21',
    'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=500&q=80',
    'GWCIMO-2026-5920',
    FALSE
  )
ON CONFLICT (id) DO NOTHING;

