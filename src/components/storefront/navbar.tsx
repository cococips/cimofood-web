"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock,
  Flame,
  Gift,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  PackageSearch,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
  X,
} from "lucide-react";
import { Button, useToast } from "@/components/ui";
import { formatRupiah } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { computeCartSummary, useCartStore } from "@/store/cart-store";

export function StorefrontNavbar() {
  const pathname = usePathname();
  const { showToast } = useToast();

  const items = useCartStore((s) => s.items);
  const isResellerMode = useCartStore((s) => s.isResellerMode);
  const referralCode = useCartStore((s) => s.referralCode);
  const setCartDrawerOpen = useCartStore((s) => s.setCartDrawerOpen);

  const role = useAuthStore((s) => s.role);
  const reseller = useAuthStore((s) => s.reseller);
  const logout = useAuthStore((s) => s.logout);
  const syncCartWithRole = useAuthStore((s) => s.syncCartWithRole);

  const [mounted, setMounted] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [badgeBounce, setBadgeBounce] = React.useState(false);
  const [activeHash, setActiveHash] = React.useState("");
  const prevCountRef = React.useRef(0);

  React.useEffect(() => {
    setMounted(true);
    syncCartWithRole();
    setActiveHash(window.location.hash);
    const onHashChange = () => setActiveHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [syncCartWithRole]);

  React.useEffect(() => {
    if (mounted) {
      syncCartWithRole();
    }
  }, [role, mounted, syncCartWithRole]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setActiveHash(window.location.hash);
    }
  }, [pathname]);

  const summary = React.useMemo(
    () => computeCartSummary(items, isResellerMode, referralCode),
    [items, isResellerMode, referralCode]
  );

  // Trigger bouncing animation on cart badge whenever items are added
  React.useEffect(() => {
    if (!mounted) return;
    if (summary.totalItems > prevCountRef.current) {
      setBadgeBounce(true);
      const timer = window.setTimeout(() => setBadgeBounce(false), 650);
      prevCountRef.current = summary.totalItems;
      return () => window.clearTimeout(timer);
    }
    prevCountRef.current = summary.totalItems;
  }, [summary.totalItems, mounted]);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    showToast({
      type: "info",
      title: "Berhasil Keluar Akun",
      description:
        "Anda kini berbelanja menggunakan Harga Eceran Resmi Web CimoFood.",
    });
  };

  const navLinks = [
    {
      label: "Katalog",
      href: "/",
      icon: Store,
      isActive:
        pathname === "/" &&
        activeHash !== "#hampers" &&
        activeHash !== "#hampers-lebaran",
      onClick: () => setActiveHash(""),
    },
    {
      label: "Hampers",
      href: "/#hampers",
      icon: Gift,
      isActive:
        pathname === "/" &&
        (activeHash === "#hampers" || activeHash === "#hampers-lebaran"),
      onClick: () => setActiveHash("#hampers"),
    },
    {
      label: "Giveaway",
      href: "/giveaway",
      icon: Sparkles,
      isActive: pathname.startsWith("/giveaway"),
      onClick: () => setActiveHash(""),
    },
    {
      label: "Lacak Pesanan",
      href: "/track",
      icon: PackageSearch,
      isActive: pathname.startsWith("/track"),
      onClick: () => setActiveHash(""),
    },
    {
      label: "Reseller",
      href: "/reseller",
      icon: Users,
      isActive: pathname.startsWith("/reseller"),
      onClick: () => setActiveHash(""),
    },
  ];

  const effectiveRole = mounted ? role : "guest";

  return (
    <>
      {/* TOP UTILITY BAR (Dark Background: Left Promo & SOP 4-Layer Guarantee | Right Service Hours, WA Help & Role Auth Controls) */}
      <div className="bg-stone-950 border-b border-stone-800 text-stone-200 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-10 flex items-center justify-between gap-4">
          {/* Left Promo Info & 4-Layer Packing Guarantee */}
          <div className="flex items-center gap-2 min-w-0 truncate">
            <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />
            <span className="truncate font-medium text-stone-200">
              <strong className="text-white">
                CimoFood Resmi UMKM Cimoring
              </strong>{" "}
              <span className="hidden md:inline">
                — Harga Lebih Hemat dari Marketplace &amp; Garansi Packing SOP 4
                Lapis!
              </span>
            </span>
          </div>

          {/* Right Customer Utility & RBAC Session Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 whitespace-nowrap">
            {/* Jam Layanan */}
            <span className="hidden xl:inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-300">
              <Clock className="h-3 w-3 text-amber-400 shrink-0" />
              <span>Jam Layanan: 08.00 - 20.00 WIB</span>
            </span>

            {/* Bantuan WhatsApp */}
            <a
              href="https://wa.me/6281223344556?text=Halo%20Admin%20CimoFood%2C%20saya%20ingin%20bertanya%20mengenai%20produk%20Cimoring"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-stone-900 hover:bg-emerald-950/80 border border-stone-700 hover:border-emerald-500/50 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 transition-colors"
            >
              <MessageCircle className="h-3 w-3 shrink-0" />
              <span>Bantuan WhatsApp</span>
            </a>

            {/* Role-Based Action Controls */}
            {effectiveRole === "guest" && (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-full bg-stone-800 hover:bg-[#EA580C] border border-stone-700 hover:border-orange-500 px-3 py-1 text-[11px] font-bold text-white transition-colors"
              >
                <LogIn className="h-3 w-3 text-amber-300 shrink-0" />
                <span>Masuk Mitra / Admin</span>
              </Link>
            )}

            {effectiveRole === "reseller" && (
              <div className="inline-flex items-center gap-1.5">
                <Link
                  href="/reseller"
                  className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/50 px-2.5 py-1 text-[11px] font-extrabold text-amber-300 hover:bg-amber-500/30 transition-colors"
                >
                  <ShieldCheck className="h-3 w-3 text-amber-400 shrink-0" />
                  <span>Mode Harga Reseller Aktif</span>
                  {reseller?.full_name && (
                    <span className="hidden md:inline text-white font-bold">
                      • {reseller.full_name}
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 rounded-full bg-stone-800 hover:bg-red-900/80 border border-stone-700 hover:border-red-500/50 px-2.5 py-1 text-[11px] font-bold text-stone-200 hover:text-white transition-colors cursor-pointer"
                >
                  <LogOut className="h-3 w-3 shrink-0" />
                  <span>Keluar</span>
                </button>
              </div>
            )}

            {effectiveRole === "admin" && (
              <div className="inline-flex items-center gap-1.5">
                <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-1 text-[11px] font-extrabold text-emerald-300">
                  <ShieldCheck className="h-3 w-3 shrink-0" />
                  <span>Admin Aktif</span>
                </span>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#EA580C] hover:bg-[#C2410C] px-3 py-1 text-[11px] font-bold text-white transition-colors"
                >
                  <LayoutDashboard className="h-3 w-3 shrink-0" />
                  <span>Buka Panel Admin</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 rounded-full bg-stone-800 hover:bg-red-900/80 border border-stone-700 hover:border-red-500/50 px-2.5 py-1 text-[11px] font-bold text-stone-200 hover:text-white transition-colors cursor-pointer"
                >
                  <LogOut className="h-3 w-3 shrink-0" />
                  <span>Keluar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAIN STICKY NAVBAR */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#F3E8D6] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-4">
          {/* Brand Logo (Strictly Single-Line Subtext with whitespace-nowrap) */}
          <Link
            href="/"
            onClick={() => setActiveHash("")}
            className="flex items-center gap-3 shrink-0 group focus:outline-none"
          >
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#DC2626] flex items-center justify-center text-white shadow-md shadow-orange-600/20 group-hover:scale-105 transition-transform shrink-0">
              <Flame className="h-5 w-5 sm:h-6 sm:w-6 fill-amber-200 text-white" />
            </div>
            <div className="whitespace-nowrap">
              <span className="block text-xl sm:text-2xl font-black tracking-tight text-stone-900 leading-none">
                Cimo<span className="text-[#EA580C]">Food</span>
              </span>
              <span className="block text-[11px] font-semibold text-stone-500 whitespace-nowrap mt-1">
                Asli Sejak 2017 • P-IRT &amp; Halal
              </span>
            </div>
          </Link>

          {/* Center Main Navigation (5 Customer Menu Items, Strictly Single-Line) */}
          <nav
            aria-label="Navigasi Utama Pelanggan"
            className="hidden lg:flex items-center gap-1.5 shrink-0"
          >
            {navLinks.map((nav) => {
              const Icon = nav.icon;
              return (
                <Link
                  key={nav.label}
                  href={nav.href}
                  onClick={nav.onClick}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
                    nav.isActive
                      ? "bg-orange-50 text-orange-700 font-semibold border-b-2 border-orange-600 shadow-2xs"
                      : "text-stone-600 font-medium hover:text-orange-600 hover:bg-orange-50/50"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      nav.isActive ? "text-orange-600" : "text-current"
                    }`}
                  />
                  <span className="whitespace-nowrap">{nav.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Cart Button & Mobile Hamburger */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Cart Trigger Button with Bouncing Badge */}
            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              aria-label="Buka Keranjang Belanja"
              className="relative inline-flex items-center gap-2.5 h-11 px-3.5 sm:px-4 rounded-2xl bg-gradient-to-r from-[#EA580C] to-[#C2410C] text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-600/20 hover:from-[#F97316] hover:to-[#EA580C] active:scale-[0.97] transition-all cursor-pointer whitespace-nowrap"
            >
              <ShoppingBag
                className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 transition-transform ${
                  badgeBounce ? "scale-125 -rotate-12" : ""
                }`}
              />
              <span className="hidden sm:inline whitespace-nowrap">
                Keranjang
              </span>
              {mounted && summary.totalItems > 0 && (
                <span className="hidden xl:inline text-orange-100 font-normal whitespace-nowrap">
                  • {formatRupiah(summary.subtotalSelling)}
                </span>
              )}
              <span
                className={`inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full text-xs font-black bg-[#F59E0B] text-stone-950 border border-white/60 shadow-xs transition-transform duration-300 ${
                  badgeBounce ? "animate-bounce scale-125 bg-amber-300" : ""
                }`}
              >
                {mounted ? summary.totalItems : 0}
              </span>
            </button>

            {/* Hamburger Menu Toggle Button for Mobile / Small Tablet */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Menu Navigasi"
              className="lg:hidden inline-flex items-center justify-center h-11 w-11 rounded-2xl border border-[#F3E8D6] bg-white text-stone-700 hover:text-[#EA580C] hover:border-orange-300 transition-colors cursor-pointer"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Responsive Hamburger Menu Drawer for Mobile / Small Tablet */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-[#F3E8D6] bg-[#FFFBEB] px-4 py-4 space-y-4 shadow-lg">
            {/* Mobile Role Status & Service Info Banner */}
            <div className="rounded-2xl bg-white p-3.5 border border-orange-200 flex items-center justify-between gap-3">
              {effectiveRole === "guest" ? (
                <>
                  <div>
                    <span className="text-[11px] font-bold text-stone-500 block">
                      Status Akun Belanja
                    </span>
                    <span className="text-xs font-extrabold text-stone-900">
                      Pembeli Eceran Resmi
                    </span>
                  </div>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#EA580C] text-white text-xs font-bold whitespace-nowrap"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Masuk Mitra / Admin</span>
                  </Link>
                </>
              ) : effectiveRole === "reseller" ? (
                <>
                  <div>
                    <span className="text-[11px] font-extrabold text-[#C2410C] block">
                      Mode Harga Reseller Aktif
                    </span>
                    <span className="text-xs font-black text-stone-900">
                      {reseller?.full_name} ({reseller?.referral_code})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Keluar</span>
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-[11px] font-extrabold text-emerald-700 block">
                      Mode Pengelola Aktif
                    </span>
                    <span className="text-xs font-black text-stone-900">
                      Admin Owner CimoFood
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#EA580C] text-white text-xs font-bold"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      <span>Panel Admin</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 5 Main Navigation Links */}
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((nav) => {
                const Icon = nav.icon;
                return (
                  <Link
                    key={nav.label}
                    href={nav.href}
                    onClick={() => {
                      nav.onClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs whitespace-nowrap transition-colors ${
                      nav.isActive
                        ? "bg-orange-50 text-orange-700 font-semibold border-orange-500"
                        : "bg-white border-[#F3E8D6] font-medium text-stone-700 hover:border-orange-300 hover:text-orange-600"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        nav.isActive ? "text-orange-600" : "text-current"
                      }`}
                    />
                    <span className="whitespace-nowrap">{nav.label}</span>
                  </Link>
                );
              })}

              <a
                href="https://wa.me/6281223344556?text=Halo%20Admin%20CimoFood%2C%20saya%20butuh%20bantuan%20pesanan"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold whitespace-nowrap"
              >
                <MessageCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="whitespace-nowrap">Bantuan WhatsApp</span>
              </a>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 px-1">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#EA580C]" />
                Jam Layanan: 08.00 - 20.00 WIB
              </span>
              <span>P-IRT &amp; Halal Resmi</span>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Floating Bottom Cart Bar when items exist */}
      {mounted && summary.totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-30 sm:hidden">
          <div className="rounded-2xl bg-stone-900/95 backdrop-blur-md text-white p-3.5 shadow-2xl border border-orange-500/30 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-extrabold bg-[#EA580C] text-white">
                  {summary.totalItems} Kemasan
                </span>
                {summary.totalSavingsVsShopee > 0 && (
                  <span className="text-[11px] font-semibold text-emerald-400">
                    Hemat {formatRupiah(summary.totalSavingsVsShopee)}
                  </span>
                )}
              </div>
              <p className="text-base font-black text-amber-300 mt-0.5">
                {formatRupiah(summary.subtotalSelling)}
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              rightIcon={<ShoppingBag className="h-4 w-4" />}
              onClick={() => setCartDrawerOpen(true)}
            >
              Lihat Keranjang
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
