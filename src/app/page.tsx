"use client";

import * as React from "react";
import Link from "next/link";
import {
  Flame,
  Gift,
  PackageCheck,
  PackageSearch,
  Search,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  CartDrawer,
  HampersSection,
  HeroTrustBar,
  ProductCard,
  StorefrontNavbar,
} from "@/components/storefront";
import {
  Badge,
  Button,
  Card,
  Modal,
  SensitivePackagingBadge,
  StockStatusBadge,
  useToast,
} from "@/components/ui";
import { getProductsWithVariants } from "@/lib/data-service";
import { formatRupiah } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import type { ProductWithVariants } from "@/types/database";

type CatalogCategoryFilter =
  | "ALL"
  | "SPICY"
  | "SAVORY"
  | "BAL_2KG"
  | "HAMPERS";

export default function HomePage() {
  const { showToast } = useToast();
  const addItem = useCartStore((s) => s.addItem);
  const isResellerMode = useCartStore((s) => s.isResellerMode);
  const setCartDrawerOpen = useCartStore((s) => s.setCartDrawerOpen);

  const [products, setProducts] = React.useState<ProductWithVariants[]>([]);
  const [categoryFilter, setCategoryFilter] =
    React.useState<CatalogCategoryFilter>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSopModalOpen, setIsSopModalOpen] = React.useState(false);
  const [activeProductDetail, setActiveProductDetail] =
    React.useState<ProductWithVariants | null>(null);

  const loadCatalog = React.useCallback(async () => {
    const list = await getProductsWithVariants({ includeHampers: true });
    setProducts(list);
  }, []);

  React.useEffect(() => {
    loadCatalog();
    const onDataUpdated = () => {
      loadCatalog();
    };
    window.addEventListener("cimofood-data-updated", onDataUpdated);
    return () =>
      window.removeEventListener("cimofood-data-updated", onDataUpdated);
  }, [loadCatalog]);

  const hampersProducts = React.useMemo(
    () => products.filter((p) => p.is_hampers),
    [products]
  );

  // Filter katalog berdasarkan tab kategori & kata kunci pencarian instan
  const filteredCatalogProducts = React.useMemo(() => {
    return products.filter((product) => {
      // Search query filter
      if (searchQuery.trim() !== "") {
        const q = searchQuery.trim().toLowerCase();
        const matchName = product.name.toLowerCase().includes(q);
        const matchFlavor = product.flavor_category.toLowerCase().includes(q);
        const matchDesc = product.description.toLowerCase().includes(q);
        if (!matchName && !matchFlavor && !matchDesc) return false;
      }

      // Category tab filter
      switch (categoryFilter) {
        case "SPICY":
          return !product.is_hampers && product.spicy_level >= 2;
        case "SAVORY":
          return !product.is_hampers && product.spicy_level <= 1;
        case "BAL_2KG":
          return (
            !product.is_hampers &&
            product.variants.some((v) => v.size_label === "Bal 2kg")
          );
        case "HAMPERS":
          return product.is_hampers;
        case "ALL":
        default:
          return !product.is_hampers;
      }
    });
  }, [products, categoryFilter, searchQuery]);

  const filterTabs: Array<{
    id: CatalogCategoryFilter;
    label: string;
    badge?: string;
  }> = [
    { id: "ALL", label: "Semua Varian (6 Rasa)" },
    { id: "SPICY", label: "Rasa Pedas 🔥" },
    { id: "SAVORY", label: "Rasa Gurih / Original" },
    { id: "BAL_2KG", label: "Ukuran Bal 2kg", badge: "Grosir" },
    { id: "HAMPERS", label: "Paket Hampers Lebaran", badge: "Spesial" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* 1. STICKY NAVBAR MODERN */}
      <StorefrontNavbar />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-14">
        {/* 2. HERO SECTION & TRUST BAR */}
        <HeroTrustBar onOpenSopModal={() => setIsSopModalOpen(true)} />

        {/* 3. KATALOG INTERAKTIF 6 VARIAN & 4 UKURAN */}
        <section id="katalog-cimoring" className="space-y-6 scroll-mt-24">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="spicy" size="sm">
                  Katalog Resmi UMKM Cimoring
                </Badge>
                {isResellerMode && (
                  <Badge variant="golden" size="sm" pulseDot>
                    Harga Khusus Mitra Reseller Aktif
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight mt-1.5">
                Pilih Varian Rasa & Ukuran Kemasan
              </h2>
              <p className="text-sm sm:text-base text-stone-600 mt-1">
                Klik pil ukuran (<strong>200g</strong>, <strong>250g</strong>,{" "}
                <strong>500g</strong>, atau <strong>Bal 2kg</strong>) pada kartu
                produk untuk melihat harga hemat dan stok real-time.
              </p>
            </div>

            {/* Instant Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari rasa (Pedas, Original, BBQ...)"
                className="w-full h-11 pl-10 pr-9 rounded-2xl border border-[#F3E8D6] bg-white text-sm text-stone-900 shadow-xs focus:outline-none focus:border-[#EA580C]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Bersihkan pencarian"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {filterTabs.map((tab) => {
              const isActive = categoryFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap border transition-all cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-[#EA580C] to-[#C2410C] text-white border-[#EA580C] shadow-md shadow-orange-600/20"
                      : "bg-white text-stone-700 border-[#F3E8D6] hover:border-orange-300 hover:text-[#EA580C]"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isActive
                          ? "bg-amber-300 text-stone-950"
                          : "bg-orange-100 text-[#C2410C]"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Product Cards Grid */}
          {filteredCatalogProducts.length === 0 ? (
            <Card
              surface="storefront"
              hoverElevation={false}
              className="p-10 text-center space-y-3"
            >
              <p className="text-base font-extrabold text-stone-900">
                Varian produk tidak ditemukan untuk pencarian &ldquo;
                {searchQuery}&rdquo;
              </p>
              <p className="text-xs text-stone-600">
                Silakan gunakan kata kunci lain atau tampilkan kembali seluruh
                varian rasa Cimoring.
              </p>
              <div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("ALL");
                  }}
                >
                  Tampilkan Semua Varian
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCatalogProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  forcedSizeLabel={
                    categoryFilter === "BAL_2KG" ? "Bal 2kg" : null
                  }
                  onViewDetail={(p) => setActiveProductDetail(p)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 4. SECTION KHUSUS HAMPERS LEBARAN & OLEH-OLEH */}
        <HampersSection hampersList={hampersProducts} />

        {/* PROMO GIVEAWAY & EKOSISTEM CIMOFOOD BANNER */}
        <section
          id="promo-giveaway"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 scroll-mt-24"
        >
          {/* Left: Giveaway Promo Card */}
          <Card
            surface="spicyHighlight"
            hoverElevation={false}
            className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6"
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="chili"
                  pulseDot
                  icon={<Sparkles className="h-3.5 w-3.5" />}
                >
                  Program Giveaway Resmi Cimoring
                </Badge>
                <Badge variant="golden" size="sm">
                  Kupon Undian Gratis
                </Badge>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-stone-900 leading-tight">
                Ikuti Giveaway Spesial CimoFood & Menangkan Paket Hampers Sultan!
              </h3>
              <p className="text-sm text-stone-700 leading-relaxed">
                Cukup ikuti akun resmi <strong>Instagram</strong>,{" "}
                <strong>TikTok</strong>, dan <strong>Shopee Cimoring</strong>{" "}
                untuk mendapatkan kupon undian berhadiah paket Cimoring gratis
                setiap bulan.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/giveaway">
                <Button
                  variant="chili"
                  size="lg"
                  leftIcon={<Gift className="h-5 w-5" />}
                >
                  Daftar Giveaway Sekarang
                </Button>
              </Link>
              <Link href="/reseller">
                <Button
                  variant="outline"
                  size="lg"
                  leftIcon={<Users className="h-5 w-5 text-[#EA580C]" />}
                >
                  Gabung Mitra Reseller (Tanpa Min. Order)
                </Button>
              </Link>
            </div>
          </Card>

          {/* Right: Quick Access to 8-Stage Order Tracking & Admin Portal */}
          <Card
            surface="storefront"
            hoverElevation={false}
            className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-5 bg-white"
          >
            <div className="space-y-2.5">
              <Badge variant="info" size="sm">
                Transparansi Operasional 8 Tahap
              </Badge>
              <h3 className="text-xl font-extrabold text-stone-900">
                Pantau Pesanan & Bukti Foto Kemasan 4 Lapis Secara Real-Time
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Sudah memesan? Lacak progres pesanan Anda mulai dari konfirmasi
                stok, unggah bukti bayar QRIS, lihat{" "}
                <strong>foto bukti kemasan 4 lapis</strong>, hingga nomor resi
                ekspedisi.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <Link href="/track" className="w-full">
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  leftIcon={<PackageSearch className="h-4 w-4" />}
                >
                  Lacak Pesanan
                </Button>
              </Link>
              <Link href="/login" className="w-full">
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  leftIcon={<Users className="h-4 w-4" />}
                >
                  Masuk Mitra / Admin
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      </main>

      {/* Storefront Footer */}
      <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 py-10 px-4 sm:px-6 mt-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-stone-800">
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#EA580C] to-[#DC2626] flex items-center justify-center text-white">
                <Flame className="h-5 w-5 fill-amber-200" />
              </div>
              <span className="text-xl font-black text-white">
                Cimo<span className="text-[#EA580C]">Food</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-md">
              Platform e-commerce resmi & portal kemitraan reseller untuk produsen
              tunggal <strong>UMKM Cimoring (Berdiri Sejak 2017)</strong>.
              Renyah, pedas nikmat, harga jujur bebas komisi marketplace, dan
              pengemasan aman SOP 4 Lapis.
            </p>
          </div>

          <div className="md:col-span-4 space-y-2 text-xs sm:text-sm">
            <h4 className="font-extrabold text-white uppercase tracking-wider text-xs">
              Jaminan Resmi UMKM Cimoring
            </h4>
            <ul className="space-y-1.5 text-stone-400">
              <li>• Izin Edar Resmi: P-IRT 2063205011245-27</li>
              <li>• 100% Bersertifikat Halal Indonesia</li>
              <li>• Garansi Packing 4 Lapis + Bukti Foto Kemasan</li>
              <li>• Ekspedisi Resmi: Anteraja, J&amp;T Express, JNE</li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-2 text-xs sm:text-sm">
            <h4 className="font-extrabold text-white uppercase tracking-wider text-xs">
              Navigasi Cepat
            </h4>
            <ul className="space-y-1.5 text-stone-400">
              <li>
                <a href="#katalog-cimoring" className="hover:text-amber-400">
                  Katalog 6 Varian Rasa
                </a>
              </li>
              <li>
                <a href="#hampers-lebaran" className="hover:text-amber-400">
                  Paket Hampers Lebaran
                </a>
              </li>
              <li>
                <Link href="/track" className="hover:text-amber-400">
                  Lacak Pesanan 8 Tahap
                </Link>
              </li>
              <li>
                <Link href="/reseller" className="hover:text-amber-400">
                  Portal Mitra Reseller
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-amber-400">
                  Masuk Akun Mitra / Admin
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <span>
            © 2026 CimoFood × UMKM Cimoring (Sejak 2017). Seluruh hak cipta
            dilindungi.
          </span>
          <span>Kemasan Aman SOP 4 Lapis • P-IRT &amp; Halal Resmi</span>
        </div>
      </footer>

      {/* 5. SLIDE-OVER CART DRAWER */}
      <CartDrawer />

      {/* MODAL: SOP 4 LAPIS ANTI-REMUK */}
      <Modal
        isOpen={isSopModalOpen}
        onClose={() => setIsSopModalOpen(false)}
        title="Garansi Kemasan Aman SOP 4 Lapis CimoFood"
        description="Standar pengemasan wajib tim CimoFood agar kerenyahan Cimoring tetap utuh sampai di rumah Anda."
        size="lg"
        footer={
          <Button
            variant="primary"
            leftIcon={<PackageCheck className="h-4 w-4" />}
            onClick={() => setIsSopModalOpen(false)}
          >
            Mengerti, Lanjut Belanja
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl bg-amber-50 border border-amber-300 p-4 text-amber-950 text-xs sm:text-sm space-y-1">
            <p className="font-extrabold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-[#C2410C]" />
              Perhatian Khusus Varian Original (SOP Anti-Jepot):
            </p>
            <p className="leading-relaxed">
              Varian Original tidak memiliki lapisan minyak bumbu sehingga
              plastik kemasannya terasa lebih tipis dan rawan jepot (terbuka)
              jika kardus ditekan terlalu kencang. Sistem CimoFood mewajibkan
              checklist khusus dan <strong>unggah foto bukti kemasan</strong>{" "}
              sebelum paket dikirim!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                title: "1. Segel Mesin Sealer Kedap Udara",
                desc: "Menjaga kerenyahan cimol kering agar tidak masuk angin selama pengiriman.",
              },
              {
                title: "2. Apit Kardus Kanan & Kiri",
                desc: "Melindungi sisi kemasan dengan tekanan terukur agar kantong Original tidak tertekan berlebih.",
              },
              {
                title: "3. Sabuk Kardus Melingkar Kokoh",
                desc: "Membentuk struktur kotak pelindung yang tahan tumpukan paket ekspedisi.",
              },
              {
                title: "4. Lapisan Bubble Wrap + Bukti Foto",
                desc: "Meredam benturan kurir dan difoto langsung ke halaman Lacak Pesanan Anda.",
              },
            ].map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-stone-200 p-4 bg-[#FAF8F5]"
              >
                <p className="font-extrabold text-sm text-[#C2410C]">
                  {step.title}
                </p>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* MODAL: DETAIL PRODUK & TABEL PERBANDINGAN 4 UKURAN */}
      <Modal
        isOpen={Boolean(activeProductDetail)}
        onClose={() => setActiveProductDetail(null)}
        title={activeProductDetail?.name || "Detail Produk Cimoring"}
        description={`${activeProductDetail?.pirt_number} • 100% Bersertifikat Halal`}
        size="lg"
        footer={
          <Button
            variant="outline"
            onClick={() => setActiveProductDetail(null)}
          >
            Tutup
          </Button>
        }
      >
        {activeProductDetail && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <img
                src={activeProductDetail.image_url}
                alt={activeProductDetail.name}
                className="w-full sm:w-40 h-40 rounded-2xl object-cover border border-stone-200 shrink-0"
              />
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="spicy" size="sm">
                    Rasa {activeProductDetail.flavor_category}
                  </Badge>
                  {activeProductDetail.is_sensitive_packaging && (
                    <SensitivePackagingBadge label="Kemasan Ekstra Aman SOP Khusus" />
                  )}
                </div>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                  {activeProductDetail.description}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-orange-50 text-stone-800 font-extrabold">
                  <tr>
                    <th className="p-3">Ukuran</th>
                    <th className="p-3">Harga Web</th>
                    <th className="p-3">Harga Marketplace</th>
                    <th className="p-3">Harga Reseller</th>
                    <th className="p-3">Status Stok</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {activeProductDetail.variants.map((v) => (
                    <tr key={v.id} className="hover:bg-orange-50/40">
                      <td className="p-3 font-extrabold text-stone-900">
                        {v.size_label} ({v.weight_grams}g)
                      </td>
                      <td className="p-3 font-black text-[#EA580C]">
                        {formatRupiah(v.web_price)}
                      </td>
                      <td className="p-3 text-stone-400 line-through">
                        {formatRupiah(v.shopee_price)}
                      </td>
                      <td className="p-3 font-bold text-amber-900">
                        {formatRupiah(v.reseller_price)}
                      </td>
                      <td className="p-3">
                        <StockStatusBadge
                          isReady={v.is_ready_stock}
                          stockQty={v.stock_qty}
                          showCount={false}
                        />
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={!v.is_ready_stock || v.stock_qty <= 0}
                          leftIcon={<ShoppingBag className="h-3.5 w-3.5" />}
                          onClick={() => {
                            addItem(activeProductDetail, v, 1);
                            showToast({
                              type: "spicy",
                              title: `+1 ${activeProductDetail.name} (${v.size_label})`,
                              description: "Berhasil ditambahkan ke keranjang.",
                            });
                            setActiveProductDetail(null);
                            setCartDrawerOpen(true);
                          }}
                        >
                          + Keranjang
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
