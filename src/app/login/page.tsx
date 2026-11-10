"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Flame,
  Handshake,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogIn,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { CartDrawer, StorefrontNavbar } from "@/components/storefront";
import { Badge, Button, Card, useToast } from "@/components/ui";
import { getResellers, registerNewReseller } from "@/lib/data-service";
import { normalizeWhatsAppNumber } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { Reseller } from "@/types/database";

type AuthTab = "login" | "register";

function LoginPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const role = useAuthStore((s) => s.role);
  const activeReseller = useAuthStore((s) => s.reseller);
  const adminUser = useAuthStore((s) => s.adminUser);
  const loginAsAdmin = useAuthStore((s) => s.loginAsAdmin);
  const loginAsReseller = useAuthStore((s) => s.loginAsReseller);
  const logout = useAuthStore((s) => s.logout);

  const initialTabParam = searchParams.get("tab");
  const redirectParam = searchParams.get("redirect");

  const [activeTab, setActiveTab] = React.useState<AuthTab>(
    initialTabParam === "register" ? "register" : "login"
  );
  const [resellers, setResellers] = React.useState<Reseller[]>([]);

  // Form Login State
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  // Form Register Reseller State
  const [regName, setRegName] = React.useState("");
  const [regPhone, setRegPhone] = React.useState("");
  const [regCity, setRegCity] = React.useState("");
  const [regAddress, setRegAddress] = React.useState("");
  const [regCode, setRegCode] = React.useState("");
  const [isRegistering, setIsRegistering] = React.useState(false);

  // Collapsible Quick Testing Section (Khusus Tim & Dosen)
  const [isQuickTestOpen, setIsQuickTestOpen] = React.useState(false);

  React.useEffect(() => {
    if (initialTabParam === "register") {
      setActiveTab("register");
    } else if (initialTabParam === "login") {
      setActiveTab("login");
    }
  }, [initialTabParam]);

  const loadResellerAccounts = React.useCallback(async () => {
    const list = await getResellers();
    setResellers(list);
  }, []);

  React.useEffect(() => {
    loadResellerAccounts();
  }, [loadResellerAccounts]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanInput) {
      showToast({
        type: "warning",
        title: "Identitas Akun Kosong",
        description:
          "Masukkan Email Admin, Kode Referral Reseller, atau Nomor WhatsApp terdaftar.",
      });
      return;
    }

    setIsLoggingIn(true);
    try {
      const lowerInput = cleanInput.toLowerCase();
      const isTryingAdmin =
        lowerInput === "admin@cimofood.id" ||
        lowerInput === "admin" ||
        normalizeWhatsAppNumber(cleanInput) === "6281223344550";

      // 1. Validasi Akun Admin CimoFood
      if (isTryingAdmin) {
        if (cleanPass !== "admincimo2026") {
          showToast({
            type: "error",
            title: "Kata Sandi Admin Salah",
            description:
              "Gunakan kata sandi resmi Admin CimoFood (admincimo2026) untuk mengakses Dasbor Operasional.",
          });
          setIsLoggingIn(false);
          return;
        }

        loginAsAdmin({
          name: "Admin Owner CimoFood",
          email: "admin@cimofood.id",
        });

        showToast({
          type: "success",
          title: "Login Admin Berhasil!",
          description:
            "Selamat datang di Dasbor Operasional CimoFood & UMKM Cimoring.",
        });

        router.push(redirectParam || "/admin");
        return;
      }

      // 2. Validasi Akun Mitra Reseller Terdaftar (berdasarkan Kode Referral atau Nomor WhatsApp)
      const latestResellers =
        resellers.length > 0 ? resellers : await getResellers();
      const upperCode = cleanInput.toUpperCase();
      const normalizedInputPhone = normalizeWhatsAppNumber(cleanInput);

      const matchedReseller = latestResellers.find((r) => {
        const matchCode = r.referral_code.toUpperCase() === upperCode;
        const matchPhone =
          r.phone_whatsapp &&
          normalizeWhatsAppNumber(r.phone_whatsapp) === normalizedInputPhone &&
          normalizedInputPhone.length >= 9;
        return matchCode || matchPhone;
      });

      if (!matchedReseller) {
        showToast({
          type: "error",
          title: "Akun Reseller Tidak Ditemukan",
          description:
            "Kode Referral atau Nomor WhatsApp belum terdaftar. Silakan periksa kembali atau daftar gratis di tab Daftar Reseller Baru.",
        });
        setIsLoggingIn(false);
        return;
      }

      loginAsReseller(matchedReseller);
      showToast({
        type: "success",
        title: `Selamat Datang, ${matchedReseller.full_name}!`,
        description: `Mode Harga Grosir Reseller & Kode Referral (${matchedReseller.referral_code}) otomatis diaktifkan.`,
      });

      router.push(redirectParam || "/reseller");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim() || !regCity.trim()) {
      showToast({
        type: "warning",
        title: "Formulir Belum Lengkap",
        description:
          "Mohon lengkapi Nama Lengkap, Nomor WhatsApp Aktif, dan Kota Domisili.",
      });
      return;
    }

    setIsRegistering(true);
    try {
      const created = await registerNewReseller({
        full_name: regName,
        phone_whatsapp: regPhone,
        city: regCity,
        address: regAddress || regCity,
        preferred_code: regCode,
      });

      loginAsReseller(created);

      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore confetti error
      }

      showToast({
        type: "success",
        title: `Pendaftaran Berhasil, ${created.full_name}!`,
        description: `Kode Referral Anda: ${created.referral_code}. Harga grosir reseller langsung aktif sejak pcs pertama!`,
      });

      router.push("/reseller");
    } catch {
      showToast({
        type: "error",
        title: "Pendaftaran Gagal",
        description: "Terjadi kendala saat mendaftarkan akun mitra reseller.",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleInstantQuickLoginAdmin = () => {
    loginAsAdmin({
      name: "Admin Owner CimoFood",
      email: "admin@cimofood.id",
    });
    showToast({
      type: "success",
      title: "Login Instan Admin Aktif",
      description: "Membuka Dasbor Operasional CimoFood...",
    });
    router.push(redirectParam || "/admin");
  };

  const handleInstantQuickLoginReseller = async (preferredCode: string) => {
    const list = resellers.length > 0 ? resellers : await getResellers();
    const target =
      list.find((r) => r.referral_code.toUpperCase() === preferredCode) ||
      list[0];
    if (!target) return;

    loginAsReseller(target);
    showToast({
      type: "success",
      title: `Login Instan Mitra: ${target.full_name}`,
      description: `Harga Reseller & Kode Referral ${target.referral_code} aktif.`,
    });
    router.push("/reseller");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBEB] text-stone-900">
      <StorefrontNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-600 hover:text-[#EA580C] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Etalase Belanja CimoFood</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: BRAND VALUE PROPOSITION & ROLE EXPLANATION */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-gradient-to-br from-stone-950 via-[#9A3412] to-[#EA580C] text-white p-6 sm:p-8 shadow-xl space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-xs font-extrabold">
                <ShieldCheck className="h-4 w-4 text-amber-300" />
                <span>PORTAL AUTENTIKASI RESMI CIMOFOOD</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Akses Mitra Reseller &amp; Pengelola Resmi{" "}
                <span className="text-amber-300">UMKM Cimoring</span>
              </h1>

              <p className="text-xs sm:text-sm text-orange-100 leading-relaxed">
                Sistem CimoFood memisahkan akses belanja pelanggan eceran, harga
                grosir khusus Mitra Reseller, dan Dasbor Operasional Admin agar
                transaksi aman dan transparan.
              </p>

              <div className="space-y-3 pt-2">
                <div className="rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 p-4 space-y-1">
                  <p className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                    <Handshake className="h-4 w-4" />
                    Keuntungan Login Mitra Reseller
                  </p>
                  <p className="text-xs text-orange-50 leading-relaxed">
                    Otomatis membuka <strong>Harga Grosir Sejak Pcs Pertama</strong>{" "}
                    di seluruh katalog, memantau target bonus bulanan 5%, dan
                    mengunduh foto materi promosi HD.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 p-4 space-y-1">
                  <p className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                    <LayoutDashboard className="h-4 w-4" />
                    Akses Pengelola &amp; Owner (Admin)
                  </p>
                  <p className="text-xs text-orange-50 leading-relaxed">
                    Kelola pesanan 8 tahap, verifikasi SOP pengemasan 4 lapis,
                    kasir POS offline, kontrol stok real-time, dan unduh laporan
                    keuangan Excel.
                  </p>
                </div>
              </div>
            </div>

            {/* Active Session Status Card if already logged in */}
            {role !== "guest" && (
              <Card className="p-5 border-2 border-emerald-300 bg-emerald-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="success" size="sm" pulseDot>
                    Sesi Login Aktif
                  </Badge>
                  <span className="text-xs font-bold text-emerald-800 uppercase">
                    Role: {role === "admin" ? "Admin Owner" : "Mitra Reseller"}
                  </span>
                </div>
                <p className="text-sm font-black text-stone-900">
                  {role === "admin"
                    ? adminUser?.name || "Admin Owner CimoFood"
                    : activeReseller?.full_name}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link href={role === "admin" ? "/admin" : "/reseller"}>
                    <Button variant="primary" size="sm">
                      {role === "admin"
                        ? "Buka Dasbor Admin"
                        : "Buka Dasbor Reseller"}
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      logout();
                      showToast({
                        type: "info",
                        title: "Berhasil Keluar Akun",
                        description:
                          "Sesi dikembalikan ke Mode Pembeli Eceran Publik.",
                      });
                    }}
                  >
                    Keluar (Logout)
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* RIGHT COLUMN: 2-TAB AUTH CARD + COLLAPSIBLE QUICK TEST SECTION */}
          <div className="lg:col-span-7">
            <Card className="p-6 sm:p-8 bg-white border-2 border-[#F3E8D6] shadow-xl space-y-6">
              {/* 2-Tab Switcher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 rounded-2xl bg-amber-50 border border-amber-200">
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                    activeTab === "login"
                      ? "bg-[#EA580C] text-white shadow-md shadow-orange-600/20"
                      : "text-stone-700 hover:text-[#EA580C]"
                  }`}
                >
                  <LogIn className="h-4 w-4 shrink-0" />
                  <span>Masuk Akun (Reseller / Admin)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                    activeTab === "register"
                      ? "bg-[#EA580C] text-white shadow-md shadow-orange-600/20"
                      : "text-stone-700 hover:text-[#EA580C]"
                  }`}
                >
                  <UserPlus className="h-4 w-4 shrink-0" />
                  <span>Daftar Reseller Baru (Gratis)</span>
                </button>
              </div>

              {/* TAB 1: MASUK AKUN (RESELLER / ADMIN) */}
              {activeTab === "login" ? (
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-stone-900">
                      Masuk ke Akun Mitra atau Admin
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-600">
                      Mitra Reseller dapat masuk menggunakan{" "}
                      <strong>Kode Referral</strong> atau{" "}
                      <strong>Nomor WhatsApp</strong> terdaftar. Pengelola masuk
                      menggunakan email resmi Admin.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-extrabold uppercase text-stone-700 mb-1.5">
                        Kode Referral Reseller / Nomor WA / Email Admin *
                      </label>
                      <div className="relative">
                        <UserCheck className="h-4 w-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="Contoh: RINACIMO atau 081223344556 atau admin@cimofood.id"
                          className="w-full h-12 pl-11 pr-4 rounded-2xl border border-amber-300 bg-[#FAF8F5] text-sm font-semibold text-stone-900 focus:outline-none focus:bg-white focus:border-[#EA580C]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase text-stone-700 mb-1.5">
                        Kata Sandi (Khusus Admin • Opsional bagi Reseller)
                      </label>
                      <div className="relative">
                        <Lock className="h-4 w-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Masukkan kata sandi jika login sebagai Admin"
                          className="w-full h-12 pl-11 pr-4 rounded-2xl border border-amber-300 bg-[#FAF8F5] text-sm font-semibold text-stone-900 focus:outline-none focus:bg-white focus:border-[#EA580C]"
                        />
                      </div>
                      <span className="text-[11px] text-stone-500 mt-1 block">
                        * Mitra Reseller cukup memasukkan Kode Referral atau
                        Nomor WhatsApp terdaftar tanpa kata sandi.
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isLoggingIn}
                    leftIcon={<LogIn className="h-5 w-5" />}
                  >
                    Masuk Sekarang
                  </Button>
                </form>
              ) : (
                /* TAB 2: DAFTAR RESELLER BARU (GRATIS) */
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="golden" size="sm">
                        100% Gratis Tanpa Biaya Pendaftaran
                      </Badge>
                    </div>
                    <h2 className="text-xl font-black text-stone-900">
                      Formulir Pendaftaran Mitra Reseller CimoFood
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-600">
                      Langsung dapatkan{" "}
                      <strong>Harga Grosir Sejak Pcs Pertama</strong> tanpa
                      minimal order dan Kode Referral unik untuk pelanggan Anda.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-stone-700 mb-1.5">
                      Nama Lengkap Mitra *
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Contoh: Teh Santi Susanti"
                      className="w-full h-12 px-4 rounded-2xl border border-amber-300 bg-[#FAF8F5] text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#EA580C]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold uppercase text-stone-700 mb-1.5">
                        Nomor WhatsApp Aktif *
                      </label>
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="0812xxxxxxxx"
                        className="w-full h-12 px-4 rounded-2xl border border-amber-300 bg-[#FAF8F5] text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#EA580C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase text-stone-700 mb-1.5">
                        Kota / Kabupaten *
                      </label>
                      <input
                        type="text"
                        required
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        placeholder="Contoh: Garut / Bandung"
                        className="w-full h-12 px-4 rounded-2xl border border-amber-300 bg-[#FAF8F5] text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#EA580C]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-stone-700 mb-1.5">
                      Alamat Lengkap Toko / Domisili
                    </label>
                    <input
                      type="text"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      placeholder="Contoh: Jl. Ahmad Yani No. 22, Kec. Garut Kota"
                      className="w-full h-12 px-4 rounded-2xl border border-amber-300 bg-[#FAF8F5] text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#EA580C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-stone-700 mb-1.5">
                      Kode Referral Pilihan (Opsional)
                    </label>
                    <input
                      type="text"
                      value={regCode}
                      onChange={(e) => setRegCode(e.target.value.toUpperCase())}
                      placeholder="Contoh: SANTICIMO (Kosongkan agar dibuat otomatis)"
                      className="w-full h-12 px-4 rounded-2xl border border-amber-300 bg-[#FAF8F5] font-mono text-sm font-bold uppercase focus:outline-none focus:bg-white focus:border-[#EA580C]"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isRegistering}
                    leftIcon={<Flame className="h-5 w-5" />}
                  >
                    Daftar &amp; Aktifkan Harga Reseller Sekarang
                  </Button>
                </form>
              )}

              {/* COLLAPSIBLE BOTTOM SECTION: AKSES CEPAT PENGUJIAN (KHUSUS TIM & DOSEN) */}
              <div className="pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsQuickTestOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <KeyRound className="h-3.5 w-3.5 text-[#EA580C]" />
                    <span>Akses Cepat Pengujian (Khusus Tim &amp; Dosen)</span>
                  </span>
                  {isQuickTestOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {isQuickTestOpen && (
                  <div className="mt-3 p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      Gunakan tombol 1-klik di bawah ini untuk langsung menguji
                      skenario <strong>Role-Based Access Control (RBAC)</strong>{" "}
                      tanpa perlu mengetik kredensial secara manual:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={handleInstantQuickLoginAdmin}
                        className="p-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-left transition-all cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase text-amber-400 block">
                            1-Klik Role Admin
                          </span>
                          <span className="text-xs font-extrabold block">
                            Login sebagai Admin Owner
                          </span>
                          <span className="text-[11px] text-stone-300 font-mono">
                            admin@cimofood.id
                          </span>
                        </div>
                        <LayoutDashboard className="h-4 w-4 text-amber-400 shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleInstantQuickLoginReseller("RINACIMO")
                        }
                        className="p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-stone-900 text-left transition-all cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase text-[#C2410C] block">
                            1-Klik Role Reseller
                          </span>
                          <span className="text-xs font-extrabold block">
                            Login Mitra: Teh Rina
                          </span>
                          <span className="text-[11px] text-stone-600 font-mono">
                            Kode: RINACIMO • Bandung
                          </span>
                        </div>
                        <Users className="h-4 w-4 text-[#EA580C] shrink-0" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-stone-500">
                      <span>
                        Akun Mitra Lainnya:{" "}
                        <button
                          type="button"
                          onClick={() =>
                            handleInstantQuickLoginReseller("SITIHOT")
                          }
                          className="font-mono font-bold text-[#EA580C] underline cursor-pointer mr-2"
                        >
                          SITIHOT (Target Tercapai)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleInstantQuickLoginReseller("DEDIKRIUK")
                          }
                          className="font-mono font-bold text-[#EA580C] underline cursor-pointer"
                        >
                          DEDIKRIUK (Mitra Pemula)
                        </button>
                      </span>
                      <span className="inline-flex items-center gap-1 text-stone-500">
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        Sandi Admin: <code>admincimo2026</code>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      <CartDrawer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FFFBEB] text-stone-700 text-sm font-bold">
          Memuat Portal Autentikasi CimoFood...
        </div>
      }
    >
      <LoginPortalContent />
    </React.Suspense>
  );
}
