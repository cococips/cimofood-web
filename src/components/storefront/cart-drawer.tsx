"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Minus,
  PackageCheck,
  Plus,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { Badge, Button, useToast } from "@/components/ui";
import { formatRupiah } from "@/lib/utils";
import { computeCartSummary, useCartStore } from "@/store/cart-store";

export function CartDrawer({
  onProceedCheckout,
}: {
  onProceedCheckout?: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();

  const items = useCartStore((s) => s.items);
  const isResellerMode = useCartStore((s) => s.isResellerMode);
  const referralCode = useCartStore((s) => s.referralCode);
  const isCartDrawerOpen = useCartStore((s) => s.isCartDrawerOpen);

  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const setReferralCode = useCartStore((s) => s.setReferralCode);
  const setCartDrawerOpen = useCartStore((s) => s.setCartDrawerOpen);

  const summary = React.useMemo(
    () => computeCartSummary(items, isResellerMode, referralCode),
    [items, isResellerMode, referralCode]
  );

  // Close on Escape key
  React.useEffect(() => {
    if (!isCartDrawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCartDrawerOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isCartDrawerOpen, setCartDrawerOpen]);

  const handleCheckoutClick = () => {
    setCartDrawerOpen(false);
    if (onProceedCheckout) {
      onProceedCheckout();
    } else {
      router.push("/checkout");
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isCartDrawerOpen
          ? "pointer-events-auto visible"
          : "pointer-events-none invisible"
      }`}
      aria-hidden={!isCartDrawerOpen}
    >
      {/* Backdrop */}
      <div
        onClick={() => setCartDrawerOpen(false)}
        className={`fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity duration-300 ${
          isCartDrawerOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Right Slide-Over Panel */}
      <aside
        aria-label="Keranjang Belanja CimoFood"
        className={`fixed top-0 right-0 bottom-0 z-10 w-full max-w-md bg-white shadow-2xl border-l border-[#F3E8D6] flex flex-col transition-transform duration-300 ease-out ${
          isCartDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 bg-[#FAF8F5] border-b border-[#F3E8D6] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-stone-900">
                  Keranjang Belanja
                </h2>
                <Badge variant="spicy" size="sm">
                  {summary.totalItems} Item
                </Badge>
              </div>
              <p className="text-xs text-stone-600">
                {isResellerMode
                  ? "Mode Harga Grosir Reseller Aktif"
                  : "Harga Resmi Web CimoFood (≤ Shopee)"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCartDrawerOpen(false)}
            aria-label="Tutup Keranjang"
            className="h-10 w-10 rounded-xl inline-flex items-center justify-center text-stone-500 hover:bg-orange-100 hover:text-[#EA580C] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {items.length === 0 ? (
            <div className="h-full min-h-72 flex flex-col items-center justify-center text-center px-4 space-y-4">
              <div className="h-20 w-20 rounded-3xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#EA580C]">
                <ShoppingBag className="h-10 w-10 stroke-[1.6]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-stone-900">
                  Keranjang Anda Masih Kosong
                </h3>
                <p className="text-xs text-stone-600 max-w-xs leading-relaxed">
                  Yuk pilih varian rasa Cimoring favorit Anda (Pedas, Balado,
                  Original, BBQ, Balado Asin, atau Ekstra Pedas) dan nikmati
                  harga hemat langsung dari produsen!
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => setCartDrawerOpen(false)}
              >
                Mulai Pilih Varian Rasa
              </Button>
            </div>
          ) : (
            <>
              {/* Alert SOP Varian Original */}
              {summary.hasSensitiveOriginal && (
                <div className="rounded-2xl bg-amber-50 border border-amber-300 p-3.5 text-amber-950 flex items-start gap-2.5">
                  <ShieldAlert className="h-5 w-5 text-[#C2410C] shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <span className="font-extrabold block text-amber-950">
                      Proteksi Kemasan Ekstra Aman SOP Khusus Aktif!
                    </span>
                    Keranjang Anda berisi varian <strong>Original</strong>. Tim
                    packing CimoFood otomatis mengemas ekstra hati-hati (tidak
                    menekan kardus terlalu kencang agar plastik tidak jepot)
                    beserta bukti foto kemasan.
                  </div>
                </div>
              )}

              {/* Item List */}
              <div className="space-y-3">
                {items.map((item) => {
                  const unitPrice = isResellerMode
                    ? item.resellerPrice
                    : item.webPrice;
                  const itemSubtotal = unitPrice * item.quantity;
                  const itemSaving =
                    Math.max(0, item.shopeePrice - unitPrice) * item.quantity;

                  return (
                    <div
                      key={item.variantId}
                      className="rounded-2xl border border-[#F3E8D6] bg-[#FAF8F5]/70 p-3.5 flex gap-3.5 hover:border-orange-300 transition-colors"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="h-20 w-20 rounded-xl object-cover bg-stone-100 shrink-0 border border-stone-200/80"
                      />

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-extrabold text-stone-900 leading-snug truncate">
                            {item.productName}
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              removeItem(item.variantId);
                              showToast({
                                type: "info",
                                title: "Item Dihapus dari Keranjang",
                                description: `${item.productName} (${item.sizeLabel}) telah dihapus.`,
                              });
                            }}
                            aria-label="Hapus item"
                            className="text-stone-400 hover:text-[#DC2626] p-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="spicy" size="sm">
                            Ukuran {item.sizeLabel}
                          </Badge>
                          {item.isSensitivePackaging && (
                            <Badge variant="sensitive" size="sm">
                              SOP Khusus Original
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <p className="text-sm font-black text-[#C2410C]">
                              {formatRupiah(itemSubtotal)}
                            </p>
                            {itemSaving > 0 && (
                              <span className="text-[11px] font-semibold text-emerald-700 block">
                                Hemat {formatRupiah(itemSaving)} vs Shopee
                              </span>
                            )}
                          </div>

                          {/* Quantity Stepper */}
                          <div className="inline-flex items-center rounded-xl border border-stone-300 bg-white p-0.5">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.variantId,
                                  item.quantity - 1
                                )
                              }
                              aria-label="Kurangi jumlah"
                              className="h-7 w-7 rounded-lg inline-flex items-center justify-center text-stone-700 hover:bg-orange-100 hover:text-[#EA580C] cursor-pointer"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-extrabold text-stone-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.variantId,
                                  item.quantity + 1
                                )
                              }
                              disabled={item.quantity >= item.maxStock}
                              aria-label="Tambah jumlah"
                              className="h-7 w-7 rounded-lg inline-flex items-center justify-center text-stone-700 hover:bg-orange-100 hover:text-[#EA580C] disabled:opacity-40 cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Referral / Promo Input */}
              <div className="rounded-2xl bg-[#FFFBEB] border border-amber-200 p-3.5 space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                  <Tag className="h-3.5 w-3.5 text-[#EA580C]" />
                  <span>Kode Referral Reseller / Promo (Opsional):</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="Contoh: RINACIMO / DEDIKRIUK"
                    className="flex-1 h-9 rounded-xl border border-amber-300 bg-white px-3 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-[#EA580C]"
                  />
                  {referralCode && (
                    <button
                      type="button"
                      onClick={() => setReferralCode("")}
                      className="px-2.5 text-xs font-semibold text-stone-500 hover:text-stone-800 cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-stone-600">
                  Gunakan kode referral mitra resmi (misal{" "}
                  <button
                    type="button"
                    onClick={() => setReferralCode("RINACIMO")}
                    className="font-bold text-[#EA580C] underline cursor-pointer"
                  >
                    RINACIMO
                  </button>
                  ) untuk ekstra potongan Rp2.000!
                </p>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer: Subtotal, Packing Fee & Proceed to Checkout */}
        {items.length > 0 && (
          <div className="p-5 sm:p-6 bg-[#FAF8F5] border-t border-[#F3E8D6] space-y-4">
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-stone-600">
                <span>
                  Subtotal Produk ({summary.totalItems} kemasan •{" "}
                  {(summary.totalWeightGrams / 1000).toFixed(2)} kg)
                </span>
                <span className="font-bold text-stone-900">
                  {formatRupiah(summary.subtotalSelling)}
                </span>
              </div>

              <div className="flex items-center justify-between text-stone-600">
                <span className="inline-flex items-center gap-1.5">
                  <PackageCheck className="h-4 w-4 text-[#EA580C]" />
                  Biaya Kemasan Aman SOP 4 Lapis
                </span>
                <span className="font-bold text-stone-900">
                  {formatRupiah(summary.packingFee)}
                </span>
              </div>

              {summary.referralDiscount > 0 && (
                <div className="flex items-center justify-between text-emerald-700 font-semibold">
                  <span>Diskon Kode Referral ({referralCode})</span>
                  <span>-{formatRupiah(summary.referralDiscount)}</span>
                </div>
              )}

              {summary.totalSavingsVsShopee > 0 && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 flex items-center justify-between text-xs text-emerald-800">
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    Total Lebih Hemat dari Marketplace:
                  </span>
                  <span className="font-black">
                    {formatRupiah(summary.totalSavingsVsShopee)}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-stone-200 flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-extrabold text-stone-900 block">
                    Estimasi Total Tagihan
                  </span>
                  <span className="text-[11px] text-stone-500">
                    *Belum termasuk ongkir ekspedisi (dikonfirmasi Admin)
                  </span>
                </div>
                <span className="text-xl font-black text-[#C2410C]">
                  {formatRupiah(summary.estimatedTotalBeforeShipping)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  clearCart();
                  showToast({
                    type: "info",
                    title: "Keranjang Dikosongkan",
                    description: "Seluruh item telah dihapus dari keranjang.",
                  });
                }}
              >
                Kosongkan
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                rightIcon={<ArrowRight className="h-5 w-5" />}
                onClick={handleCheckoutClick}
              >
                Lanjut ke Checkout
              </Button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

