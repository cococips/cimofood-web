"use client";

import * as React from "react";
import {
  Award,
  CheckCircle2,
  Flame,
  Gift,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
} from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";

export function HeroTrustBar({
  onOpenSopModal,
}: {
  onOpenSopModal: () => void;
}) {
  const trustBadges = [
    {
      title: "Izin Edar PIRT Resmi",
      subtitle: "P-IRT 2063205011245-27 Terdaftar",
      icon: <Award className="h-5 w-5 text-[#EA580C]" />,
      bg: "bg-orange-50 border-orange-200/90",
    },
    {
      title: "100% Bersertifikat Halal",
      subtitle: "Bahan baku & bumbu rempah halal",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
      bg: "bg-emerald-50/80 border-emerald-200/90",
    },
    {
      title: "Harga Transparan",
      subtitle: "Lebih Hemat dari Marketplace",
      icon: <Tag className="h-5 w-5 text-amber-600" />,
      bg: "bg-amber-50 border-amber-200/90",
    },
    {
      title: "Garansi Packing 4 Lapis Anti-Remuk",
      subtitle: "Sealer + Kardus + Bubble + Foto Bukti",
      icon: <ShieldCheck className="h-5 w-5 text-[#DC2626]" />,
      bg: "bg-red-50/80 border-red-200/90",
    },
  ];

  return (
    <section className="space-y-6">
      {/* Main Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFFBEB] via-[#FFF7ED] to-[#FFEDD5] border border-[#FED7AA] p-6 sm:p-10 shadow-lg shadow-orange-950/5">
        {/* Decorative warm glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-[#F59E0B]/20 to-[#EA580C]/20 blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Copywriting */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="chili"
                pulseDot
                icon={<Flame className="h-3.5 w-3.5 fill-current" />}
              >
                Etalase Resmi Produsen Tunggal UMKM Cimoring
              </Badge>
              <Badge
                variant="golden"
                icon={<Sparkles className="h-3.5 w-3.5 text-amber-700" />}
              >
                Kriuk Renyah Bikin Nagih
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-900 leading-[1.14]">
              Cimoring Asli Produsen Sejak 2017 –{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EA580C] via-[#C2410C] to-[#DC2626]">
                Renyah, Gurih, Kemasan Aman 4 Lapis
              </span>
            </h1>

            <p className="text-base sm:text-lg text-stone-700 leading-relaxed max-w-2xl">
              Pesan langsung dari dapur produksi{" "}
              <strong>UMKM Cimoring</strong> tanpa potongan komisi marketplace!
              Nikmati 6 varian rasa autentik dalam 4 pilihan ukuran dengan{" "}
              <strong>harga lebih hemat dari Shopee</strong>, konfirmasi stok
              cepat via WhatsApp, serta bukti foto kemasan sebelum dikirim.
            </p>

            {/* Primary CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                variant="primary"
                size="lg"
                leftIcon={<ShoppingBag className="h-5 w-5" />}
                onClick={() => {
                  document
                    .getElementById("katalog-cimoring")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Belanja Sekarang
              </Button>
              <Button
                variant="golden"
                size="lg"
                leftIcon={<Gift className="h-5 w-5" />}
                onClick={() => {
                  document
                    .getElementById("hampers-lebaran")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Lihat Paket Hampers Lebaran
              </Button>
              <Button
                variant="outline"
                size="lg"
                leftIcon={<PackageCheck className="h-5 w-5 text-[#EA580C]" />}
                onClick={onOpenSopModal}
              >
                Standar SOP 4 Lapis
              </Button>
            </div>
          </div>

          {/* Right Visual Feature Card */}
          <div className="lg:col-span-5">
            <Card surface="spicyHighlight" hoverElevation={false} className="p-1.5">
              <div className="bg-white rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="relative h-44 w-full rounded-xl overflow-hidden bg-stone-100">
                  <img
                    src="https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=900&q=80"
                    alt="Cimoring Asli Sejak 2017"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent flex flex-col justify-end p-4 text-white">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                      Jaminan Kualitas Produsen
                    </span>
                    <p className="text-base font-extrabold leading-snug">
                      Digoreng Renyah Setiap Hari & Dikemas SOP 4 Lapis
                    </p>
                  </div>
                </div>

                {/* Comparison Mini Table */}
                <div className="rounded-xl bg-[#FFFBEB] border border-amber-200 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                    <span>Keunggulan Beli di Web CimoFood:</span>
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Hemat s/d Rp17.000
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-white rounded-lg p-2.5 border border-amber-200/70">
                      <span className="text-stone-500 block">
                        Kemasan 250g di Web
                      </span>
                      <span className="text-base font-black text-[#EA580C]">
                        Mulai Rp13.000
                      </span>
                      <span className="text-[11px] text-stone-400 line-through block">
                        Shopee Rp15.500
                      </span>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 border border-amber-200/70">
                      <span className="text-stone-500 block">
                        Varian Original
                      </span>
                      <span className="text-xs font-extrabold text-amber-900 mt-0.5 block">
                        SOP Khusus Anti-Jepot
                      </span>
                      <span className="text-[11px] text-emerald-700 font-semibold block">
                        + Foto Bukti Packing
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* 4 Official Trust Badges Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {trustBadges.map((badge) => (
          <div
            key={badge.title}
            className={`flex items-start gap-3.5 rounded-2xl border p-4 transition-all hover:shadow-md bg-white ${badge.bg}`}
          >
            <div className="h-11 w-11 rounded-xl bg-white shadow-xs border border-stone-200/70 flex items-center justify-center shrink-0">
              {badge.icon}
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-stone-900 leading-snug">
                {badge.title}
              </h2>
              <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                {badge.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

