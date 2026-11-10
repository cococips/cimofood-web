"use client";

import * as React from "react";
import Link from "next/link";
import {
  Award,
  Calculator,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Handshake,
  Image as ImageIcon,
  LogIn,
  LogOut,
  MessageCircle,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { CartDrawer, StorefrontNavbar } from "@/components/storefront";
import {
  Badge,
  Button,
  Card,
  SensitivePackagingBadge,
  StockStatusBadge,
  useToast,
} from "@/components/ui";
import { getProductsWithVariants, getResellers } from "@/lib/data-service";
import { formatRupiah } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import type {
  ProductVariant,
  ProductWithVariants,
  Reseller,
} from "@/types/database";

const PROMO_MEDIA_KIT = [
  {
    id: "kit-pedas-jeruk",
    title: "Poster Promo Cimoring Pedas Daun Jeruk (Best Seller)",
    badge: "Foto Katalog HD",
    imageUrl:
      "https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=900&q=80",
    caption:
      "🔥 CIMORING PEDAS DAUN JERUK ASLI SEJAK 2017! 🔥\nRenyah kriuknya bikin nagih, wangi daun jeruk asli, sudah P-IRT & Halal Resmi! Dikemas aman 4 lapis anti-remuk. Yuk pesan sekarang atau pakai kode voucher saya biar dapat diskon tambahan!",
  },
  {
    id: "kit-original-kencur",
    title: "Materi Story WA Cimoring Original Gurih Kencur",
    badge: "Cocok untuk Anak & Keluarga",
    imageUrl:
      "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=900&q=80",
    caption:
      "✨ GURIH RENYAH TANPA PEDAS: CIMORING ORIGINAL KENCUR ✨\nCamilan favorit keluarga & anak-anak! Gurih rempah kencur asli sejak 2017, tanpa pengawet, dan dikemas dengan SOP Ekstra Aman 4 Lapis. Ready stock ukuran 200g, 250g, 500g, hingga Bal 2kg!",
  },
  {
    id: "kit-hampers-sultan",
    title: "Banner Paket Hampers Lebaran & Oleh-Oleh Keluarga",
    badge: "Edisi Spesial Hampers",
    imageUrl:
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=80",
    caption:
      "🎁 BINGUNG CARI HAMPERS & OLEH-OLEH YANG PASTI DISUKAI SEMUA ORANG? 🎁\nPaket Hampers Cimoring CimoFood hadir dengan boks eksklusif + Gratis Kartu Ucapan Kustom + Garansi Packing 4 Lapis Anti-Remuk! Pesan sekarang sebelum kehabisan kuota!",
  },
];

const RESELLER_TESTIMONIALS = [
  {
    name: "Teh Rina Kartika",
    city: "Bandung",
    tier: "Reseller Aktif",
    quote:
      "Enaknya jadi mitra CimoFood itu tanpa minimal order! Kalau ada tetangga pesan 2 bungkus pun tetap dikasih harga grosir reseller, dan kemasannya rapi 4 lapis tidak pernah remuk.",
    monthlySales: "Rp1.450.000 / bulan",
  },
  {
    name: "Neng Siti Nurhaliza",
    city: "Tasikmalaya",
    tier: "Reseller Sultan",
    quote:
      "Kode referral unik sangat membantu! Teman-teman kantor tinggal checkout sendiri pakai kode saya dapat diskon Rp2.000, dan omzet bulanan saya otomatis bertambah sampai tembus bonus 5%.",
    monthlySales: "Rp2.850.000 / bulan",
  },
  {
    name: "Kang Dedi Pratama",
    city: "Cimahi",
    tier: "Mitra Reseller",
    quote:
      "Materi foto promosi dan teks iklannya sudah disiapkan lengkap. Tinggal unduh dan pasang di Status WhatsApp tiap pagi, pesanan mengalir terus.",
    monthlySales: "Rp920.000 / bulan",
  },
];

export default function ResellerPortalPage() {
  const { showToast } = useToast();
  const addItem = useCartStore((s) => s.addItem);
  const setResellerMode = useCartStore((s) => s.setResellerMode);
  const setReferralCode = useCartStore((s) => s.setReferralCode);

  const role = useAuthStore((s) => s.role);
  const authReseller = useAuthStore((s) => s.reseller);
  const updateActiveReseller = useAuthStore((s) => s.updateActiveReseller);
  const logout = useAuthStore((s) => s.logout);

  const [mounted, setMounted] = React.useState(false);
  const [resellers, setResellers] = React.useState<Reseller[]>([]);
  const [products, setProducts] = React.useState<ProductWithVariants[]>([]);
  const [selectedVariants, setSelectedVariants] = React.useState<
    Record<string, string>
  >({});
  const [copiedCode, setCopiedCode] = React.useState(false);

  // Kalkulator Komisi & Bonus Otomatis State
  const [calcPacksPerDay, setCalcPacksPerDay] = React.useState(5);
  const [calcSizeType, setCalcSizeType] = React.useState<
    "200g" | "250g" | "500g" | "Bal 2kg"
  >("250g");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = React.useCallback(async () => {
    const [resellerList, productList] = await Promise.all([
      getResellers(),
      getProductsWithVariants({ includeHampers: true, activeOnly: true }),
    ]);
    setResellers(resellerList);
    setProducts(productList);

    const defaultMap: Record<string, string> = {};
    for (const p of productList) {
      const def =
        p.variants.find((v) => v.size_label === "250g") || p.variants[0];
      if (def) defaultMap[p.id] = def.id;
    }
    setSelectedVariants((prev) => ({ ...defaultMap, ...prev }));
  }, []);

  React.useEffect(() => {
    loadData();
    const onUpdated = () => loadData();
    window.addEventListener("cimofood-data-updated", onUpdated);
    return () => window.removeEventListener("cimofood-data-updated", onUpdated);
  }, [loadData]);

  // Sinkronkan data terbaru reseller yang sedang login
  const activeReseller = React.useMemo(() => {
    if (role === "reseller" && authReseller) {
      return (
        resellers.find(
          (r) =>
            r.id === authReseller.id ||
            r.referral_code.toUpperCase() ===
              authReseller.referral_code.toUpperCase()
        ) || authReseller
      );
    }
    if (role === "admin") {
      return authReseller || resellers[0] || null;
    }
    return null;
  }, [role, authReseller, resellers]);

  React.useEffect(() => {
    if (mounted && role === "reseller" && activeReseller) {
      updateActiveReseller(activeReseller);
    }
  }, [mounted, role, activeReseller, updateActiveReseller]);

  const handleCopyReferral = async () => {
    if (!activeReseller) return;
    try {
      await navigator.clipboard.writeText(activeReseller.referral_code);
      setCopiedCode(true);
      showToast({
        type: "success",
        title: "Kode Referral Disalin!",
        description: `Kode ${activeReseller.referral_code} siap dibagikan ke pelanggan atau grup WhatsApp.`,
      });
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleAddWholesaleItem = (
    product: ProductWithVariants,
    variant: ProductVariant
  ) => {
    setResellerMode(true);
    if (activeReseller) {
      setReferralCode(activeReseller.referral_code);
    }
    addItem(product, variant, 1);
    showToast({
      type: "success",
      title: "Harga Reseller Masuk Keranjang!",
      description: `${product.name} (${variant.size_label}) seharga ${formatRupiah(variant.reseller_price)} ditambahkan.`,
    });
  };

  const handleDownloadPromoImage = (title: string, imageUrl: string) => {
    window.open(imageUrl, "_blank", "noopener,noreferrer");
    showToast({
      type: "success",
      title: "Membuka File Foto Promosi HD",
      description: `${title} siap disimpan ke galeri HP/Laptop Anda.`,
    });
  };

  const handleCopyCaption = async (title: string, caption: string) => {
    const fullCaption = activeReseller
      ? `${caption}\n\n🏷️ Kode Voucher Diskon Rp2.000: ${activeReseller.referral_code}`
      : caption;
    try {
      await navigator.clipboard.writeText(fullCaption);
      showToast({
        type: "info",
        title: "Caption Promosi + Kode Referral Disalin!",
        description: `Teks promosi "${title}" siap ditempel ke WhatsApp Status atau Instagram.`,
      });
    } catch {
      // ignore
    }
  };

  const progressPercentage = activeReseller
    ? Math.min(
        100,
        Math.round(
          (activeReseller.current_month_sales /
            Math.max(1, activeReseller.monthly_target_amount)) *
            100
        )
      )
    : 0;

  const estimatedBonus = activeReseller
    ? Math.round(
        (activeReseller.current_month_sales * activeReseller.bonus_percentage) /
          100
      )
    : 0;

  const remainingTargetRupiah = activeReseller
    ? Math.max(
        0,
        activeReseller.monthly_target_amount -
          activeReseller.current_month_sales
      )
    : 0;

  // Rata-rata harga reseller 250g = Rp12.000 untuk estimasi berapa pcs lagi mencapai target
  const remainingTargetPcs = Math.ceil(remainingTargetRupiah / 12000);

  // Kalkulator simulasi komisi & keuntungan bulanan
  const calcPricingMap: Record<
    "200g" | "250g" | "500g" | "Bal 2kg",
    { reseller: number; retail: number }
  > = {
    "200g": { reseller: 9500, retail: 12000 },
    "250g": { reseller: 12000, retail: 15000 },
    "500g": { reseller: 21000, retail: 26000 },
    "Bal 2kg": { reseller: 39000, retail: 47000 },
  };
  const selectedCalcSpec = calcPricingMap[calcSizeType];
  const monthlyPacksSimulated = calcPacksPerDay * 30;
  const monthlySimulatedOmzet =
    monthlyPacksSimulated * selectedCalcSpec.reseller;
  const monthlyDirectMargin =
    monthlyPacksSimulated *
    (selectedCalcSpec.retail - selectedCalcSpec.reseller);
  const monthlyTargetBonus =
    monthlySimulatedOmzet >= (activeReseller?.monthly_target_amount || 1000000)
      ? Math.round(
          (monthlySimulatedOmzet * (activeReseller?.bonus_percentage || 5)) /
            100
        )
      : 0;
  const totalSimulatedIncome = monthlyDirectMargin + monthlyTargetBonus;

  const isPartnerAuthenticated =
    mounted && (role === "reseller" || role === "admin") && activeReseller;

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBEB] text-stone-900">
      <StorefrontNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
        {/* ====================================================================
            VIEW 1: GUEST (BELUM LOGIN) -> LANDING PAGE KEMITRAAN RESELLER
           ==================================================================== */}
        {!isPartnerAuthenticated ? (
          <>
            {/* HERO LANDING KEMITRAAN RESELLER */}
            <div className="rounded-3xl bg-gradient-to-br from-stone-950 via-[#9A3412] to-[#EA580C] text-white p-6 sm:p-10 lg:p-12 shadow-xl relative overflow-hidden">
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-xs font-extrabold">
                    <Handshake className="h-4 w-4 text-amber-300" />
                    <span>PROGRAM KEMITRAAN RESMI UMKM CIMORING (SEJAK 2017)</span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                    Harga Grosir Reseller{" "}
                    <span className="text-amber-300 underline decoration-amber-400/50">
                      Sejak Pcs Pertama Tanpa Minimal Order!
                    </span>
                  </h1>
                  <p className="text-sm sm:text-base text-orange-100 leading-relaxed max-w-2xl">
                    Mulai usaha camilan laris tanpa risiko stok menumpuk. Pesan{" "}
                    <strong className="text-white">1 bungkus pun</strong> tetap
                    mendapatkan{" "}
                    <strong className="text-amber-300">
                      Harga Grosir Reseller
                    </strong>
                    , gratis biaya pendaftaran, dikemas dengan{" "}
                    <strong className="text-white">
                      SOP 4 Lapis Anti-Remuk
                    </strong>
                    , serta berhak atas{" "}
                    <strong className="text-amber-300">
                      Bonus Target Bulanan 5%
                    </strong>
                    !
                  </p>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <Link href="/login?tab=register">
                      <Button
                        variant="golden"
                        size="lg"
                        leftIcon={<UserPlus className="h-5 w-5" />}
                      >
                        Daftar Jadi Reseller Sekarang (Gratis)
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button
                        variant="outline"
                        size="lg"
                        leftIcon={<LogIn className="h-5 w-5" />}
                        className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                      >
                        Masuk Akun Reseller
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Highlight Benefit Summary Card */}
                <div className="lg:col-span-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                      Keunggulan Eksklusif Mitra CimoFood
                    </span>
                    <Badge variant="golden" size="sm">
                      100% Tanpa Modal Awal
                    </Badge>
                  </div>

                  <ul className="space-y-3 text-xs sm:text-sm text-orange-50">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
                      <span>
                        <strong>Tanpa Minimal Order:</strong> Beli satuan atau
                        partai besar (Bal 2kg) langsung dipotong ke harga
                        grosir.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
                      <span>
                        <strong>Kode Referral Diskon Rp2.000:</strong> Pelanggan
                        Anda dapat potongan harga, omzet bulanan Anda otomatis
                        tercatat.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
                      <span>
                        <strong>Bonus Target Bulanan 5%:</strong> Tambahan
                        komisi tunai dari Cimoring setiap mencapai target omzet
                        bulanan.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
                      <span>
                        <strong>Marketing Kit Siap Pakai:</strong> Foto katalog
                        HD &amp; teks promosi WhatsApp siap unduh setelah login.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 4 PILAR KEUNTUNGAN KEMITRAAN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  badge: "Margin Langsung",
                  title: "Untung Rp2.500 - Rp16.000 / Kemasan",
                  desc: "Harga khusus reseller jauh lebih hemat dibanding harga eceran web maupun marketplace.",
                },
                {
                  badge: "Skema Komisi 5%",
                  title: "Bonus Target Penjualan Bulanan",
                  desc: "Capai akumulasi penjualan bulanan Rp1.000.000 dan cairkan bonus tambahan 5% langsung dari produsen.",
                },
                {
                  badge: "Garansi Kualitas",
                  title: "SOP Packing 4 Lapis + Bukti Foto",
                  desc: "Aman dikirim ke luar kota dengan segel sealer, apit kardus, sabuk kardus, dan bubble wrap.",
                },
                {
                  badge: "Legalitas Lengkap",
                  title: "P-IRT & Sertifikat Halal Resmi",
                  desc: "Produk asli UMKM Cimoring sejak 2017 yang mudah dijual ke keluarga, kantor, maupun toko oleh-oleh.",
                },
              ].map((item) => (
                <Card
                  key={item.title}
                  className="p-5 bg-white border border-amber-200 space-y-2"
                >
                  <Badge variant="spicy" size="sm">
                    {item.badge}
                  </Badge>
                  <h3 className="text-base font-black text-stone-900">
                    {item.title}
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {item.desc}
                  </p>
                </Card>
              ))}
            </div>

            {/* KALKULATOR SIMULASI KEUNTUNGAN UNTUK CALON MITRA */}
            <Card className="p-6 sm:p-8 bg-white border-2 border-amber-300 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-200/80 pb-4">
                <div className="space-y-1">
                  <Badge variant="spicy" size="md">
                    Simulasi Potensi Penghasilan Mitra
                  </Badge>
                  <h2 className="text-xl sm:text-2xl font-black text-stone-900 flex items-center gap-2">
                    <Calculator className="h-6 w-6 text-[#EA580C]" />
                    <span>
                      Hitung Sendiri Potensi Laba &amp; Bonus Bulanan Anda
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600">
                    Geser simulasi penjualan harian di bawah ini untuk melihat
                    estimasi <strong>Laba Selisih Eceran</strong> +{" "}
                    <strong>Bonus Target 5%</strong>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-6 space-y-5">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-stone-700 mb-2">
                      1. Pilih Ukuran Kemasan yang Dijual:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["200g", "250g", "500g", "Bal 2kg"] as const).map(
                        (sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setCalcSizeType(sz)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                              calcSizeType === sz
                                ? "bg-[#EA580C] text-white border-[#EA580C] shadow-sm"
                                : "bg-amber-50 text-stone-700 border-amber-200 hover:border-[#EA580C]"
                            }`}
                          >
                            {sz}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold">
                      <span className="text-stone-700">
                        2. Target Penjualan per Hari:
                      </span>
                      <span className="text-lg font-black text-[#EA580C]">
                        {calcPacksPerDay} pcs / hari ({monthlyPacksSimulated}{" "}
                        pcs / bulan)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      value={calcPacksPerDay}
                      onChange={(e) =>
                        setCalcPacksPerDay(Number(e.target.value))
                      }
                      className="w-full accent-[#EA580C] cursor-pointer h-2.5 bg-amber-200 rounded-lg"
                    />
                    <div className="flex justify-between text-[11px] font-semibold text-stone-400">
                      <span>1 pcs/hari (Santai)</span>
                      <span>10 pcs/hari (Aktif)</span>
                      <span>30 pcs/hari (Sultan)</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                    <span className="text-[11px] font-bold uppercase text-stone-500 block">
                      Laba Jual Eceran
                    </span>
                    <p className="text-lg font-black text-stone-900 mt-1">
                      +{formatRupiah(monthlyDirectMargin)}
                    </p>
                    <span className="text-[11px] text-stone-500 mt-1 block">
                      Margin{" "}
                      {formatRupiah(
                        selectedCalcSpec.retail - selectedCalcSpec.reseller
                      )}{" "}
                      × {monthlyPacksSimulated} pcs
                    </span>
                  </div>

                  <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4">
                    <span className="text-[11px] font-bold uppercase text-[#C2410C] block">
                      Bonus Target (5%)
                    </span>
                    <p className="text-lg font-black text-[#EA580C] mt-1">
                      +{formatRupiah(monthlyTargetBonus)}
                    </p>
                    <span className="text-[11px] text-stone-500 mt-1 block">
                      {monthlyTargetBonus > 0
                        ? "Target Rp1 Juta Tercapai!"
                        : "Capai omzet Rp1 Juta untuk klaim"}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-emerald-600 text-white p-4 shadow-md">
                    <span className="text-[11px] font-extrabold uppercase text-emerald-100 block">
                      Total Potensi Penghasilan
                    </span>
                    <p className="text-xl font-black mt-1">
                      {formatRupiah(totalSimulatedIncome)}
                    </p>
                    <span className="text-[11px] text-emerald-100 mt-1 block">
                      Per bulan (Laba + Bonus)
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* TESTIMONI MITRA RESELLER AKTIF */}
            <section className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <Badge variant="golden" size="md">
                    Kisah Sukses Mitra CimoFood
                  </Badge>
                  <h2 className="text-2xl sm:text-3xl font-black text-stone-900 mt-1">
                    Dipercaya Ratusan Reseller di Berbagai Kota
                  </h2>
                </div>
                <Link href="/login?tab=register">
                  <Button
                    variant="primary"
                    size="md"
                    leftIcon={<UserPlus className="h-4 w-4" />}
                  >
                    Gabung Sekarang (Gratis)
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {RESELLER_TESTIMONIALS.map((t) => (
                  <Card
                    key={t.name}
                    className="p-6 bg-white flex flex-col justify-between space-y-4"
                  >
                    <p className="text-xs sm:text-sm text-stone-700 italic leading-relaxed">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-stone-900">
                          {t.name}
                        </p>
                        <p className="text-xs text-stone-500">
                          {t.city} • {t.tier}
                        </p>
                      </div>
                      <Badge variant="success" size="sm">
                        {t.monthlySales}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </>
        ) : (
          /* ====================================================================
             VIEW 2: LOGGED IN AS RESELLER / ADMIN -> DASBOR PRIBADI RESELLER
             ==================================================================== */
          <>
            {/* HEADER DASBOR PRIBADI MITRA RESELLER */}
            <div className="rounded-3xl bg-gradient-to-br from-stone-950 via-[#9A3412] to-[#EA580C] text-white p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 text-xs font-extrabold">
                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    <span>
                      SESI MITRA RESELLER AKTIF • HARGA GROSIR TERKUNCI OTOMATIS
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                    Selamat Datang, {activeReseller.full_name}! 👋
                  </h1>
                  <p className="text-xs sm:text-sm text-orange-100">
                    Domisili: {activeReseller.address} ({activeReseller.city}) •
                    Level Kemitraan:{" "}
                    <strong className="text-amber-300">
                      {activeReseller.tier_level}
                    </strong>{" "}
                    • Kode Referral:{" "}
                    <strong className="font-mono text-white">
                      {activeReseller.referral_code}
                    </strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a href="#katalog-grosir">
                    <Button
                      variant="golden"
                      size="md"
                      leftIcon={<ShoppingBag className="h-4 w-4" />}
                    >
                      Belanja Stok Harga Reseller
                    </Button>
                  </a>
                  <a href="#materi-promosi">
                    <Button
                      variant="outline"
                      size="md"
                      className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                    >
                      Unduh Media Promosi
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    size="md"
                    leftIcon={<LogOut className="h-4 w-4" />}
                    onClick={() => {
                      logout();
                      showToast({
                        type: "info",
                        title: "Berhasil Keluar Akun Mitra",
                        description:
                          "Sesi Anda telah ditutup dan kembali ke mode pengunjung publik.",
                      });
                    }}
                    className="bg-stone-900/70 text-stone-200 border-white/20 hover:bg-red-950 hover:text-white"
                  >
                    Keluar Akun
                  </Button>
                </div>
              </div>
            </div>

            {/* DASHBOARD PROGRES TARGET PENJUALAN BULANAN & KODE REFERRAL */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Progress Bar Target Penjualan Bulanan */}
              <Card className="lg:col-span-8 p-6 sm:p-7 space-y-5 border-2 border-orange-200 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <Badge variant="spicy" size="md">
                      Progress Target Penjualan Bulanan
                    </Badge>
                    <h2 className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
                      Performa Penjualan &amp; Bonus Bulanan
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-600">
                      Setiap pembelian grosir langsung maupun pesanan pelanggan
                      dengan kode{" "}
                      <strong className="font-mono text-[#EA580C]">
                        {activeReseller.referral_code}
                      </strong>{" "}
                      otomatis dihitung.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-right">
                    <span className="text-[11px] font-bold uppercase text-emerald-700 block">
                      Akumulasi Bonus Komisi ({activeReseller.bonus_percentage}
                      %)
                    </span>
                    <span className="text-xl font-black text-emerald-800">
                      {formatRupiah(estimatedBonus)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar Visual + Berapa Pcs/Rupiah Lagi */}
                <div className="rounded-2xl bg-amber-50/90 border border-amber-200 p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold">
                    <span className="text-stone-800 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-[#EA580C]" />
                      Pencapaian Omzet Bulan Ini
                    </span>
                    <span className="text-[#C2410C]">
                      {formatRupiah(activeReseller.current_month_sales)} /{" "}
                      {formatRupiah(activeReseller.monthly_target_amount)} (
                      {progressPercentage}%)
                    </span>
                  </div>

                  <div className="w-full h-4 rounded-full bg-amber-200/70 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#EA580C] via-[#DC2626] to-emerald-600 transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-700 pt-1">
                    {remainingTargetRupiah === 0 ? (
                      <span className="font-extrabold text-emerald-700 flex items-center gap-1.5">
                        <Award className="h-4 w-4" />
                        🎉 Selamat! Target penjualan bulanan tercapai! Bonus
                        komisi {activeReseller.bonus_percentage}% siap dicairkan
                        dari Cimoring.
                      </span>
                    ) : (
                      <span>
                        Tinggal{" "}
                        <strong className="text-[#C2410C]">
                          {formatRupiah(remainingTargetRupiah)}
                        </strong>{" "}
                        lagi (setara{" "}
                        <strong className="text-[#EA580C]">
                          ±{remainingTargetPcs} pcs ukuran 250g
                        </strong>
                        ) untuk mencairkan Bonus Target{" "}
                        <strong>{activeReseller.bonus_percentage}%</strong> dari
                        Cimoring!
                      </span>
                    )}
                    <span className="font-bold text-stone-600">
                      Pesanan Referral:{" "}
                      <strong>
                        {activeReseller.total_orders_referred} Transaksi
                      </strong>
                    </span>
                  </div>
                </div>
              </Card>

              {/* Kartu Kode Referral Unik */}
              <Card className="lg:col-span-4 p-6 sm:p-7 flex flex-col justify-between space-y-4 bg-gradient-to-b from-amber-50 to-white border-2 border-amber-300">
                <div className="space-y-2">
                  <Badge variant="warning" size="md">
                    Kode Referral Unik Reseller
                  </Badge>
                  <h3 className="text-lg font-black text-stone-900">
                    Bagikan ke Pelanggan Anda
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Pelanggan yang memakai kode ini saat checkout di CimoFood
                    mendapatkan <strong>diskon Rp2.000</strong> dan pesanannya
                    otomatis menambah progres target bulanan Anda!
                  </p>
                </div>

                <div className="rounded-2xl bg-white border-2 border-dashed border-[#EA580C] p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-stone-400 block">
                      KODE REFERRAL ANDA
                    </span>
                    <span className="font-mono text-2xl font-black text-[#EA580C] tracking-wider">
                      {activeReseller.referral_code}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyReferral}
                    leftIcon={
                      copiedCode ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )
                    }
                  >
                    {copiedCode ? "Tersalin" : "Salin"}
                  </Button>
                </div>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Halo teman-teman! Yuk cobain Cimoring Asli Sejak 2017 yang renyah gurih & dikemas aman 4 lapis! 🌶️🔥\n\nPesan langsung di web resmi CimoFood dan pakai Kode Referral saya: *${activeReseller.referral_code}* untuk dapat potongan harga langsung Rp2.000!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="success"
                    size="lg"
                    fullWidth
                    leftIcon={<MessageCircle className="h-5 w-5" />}
                  >
                    Bagikan Kode ke WhatsApp
                  </Button>
                </a>
              </Card>
            </div>

            {/* KALKULATOR KOMISI / BONUS & KEUNTUNGAN RESELLER OTOMATIS */}
            <Card className="p-6 sm:p-8 bg-white border-2 border-amber-300 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-200/80 pb-4">
                <div className="space-y-1">
                  <Badge variant="spicy" size="md">
                    Kalkulator Simulasi Cuan Reseller
                  </Badge>
                  <h2 className="text-xl sm:text-2xl font-black text-stone-900 flex items-center gap-2">
                    <Calculator className="h-6 w-6 text-[#EA580C]" />
                    <span>
                      Kalkulator Komisi / Bonus &amp; Laba Bulanan Otomatis
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600">
                    Geser jumlah penjualan harian untuk menghitung otomatis{" "}
                    <strong>Laba Selisih Harga Eceran</strong> +{" "}
                    <strong>Bonus Target Bulanan 5%</strong> dari Cimoring.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-6 space-y-5">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-stone-700 mb-2">
                      1. Pilih Ukuran Kemasan yang Dijual:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["200g", "250g", "500g", "Bal 2kg"] as const).map(
                        (sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setCalcSizeType(sz)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                              calcSizeType === sz
                                ? "bg-[#EA580C] text-white border-[#EA580C] shadow-sm"
                                : "bg-amber-50 text-stone-700 border-amber-200 hover:border-[#EA580C]"
                            }`}
                          >
                            {sz}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold">
                      <span className="text-stone-700">
                        2. Target Penjualan per Hari:
                      </span>
                      <span className="text-lg font-black text-[#EA580C]">
                        {calcPacksPerDay} pcs / hari ({monthlyPacksSimulated}{" "}
                        pcs / bulan)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      value={calcPacksPerDay}
                      onChange={(e) =>
                        setCalcPacksPerDay(Number(e.target.value))
                      }
                      className="w-full accent-[#EA580C] cursor-pointer h-2.5 bg-amber-200 rounded-lg"
                    />
                    <div className="flex justify-between text-[11px] font-semibold text-stone-400">
                      <span>1 pcs/hari (Santai)</span>
                      <span>10 pcs/hari (Aktif)</span>
                      <span>30 pcs/hari (Sultan)</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                    <span className="text-[11px] font-bold uppercase text-stone-500 block">
                      Laba Jual Eceran
                    </span>
                    <p className="text-lg font-black text-stone-900 mt-1">
                      +{formatRupiah(monthlyDirectMargin)}
                    </p>
                    <span className="text-[11px] text-stone-500 mt-1 block">
                      Margin{" "}
                      {formatRupiah(
                        selectedCalcSpec.retail - selectedCalcSpec.reseller
                      )}{" "}
                      × {monthlyPacksSimulated} pcs
                    </span>
                  </div>

                  <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4">
                    <span className="text-[11px] font-bold uppercase text-[#C2410C] block">
                      Bonus Target (5%)
                    </span>
                    <p className="text-lg font-black text-[#EA580C] mt-1">
                      +{formatRupiah(monthlyTargetBonus)}
                    </p>
                    <span className="text-[11px] text-stone-500 mt-1 block">
                      {monthlyTargetBonus > 0
                        ? "Target Rp1 Juta Tercapai!"
                        : "Capai omzet Rp1 Juta untuk klaim"}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-emerald-600 text-white p-4 shadow-md">
                    <span className="text-[11px] font-extrabold uppercase text-emerald-100 block">
                      Total Potensi Penghasilan
                    </span>
                    <p className="text-xl font-black mt-1">
                      {formatRupiah(totalSimulatedIncome)}
                    </p>
                    <span className="text-[11px] text-emerald-100 mt-1 block">
                      Per bulan (Laba + Bonus)
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* KATALOG KHUSUS DENGAN HARGA RESELLER TANPA MINIMAL ORDER */}
            <section id="katalog-grosir" className="space-y-6 scroll-mt-24">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <Badge variant="success" size="md">
                    Harga Grosir Sejak Pcs Pertama
                  </Badge>
                  <h2 className="text-2xl sm:text-3xl font-black text-stone-900 mt-1">
                    Katalog Khusus Harga Reseller (Tanpa Minimal Order)
                  </h2>
                  <p className="text-sm text-stone-600">
                    Pesan stok langsung dengan harga khusus Reseller yang jauh
                    lebih hemat dibandingkan harga eceran web maupun
                    marketplace.
                  </p>
                </div>
                <Link href="/checkout">
                  <Button
                    variant="primary"
                    size="lg"
                    leftIcon={<ShoppingBag className="h-5 w-5" />}
                  >
                    Lanjut ke Checkout Reseller
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                  const selectedVariantId =
                    selectedVariants[product.id] || product.variants[0]?.id;
                  const activeVariant =
                    product.variants.find((v) => v.id === selectedVariantId) ||
                    product.variants[0];

                  if (!activeVariant) return null;

                  const profitVsWeb = Math.max(
                    0,
                    activeVariant.web_price - activeVariant.reseller_price
                  );
                  const profitVsShopee = Math.max(
                    0,
                    activeVariant.shopee_price - activeVariant.reseller_price
                  );

                  return (
                    <Card
                      key={product.id}
                      className="p-5 flex flex-col justify-between space-y-4 bg-white"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-extrabold uppercase tracking-wider text-[#EA580C]">
                              {product.flavor_category}
                            </span>
                            <h3 className="text-lg font-extrabold text-stone-900 leading-snug">
                              {product.name}
                            </h3>
                          </div>
                          <StockStatusBadge
                            stockQty={activeVariant.stock_qty}
                            isReady={activeVariant.is_ready_stock}
                          />
                        </div>

                        {product.is_sensitive_packaging && (
                          <SensitivePackagingBadge />
                        )}

                        {/* Pilihan Ukuran */}
                        <div className="grid grid-cols-4 gap-1.5 pt-1">
                          {product.variants.map((v) => {
                            const isSelected = v.id === activeVariant.id;
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() =>
                                  setSelectedVariants((prev) => ({
                                    ...prev,
                                    [product.id]: v.id,
                                  }))
                                }
                                className={`py-2 px-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-[#EA580C] text-white border-[#EA580C] shadow-sm"
                                    : "bg-amber-50/70 text-stone-700 border-amber-200 hover:border-[#EA580C]"
                                }`}
                              >
                                {v.size_label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Rincian Harga Reseller & Margin Keuntungan */}
                        <div className="rounded-2xl bg-amber-50/90 border border-amber-200/90 p-4 space-y-2">
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs font-bold text-stone-600">
                              Harga Khusus Reseller:
                            </span>
                            <span className="text-2xl font-black text-[#EA580C]">
                              {formatRupiah(activeVariant.reseller_price)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-stone-500 border-t border-amber-200/70 pt-2">
                            <span>Harga Eceran Web:</span>
                            <span className="font-bold text-stone-700">
                              {formatRupiah(activeVariant.web_price)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-stone-500">
                            <span>Harga Marketplace (Shopee):</span>
                            <span className="line-through">
                              {formatRupiah(activeVariant.shopee_price)}
                            </span>
                          </div>
                          <div className="rounded-xl bg-emerald-100/90 border border-emerald-300 px-3 py-2 flex items-center justify-between text-xs font-extrabold text-emerald-900 mt-1">
                            <span className="flex items-center gap-1">
                              <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                              Margin Jual Kembali:
                            </span>
                            <span>
                              +{formatRupiah(profitVsWeb)} s/d{" "}
                              {formatRupiah(profitVsShopee)} / pcs
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="primary"
                        size="md"
                        fullWidth
                        disabled={
                          !activeVariant.is_ready_stock ||
                          activeVariant.stock_qty <= 0
                        }
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() =>
                          handleAddWholesaleItem(product, activeVariant)
                        }
                      >
                        + Pesan Harga Reseller (
                        {formatRupiah(activeVariant.reseller_price)})
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* KUMPULAN MATERI FOTO PROMOSI PRODUK SIAP UNDUH (MARKETING KIT) */}
            <section id="materi-promosi" className="space-y-6 scroll-mt-24">
              <div>
                <Badge variant="spicy" size="md">
                  Marketing Kit Resmi Mitra Reseller
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-black text-stone-900 mt-1 flex items-center gap-2">
                  <ImageIcon className="h-7 w-7 text-[#EA580C]" />
                  <span>Kumpulan Materi Foto Promosi Produk Siap Unduh</span>
                </h2>
                <p className="text-sm text-stone-600">
                  Unduh foto katalog resolusi tinggi dan salin teks iklan siap
                  pakai untuk diposting ke Status WhatsApp, Instagram, atau
                  Facebook.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PROMO_MEDIA_KIT.map((kit) => (
                  <Card
                    key={kit.id}
                    className="overflow-hidden flex flex-col justify-between bg-white"
                  >
                    <div>
                      <div className="relative h-52 w-full bg-stone-100">
                        <img
                          src={kit.imageUrl}
                          alt={kit.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge variant="spicy" size="sm">
                            {kit.badge}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-5 space-y-3">
                        <h3 className="text-base font-extrabold text-stone-900">
                          {kit.title}
                        </h3>
                        <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3 text-xs text-stone-700 whitespace-pre-line leading-relaxed">
                          {kit.caption}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 grid grid-cols-2 gap-2.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Copy className="h-4 w-4" />}
                        onClick={() =>
                          handleCopyCaption(kit.title, kit.caption)
                        }
                      >
                        Salin Teks Iklan
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Download className="h-4 w-4" />}
                        onClick={() =>
                          handleDownloadPromoImage(kit.title, kit.imageUrl)
                        }
                      >
                        Unduh Foto HD
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <CartDrawer />
    </div>
  );
}
