"use client";

import * as React from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Gift,
  Sparkles,
  Ticket,
  Trophy,
  Upload,
  Users,
} from "lucide-react";
import { CartDrawer, StorefrontNavbar } from "@/components/storefront";
import { Badge, Button, Card, useToast } from "@/components/ui";
import {
  getGiveawayParticipants,
  registerGiveawayParticipant,
} from "@/lib/data-service";
import { formatDateID } from "@/lib/utils";
import type { GiveawayParticipant } from "@/types/database";

const SAMPLE_FOLLOW_PROOF =
  "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=700&q=80";

export default function GiveawayCampaignPage() {
  const { showToast } = useToast();

  const [participants, setParticipants] = React.useState<GiveawayParticipant[]>(
    []
  );
  const [followIg, setFollowIg] = React.useState(false);
  const [followTiktok, setFollowTiktok] = React.useState(false);
  const [followShopee, setFollowShopee] = React.useState(false);

  const [fullName, setFullName] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [igUsername, setIgUsername] = React.useState("");
  const [tiktokUsername, setTiktokUsername] = React.useState("");
  const [shopeeUsername, setShopeeUsername] = React.useState("");
  const [proofUrl, setProofUrl] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [createdCoupon, setCreatedCoupon] =
    React.useState<GiveawayParticipant | null>(null);
  const [copiedCoupon, setCopiedCoupon] = React.useState(false);

  const loadParticipants = React.useCallback(async () => {
    const list = await getGiveawayParticipants();
    setParticipants(list);
  }, []);

  React.useEffect(() => {
    loadParticipants();
    const onUpdated = () => loadParticipants();
    window.addEventListener("cimofood-data-updated", onUpdated);
    return () => window.removeEventListener("cimofood-data-updated", onUpdated);
  }, [loadParticipants]);

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProofUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!followIg || !followTiktok || !followShopee) {
      showToast({
        type: "warning",
        title: "Centang Ketiga Tugas Follow Terlebih Dahulu!",
        description:
          "Pastikan Anda sudah mencentang Follow Instagram @cimoring, TikTok @cimoring, dan Shopee Cimoring.",
      });
      return;
    }

    if (!fullName.trim() || !whatsapp.trim()) {
      showToast({
        type: "error",
        title: "Nama & Nomor WhatsApp Wajib Diisi",
        description:
          "Mohon isi Nama Lengkap dan Nomor WhatsApp aktif untuk klaim kupon undian.",
      });
      return;
    }

    const fallbackHandle = fullName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 12);

    setIsSubmitting(true);
    try {
      const registered = await registerGiveawayParticipant({
        full_name: fullName,
        whatsapp,
        instagram_username: igUsername.trim()
          ? igUsername.startsWith("@")
            ? igUsername.trim()
            : `@${igUsername.trim()}`
          : `@${fallbackHandle || "peserta"}_ig`,
        tiktok_username: tiktokUsername.trim()
          ? tiktokUsername.startsWith("@")
            ? tiktokUsername.trim()
            : `@${tiktokUsername.trim()}`
          : `@${fallbackHandle || "peserta"}_tt`,
        shopee_username:
          shopeeUsername.trim() || `${fallbackHandle || "peserta"}.shopee`,
        followed_all_proof_url: proofUrl || SAMPLE_FOLLOW_PROOF,
      });

      setCreatedCoupon(registered);
      await loadParticipants();

      try {
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      showToast({
        type: "success",
        title: "Nomor Kupon Undian & Voucher Berhasil Diklaim!",
        description: `Kode Kupon Anda: ${registered.coupon_code}. Data Anda otomatis tercatat di Dasbor Admin CimoFood!`,
      });
    } catch {
      showToast({
        type: "error",
        title: "Gagal Mendaftar Giveaway",
        description: "Silakan coba beberapa saat lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCoupon = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCoupon(true);
      showToast({
        type: "info",
        title: "Nomor Kupon Disalin!",
        description: `${code} berhasil disalin ke clipboard.`,
      });
      setTimeout(() => setCopiedCoupon(false), 2000);
    } catch {
      // ignore
    }
  };

  const allFollowed = followIg && followTiktok && followShopee;

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBEB] text-stone-900">
      <StorefrontNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
        {/* HERO BANNER GIVEAWAY */}
        <div className="rounded-3xl bg-gradient-to-br from-[#DC2626] via-[#EA580C] to-stone-950 text-white p-6 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-300 text-stone-950 text-xs font-black">
              <Gift className="h-4 w-4" />
              <span>PROGRAM PROMOSI &amp; GIVEAWAY RESMI CIMORING</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Klaim Kupon Undian{" "}
              <span className="text-amber-300 underline decoration-amber-400/50">
                10 Paket Hampers Sultan
              </span>{" "}
              &amp; Voucher Diskon Belanja!
            </h1>
            <p className="text-sm sm:text-base text-orange-100 leading-relaxed">
              Selesaikan 3 langkah mudah mengikuti media sosial resmi{" "}
              <strong className="text-white">@cimoring</strong>, masukkan Nama
              &amp; Nomor WhatsApp Anda, dan dapatkan{" "}
              <strong className="text-amber-300">
                Nomor Kupon Undian / Voucher Diskon
              </strong>{" "}
              beserta selebrasi instan!
            </p>
          </div>
        </div>

        {/* HASIL KLAIM KUPON JIKA SUDAH SUBMIT */}
        {createdCoupon && (
          <Card className="p-6 sm:p-8 border-2 border-emerald-500 bg-gradient-to-r from-emerald-50 via-white to-amber-50 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <Badge variant="success" size="md">
                  🎉 Selamat! Kupon Undian &amp; Voucher Diskon Aktif
                </Badge>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900">
                  Halo Kak {createdCoupon.full_name}, Kupon Anda Tercatat Resmi!
                </h2>
                <p className="text-xs sm:text-sm text-stone-600">
                  Data kepesertaan Anda telah masuk secara otomatis ke tab{" "}
                  <Link
                    href="/admin/giveaway"
                    className="font-bold text-[#EA580C] underline"
                  >
                    Peserta Giveaway di Dasbor Admin
                  </Link>
                  . Simpan kode kupon berikut untuk pengundian akhir bulan!
                </p>
              </div>

              <div className="rounded-2xl bg-white border-2 border-dashed border-[#EA580C] px-5 py-4 flex items-center gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-stone-400 block">
                    NOMOR KUPON UNDIAN / VOUCHER
                  </span>
                  <span className="font-mono text-2xl font-black text-[#EA580C]">
                    {createdCoupon.coupon_code}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopyCoupon(createdCoupon.coupon_code)}
                  leftIcon={
                    copiedCoupon ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )
                  }
                >
                  {copiedCoupon ? "Tersalin" : "Salin"}
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* KOLOM KIRI: 3 TUGAS INTERAKTIF & FORM KLAIM KUPON */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="p-6 sm:p-7 space-y-6 bg-white">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <Badge variant="spicy" size="md">
                    Langkah 1: Checklist Tugas Peserta
                  </Badge>
                  <h2 className="text-xl font-black text-stone-900">
                    Centang 3 Tugas Follow Akun Resmi Cimoring
                  </h2>
                </div>
                <Badge
                  variant={allFollowed ? "success" : "warning"}
                  size="md"
                >
                  {[followIg, followTiktok, followShopee].filter(Boolean).length}
                  /3 Selesai
                </Badge>
              </div>

              <div className="space-y-3">
                {[
                  {
                    checked: followIg,
                    onChange: setFollowIg,
                    title: "1. Follow Instagram @cimoring",
                    desc: "Ikuti akun Instagram resmi @cimoring untuk info katalog terbaru & live undian.",
                    url: "https://instagram.com",
                  },
                  {
                    checked: followTiktok,
                    onChange: setFollowTiktok,
                    title: "2. Follow TikTok @cimoring",
                    desc: "Tonton keseruan produksi Cimoring renyah sejak 2017 & promo flash sale.",
                    url: "https://tiktok.com",
                  },
                  {
                    checked: followShopee,
                    onChange: setFollowShopee,
                    title: "3. Follow Shopee Cimoring",
                    desc: "Ikuti toko resmi Shopee Cimoring untuk verifikasi peserta Giveaway.",
                    url: "https://shopee.co.id",
                  },
                ].map((step) => (
                  <div
                    key={step.title}
                    onClick={() => step.onChange(!step.checked)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      step.checked
                        ? "bg-emerald-50 border-emerald-500 text-emerald-950"
                        : "bg-amber-50/60 border-amber-200 hover:border-[#EA580C]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={step.checked}
                        onChange={(e) => step.onChange(e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-5 w-5 accent-emerald-600 mt-0.5 shrink-0"
                      />
                      <div>
                        <p className="text-sm font-extrabold">{step.title}</p>
                        <p className="text-xs text-stone-600 mt-0.5">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                    <a
                      href={step.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-extrabold text-[#EA580C] hover:underline flex items-center gap-1 shrink-0"
                    >
                      <span>Buka</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleSubmitGiveaway}
                className="space-y-4 pt-4 border-t border-amber-200/80"
              >
                <div className="space-y-1">
                  <Badge variant="warning" size="md">
                    Langkah 2: Ambil Nomor Kupon Undian
                  </Badge>
                  <h3 className="text-lg font-black text-stone-900">
                    Isi Nama &amp; Nomor WhatsApp Aktif
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-stone-700 mb-1.5">
                      Nama Lengkap Peserta *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Contoh: Dinda Kirana"
                      className="w-full h-12 px-4 rounded-2xl border border-amber-300 bg-white text-sm font-semibold focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-stone-700 mb-1.5">
                      Nomor WhatsApp Aktif *
                    </label>
                    <input
                      type="tel"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="w-full h-12 px-4 rounded-2xl border border-amber-300 bg-white text-sm font-semibold focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">
                      Username IG (Opsional)
                    </label>
                    <input
                      type="text"
                      value={igUsername}
                      onChange={(e) => setIgUsername(e.target.value)}
                      placeholder="@username_ig"
                      className="w-full h-11 px-3.5 rounded-xl border border-amber-200 bg-white text-xs font-semibold focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">
                      Username TikTok (Opsional)
                    </label>
                    <input
                      type="text"
                      value={tiktokUsername}
                      onChange={(e) => setTiktokUsername(e.target.value)}
                      placeholder="@username_tiktok"
                      className="w-full h-11 px-3.5 rounded-xl border border-amber-200 bg-white text-xs font-semibold focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">
                      Username Shopee (Opsional)
                    </label>
                    <input
                      type="text"
                      value={shopeeUsername}
                      onChange={(e) => setShopeeUsername(e.target.value)}
                      placeholder="username_shopee"
                      className="w-full h-11 px-3.5 rounded-xl border border-amber-200 bg-white text-xs font-semibold focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                </div>

                {/* Upload Bukti Screenshot Follow */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-600">
                    Bukti Screenshot Follow (Opsional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <label className="flex-1 min-w-[200px] h-11 px-4 rounded-xl border-2 border-dashed border-amber-300 hover:border-[#EA580C] bg-amber-50/50 flex items-center justify-center gap-2 text-xs font-extrabold text-stone-700 cursor-pointer">
                      <Upload className="h-4 w-4 text-[#EA580C]" />
                      <span>Upload Screenshot...</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProofFileChange}
                        className="hidden"
                      />
                    </label>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setProofUrl(SAMPLE_FOLLOW_PROOF)}
                    >
                      Gunakan Sampel Bukti
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isSubmitting}
                  leftIcon={<Ticket className="h-5 w-5" />}
                >
                  Ambil Nomor Kupon Undian &amp; Voucher Diskon!
                </Button>
              </form>
            </Card>
          </div>

          {/* KOLOM KANAN: INFO HADIAH & DAFTAR PESERTA TERBARU */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6 space-y-4 bg-gradient-to-b from-amber-50 to-white border-2 border-amber-300">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-[#EA580C] text-white flex items-center justify-center">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">
                    Hadiah Utama Giveaway Cimoring
                  </h3>
                  <p className="text-xs text-stone-600">
                    Dikirim gratis dengan Kemasan Aman SOP 4 Lapis!
                  </p>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-stone-700 font-semibold">
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#EA580C] shrink-0" />
                  <span>
                    <strong>3 Pemenang Utama:</strong> Paket Hampers Sultan
                    Keluarga (2kg / 8 Pouch Lengkap Semua Rasa)
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#EA580C] shrink-0" />
                  <span>
                    <strong>7 Pemenang Favorit:</strong> Paket Hampers Lebaran 4
                    Pouch (1kg) + Kartu Ucapan Eksklusif
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#EA580C] shrink-0" />
                  <span>
                    <strong>Voucher Belanja:</strong> Seluruh peserta terdaftar
                    berhak menikmati harga spesial Web CimoFood!
                  </span>
                </li>
              </ul>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Link href="/" className="block">
                  <Button variant="outline" size="sm" fullWidth>
                    Belanja Katalog
                  </Button>
                </Link>
                <Link href="/admin/giveaway" className="block">
                  <Button variant="secondary" size="sm" fullWidth>
                    Lihat di Admin
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Daftar Peserta Giveaway Terbaru */}
            <Card className="p-6 space-y-4 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#EA580C]" />
                  <span>Peserta Terdaftar ({participants.length})</span>
                </h3>
                <Badge variant="success" size="sm">
                  Tersinkron ke Admin
                </Badge>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-stone-900">
                          {p.full_name}
                        </span>
                        {p.is_verified && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        )}
                      </div>
                      <p className="text-xs text-stone-500">
                        IG: {p.instagram_username} • TikTok: {p.tiktok_username}
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {formatDateID(p.created_at)}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-[#C2410C] shrink-0">
                      {p.coupon_code}
                    </span>
                  </div>
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
