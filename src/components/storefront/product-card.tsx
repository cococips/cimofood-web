"use client";

import * as React from "react";
import {
  Check,
  Eye,
  Plus,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  SensitivePackagingBadge,
  SpicyLevelBadge,
  StockStatusBadge,
  useToast,
} from "@/components/ui";
import { formatRupiah } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import type { ProductWithVariants } from "@/types/database";

export interface ProductCardProps {
  product: ProductWithVariants;
  forcedSizeLabel?: string | null;
  onViewDetail: (product: ProductWithVariants) => void;
}

export function ProductCard({
  product,
  forcedSizeLabel,
  onViewDetail,
}: ProductCardProps) {
  const { showToast } = useToast();
  const addItem = useCartStore((s) => s.addItem);
  const isResellerMode = useCartStore((s) => s.isResellerMode);
  const cartItems = useCartStore((s) => s.items);

  // Default pilih ukuran 250g jika ada, atau varian pertama
  const [selectedVariantId, setSelectedVariantId] = React.useState<string>(
    () => {
      const preferred =
        product.variants.find((v) => v.size_label === "250g") ||
        product.variants[0];
      return preferred ? preferred.id : "";
    }
  );
  const [justAdded, setJustAdded] = React.useState(false);

  // Jika filter kategori memilih ukuran tertentu (misal "Bal 2kg"), sinkronkan pil ukuran otomatis
  React.useEffect(() => {
    if (!forcedSizeLabel) return;
    const matched = product.variants.find(
      (v) => v.size_label.toLowerCase() === forcedSizeLabel.toLowerCase()
    );
    if (matched) {
      setSelectedVariantId(matched.id);
    }
  }, [forcedSizeLabel, product.variants]);

  const activeVariant =
    product.variants.find((v) => v.id === selectedVariantId) ||
    product.variants[0];

  if (!activeVariant) return null;

  const activePrice = isResellerMode
    ? activeVariant.reseller_price
    : activeVariant.web_price;
  const savingsAmount = Math.max(0, activeVariant.shopee_price - activePrice);
  const savingsPercentage = Math.round(
    (savingsAmount / activeVariant.shopee_price) * 100
  );

  const isOutOfStock =
    !activeVariant.is_ready_stock || activeVariant.stock_qty <= 0;

  const currentQtyInCart =
    cartItems.find((i) => i.variantId === activeVariant.id)?.quantity || 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, activeVariant, 1);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 900);

    showToast({
      type: "spicy",
      title: `+1 ${product.name} (${activeVariant.size_label})`,
      description: `Masuk ke keranjang seharga ${formatRupiah(activePrice)} (Hemat ${formatRupiah(savingsAmount)} dari harga marketplace!).`,
    });
  };

  return (
    <Card
      surface="storefront"
      hoverElevation
      className="flex flex-col justify-between group"
    >
      <div>
        {/* Product Image & Floating Badges */}
        <div className="relative h-56 w-full bg-stone-100 overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Top Left Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[85%]">
            {product.badge_text && (
              <Badge variant="spicy" size="sm" className="shadow-xs">
                {product.badge_text}
              </Badge>
            )}
            <SpicyLevelBadge level={product.spicy_level} />
          </div>

          {/* Top Right Savings Pill */}
          {savingsPercentage > 0 && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center rounded-full bg-[#DC2626] text-white px-2.5 py-1 text-[11px] font-black shadow-sm">
                Hemat {savingsPercentage}%
              </span>
            </div>
          )}

          {/* Bottom Overlay Stock Status Badge */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
            <StockStatusBadge
              isReady={activeVariant.is_ready_stock}
              stockQty={activeVariant.stock_qty}
            />
            {currentQtyInCart > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-900/90 text-amber-300 px-2.5 py-1 text-[11px] font-bold shadow-xs">
                <ShoppingBag className="h-3 w-3" /> {currentQtyInCart} di
                Keranjang
              </span>
            )}
          </div>
        </div>

        {/* Product Title & Special Original SOP Badge */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg font-extrabold leading-snug group-hover:text-[#EA580C] transition-colors">
              {product.name}
            </CardTitle>
          </div>

          {/* Label Informasi Khusus pada Varian Original */}
          {product.is_sensitive_packaging && (
            <div className="pt-1 space-y-1">
              <SensitivePackagingBadge label="Kemasan Ekstra Aman SOP Khusus" />
              <p className="text-[11px] text-amber-900/90 bg-amber-50 border border-amber-200/80 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-[#C2410C] shrink-0" />
                <span>
                  Plastik tanpa minyak bumbu lebih tipis — dikemas SOP 4 Lapis
                  anti-jepot + bukti foto.
                </span>
              </p>
            </div>
          )}

          <CardDescription className="line-clamp-2 mt-1 text-xs sm:text-sm">
            {product.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Pilihan Pil Ukuran Interaktif (200g, 250g, 500g, Bal 2kg) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Pilih Ukuran Kemasan:
              </span>
              <span className="text-[11px] font-semibold text-stone-500">
                Berat Bersih: <strong>{activeVariant.weight_grams}g</strong>
              </span>
            </div>

            <div
              className={`grid gap-1.5 ${
                product.variants.length >= 4
                  ? "grid-cols-4"
                  : product.variants.length === 1
                    ? "grid-cols-1"
                    : "grid-cols-2"
              }`}
            >
              {product.variants.map((variant) => {
                const isSelected = variant.id === activeVariant.id;
                const variantOut =
                  !variant.is_ready_stock || variant.stock_qty <= 0;

                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`relative py-2 px-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-[#EA580C] to-[#C2410C] text-white border-[#EA580C] shadow-sm shadow-orange-600/20 scale-[1.02]"
                        : variantOut
                          ? "bg-stone-100 text-stone-400 border-stone-200 line-through"
                          : "bg-[#FAF8F5] text-stone-700 border-stone-200/90 hover:border-[#EA580C] hover:text-[#EA580C]"
                    }`}
                  >
                    {variant.size_label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-Time Price & Marketplace Comparison Box */}
          <div className="rounded-2xl bg-gradient-to-br from-[#FFFBEB] to-[#FFF7ED] border border-[#FED7AA] p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-stone-500 line-through font-medium">
                  Marketplace {formatRupiah(activeVariant.shopee_price)}
                </span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300/70 px-2 py-0.5 rounded-full">
                  Hemat {formatRupiah(savingsAmount)}
                </span>
              </div>
              <span className="text-[11px] font-bold text-stone-600">
                Stok: {activeVariant.stock_qty} pcs
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-1.5">
              <div>
                <p className="text-2xl font-black text-[#C2410C] tracking-tight">
                  {formatRupiah(activePrice)}
                </p>
                <p className="text-[11px] text-stone-600 font-medium mt-0.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-600" />
                  {isResellerMode
                    ? "Harga Khusus Mitra Reseller Aktif"
                    : `Harga Reseller: ${formatRupiah(activeVariant.reseller_price)}`}
                </p>
              </div>

              <span className="text-[11px] font-semibold text-stone-500 bg-white/80 px-2.5 py-1 rounded-lg border border-orange-200/60">
                /{activeVariant.size_label}
              </span>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Action Footer */}
      <CardFooter className="bg-white border-t border-[#F3E8D6] gap-2.5">
        <Button
          variant="outline"
          size="md"
          onClick={() => onViewDetail(product)}
          leftIcon={<Eye className="h-4 w-4" />}
          aria-label={`Detail ${product.name}`}
        >
          Detail
        </Button>

        <Button
          variant={justAdded ? "success" : "primary"}
          size="md"
          fullWidth
          disabled={isOutOfStock}
          leftIcon={
            justAdded ? (
              <Check className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )
          }
          onClick={handleAddToCart}
        >
          {isOutOfStock
            ? "Stok Habis"
            : justAdded
              ? "Ditambahkan!"
              : "+ Keranjang"}
        </Button>
      </CardFooter>
    </Card>
  );
}

