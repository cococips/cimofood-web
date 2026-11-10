"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  Clock,
  CreditCard,
  MapPin,
  MessageCircle,
  Minus,
  PackageCheck,
  Phone,
  Plus,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  User,
} from "lucide-react";
import { CartDrawer, StorefrontNavbar } from "@/components/storefront";
import {
  Badge,
  Button,
  Card,
  SensitivePackagingBadge,
  useToast,
} from "@/components/ui";
import {
  createOnlineOrder,
  getProductsWithVariants,
  getResellerByReferralCode,
} from "@/lib/data-service";
import { formatRupiah } from "@/lib/utils";
import { computeCartSummary, useCartStore } from "@/store/cart-store";
import type { CourierType, ProductWithVariants } from "@/types/database";

const COURIER_OPTIONS: Array<{
  id: CourierType;
  name: string;
  eta: string;
  desc: string;
}> = [
  {
    id: "JNT",
    name: "J&T Express",
    eta: "Estimasi 1 - 3 Hari",
    desc: "Rekomendasi pengiriman cepat antarkota dengan pelacakan resi otomatis.",
  },
  {
    id: "ANTERAJA",
    name: "Anteraja Reguler",
    eta: "Estimasi 2 - 3 Hari",
    desc: "Ongkir hemat dan penjemputan kurir langsung ke tim packing CimoFood.",
  },
  {
    id: "JNE",
    name: "JNE Reguler / YES",
    eta: "Estimasi 1 - 3 Hari",
    desc: "Jangkauan pengiriman luas hingga seluruh kecamatan di Indonesia.",
  },
  {
    id: "COD_MANDIRI",
    name: "Ambil Langsung / COD Lokal",
    eta: "Hari yang Sama",
    desc: "Ambil langsung di rumah produksi Cimoring atau COD area lokal.",
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const items = useCartStore((s) => s.items);
  const isResellerMode = useCartStore((s) => s.isResellerMode);
  const referralCode = useCartStore((s) => s.referralCode);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const setReferralCode = useCartStore((s) => s.setReferralCode);
  const addItem = useCartStore((s) => s.addItem);

  const [customerName, setCustomerName] = React.useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = React.useState("");
  const [customerCity, setCustomerCity] = React.useState("");
  const [shippingAddress, setShippingAddress] = React.useState("");
  const [courier, setCourier] = React.useState<CourierType>("JNT");
  const [paymentMethod, setPaymentMethod] = React.useState<
    "QRIS" | "TRANSFER_BANK"
  >("QRIS");
  const [notes, setNotes] = React.useState("");
  const [matchedResellerName, setMatchedResellerName] = React.useState<
    string | null
  >(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [quickProducts, setQuickProducts] = React.useState<
    ProductWithVariants[]
  >([]);

  const summary = React.useMemo(
    () => computeCartSummary(items, isResellerMode, referralCode),
    [items, isResellerMode, referralCode]
  );

  React.useEffect(() => {
    getProductsWithVariants({ includeHampers: true }).then(setQuickProducts);
  }, []);

  React.useEffect(() => {
    if (!referralCode || referralCode.trim().length < 3) {
      setMatchedResellerName(null);
      return;
    }
    getResellerByReferralCode(referralCode).then((reseller) => {
      setMatchedResellerName(reseller ? reseller.full_name : null);
    });
  }, [referralCode]);

  const handleFillSampleCustomer = () => {
    setCustomerName("Rizky Pratama");
    setCustomerWhatsapp("081234567899");
    setCustomerCity("Kota Bandung - Kec. Coblong");
    setShippingAddress(
      "Jl. Dago Asri No. 19, RT 04/RW 06, Kel. Dago, Kec. Coblong, Kota Bandung 40135"
    );
    setReferralCode("RINACIMO");
    setNotes(
      "Tolong pastikan kemasan Varian Original aman ya Kak, untuk oleh-oleh keluarga."
    );
    showToast({
      type: "info",
      title: "Data Pembeli Contoh Diisi",
      description:
        "Silakan klik tombol 'Buat Pesanan & Konfirmasi via WhatsApp'.",
    });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      showToast({
        type: "warning",
        title: "Keranjang Belanja Kosong",
        description: "Silakan pilih minimal 1 kemasan Cimoring terlebih dahulu.",
      });
      return;
    }

    const cleanPhone = customerWhatsapp.replace(/\D/g, "");
    if (cleanPhone.length < 9) {
      showToast({
        type: "error",
        title: "Nomor WhatsApp Tidak Valid",
        description: "Masukkan nomor WhatsApp aktif minimal 10 digit.",
      });
      return;
    }

    if (
      !customerName.trim() ||
      !customerCity.trim() ||
      !shippingAddress.trim()
    ) {
      showToast({
        type: "error",
        title: "Formulir Belum Lengkap",
        description:
          "Mohon lengkapi Nama Lengkap, Kota/Kecamatan, dan Alamat Pengiriman.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await createOnlineOrder({
        customer_name: customerName,
        customer_whatsapp: customerWhatsapp,
        customer_city: customerCity,
        shipping_address: shippingAddress,
        courier,
        payment_method: paymentMethod,
        referral_code: referralCode || undefined,
        discount_amount: summary.referralDiscount,
        notes: notes || undefined,
        items: items.map((item) => ({
          variant_id: item.variantId,
          product_name: item.productName,
          size_label: item.sizeLabel,
          is_sensitive_packaging: item.isSensitivePackaging,
          quantity: item.quantity,
          unit_base_price: item.basePrice,
          unit_selling_price: isResellerMode
            ? item.resellerPrice
            : item.webPrice,
        })),
      });

      clearCart();

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.65 },
          colors: ["#EA580C", "#DC2626", "#F59E0B", "#10B981"],
        });
      } catch {
        // Abaikan jika confetti gagal
      }

      showToast({
        type: "spicy",
        title: `Pesanan ${order.order_code} Berhasil Dibuat!`,
        description:
          "Mengarahkan otomatis ke halaman Lacak Pesanan 8 Tahap & Konfirmasi WhatsApp...",
      });

      // Arahkan otomatis ke halaman detail pesanan /track/[orderCode]
      router.push(`/track/${order.order_code}?new=1`);
    } catch (err) {
      console.error(err);
      showToast({
        type: "error",
        title: "Gagal Membuat Pesanan",
        description: "Terjadi kendala saat menyimpan pesanan Anda.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <StorefrontNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Top Back Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-700 hover:text-[#EA580C] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Katalog Cimoring</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="spicy"
              size="sm"
              icon={<Clock className="h-3.5 w-3.5" />}
            >
              Ongkir &amp; Stok Dikonfirmasi Admin Maks. 1 Jam
            </Badge>
            <Badge variant="golden" size="sm">
              SOP Kemasan 4 Lapis Anti-Remuk
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Validated Customer & Shipping Form */}
          <div className="lg:col-span-7 space-y-6">
            <Card
              surface="storefront"
              hoverElevation={false}
              className="p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F3E8D6] pb-4 mb-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-stone-900">
                    Data Penerima &amp; Ekspedisi Pengiriman
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                    Isi data lengkap Anda. Pembayaran baru dilakukan setelah
                    Admin memastikan stok segar tersedia.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleFillSampleCustomer}
                >
                  Isi Data Contoh Cepat
                </Button>
              </div>

              <form
                id="checkout-form"
                onSubmit={handleSubmitOrder}
                className="space-y-5"
              >
                {/* Nama Lengkap & Nomor WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-extrabold text-stone-800 mb-1.5">
                      <User className="h-3.5 w-3.5 text-[#EA580C]" />
                      <span>Nama Lengkap Penerima *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full h-11 rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-extrabold text-stone-800 mb-1.5">
                      <Phone className="h-3.5 w-3.5 text-[#EA580C]" />
                      <span>Nomor WhatsApp Aktif *</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerWhatsapp}
                      onChange={(e) => setCustomerWhatsapp(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full h-11 rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                </div>

                {/* Kota / Kecamatan */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-extrabold text-stone-800 mb-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#EA580C]" />
                    <span>Kota / Kabupaten &amp; Kecamatan *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    placeholder="Contoh: Kota Bandung - Kec. Lengkong"
                    className="w-full h-11 rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 focus:outline-none focus:border-[#EA580C]"
                  />
                </div>

                {/* Alamat Lengkap */}
                <div>
                  <label className="block text-xs font-extrabold text-stone-800 mb-1.5">
                    Alamat Lengkap Pengiriman (Jalan, No. Rumah, RT/RW, Patokan)
                    *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Tuliskan nama jalan, nomor rumah, kelurahan, kode pos, dan patokan agar kurir mudah menemukan lokasi..."
                    className="w-full rounded-xl border border-stone-300 bg-white p-3.5 text-sm text-stone-900 focus:outline-none focus:border-[#EA580C]"
                  />
                </div>

                {/* Pilihan Ekspedisi */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-extrabold text-stone-800 mb-2">
                    <Truck className="h-4 w-4 text-[#EA580C]" />
                    <span>Pilih Ekspedisi Pengiriman:</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {COURIER_OPTIONS.map((option) => {
                      const selected = courier === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setCourier(option.id)}
                          className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                            selected
                              ? "bg-orange-50/90 border-[#EA580C] ring-2 ring-[#EA580C]/20"
                              : "bg-[#FAF8F5] border-stone-200 hover:border-orange-300"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-stone-900">
                              {option.name}
                            </span>
                            <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border border-stone-200 text-[#C2410C]">
                              {option.eta}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                            {option.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Metode Pembayaran & Kode Referral Reseller */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-extrabold text-stone-800 mb-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-[#EA580C]" />
                      <span>Metode Pembayaran Pilihan:</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["QRIS", "TRANSFER_BANK"] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`h-11 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                            paymentMethod === method
                              ? "bg-[#EA580C] text-white border-[#EA580C]"
                              : "bg-white text-stone-700 border-stone-300 hover:border-orange-300"
                          }`}
                        >
                          {method === "QRIS"
                            ? "QRIS CimoFood"
                            : "Transfer Bank"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-extrabold text-stone-800 mb-1.5">
                      <Tag className="h-3.5 w-3.5 text-[#EA580C]" />
                      <span>Kode Referral Reseller (Opsional):</span>
                    </label>
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      placeholder="Contoh: RINACIMO / DEDIKRIUK"
                      className="w-full h-11 rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-bold uppercase tracking-wider text-stone-900 focus:outline-none focus:border-[#EA580C]"
                    />
                    {matchedResellerName && (
                      <p className="text-[11px] font-bold text-emerald-700 mt-1">
                        ✓ Mitra Reseller: {matchedResellerName} (Potongan
                        Rp2.000)
                      </p>
                    )}
                  </div>
                </div>

                {/* Catatan Pesanan */}
                <div>
                  <label className="block text-xs font-extrabold text-stone-800 mb-1.5">
                    Catatan Pesanan / Kartu Ucapan Hampers (Opsional):
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Tolong pastikan segel rapat untuk oleh-oleh perjalanan jauh..."
                    className="w-full h-11 rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
              </form>
            </Card>
          </div>

          {/* Right Column: Transparent Order Summary */}
          <div className="lg:col-span-5 space-y-6">
            <Card
              surface="storefront"
              hoverElevation={false}
              className="p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#F3E8D6] pb-3.5">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-[#EA580C]" />
                  <h2 className="text-lg font-extrabold text-stone-900">
                    Ringkasan Pesanan ({summary.totalItems} Kemasan)
                  </h2>
                </div>
                <Link
                  href="/#katalog-cimoring"
                  className="text-xs font-bold text-[#EA580C] hover:underline"
                >
                  + Tambah Varian
                </Link>
              </div>

              {items.length === 0 ? (
                <div className="rounded-2xl bg-[#FFFBEB] border border-amber-200 p-5 text-center space-y-3">
                  <p className="text-sm font-bold text-stone-900">
                    Keranjang Belanja Masih Kosong
                  </p>
                  <p className="text-xs text-stone-600">
                    Klik tombol di bawah untuk mengisi produk sampel agar Anda
                    bisa langsung menguji alur Checkout &amp; Pelacakan 8 Tahap:
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const ori = quickProducts.find(
                        (p) => p.flavor_category === "Original"
                      );
                      const pedas = quickProducts.find(
                        (p) => p.flavor_category === "Pedas"
                      );
                      if (ori && ori.variants[1]) {
                        addItem(ori, ori.variants[1], 1);
                      }
                      if (pedas && pedas.variants[1]) {
                        addItem(pedas, pedas.variants[1], 2);
                      }
                      showToast({
                        type: "spicy",
                        title: "Produk Contoh Ditambahkan!",
                        description:
                          "1x Original 250g & 2x Pedas 250g siap di-checkout.",
                      });
                    }}
                  >
                    + Isi Produk Contoh Cepat
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {items.map((item) => {
                    const unitPrice = isResellerMode
                      ? item.resellerPrice
                      : item.webPrice;
                    return (
                      <div
                        key={item.variantId}
                        className="flex items-start justify-between gap-3 rounded-2xl bg-[#FAF8F5] border border-[#F3E8D6] p-3"
                      >
                        <div className="flex gap-3 min-w-0">
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="h-14 w-14 rounded-xl object-cover shrink-0 border border-stone-200"
                          />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-extrabold text-stone-900 truncate">
                              {item.productName}
                            </p>
                            <div className="flex flex-wrap items-center gap-1 mt-0.5">
                              <Badge variant="spicy" size="sm">
                                {item.sizeLabel}
                              </Badge>
                              {item.isSensitivePackaging && (
                                <SensitivePackagingBadge label="SOP Khusus Original" />
                              )}
                            </div>
                            <p className="text-xs font-bold text-[#C2410C] mt-1">
                              {formatRupiah(unitPrice)} × {item.quantity} ={" "}
                              {formatRupiah(unitPrice * item.quantity)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity - 1)
                            }
                            className="h-7 w-7 rounded-lg border border-stone-300 bg-white flex items-center justify-center text-stone-700 hover:border-[#EA580C] cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity + 1)
                            }
                            className="h-7 w-7 rounded-lg border border-stone-300 bg-white flex items-center justify-center text-stone-700 hover:border-[#EA580C] cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.variantId)}
                            className="h-7 w-7 rounded-lg text-stone-400 hover:text-red-600 flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sensitive Original SOP Notice */}
              {summary.hasSensitiveOriginal && (
                <div className="rounded-2xl bg-amber-50 border border-amber-300 p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
                  <ShieldAlert className="h-4 w-4 text-[#C2410C] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block">
                      Kemasan Ekstra Aman SOP Khusus (Varian Original)
                    </span>
                    Pesanan Anda mengandung Varian Original. Tim packing wajib
                    mengunggah foto bukti kemas 4 lapis di halaman Lacak Pesanan
                    agar Anda tenang barang tidak jepot/remuk!
                  </div>
                </div>
              )}

              {/* Info Box: Ongkir & Stok Dikonfirmasi Admin Maksimal 1 Jam */}
              <div className="rounded-2xl bg-orange-50/90 border border-orange-200 p-3.5 text-xs text-stone-800 flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-[#EA580C] shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-[#C2410C] block">
                    Ongkir &amp; Stok Dikonfirmasi Admin Maksimal 1 Jam
                  </span>
                  Untuk mencegah pembatalan akibat stok habis mendadak, Admin
                  memastikan stok ke rumah produksi &amp; menghitung ongkir
                  ekspedisi sebelum Anda mentransfer pembayaran.
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-2.5 pt-3 border-t border-[#F3E8D6] text-xs sm:text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>
                    Total Berat ({summary.totalItems} kemasan)
                  </span>
                  <span className="font-bold text-stone-800">
                    {(summary.totalWeightGrams / 1000).toFixed(2)} kg
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal Produk</span>
                  <span className="font-bold text-stone-900">
                    {formatRupiah(summary.subtotalSelling)}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span className="inline-flex items-center gap-1">
                    <PackageCheck className="h-4 w-4 text-[#EA580C]" />
                    Biaya Packing Aman 4 Lapis
                  </span>
                  <span className="font-bold text-stone-900">
                    {formatRupiah(summary.packingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Ongkos Kirim ({courier})</span>
                  <span className="font-bold text-[#EA580C]">
                    Dikonfirmasi Admin Maks. 1 Jam
                  </span>
                </div>

                {summary.referralDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Diskon Kode Referral ({referralCode})</span>
                    <span>-{formatRupiah(summary.referralDiscount)}</span>
                  </div>
                )}

                {summary.totalSavingsVsShopee > 0 && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 flex items-center justify-between text-xs text-emerald-800">
                    <span className="font-semibold flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      Hemat dibanding Harga Marketplace:
                    </span>
                    <span className="font-black">
                      {formatRupiah(summary.totalSavingsVsShopee)}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-stone-200 flex items-baseline justify-between">
                  <div>
                    <span className="text-sm font-extrabold text-stone-900 block">
                      Total Sementara
                    </span>
                    <span className="text-[11px] text-stone-500">
                      *Sebelum ongkir ekspedisi
                    </span>
                  </div>
                  <span className="text-2xl font-black text-[#C2410C]">
                    {formatRupiah(summary.estimatedTotalBeforeShipping)}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                form="checkout-form"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                loadingText="Menyimpan & Mengarahkan..."
                leftIcon={<MessageCircle className="h-5 w-5" />}
              >
                Buat Pesanan &amp; Konfirmasi via WhatsApp
              </Button>
            </Card>
          </div>
        </div>
      </main>

      <CartDrawer />
    </div>
  );
}
