# CimoFood – Platform E-Commerce Reseller & Sistem Operasional UMKM Cimoring

> **"CimoFood – Renyah, Pedas, Asli Sejak 2017"**  
> Platform toko online resmi (etalase digital), sistem manajemen pesanan 8-tahap dengan SOP Packing 4 Lapis, kasir pencatatan *offline* (Touch POS), serta portal mitra *reseller* tanpa minimal order untuk **UMKM Cimoring** (Berizin P-IRT Resmi & Bersertifikat Halal).

---

## Fitur Utama

1. **Storefront E-Commerce Mobile-First (`/`)**
   - Katalog interaktif **6 Varian Rasa Cimoring** (*Original Gurih Kencur, Pedas, Balado, Barbecue, Balado Asin, Ekstra Pedas Daun Jeruk*) dalam **4 Ukuran Kemasan** (`200g`, `250g`, `500g`, `Bal 2kg`) serta **2 Paket Hampers Lebaran**.
   - Perbandingan transparan Harga Web CimoFood vs Harga Marketplace ($P_{\text{web}} \le P_{\text{shopee}}$), indikator stok *real-time*, serta penanda khusus **Kemasan Ekstra Aman SOP Khusus** untuk varian *Original*.
   - **Slide-Over Cart Drawer** dengan kalkulasi otomatis berat, penghematan, dan biaya packing aman 4 lapis.

2. **Checkout Konfirmasi Stok Anti-Batal & Pelacakan 8 Tahap (`/checkout`, `/track`, `/track/[orderCode]`)**
   - Konfirmasi stok & ongkir via WhatsApp (`wa.me`) sebelum pembayaran.
   - Visualisasi **Timeline 8 Tahap Pesanan** lengkap dengan QRIS & Rekening Bank resmi, *upload* bukti pembayaran, tampilan **Foto Bukti Kemasan SOP 4 Lapis**, salin nomor resi, dan ulasan pembeli.

3. **Dasbor Admin Laptop & Tablet First (`/admin`)**
   - Dirancang khusus dengan **Sidebar Kiri + Sticky Topbar** dan tombol sentuh besar (`min-h-12` / `48px`):
     - **Tab 1 (`/admin/reports`)**: Ringkasan & Analitik Keuangan (4 KPI Card: *Total Omzet Kotor, Setoran Harga Dasar ke Produsen, Pendapatan Biaya Packing, Laba Bersih Tim CimoFood*) + **Export Laporan ke Excel (`.xlsx`) Multi-Sheet**.
     - **Tab 2 (`/admin/orders`)**: Manajemen Pesanan 8 Tahap, peringatan otomatis untuk pesanan berisi **Varian Original**, modal wajib **Checklist SOP 4 Lapis + Upload Foto Bukti Kemasan**, serta input Nomor Resi.
     - **Tab 3 (`/admin/pos`)**: Kasir Cepat / Touch POS Offline 1-Klik (termasuk tombol cepat *Eceran Warung/Rumah Rp1.000 – Rp5.000*) dengan metode bayar Tunai/QRIS.
     - **Tab 4 (`/admin/inventory`)**: Manajemen Stok 1 Detik (`+`/`-` & switch *Tersedia/Habis*) dan pengaturan **Harga 3 Tingkat** dengan peringatan otomatis apabila harga web melebihi harga Shopee.
     - **Tab 5 (`/admin/giveaway`)**: Manajemen Peserta Giveaway (Verifikasi & Undi Pemenang Beruntung) dan pantauan target Mitra Reseller.

4. **Portal Mitra Reseller (`/reseller`) & Kampanye Giveaway (`/giveaway`)**
   - Harga grosir Reseller aktif sejak pcs pertama tanpa minimal order, *Progress Bar* target bulanan, **Kalkulator Simulasi Komisi & Bonus 5%**, kode referral unik, dan **Marketing Kit Foto Promosi HD Siap Unduh**.
   - Halaman Giveaway interaktif dengan checklist 3 tugas follow (`@cimoring` di Instagram, TikTok, dan Shopee) serta klaim **Nomor Kupon Undian (`GWCIMO-2026-XXXX`)** dengan animasi *confetti*.

---

## Cara Menjalankan Proyek

```bash
# 1. Instal dependensi
npm install

# 2. Jalankan server pengembangan (http://localhost:3000)
npm run dev

# 3. Buat build produksi
npm run build
npm run start
```

### Konfigurasi Database (Dual-Mode Smart Fallback)
- **Mode Instan (Tanpa Konfigurasi Tambahan)**: Jika `.env.local` belum diisi, aplikasi otomatis berjalan menggunakan **LocalStorage + Seed Data Lengkap** sehingga seluruh fitur dapat langsung diuji coba tanpa error.
- **Mode Supabase Cloud**: Salin `.env.example` menjadi `.env.local`, isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`, lalu jalankan skrip SQL pada `supabase/schema.sql` di SQL Editor Supabase Anda.
