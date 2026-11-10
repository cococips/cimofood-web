"use client";

import * as React from "react";
import Link from "next/link";
import {
  Database,
  Flame,
  Gift,
  LayoutDashboard,
  Menu,
  PackageSearch,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
  X,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { getDataLayerStatus } from "@/lib/supabase";
import { formatRupiah } from "@/lib/utils";
import { computeCartSummary, useCartStore } from "@/store/cart-store";

export function StorefrontNavbar() {
  const items = useCartStore((s) => s.items);
  const isResellerMode = useCartStore((s) => s.isResellerMode);
  const referralCode = useCartStore((s) => s.referralCode);
  const setResellerMode = useCartStore((s) => s.setResellerMode);
  const setCartDrawerOpen = useCartStore((s) => s.setCartDrawerOpen);

  const [mounted, setMounted] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [badgeBounce, setBadgeBounce] = React.useState(false);
  const prevCountRef = React.useRef(0);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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

  const dataLayerStatus = getDataLayerStatus();

  const navLinks = [
    {
      label: "Katalog",
      href: "/#katalog-cimoring",
      icon: <Store className="h-4 w-4 text-[#EA580C]" />,
    },
    {
      label: "Paket Hampers",
      href: "/#hampers-lebaran",
      icon: <Gift className="h-4 w-4 text-amber-600" />,
    },
    {
      label: "Giveaway",
      href: "/#promo-giveaway",
      icon: <Sparkles className="h-4 w-4 text-[#DC2626]" />,
    },
    {
      label: "Lacak Pesanan",
      href: "/track",
      icon: <PackageSearch className="h-4 w-4 text-emerald-600" />,
    },
    {
      label: "Portal Reseller",
      href: "/reseller",
      icon: <Users className="h-4 w-4 text-indigo-600" />,
    },
    {
      label: "Dasbor Admin",
      href: "/admin",
      icon: <LayoutDashboard className="h-4 w-4 text-slate-700" />,
    },
  ];

  return (
    <>
      {/* Top Announcement Ribbon */}
      <div className="bg-gradient-to-r from-[#7C2D12] via-[#C2410C] to-[#DC2626] text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <Flame className="h-3.5 w-3.5 text-amber-300 fill-amber-300 shrink-0" />
            <span>
              <strong>CimoFood Resmi UMKM Cimoring (Sejak 2017)</strong> — Harga
              Lebih Hemat dari Marketplace & Garansi Kemasan SOP 4 Lapis!
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold">
              <Database className="h-3 w-3 text-amber-300" />
              {dataLayerStatus.label}
            </span>
          </div>
        </div>
      </div>

      {/* Main Sticky Navbar */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#F3E8D6] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#DC2626] flex items-center justify-center text-white shadow-md shadow-orange-600/25 group-hover:scale-105 transition-transform">
              <Flame className="h-6 w-6 fill-amber-200 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-stone-900">
                  Cimo<span className="text-[#EA580C]">Food</span>
                </span>
                <Badge variant="golden" size="sm" className="hidden xs:inline-flex">
                  Sejak 2017
                </Badge>
              </div>
              <p className="text-[11px] text-stone-600 hidden sm:block font-medium">
                Renyah • Pedas • P-IRT & Halal Resmi
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((nav) => (
              <Link
                key={nav.label}
                href={nav.href}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-stone-700 hover:text-[#EA580C] hover:bg-orange-100/60 transition-colors"
              >
                {nav.icon}
                <span>{nav.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right Actions: Reseller Mode Toggle & Cart Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Switcher Harga Eceran vs Harga Reseller */}
            <div className="hidden md:flex items-center bg-orange-100/80 p-1 rounded-xl border border-orange-200">
              <button
                type="button"
                onClick={() => setResellerMode(false)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isResellerMode
                    ? "bg-[#EA580C] text-white shadow-xs"
                    : "text-stone-700 hover:text-[#EA580C]"
                }`}
              >
                Harga Web
              </button>
              <button
                type="button"
                onClick={() => setResellerMode(true)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isResellerMode
                    ? "bg-[#C2410C] text-white shadow-xs"
                    : "text-stone-700 hover:text-[#C2410C]"
                }`}
              >
                Harga Reseller
              </button>
            </div>

            {/* Cart Trigger Button with Bouncing Badge */}
            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              aria-label="Buka Keranjang Belanja"
              className="relative inline-flex items-center gap-2.5 h-11 px-3.5 sm:px-4 rounded-2xl bg-gradient-to-r from-[#EA580C] to-[#C2410C] text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-600/25 hover:from-[#F97316] hover:to-[#EA580C] active:scale-[0.97] transition-all cursor-pointer"
            >
              <ShoppingBag
                className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform ${
                  badgeBounce ? "scale-125 -rotate-12" : ""
                }`}
              />
              <span className="hidden sm:inline">Keranjang</span>
              {mounted && summary.totalItems > 0 && (
                <span className="hidden lg:inline text-orange-100 font-normal">
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

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Menu Navigasi"
              className="xl:hidden inline-flex items-center justify-center h-11 w-11 rounded-2xl border border-[#F3E8D6] bg-white text-stone-700 hover:text-[#EA580C] hover:border-orange-300 transition-colors cursor-pointer"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Expandable Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="xl:hidden border-t border-[#F3E8D6] bg-[#FFFBEB] px-4 py-4 space-y-4 animate-in fade-in duration-150">
            {/* Mobile Reseller Price Switcher */}
            <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-orange-200">
              <span className="text-xs font-bold text-stone-700">
                Mode Tampilan Harga:
              </span>
              <div className="flex items-center gap-1 bg-orange-100/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setResellerMode(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    !isResellerMode
                      ? "bg-[#EA580C] text-white"
                      : "text-stone-700"
                  }`}
                >
                  Eceran Web
                </button>
                <button
                  type="button"
                  onClick={() => setResellerMode(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    isResellerMode
                      ? "bg-[#C2410C] text-white"
                      : "text-stone-700"
                  }`}
                >
                  Mitra Reseller
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {navLinks.map((nav) => (
                <Link
                  key={nav.label}
                  href={nav.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#F3E8D6] text-xs font-bold text-stone-800 hover:border-[#EA580C] hover:text-[#EA580C] transition-colors"
                >
                  {nav.icon}
                  <span>{nav.label}</span>
                </Link>
              ))}
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

