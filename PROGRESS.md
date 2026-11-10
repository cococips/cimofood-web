# PROGRESS PENGEMBANGAN CIMOFOOD
> **Single Source of Truth:** `PRD.md` & `GEMINI.md`  
> **Brand Tagline:** *"CimoFood – Renyah, Pedas, Asli Sejak 2017"*

---

## Ringkasan Status Fase

| Fase | Nama Fase | Status | Tanggal Selesai |
| :--- | :--- | :--- | :--- |
| **Fase 1** | Pondasi Arsitektur, Design System Profesional, & Backend Schema | **SELESAI (100%)** | 10 November 2026 |
| **Fase 2** | Storefront E-Commerce Profesional & Pengalaman Belanja Pembeli | **SELESAI (100%)** | 10 November 2026 |
| **Fase 3** | Alur Pesanan 8 Tahap, Konfirmasi WhatsApp, Pembayaran QRIS, & Pelacakan | **SELESAI (100%)** | 10 November 2026 |
| **Fase 4** | Dasbor Admin Laptop/Tablet-First, Kasir POS Offline, Manajemen Stok, & Laporan Keuangan | **SELESAI (100%)** | 10 November 2026 |
| **Fase 5** | Portal Reseller Tanpa Minimal Order, Target Bonus, & Halaman Giveaway | **SELESAI (100%)** | 10 November 2026 |

---

## Detail Penyelesaian Fase 5

### 1. Portal Reseller Tanpa Minimal Order (`src/app/reseller/page.tsx`)
- **Value Proposition Utama**: Menonjolkan *"Harga Grosir Reseller Sejak Pcs Pertama Tanpa Minimal Order!"*, dilengkapi switcher simulasi login akun mitra aktif (`RINACIMO`, `DEDIKRIUK`, `SITIHOT`) dan modal pendaftaran Mitra Reseller baru gratis (`registerNewReseller`).
- **Progress Bar Target Penjualan Bulanan & Kalkulator Komisi/Bonus Otomatis**:
  - Menampilkan *progress bar* penjualan bulanan terhadap target, serta informasi otomatis berapa **Rupiah** dan berapa **pcs (bungkus)** lagi untuk mencapai bonus target `5%` dari Cimoring.
  - Dilengkapi **Kalkulator Simulasi Komisi & Laba Bulanan** interaktif (pilih ukuran `200g`/`250g`/`500g`/`Bal 2kg` dan geser slider target harian untuk menghitung otomatis Laba Jual Eceran + Bonus Target 5%).
- **Katalog Khusus Harga Reseller & Kode Referral Unik**:
  - Menampilkan seluruh produk dengan `reseller_price` aktif, perbandingan margin keuntungan jual kembali per pcs, serta kartu salin & bagikan **Kode Referral Unik** ke WhatsApp.
- **Kumpulan Materi Foto Promosi Produk Siap Unduh (Marketing Kit Reseller)**:
  - Menyediakan kartu materi foto promosi HD beserta tombol **"Unduh Foto HD"** dan **"Salin Teks Iklan"** (otomatis menyertakan kode referral mitra).

### 2. Halaman Kampanye Giveaway (`src/app/giveaway/page.tsx`) & Tab Admin Khusus (`/admin/giveaway`)
- **Checklist Interaktif 3 Tugas Peserta**:
  1. Follow Instagram `@cimoring`
  2. Follow TikTok `@cimoring`
  3. Follow Shopee Cimoring
- **Klaim Nomor Kupon Undian & Animasi Confetti**:
  - Setelah ketiga tugas dicentang dan peserta mengisi **Nama & Nomor WhatsApp**, sistem menghasilkan **Nomor Kupon Undian / Voucher Diskon (`GWCIMO-2026-XXXX`)** disertai selebrasi `canvas-confetti`.
- **Sinkronisasi Otomatis ke Tab Khusus di `/admin` (`/admin/giveaway`)**:
  - Data peserta otomatis masuk ke **Tab 5: Peserta Giveaway & Reseller** di Dasbor Admin (`src/components/admin/admin-dashboard.tsx`), lengkap dengan fitur **Verifikasi Peserta** (`toggleVerifyGiveawayParticipant`), **Undi Pemenang Giveaway Beruntung** dengan confetti, dan tombol hubungi pemenang via WhatsApp.

---

## Detail Penyelesaian Fase 4

### 1. Layout Sidebar + Sticky Topbar (Laptop & Tablet First) (`src/components/admin/admin-dashboard.tsx`)
- Dirancang dengan pendekatan **Laptop & Tablet First** (`#F8FAFC`), **Left Sidebar** tetap + **Sticky Topbar** dengan ukuran tombol minimal **`h-12` (`48px`)** hingga `h-16`.

### 2. Tab 1: Ringkasan & Analitik Keuangan (`/admin` & `/admin/reports`)
- **Empat KPI Card Utama**: *Total Omzet Kotor*, *Total Setoran Harga Dasar ke Produsen Cimoring (Modal)*, *Total Pendapatan Biaya Packing*, dan *Laba Bersih Tim CimoFood (Markup/Ujrah)*.
- Filter periode laporan (*Hari Ini*, *Minggu Ini*, *Bulan Ini*, *Semua*) + tombol **"Export Laporan ke Excel (.xlsx)"** Multi-Sheet.

### 3. Tab 2: Manajemen Pesanan (8 Tahap Workflow) (`/admin/orders`)
- Peringatan kuning otomatis untuk pesanan yang mengandung **Varian Original**, input Ongkir & kirim tagihan WA, pratinjau bukti bayar & verifikasi lunas, setoran tunai produsen, modal wajib checklist SOP 4 Lapis + upload foto bukti kemasan, serta input Nomor Resi.

### 4. Tab 3: Kasir Cepat / POS Offline (`/admin/pos`)
- Antarmuka **Touch POS** untuk mencatat pembeli eceran rumah produksi dengan tombol **"Simpan Transaksi Instan (1-Klik)"** (Tunai/QRIS) yang langsung memotong stok dan masuk ke laporan keuangan.

### 5. Tab 4: Manajemen Stok & Harga 3 Tingkat (`/admin/inventory`)
- Kontrol cepat stok harian (`+` / `-` besar & switch **"✓ Tersedia / ✕ Habis"**) serta pengaturan Harga 3 Tingkat dengan **indikator peringatan otomatis** jika harga web melebihi harga Shopee.

---

## Daftar File yang Dibuat / Diubah

### Fase 5
- `src/app/reseller/page.tsx` — Portal Reseller Tanpa Minimal Order, Progress Bar Target, Kalkulator Komisi/Bonus, Katalog Harga Reseller, & Marketing Kit Foto Promosi Siap Unduh
- `src/app/giveaway/page.tsx` — Halaman Kampanye Giveaway 3 Tugas Follow `@cimoring`, Klaim Nomor Kupon Undian & Confetti
- `src/app/admin/giveaway/page.tsx` — Rute langsung ke Tab Peserta Giveaway & Reseller di Dasbor Admin
- `src/components/admin/admin-dashboard.tsx` — Penambahan Tab 5 (`giveaway`): Manajemen Peserta Giveaway (Verifikasi & Undi Pemenang) & Tabel Mitra Reseller
- `src/lib/data-service.ts` — Penambahan `registerNewReseller` dan `toggleVerifyGiveawayParticipant`
- `PROGRESS.md` — Pencatatan penyelesaian Fase 5 (100% Selesai)

### Fase 1 – Fase 4
- `package.json`, `next.config.ts`, `tailwind.config.ts`, `.env.example`, `supabase/schema.sql`
- `src/types/database.ts`, `src/lib/utils.ts`, `src/lib/supabase.ts`, `src/lib/seed-data.ts`, `src/store/cart-store.ts`
- `src/components/ui/` (`button.tsx`, `badge.tsx`, `card.tsx`, `modal.tsx`, `toast.tsx`, `index.ts`)
- `src/components/storefront/` (`navbar.tsx`, `hero-trust-bar.tsx`, `product-card.tsx`, `hampers-section.tsx`, `cart-drawer.tsx`, `index.ts`)
- `src/app/page.tsx`, `src/app/checkout/page.tsx`, `src/app/track/page.tsx`, `src/app/track/[orderCode]/page.tsx`
- `src/app/admin/page.tsx`, `src/app/admin/orders/page.tsx`, `src/app/admin/pos/page.tsx`, `src/app/admin/inventory/page.tsx`, `src/app/admin/reports/page.tsx`
