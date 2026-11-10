"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  FileCheck2,
  MapPin,
  MessageCircle,
  Package,
  PackageCheck,
  QrCode,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Truck,
  Upload,
} from "lucide-react";
import { CartDrawer, StorefrontNavbar } from "@/components/storefront";
import {
  Badge,
  Button,
  Card,
  OrderStatusBadge,
  SensitivePackagingBadge,
  useToast,
} from "@/components/ui";
import { getOrderByCode, updateOrderStage } from "@/lib/data-service";
import {
  createWhatsAppCheckoutUrl,
  formatDateID,
  formatRupiah,
} from "@/lib/utils";
import {
  ORDER_STAGES,
  ORDER_STATUS_MAP,
  type OrderStatus,
  type OrderWithItems,
} from "@/types/database";

const SAMPLE_PAYMENT_PROOF_URL =
  "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=700&q=80";
const SAMPLE_PACKING_PHOTO_URL =
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80";

function OrderTrackingDetailContent() {
  const params = useParams<{ orderCode: string }>();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const orderCodeParam = decodeURIComponent(params.orderCode || "");
  const isNewCheckout = searchParams.get("new") === "1";

  const [order, setOrder] = React.useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [paymentProofInput, setPaymentProofInput] = React.useState("");
  const [isUploadingProof, setIsUploadingProof] = React.useState(false);
  const [copiedText, setCopiedText] = React.useState<string | null>(null);

  // Review state for Stage 8
  const [rating, setRating] = React.useState(5);
  const [reviewText, setReviewText] = React.useState(
    "Alhamdulillah Cimoring sampai dengan utuh, renyah banget, dan kemasannya rapi berlapis-lapis!"
  );
  const [reviewSubmitted, setReviewSubmitted] = React.useState(false);

  // Demo simulator shipping input
  const [simShippingCost, setSimShippingCost] = React.useState(12000);
  const [simTrackingNumber, setSimTrackingNumber] =
    React.useState("JP8849201188");

  const loadOrder = React.useCallback(async () => {
    if (!orderCodeParam) return;
    setIsLoading(true);
    const data = await getOrderByCode(orderCodeParam);
    setOrder(data);
    if (data?.payment_proof_url) {
      setPaymentProofInput(data.payment_proof_url);
    }
    setIsLoading(false);
  }, [orderCodeParam]);

  React.useEffect(() => {
    loadOrder();
    const onUpdated = () => loadOrder();
    window.addEventListener("cimofood-data-updated", onUpdated);
    return () => window.removeEventListener("cimofood-data-updated", onUpdated);
  }, [loadOrder]);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    window.setTimeout(() => setCopiedText(null), 1800);
    showToast({
      type: "success",
      title: `${label} Disalin!`,
      description: `${text} berhasil disalin ke papan klip.`,
    });
  };

  // Handle local file upload -> Data URL for payment proof
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPaymentProofInput(reader.result);
        showToast({
          type: "info",
          title: "Foto Bukti Bayar Dipilih",
          description:
            "Klik tombol 'Kirim Bukti Pembayaran' untuk mengonfirmasi ke Admin.",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPaymentProof = async () => {
    if (!order) return;
    const finalProofUrl =
      paymentProofInput.trim() || SAMPLE_PAYMENT_PROOF_URL;

    setIsUploadingProof(true);
    try {
      const updated = await updateOrderStage(order.id, order.status, {
        payment_proof_url: finalProofUrl,
      });
      if (updated) {
        setOrder(updated);
        setPaymentProofInput(finalProofUrl);
      }
      showToast({
        type: "spicy",
        title: "Bukti Pembayaran Berhasil Diunggah!",
        description:
          "Admin CimoFood sedang memverifikasi bukti pembayaran Anda untuk lanjut ke Tahap 4.",
      });
    } catch {
      showToast({
        type: "error",
        title: "Gagal Mengunggah Bukti Bayar",
        description: "Silakan coba kembali.",
      });
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleConfirmOrderCompleted = async () => {
    if (!order) return;
    try {
      const updated = await updateOrderStage(order.id, "8_COMPLETED", {
        notes: reviewText || order.notes || undefined,
      });
      if (updated) {
        setOrder(updated);
      }
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.65 },
          colors: ["#10B981", "#EA580C", "#F59E0B"],
        });
      } catch {
        // Ignore
      }
      showToast({
        type: "success",
        title: "Alhamdulillah, Pesanan Selesai!",
        description:
          "Terima kasih telah mengonfirmasi paket diterima dengan utuh dan renyah.",
      });
    } catch {
      showToast({
        type: "error",
        title: "Gagal Mengubah Status",
        description: "Terjadi kesalahan saat menyimpan konfirmasi.",
      });
    }
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    const updated = await updateOrderStage(order.id, "8_COMPLETED", {
      notes: `⭐ Rating ${rating}/5: ${reviewText}`,
    });
    if (updated) setOrder(updated);
    setReviewSubmitted(true);
    showToast({
      type: "spicy",
      title: "Terima Kasih atas Ulasan Anda! 🙏",
      description: `Rating ${rating} bintang telah tercatat untuk mendukung UMKM Cimoring.`,
    });
  };

  // Simulator helper to test stage transitions directly
  const handleSimulateStage = async (targetStatus: OrderStatus) => {
    if (!order) return;
    try {
      const updated = await updateOrderStage(order.id, targetStatus, {
        shipping_cost:
          targetStatus === "3_WAITING_PAYMENT"
            ? simShippingCost
            : order.shipping_cost || simShippingCost,
        payment_proof_url:
          order.payment_proof_url || SAMPLE_PAYMENT_PROOF_URL,
        sop_sealer_checked: true,
        sop_cardboard_layered: true,
        sop_bubble_wrap_checked: true,
        packing_photo_url:
          order.packing_photo_url || SAMPLE_PACKING_PHOTO_URL,
        tracking_number:
          targetStatus === "7_SHIPPED" || targetStatus === "8_COMPLETED"
            ? order.tracking_number || simTrackingNumber
            : order.tracking_number || undefined,
      });
      if (updated) setOrder(updated);
      showToast({
        type: "info",
        title: `Status Diubah ke ${ORDER_STATUS_MAP[targetStatus].label}`,
        description: "Timeline 8 Tahap diperbarui secara real-time.",
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Gagal Mengubah Tahap",
        description:
          err instanceof Error ? err.message : "Terjadi kesalahan.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <StorefrontNavbar />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-16 text-center">
          <p className="text-sm font-bold text-stone-600 animate-pulse">
            Memuat data pelacakan pesanan {orderCodeParam}...
          </p>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <StorefrontNavbar />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-16">
          <Card
            surface="storefront"
            hoverElevation={false}
            className="p-8 text-center space-y-4"
          >
            <h1 className="text-2xl font-black text-stone-900">
              Kode Pesanan &ldquo;{orderCodeParam}&rdquo; Tidak Ditemukan
            </h1>
            <p className="text-sm text-stone-600">
              Pastikan kode pesanan sudah benar atau cari menggunakan Nomor
              WhatsApp Anda di halaman Lacak Pesanan.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/track">
                <Button variant="primary">Kembali ke Pencarian Pesanan</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Belanja di Katalog</Button>
              </Link>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  const currentStageMeta = ORDER_STATUS_MAP[order.status];
  const currentStageNumber = currentStageMeta?.stageNumber ?? 1;
  const eightStages = ORDER_STAGES.filter((s) => s.status !== "CANCELLED");

  return (
    <div className="min-h-screen flex flex-col">
      <StorefrontNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Top Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/track"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-700 hover:text-[#EA580C] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Cari Pesanan Lain</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopyText(order.order_code, "Kode Pesanan")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-mono font-bold text-stone-800 hover:border-[#EA580C] cursor-pointer"
            >
              <span>{order.order_code}</span>
              <Copy className="h-3.5 w-3.5 text-[#EA580C]" />
            </button>
            <OrderStatusBadge status={order.status} size="md" />
          </div>
        </div>

        {/* NEW ORDER WHATSAPP CONFIRMATION BANNER (Tahap 1 & 2) */}
        {(isNewCheckout ||
          order.status === "1_CHECKOUT_CREATED" ||
          order.status === "2_WAITING_STOCK_CONFIRMATION") && (
          <Card
            surface="spicyHighlight"
            hoverElevation={false}
            className="p-6 sm:p-8 border-2 border-[#EA580C]"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="chili" pulseDot size="sm">
                    Langkah Wajib Sekarang: Konfirmasi Stok &amp; Ongkir
                  </Badge>
                  <Badge variant="golden" size="sm">
                    Respon Admin Maks. 1 Jam
                  </Badge>
                </div>
                <h1 className="text-xl sm:text-3xl font-black text-stone-900">
                  Pesanan{" "}
                  <span className="font-mono text-[#EA580C]">
                    {order.order_code}
                  </span>{" "}
                  Berhasil Dibuat!
                </h1>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                  Klik tombol hijau di samping untuk mengirim rincian pesanan
                  otomatis ke <strong>WhatsApp Admin CimoFood</strong>. Admin
                  akan memastikan ketersediaan stok harian ke dapur produksi
                  Cimoring dan menginput nominal ongkir ekspedisi{" "}
                  <strong>{order.courier}</strong> ke{" "}
                  <strong>{order.customer_city}</strong>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                <a
                  href={createWhatsAppCheckoutUrl(order)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="success"
                    size="lg"
                    fullWidth
                    leftIcon={<MessageCircle className="h-5 w-5" />}
                    rightIcon={<ExternalLink className="h-4 w-4" />}
                  >
                    Buka WhatsApp Admin Sekarang
                  </Button>
                </a>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSimulateStage("3_WAITING_PAYMENT")}
                >
                  ⚡ Simulasikan Admin Input Ongkir (Lanjut Tahap 3)
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* STAGE-SPECIFIC INTERACTIVE ACTION PANELS */}

        {/* STAGE 3: MENUNGGU PEMBAYARAN (QRIS + BANK + UPLOAD BUKTI BAYAR) */}
        {order.status === "3_WAITING_PAYMENT" && (
          <Card
            surface="storefront"
            hoverElevation={false}
            className="p-6 sm:p-8 border-2 border-[#DC2626] space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F3E8D6] pb-4">
              <div>
                <Badge variant="chili" pulseDot size="sm">
                  Tahap 3: Stok &amp; Ongkir Sudah Dikonfirmasi Admin!
                </Badge>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
                  Silakan Lakukan Pembayaran &amp; Unggah Bukti Bayar
                </h2>
                <p className="text-xs sm:text-sm text-stone-600">
                  Admin telah mengonfirmasi ongkir{" "}
                  <strong>{order.courier}</strong> sebesar{" "}
                  <strong>{formatRupiah(order.shipping_cost)}</strong>. Total
                  tagihan akhir Anda adalah{" "}
                  <strong className="text-[#DC2626] text-base">
                    {formatRupiah(order.grand_total)}
                  </strong>
                  .
                </p>
              </div>

              <div className="rounded-2xl bg-[#FFFBEB] border border-amber-300 px-4 py-3 text-right">
                <span className="text-xs font-bold text-stone-500 block">
                  Total Tagihan Akhir:
                </span>
                <span className="text-2xl font-black text-[#C2410C]">
                  {formatRupiah(order.grand_total)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: QRIS & Rekening Bank Resmi CimoFood */}
              <div className="lg:col-span-6 space-y-4">
                <div className="rounded-2xl bg-gradient-to-br from-[#FFFBEB] to-[#FFF7ED] border border-orange-200 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-[#EA580C]" />
                      <h3 className="text-sm font-extrabold text-stone-900">
                        Opsi 1: Scan QRIS Resmi CimoFood
                      </h3>
                    </div>
                    <Badge variant="spicy" size="sm">
                      Bebas Biaya Admin
                    </Badge>
                  </div>

                  {/* Simulated QRIS Card */}
                  <div className="bg-white rounded-2xl border-2 border-stone-200 p-5 flex flex-col items-center text-center space-y-3 shadow-xs">
                    <div className="flex items-center justify-between w-full text-[11px] font-black text-stone-700 border-b border-stone-200 pb-2">
                      <span>QRIS STANDAR PEMBAYARAN NASIONAL</span>
                      <span className="text-[#EA580C]">NMID: ID2026CIMOFOOD</span>
                    </div>

                    {/* Visual QR Grid */}
                    <div className="h-44 w-44 rounded-2xl bg-stone-900 p-3 flex flex-col items-center justify-center text-white relative border-4 border-[#EA580C]">
                      <QrCode className="h-28 w-28 text-white" />
                      <span className="mt-1 text-[10px] font-extrabold tracking-widest text-amber-300">
                        CIMOFOOD UMKM CIMORING
                      </span>
                    </div>

                    <div className="text-xs text-stone-600">
                      Mendukung GoPay, OVO, Dana, ShopeePay, LinkAja, BCA
                      Mobile, Livin&apos; Mandiri, BRImo, dan BSI Mobile.
                    </div>
                  </div>

                  {/* Bank Transfer Info Box */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-extrabold text-stone-800 flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-[#EA580C]" />
                      <span>Opsi 2: Transfer Rekening Bank Resmi</span>
                    </h4>

                    {[
                      {
                        bank: "Bank BCA",
                        acc: "4372889102",
                        holder: "a.n. CimoFood UMKM Cimoring",
                      },
                      {
                        bank: "Bank Mandiri",
                        acc: "1320098847123",
                        holder: "a.n. CimoFood UMKM Cimoring",
                      },
                    ].map((b) => (
                      <div
                        key={b.bank}
                        className="rounded-xl bg-white border border-stone-200 p-3 flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <span className="font-extrabold text-stone-900">
                            {b.bank}
                          </span>{" "}
                          —{" "}
                          <span className="font-mono font-bold text-[#C2410C]">
                            {b.acc}
                          </span>
                          <span className="block text-[11px] text-stone-500">
                            {b.holder}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText(b.acc, b.bank)}
                          className="px-2.5 py-1.5 rounded-lg bg-orange-50 text-[#EA580C] font-bold hover:bg-orange-100 cursor-pointer inline-flex items-center gap-1"
                        >
                          {copiedText === b.bank ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          <span>Salin</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Upload Payment Proof Form */}
              <div className="lg:col-span-6 space-y-4">
                <div className="rounded-2xl bg-[#FAF8F5] border border-[#F3E8D6] p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-[#EA580C]" />
                    <h3 className="text-sm font-extrabold text-stone-900">
                      Formulir Upload Bukti Pembayaran
                    </h3>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    Unggah tangkapan layar (*screenshot*) bukti pembayaran QRIS
                    atau struk transfer bank Anda agar Admin dapat segera
                    memverifikasi dan mengambil barang dari produsen Cimoring.
                  </p>

                  {/* File Upload Dropzone */}
                  <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-orange-300 bg-white p-5 text-center cursor-pointer hover:bg-orange-50/40 transition-colors">
                    <Camera className="h-8 w-8 text-[#EA580C] mb-1.5" />
                    <span className="text-xs font-extrabold text-stone-800">
                      Pilih Foto Bukti Bayar dari HP / Laptop
                    </span>
                    <span className="text-[11px] text-stone-500 mt-0.5">
                      Format JPG, PNG, atau WebP
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-stone-500">
                      Atau uji cepat dengan bukti bayar contoh:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentProofInput(SAMPLE_PAYMENT_PROOF_URL)
                      }
                      className="font-bold text-[#EA580C] underline cursor-pointer"
                    >
                      Gunakan Bukti Bayar Contoh
                    </button>
                  </div>

                  {paymentProofInput && (
                    <div className="rounded-xl overflow-hidden border border-emerald-300 bg-emerald-50/60 p-2.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-800 px-1">
                        <span className="flex items-center gap-1">
                          <FileCheck2 className="h-4 w-4" /> Pratinjau Bukti
                          Pembayaran:
                        </span>
                        <span className="text-[11px]">Siap Diverifikasi</span>
                      </div>
                      <img
                        src={paymentProofInput}
                        alt="Bukti Pembayaran"
                        className="h-40 w-full object-cover rounded-lg border border-emerald-200"
                      />
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      isLoading={isUploadingProof}
                      leftIcon={<Upload className="h-4 w-4" />}
                      onClick={handleSubmitPaymentProof}
                    >
                      Kirim Bukti Pembayaran
                    </Button>
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => handleSimulateStage("4_PAID_VERIFIED")}
                    >
                      ⚡ Simulasikan Verifikasi Lunas
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* STAGE 6, 7, 8: BUKTI FOTO KEMASAN SOP 4 LAPIS & INFORMASI EKSPEDISI */}
        {(order.status === "6_PACKED_SOP_VERIFIED" ||
          order.status === "7_SHIPPED" ||
          order.status === "8_COMPLETED" ||
          Boolean(order.packing_photo_url)) && (
          <Card
            surface="storefront"
            hoverElevation={false}
            className="p-6 sm:p-8 border-2 border-emerald-500/70 space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="success"
                    size="sm"
                    icon={<ShieldCheck className="h-3.5 w-3.5" />}
                  >
                    Terverifikasi SOP 4 Lapis Anti-Remuk
                  </Badge>
                  {order.has_sensitive_original_item && (
                    <SensitivePackagingBadge label="Kemasan Ekstra Aman SOP Khusus (Varian Original)" />
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 mt-1.5">
                  Bukti Foto Pengemasan 4 Lapis &amp; Resi Pengiriman
                </h2>
                <p className="text-xs sm:text-sm text-stone-600">
                  Tim packing CimoFood telah mengemas pesanan Anda sesuai
                  standar 4 lapis agar kerenyahan Cimoring tetap utuh dan tidak
                  remuk/jepot di perjalanan.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left: Packing Photo Proof */}
              <div className="lg:col-span-6">
                <div className="rounded-2xl overflow-hidden border-2 border-emerald-300 bg-stone-900 relative group">
                  <img
                    src={order.packing_photo_url || SAMPLE_PACKING_PHOTO_URL}
                    alt="Foto Bukti Kemasan 4 Lapis CimoFood"
                    className="h-64 sm:h-72 w-full object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-stone-950/90 via-stone-950/50 to-transparent p-4 text-white">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 block">
                      📸 Foto Asli Paket Sebelum Diserahkan ke Kurir
                    </span>
                    <p className="text-xs sm:text-sm font-bold">
                      Kode Paket: {order.order_code} • Penerima:{" "}
                      {order.customer_name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: 4-Layer SOP Checklist + Courier Resi + Complete Action */}
              <div className="lg:col-span-6 space-y-4">
                <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-4 space-y-2.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                    Checklist Standar Kemasan 4 Lapis:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      {
                        label: "1. Segel Mesin Sealer Rapat",
                        checked: order.sop_sealer_checked || true,
                      },
                      {
                        label: "2. Apit Kardus Kanan-Kiri",
                        checked: order.sop_cardboard_layered || true,
                      },
                      {
                        label: "3. Sabuk Kardus Melingkar",
                        checked: order.sop_cardboard_layered || true,
                      },
                      {
                        label: "4. Lapisan Bubble Wrap Tebal",
                        checked: order.sop_bubble_wrap_checked || true,
                      },
                    ].map((chk) => (
                      <div
                        key={chk.label}
                        className="flex items-center gap-2 bg-white rounded-xl p-2.5 border border-emerald-200/80 font-bold text-stone-800"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{chk.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tracking Number Box */}
                <div className="rounded-2xl bg-[#FFFBEB] border border-amber-300 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-stone-500 block">
                      Ekspedisi: <strong>{order.courier}</strong>
                    </span>
                    <span className="text-lg font-mono font-black text-[#C2410C]">
                      {order.tracking_number || "Menunggu Input Resi Kurir"}
                    </span>
                  </div>
                  {order.tracking_number && (
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Copy className="h-4 w-4" />}
                      onClick={() =>
                        handleCopyText(order.tracking_number!, "Nomor Resi")
                      }
                    >
                      Salin Nomor Resi
                    </Button>
                  )}
                </div>

                {/* Action for Stage 7 -> Stage 8 Confirmation */}
                {order.status === "7_SHIPPED" && (
                  <div className="pt-1">
                    <Button
                      variant="success"
                      size="lg"
                      fullWidth
                      leftIcon={<PackageCheck className="h-5 w-5" />}
                      onClick={handleConfirmOrderCompleted}
                    >
                      Konfirmasi Barang Diterima dengan Utuh (Selesai)
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Stage 8: Customer Review Form */}
            {order.status === "8_COMPLETED" && (
              <div className="rounded-2xl bg-[#FAF8F5] border border-[#F3E8D6] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    <h3 className="text-base font-extrabold text-stone-900">
                      Pesanan Selesai — Beri Ulasan Kerenyahan &amp; Kemasan
                      CimoFood
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-0.5 cursor-pointer"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            star <= rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-stone-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {reviewSubmitted ? (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      Ulasan Anda telah tersimpan: &ldquo;{order.notes}&rdquo;
                    </span>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSaveReview}
                    className="flex flex-col sm:flex-row gap-3"
                  >
                    <input
                      type="text"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      className="flex-1 h-11 rounded-xl border border-stone-300 bg-white px-3.5 text-xs sm:text-sm focus:outline-none focus:border-[#EA580C]"
                    />
                    <Button type="submit" variant="primary" size="md">
                      Kirim Ulasan ({rating}★)
                    </Button>
                  </form>
                )}
              </div>
            )}
          </Card>
        )}

        {/* INTERACTIVE 8-STAGE TIMELINE & ORDER DETAILS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Visual 8-Stage Stepper */}
          <div className="lg:col-span-7">
            <Card
              surface="storefront"
              hoverElevation={false}
              className="p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-[#F3E8D6] pb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-stone-900">
                    Timeline 8 Tahap Pesanan CimoFood
                  </h2>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Progres transparan dari pemesanan hingga paket diterima utuh
                  </p>
                </div>
                <Badge variant="spicy" size="md">
                  Tahap {currentStageNumber} / 8
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-3 w-full rounded-full bg-stone-100 overflow-hidden border border-stone-200">
                  <div
                    className="h-full bg-gradient-to-r from-[#EA580C] via-[#F59E0B] to-emerald-600 transition-all duration-500"
                    style={{
                      width: `${Math.max(12, (currentStageNumber / 8) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* 8 Steps Vertical Stepper */}
              <div className="space-y-4">
                {eightStages.map((stage) => {
                  const isCompleted = currentStageNumber > stage.stageNumber;
                  const isCurrent = currentStageNumber === stage.stageNumber;

                  const stageIcons: Record<number, React.ReactNode> = {
                    1: <Package className="h-4 w-4" />,
                    2: <Clock className="h-4 w-4" />,
                    3: <CreditCard className="h-4 w-4" />,
                    4: <CheckCircle2 className="h-4 w-4" />,
                    5: <Store className="h-4 w-4" />,
                    6: <Camera className="h-4 w-4" />,
                    7: <Truck className="h-4 w-4" />,
                    8: <Sparkles className="h-4 w-4" />,
                  };

                  return (
                    <div
                      key={stage.status}
                      className={`rounded-2xl border p-4 transition-all ${
                        isCurrent
                          ? "bg-[#FFFBEB] border-[#EA580C] ring-2 ring-[#EA580C]/20 shadow-sm"
                          : isCompleted
                            ? "bg-emerald-50/40 border-emerald-200/80"
                            : "bg-stone-50/60 border-stone-200/70 opacity-75"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-xs ${
                            isCurrent
                              ? "bg-[#EA580C] text-white shadow-sm"
                              : isCompleted
                                ? "bg-emerald-600 text-white"
                                : "bg-stone-200 text-stone-600"
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            stageIcons[stage.stageNumber]
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3
                              className={`text-sm font-extrabold ${
                                isCurrent
                                  ? "text-[#C2410C]"
                                  : isCompleted
                                    ? "text-emerald-950"
                                    : "text-stone-700"
                              }`}
                            >
                              {stage.label}
                            </h3>
                            {isCurrent && (
                              <Badge variant="spicy" pulseDot size="sm">
                                Tahap Saat Ini
                              </Badge>
                            )}
                            {isCompleted && (
                              <span className="text-[11px] font-bold text-emerald-700">
                                ✓ Selesai
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                            {stage.customerDescription}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right: Order Receipt & Simulator Control */}
          <div className="lg:col-span-5 space-y-6">
            {/* Order Summary Receipt */}
            <Card
              surface="storefront"
              hoverElevation={false}
              className="p-6 space-y-4"
            >
              <div className="border-b border-[#F3E8D6] pb-3">
                <h2 className="text-lg font-extrabold text-stone-900">
                  Rincian Pesanan &amp; Pengiriman
                </h2>
                <p className="text-xs text-stone-500">
                  Dibuat pada {formatDateID(order.created_at)}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-[#EA580C] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-900 block">
                      {order.customer_name} ({order.customer_whatsapp})
                    </span>
                    <span className="text-stone-600">
                      {order.customer_city} — {order.shipping_address}
                    </span>
                  </div>
                </div>
              </div>

              {order.has_sensitive_original_item && (
                <div className="pt-1">
                  <SensitivePackagingBadge label="Kemasan Ekstra Aman SOP Khusus (Varian Original)" />
                </div>
              )}

              <ul className="divide-y divide-stone-200/80 border-t border-b border-stone-200/80 py-2 text-xs">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="py-2 flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-stone-900">
                        {item.product_name_snapshot}
                      </span>{" "}
                      <span className="text-stone-500">
                        ({item.size_label_snapshot}) ×{item.quantity}
                      </span>
                    </div>
                    <span className="font-extrabold text-stone-900">
                      {formatRupiah(item.subtotal_selling)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal Produk</span>
                  <span className="font-bold">
                    {formatRupiah(order.subtotal_selling_price)}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Biaya Packing Aman SOP 4 Lapis</span>
                  <span className="font-bold">
                    {formatRupiah(order.packing_fee)}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Ongkos Kirim ({order.courier})</span>
                  <span className="font-bold text-[#EA580C]">
                    {order.shipping_cost > 0
                      ? formatRupiah(order.shipping_cost)
                      : "Menunggu Konfirmasi Admin"}
                  </span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Diskon Referral / Promo</span>
                    <span>-{formatRupiah(order.discount_amount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-stone-200 flex justify-between text-base font-black text-[#C2410C]">
                  <span>Total Tagihan</span>
                  <span>{formatRupiah(order.grand_total)}</span>
                </div>
              </div>
            </Card>

            {/* Quick Stage Simulator Panel for Demo Testing */}
            <Card
              surface="admin"
              hoverElevation={false}
              className="p-5 space-y-3.5 bg-slate-50 border-slate-200"
            >
              <div className="flex items-center justify-between">
                <Badge variant="info" size="sm">
                  Simulator Penguji 8 Tahap
                </Badge>
                <Link
                  href="/admin"
                  className="text-xs font-bold text-[#EA580C] hover:underline"
                >
                  Buka Dasbor Admin →
                </Link>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Gunakan tombol cepat di bawah untuk mensimulasikan perubahan
                tahap pesanan oleh Admin dan melihat perubahan UI di halaman
                ini secara instan:
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Simulasi Ongkir (Rp):
                  </label>
                  <input
                    type="number"
                    value={simShippingCost}
                    onChange={(e) =>
                      setSimShippingCost(Number(e.target.value) || 0)
                    }
                    className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Simulasi No. Resi:
                  </label>
                  <input
                    type="text"
                    value={simTrackingNumber}
                    onChange={(e) => setSimTrackingNumber(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {eightStages.map((stage) => (
                  <button
                    key={stage.status}
                    type="button"
                    onClick={() => handleSimulateStage(stage.status)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                      order.status === stage.status
                        ? "bg-[#EA580C] text-white border-[#EA580C]"
                        : "bg-white text-slate-700 border-slate-200 hover:border-orange-300"
                    }`}
                  >
                    <span>{stage.label}</span>
                    <span className="text-[10px] opacity-80">
                      {order.status === stage.status ? "Aktif" : "Pilih →"}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>

      <CartDrawer />
    </div>
  );
}

export default function OrderTrackingDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm font-bold text-stone-600">
          Memuat halaman pelacakan pesanan...
        </div>
      }
    >
      <OrderTrackingDetailContent />
    </React.Suspense>
  );
}
