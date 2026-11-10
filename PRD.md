# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Nama Proyek: CimoFood – Platform E-Commerce Reseller & Sistem Operasional UMKM Cimoring

---

## 1. Ringkasan Proyek & Konteks Bisnis
**CimoFood** adalah platform web toko online resmi (etalase digital), sistem manajemen pesanan 8-tahap, kasir pencatatan *offline* (POS ringan), serta portal pengelolaan *reseller* untuk mitra produsen tunggal **UMKM Cimoring** (berdiri sejak 2017, memiliki izin PIRT dan sertifikasi Halal).

### 1.1 Masalah Utama yang Diselesaikan
1. **Bebas Potongan Platform:** Penjualan terbesar UMKM saat ini berasal dari Shopee, namun potongan komisi dan pajak platform sangat tinggi sehingga menggerus margin (margin dasar pemilik sekitar $\text{Rp}2.000$ per kemasan). CimoFood menjadi kanal penjualan mandiri tanpa biaya titip bagi produsen dan dengan harga jual yang tidak melebihi harga Shopee.
2. **Standarisasi & Pengambilalihan Beban Packing:** Pemilik selama ini mengerjakan *packing* sendirian. Tim CimoFood mengambil alih proses *packing* menggunakan **SOP 4 Lapis** (segel mesin *sealer*, apit kardus kanan-kiri, kardus melingkar, *bubble wrap*) dengan fitur **unggah foto bukti kemasan** (terutama untuk varian Original yang plastiknya lebih tipis karena tanpa lapisan bumbu).
3. **Konfirmasi Stok Anti-Batal:** Produksi Cimoring bersifat *ready stock* harian namun sering habis mendadak saat lonjakan pesanan (seperti libur Lebaran). Sistem menerapkan alur konfirmasi stok dan ongkir via WhatsApp sebelum pembeli melakukan pembayaran.
4. **Digitalisasi Pencatatan Offline & Laporan Excel:** Pembeli eceran yang datang langsung ke rumah selama ini jarang dicatat atau dicatat asal. Sistem menyediakan fitur **Input Kasir Cepat (POS Offline)** dan fitur **Export ke Microsoft Excel (.xlsx)** yang selaras dengan kebiasaan pemilik mencadangkan data ke Google Drive.
5. **Ergonomi Perangkat (Laptop & Tablet First untuk Admin):** Pemilik merasa pengelolaan toko lewat HP merepotkan (*"ribet pencet-pencet"*) dan lebih nyaman menggunakan **Laptop** (saat bekerja cepat) atau **Tablet** (saat di perjalanan/mobil). Oleh karena itu, **Dasbor Admin wajib dirancang dengan antarmuka ramah Laptop & Tablet** (tombol besar, tabel lega, navigasi samping), sementara **Etalase Pembeli dirancang Mobile-First**.

---

## 2. Tech Stack & Arsitektur Sistem
* **Framework Utama:** Next.js (App Router, TypeScript)
* **Styling & UI Components:** Tailwind CSS + shadcn/ui + Lucide Icons
* **Database, Auth & Storage:** Supabase (PostgreSQL, Supabase Auth, Supabase Storage)
* **State Management (Cart):** Zustand (dengan `localStorage` persistence)
* **Export Laporan:** `xlsx` (SheetJS) untuk unduh laporan format Microsoft Excel
* **Integrasi Komunikasi:** WhatsApp Deep Link API (`https://wa.me/...`) dengan pesan terformat otomatis

---

## 3. Aturan Bisnis & Rumus Perhitungan (Business Logic)

### 3.1 Struktur Harga 3 Tingkat & Rumus Keuntungan
Setiap varian ukuran produk memiliki 4 atribut harga di database:
1. `base_price` ($P_{\text{dasar}}$): Harga dasar / harga grosir yang dibayarkan tim CimoFood kepada produsen Cimoring saat mengambil barang.
2. `web_price` ($P_{\text{web}}$): Harga jual eceran di website CimoFood (mengandung *markup/ujrah* bertingkat $10\% - 50\%$ di atas $P_{\text{dasar}}$).
3. `shopee_price` ($P_{\text{shopee}}$): Harga jual di marketplace sebagai referensi transparansi harga. Aturan wajib:
   $$P_{\text{web}} \le P_{\text{shopee}}$$
4. `reseller_price` ($P_{\text{reseller}}$): Harga khusus untuk akun Reseller terdaftar (tanpa minimal order).

**Rumus Total Tagihan Pembeli ($T_{\text{bayar}}$):**
$$T_{\text{bayar}} = \sum (P_{\text{item}} \times Q_{\text{item}}) + C_{\text{packing}} + C_{\text{ongkir}} - D_{\text{promo}}$$

**Rumus Laba Bersih CimoFood per Pesanan ($L_{\text{cimofood}}$):**
$$L_{\text{cimofood}} = \sum \left((P_{\text{item}} - P_{\text{dasar}}) \times Q_{\text{item}}\right) + (C_{\text{packing}} - M_{\text{kemasan}})$$
*(Di mana $C_{\text{packing}}$ adalah biaya packing aman yang dibebankan ke pesanan dan $M_{\text{kemasan}}$ adalah modal bahan kardus/bubble wrap).*

### 3.2 Mesin Status Pesanan 8 Tahap (8-Stage Order State Machine)
Setiap pesanan online wajib melewati urutan status berikut secara ketat:
1. `1_CHECKOUT_CREATED`: Pembeli memilih varian & ukuran, mengisi alamat, dan menekan tombol pesan.
2. `2_WAITING_STOCK_CONFIRMATION`: Pesanan tercatat di sistem; pembeli diarahkan ke WhatsApp Admin. Admin mengecek stok ke Cimoring dan menghitung ongkir ekspedisi (Anteraja / J&T / JNE) maksimal dalam 1 jam pada jam layanan.
3. `3_WAITING_PAYMENT`: Admin menginput nominal ongkir di Dasbor dan mengubah status pesanan. Pembeli melihat total tagihan akhir, membayar via Transfer Bank / QRIS, dan mengunggah foto bukti bayar di halaman Lacak Pesanan.
4. `4_PAID_VERIFIED`: Admin memverifikasi bukti bayar. Status berubah menjadi **Dibayar**.
5. `5_PICKED_FROM_PRODUCER`: Tim CimoFood mengambil barang dari rumah produksi Cimoring dan menyerahkan pembayaran sebesar total `base_price`.
6. `6_PACKED_SOP_VERIFIED`: Tim mengemas produk sesuai SOP 4 Lapis. **Syarat wajib sistem:** Admin harus mencentang *checklist* SOP (termasuk peringatan khusus jika pesanan mengandung **Varian Original** yang kemasannya lebih tipis) dan **mengunggah foto bukti kemasan** sebelum bisa lanjut ke tahap berikutnya.
7. `7_SHIPPED`: Barang diserahkan ke ekspedisi (Anteraja / J&T / JNE). Admin menginput Nomor Resi, dan tombol pemberitahuan WhatsApp otomatis dikirim ke pembeli.
8. `8_COMPLETED`: Pembeli mengonfirmasi barang diterima dengan utuh. Transaksi masuk ke perhitungan final Laporan Penjualan & Keuangan.
*Status Tambahan:* `CANCELLED` (Jika stok habis saat tahap konfirmasi atau pembeli membatalkan pesanan sebelum membayar).

---

## 4. Spesifikasi Data Awal Produk (Seed Data)

### 4.1 Varian Rasa (6 Varian)
1. **Original** *(Flag khusus: `is_sensitive_packaging = true` karena tanpa lapisan bumbu sehingga plastik lebih tipis/rawan jepot jika kardus terlalu menekan)*
2. **Pedas**
3. **Balado**
4. **Barbecue (BBQ)**
5. **Balado Asin**
6. **Pedas Daun Jeruk**

### 4.2 Ukuran Kemasan & Kisaran Harga
* **Kemasan Eceran Warung/Rumah (Khusus POS Offline):** $\text{Rp}1.000 - \text{Rp}5.000$
* **Kemasan Pouch 200 gram:** Mulai $\text{Rp}10.000$
* **Kemasan Pouch 250 gram:** Sekitar $\text{Rp}12.500 - \text{Rp}15.000$
* **Kemasan Medium 500 gram:** Sekitar $\text{Rp}22.000 - \text{Rp}25.000$
* **Kemasan Bal 2 Kilogram (Grosir/Keluarga):** Sekitar $\text{Rp}40.000 - \text{Rp}45.000$
* **Paket Hampers / Bundling Lebaran:** Paket isi kombinasi varian + kardus edisi Hari Raya.

---

## 5. Skema Database Lengkap (Supabase PostgreSQL)

Gunakan skema SQL berikut untuk menginisialisasi tabel di Supabase:

```sql
-- 1. ENUM TYPES
CREATE TYPE user_role AS ENUM ('ADMIN', 'RESELLER');
CREATE TYPE order_channel AS ENUM ('ONLINE_WEB', 'OFFLINE_POS', 'RESELLER_WEB');
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
CREATE TYPE courier_type AS ENUM ('ANTERAJA', 'JNT', 'JNE', 'COD_MANDIRI', 'AMBIL_DI_TEMPAT');

-- 2. PROFILES TABLE (Admin & Reseller)
CREATE TABLE profiles (
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

-- 3. PRODUCTS TABLE (6 Varian Rasa & Paket Hampers)
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  flavor_category TEXT NOT NULL, -- 'Original', 'Pedas', 'Balado', 'Barbecue', 'Balado Asin', 'Pedas Daun Jeruk', 'Hampers'
  description TEXT,
  image_url TEXT,
  is_hampers BOOLEAN DEFAULT FALSE,
  is_sensitive_packaging BOOLEAN DEFAULT FALSE, -- TRUE untuk varian Original
  pirt_number TEXT DEFAULT 'P-IRT Terdaftar Resmi',
  is_halal_certified BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCT VARIANTS TABLE (Ukuran 200g, 250g, 500g, 2000g, Eceran)
CREATE TABLE product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  size_label TEXT NOT NULL, -- 'Eceran', '200g', '250g', '500g', 'Bal 2kg'
  weight_grams INTEGER NOT NULL,
  base_price NUMERIC NOT NULL,     -- Harga dasar ke produsen Cimoring
  web_price NUMERIC NOT NULL,      -- Harga jual eceran web (<= shopee_price)
  shopee_price NUMERIC NOT NULL,   -- Harga referensi Shopee untuk perbandingan
  reseller_price NUMERIC NOT NULL, -- Harga khusus Reseller tanpa minimal order
  stock_qty INTEGER DEFAULT 20,
  is_ready_stock BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ORDERS TABLE (Mendukung 8 Tahap + POS Offline)
CREATE TABLE orders (
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
  reseller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referral_code_used TEXT,
  
  -- Pengiriman & Kemasan
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
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  net_profit_cimofood NUMERIC NOT NULL DEFAULT 0, -- Otomatis dihitung
  
  -- Pembayaran
  payment_method TEXT DEFAULT 'QRIS', -- 'QRIS', 'TRANSFER_BANK', 'TUNAI_POS'
  payment_proof_url TEXT,
  paid_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDER ITEMS TABLE
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE RESTRICT NOT NULL,
  product_name_snapshot TEXT NOT NULL,
  size_label_snapshot TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_base_price NUMERIC NOT NULL,
  unit_selling_price NUMERIC NOT NULL,
  subtotal_base NUMERIC NOT NULL,
  subtotal_selling NUMERIC NOT NULL
);

-- 7. GIVEAWAY CAMPAIGNS & PARTICIPANTS
CREATE TABLE giveaway_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  instagram_username TEXT NOT NULL,
  tiktok_username TEXT NOT NULL,
  shopee_username TEXT NOT NULL,
  Followed_all_proof_url TEXT,
  coupon_code TEXT UNIQUE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. Spesifikasi Halaman & Modul Antarmuka (UI/UX)

### 6.1 Sisi Publik / Pembeli (Mobile-First & Cepat)
1. **Hero & Trust Banner (`/`)**:
   * Menampilkan *value proposition* utama: *"Cimoring Asli Sejak 2017 – Renyah, Berizin PIRT & Bersertifikat Halal, Harga Lebih Hemat dari Marketplace, Garansi Kemasan Aman 4 Lapis"*.
2. **Katalog Interaktif & Filter Ukuran**:
   * Setiap kartu produk menampilkan pilihan *chip* ukuran (`200g`, `250g`, `500g`, `Bal 2kg`), indikator stok *real-time* (`Tersedia` hijau / `Habis` merah), harga coret Shopee vs Harga Web CimoFood, dan tombol tambah ke keranjang.
3. **Bagian Khusus Paket Hampers Lebaran & Promo Giveaway (`/giveaway`)**:
   * Katalog paket *bundling* oleh-oleh/Lebaran dan formulir pendaftaran *Giveaway* (wajib *follow* Instagram, TikTok, dan Shopee Cimoring).
4. **Keranjang & Checkout (`/checkout`)**:
   * Ringkasan pesanan, pilihan ekspedisi (Anteraja, J&T, JNE), input nama, nomor WhatsApp aktif, dan alamat lengkap.
   * Saat disubmit, sistem membuat `order_code`, menyimpan ke database dengan status `2_WAITING_STOCK_CONFIRMATION`, dan membuka WhatsApp Admin dengan pesan otomatis.
5. **Halaman Lacak Pesanan & Upload Bukti Bayar (`/track/[order_code]`)**:
   * Menampilkan *progress bar* visual **8 Tahap Pesanan**.
   * Saat status `3_WAITING_PAYMENT`, muncul gambar QRIS / Nomor Rekening dan form *upload* bukti pembayaran.
   * Saat status `6_PACKED_SOP_VERIFIED` dan `7_SHIPPED`, pembeli bisa melihat **Foto Bukti Kemasan 4 Lapis** paket mereka beserta nomor resi pengiriman.

### 6.2 Sisi Pengelola / Dasbor Admin (`/admin` – Laptop & Tablet First)
*Catatan Desain:* Gunakan ukuran tombol minimal tinggi `48px` (`h-12`), huruf yang jelas, *sidebar* tetap di kiri untuk layar Tablet/Laptop (`md:flex`), serta hindari *dropdown* kecil yang sulit ditekan dengan jari di layar tablet.
1. **Papan Kendali Pesanan 8 Tahap (`/admin/orders`)**:
   * Tampilan *Kanban* atau *Tab Filter* berdasarkan 8 tahapan status.
   * Tombol aksi cepat di setiap kartu pesanan: *Konfirmasi Stok & Input Ongkir* $\rightarrow$ *Verifikasi Pembayaran* $\rightarrow$ *Tandai Diambil dari Produsen* $\rightarrow$ *Checklist SOP Packing + Upload Foto Kemasan* $\rightarrow$ *Input Resi & Kirim WA*.
   * Jika pesanan berisi **Varian Original**, tampilkan *Alert Banner* kuning: *"PERHATIAN SOP: Pesanan ini berisi Varian Original (plastik tanpa bumbu lebih tipis). Jangan menekan kardus terlalu kencang agar tidak jepot!"*
2. **Kasir Cepat / POS Offline (`/admin/pos`)**:
   * Dirancang khusus untuk mencatat pembeli eceran yang datang langsung ke rumah produksi.
   * Tampilan grid tombol besar per varian & ukuran (termasuk eceran $\text{Rp}1.000$). Klik item $\rightarrow$ Klik "Bayar Tunai / QRIS" $\rightarrow$ Otomatis memotong stok dan langsung masuk ke laporan sebagai `8_COMPLETED` (`OFFLINE_POS`) hanya dalam 3 detik.
3. **Manajemen Stok Cepat (`/admin/inventory`)**:
   * Tabel seluruh varian rasa dan ukuran dengan tombol *toggle switch* besar (`Ready Stock` / `Habis`) dan tombol `+` / `-` jumlah stok yang nyaman ditekan di layar Tablet.
4. **Laporan Penjualan, Laba & Export Excel (`/admin/reports`)**:
   * Filter Harian, Mingguan, Bulanan, atau Musim Lebaran.
   * Menampilkan 4 kartu metrik utama: **Total Omzet Kotor**, **Total Setoran Harga Dasar ke Produsen Cimoring**, **Total Keuntungan Bersih CimoFood**, dan **Jumlah Kemasan Terjual**.
   * Tombol **"Download Laporan Excel (.xlsx)"** agar pemilik bisa langsung menyimpan file ke folder Google Drive Chimoring.

### 6.3 Sisi Reseller (`/reseller`)
1. **Katalog Harga Grosir Tanpa Minimal Order**: Begitu Reseller login, seluruh harga di katalog otomatis berubah menjadi `reseller_price`.
2. **Progres Target & Bonus Komisi**: Menampilkan *progress bar* penjualan bulanan Reseller terhadap target, lengkap dengan estimasi bonus/fee yang akan diterima dan kode *referral* siap bagikan.