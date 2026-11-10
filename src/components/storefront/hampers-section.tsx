"use client";

import * as React from "react";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Gift,
  HeartHandshake,
  MessageSquareHeart,
  Plus,
  Sparkles,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  SensitivePackagingBadge,
  StockStatusBadge,
  useToast,
} from "@/components/ui";
import { formatRupiah } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import type { ProductWithVariants } from "@/types/database";

export function HampersSection({
  hampersList,
}: {
  hampersList: ProductWithVariants[];
}) {
  const { showToast } = useToast();
  const addItem = useCartStore((s) => s.addItem);
  const isResellerMode = useCartStore((s) => s.isResellerMode);

  const [recipientName, setRecipientName] = React.useState("");
  const [senderName, setSenderName] = React.useState("");
  const [greetingNote, setGreetingNote] = React.useState(
    "Selamat Hari Raya Idul Fitri, mohon maaf lahir & batin. Semoga kerenyahan Cimoring ini menambah kehangatan berkumpul bersama keluarga tercinta!"
  );

  const handleAddHampers = (hampers: ProductWithVariants) => {
    const variant = hampers.variants[0];
    if (!variant) return;

    addItem(hampers, variant, 1);

    try {
      confetti({
        particleCount: 55,
        spread: 60,
        origin: { y: 0.75 },
        colors: ["#EA580C", "#F59E0B", "#10B981"],
      });
    } catch {
      // Abaikan jika confetti gagal
    }

    const activePrice = isResellerMode
      ? variant.reseller_price
      : variant.web_price;

    showToast({
      type: "spicy",
      title: `${hampers.name} Ditambahkan!`,
      description: `Harga ${formatRupiah(activePrice)} lengkap dengan Box Eksklusif & Kartu Ucapan Gratis${
        recipientName ? ` untuk ${recipientName}` : ""
      }.`,
    });
  };

  if (hampersList.length === 0) return null;

  return (
    <section
      id="hampers"
      className="scroll-mt-24 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7]/70 to-[#FFEDD5] border-2 border-[#F59E0B]/50 p-6 sm:p-10 shadow-lg shadow-amber-950/5 space-y-8"
    >
      <span id="hampers-lebaran" className="sr-only" />
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="golden"
              size="md"
              icon={<Gift className="h-4 w-4 text-amber-800" />}
            >
              Bundling Spesial Hari Raya & Oleh-Oleh Keluarga
            </Badge>
            <Badge
              variant="success"
              size="sm"
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            >
              Gratis Kartu Ucapan Custom & Pita Satin
            </Badge>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
            Paket Hampers Lebaran & Hantaran Spesial Cimoring
          </h2>
          <p className="text-sm sm:text-base text-stone-700 leading-relaxed">
            Kirimkan hantaran camilan renyah asli UMKM Cimoring kepada orang
            tua, sahabat, atau relasi bisnis. Dikemas dalam{" "}
            <strong>Box Edisi Hari Raya</strong> dengan pelindung luar{" "}
            <strong>SOP 4 Lapis Anti-Remuk</strong>.
          </p>
        </div>

        <div className="rounded-2xl bg-white/90 border border-amber-300 px-4 py-3 flex items-center gap-3 self-start">
          <HeartHandshake className="h-8 w-8 text-[#EA580C] shrink-0" />
          <div className="text-xs">
            <span className="font-extrabold text-stone-900 block">
              Bisa Kirim Langsung ke Alamat Kerabat!
            </span>
            <span className="text-stone-600">
              Kartu ucapan dicetak rapi di dalam box hampers.
            </span>
          </div>
        </div>
      </div>

      {/* Hampers Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hampersList.map((hampers) => {
          const variant = hampers.variants[0];
          if (!variant) return null;

          const activePrice = isResellerMode
            ? variant.reseller_price
            : variant.web_price;
          const savings = Math.max(0, variant.shopee_price - activePrice);

          return (
            <Card
              key={hampers.id}
              surface="storefront"
              hoverElevation
              className="grid grid-cols-1 sm:grid-cols-12 overflow-hidden border-amber-300/90"
            >
              {/* Left Image */}
              <div className="sm:col-span-5 relative min-h-56 sm:min-h-full bg-stone-100">
                <img
                  src={hampers.image_url}
                  alt={hampers.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <Badge variant="golden" size="sm">
                    {hampers.badge_text || "Edisi Lebaran"}
                  </Badge>
                </div>
                <div className="absolute bottom-3 left-3">
                  <StockStatusBadge
                    isReady={variant.is_ready_stock}
                    stockQty={variant.stock_qty}
                  />
                </div>
              </div>

              {/* Right Content */}
              <div className="sm:col-span-7 p-5 sm:p-6 flex flex-col justify-between gap-4 bg-white">
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#EA580C]">
                      {variant.size_label} • {variant.weight_grams}g
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      Hemat {formatRupiah(savings)}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-stone-900 leading-snug">
                    {hampers.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {hampers.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <SensitivePackagingBadge label="Kemasan Ekstra Aman SOP Khusus" />
                    <Badge
                      variant="spicy"
                      size="sm"
                      icon={<Sparkles className="h-3 w-3" />}
                    >
                      Gratis Kartu Ucapan
                    </Badge>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200/80 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-stone-400 line-through block">
                        Harga Marketplace {formatRupiah(variant.shopee_price)}
                      </span>
                      <span className="text-2xl font-black text-[#C2410C]">
                        {formatRupiah(activePrice)}
                      </span>
                    </div>
                    <div className="text-right text-[11px] text-stone-500">
                      <span>Harga Reseller:</span>
                      <strong className="block text-stone-800">
                        {formatRupiah(variant.reseller_price)}
                      </strong>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    leftIcon={<Plus className="h-4 w-4" />}
                    onClick={() => handleAddHampers(hampers)}
                  >
                    + Keranjang Hampers Ini
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Interactive Free Greeting Card Customizer */}
      <div className="rounded-2xl bg-white/95 border border-amber-300 p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center gap-2 text-[#C2410C] font-extrabold text-sm">
              <MessageSquareHeart className="h-5 w-5" />
              <span>Simulasi & Kustomisasi Kartu Ucapan Hampers Gratis</span>
            </div>
            <p className="text-xs text-stone-600">
              Tulis nama penerima dan pesan hangat Anda di bawah ini. Catatan
              kartu ucapan ini akan otomatis disertakan saat Anda melanjutkan ke
              Checkout.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Kepada (Penerima Hampers):
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Contoh: Keluarga Besar Bpk. H. Ahmad"
                  className="w-full h-10 rounded-xl border border-stone-300 px-3 text-xs focus:outline-none focus:border-[#EA580C]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Dari (Pengirim):
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Contoh: Rina & Keluarga di Bandung"
                  className="w-full h-10 rounded-xl border border-stone-300 px-3 text-xs focus:outline-none focus:border-[#EA580C]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Isi Ucapan Spesial:
              </label>
              <textarea
                rows={2}
                value={greetingNote}
                onChange={(e) => setGreetingNote(e.target.value)}
                className="w-full rounded-xl border border-stone-300 p-2.5 text-xs focus:outline-none focus:border-[#EA580C]"
              />
            </div>
          </div>

          {/* Live Greeting Card Preview */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border-2 border-dashed border-[#F59E0B] p-5 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between border-b border-amber-300/80 pb-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#C2410C]">
                  ✨ Kartu Ucapan Eksklusif CimoFood
                </span>
                <span className="text-[10px] font-bold bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-full">
                  GRATIS
                </span>
              </div>
              <p className="text-xs font-bold text-stone-800">
                Untuk Yth:{" "}
                <span className="text-[#EA580C]">
                  {recipientName || "Keluarga / Sahabat Tercinta"}
                </span>
              </p>
              <p className="text-xs italic text-stone-700 leading-relaxed bg-white/70 p-3 rounded-xl border border-amber-200/60">
                &ldquo;{greetingNote}&rdquo;
              </p>
              <p className="text-xs font-bold text-right text-stone-800 pt-1">
                Salam Hangat,{" "}
                <span className="text-[#C2410C]">
                  {senderName || "Pengirim"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

