"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductVariant, ProductWithVariants } from "@/types/database";

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  flavorCategory: string;
  sizeLabel: string;
  weightGrams: number;
  imageUrl: string;
  isSensitivePackaging: boolean;
  basePrice: number;
  webPrice: number;
  shopeePrice: number;
  resellerPrice: number;
  quantity: number;
  maxStock: number;
}

interface CartStoreState {
  items: CartItem[];
  isResellerMode: boolean;
  referralCode: string;
  isCartDrawerOpen: boolean;

  // Actions
  addItem: (
    product: ProductWithVariants,
    variant: ProductVariant,
    qty?: number
  ) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  setResellerMode: (enabled: boolean) => void;
  setReferralCode: (code: string) => void;
  setCartDrawerOpen: (open: boolean) => void;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      isResellerMode: false,
      referralCode: "",
      isCartDrawerOpen: false,

      addItem: (product, variant, qty = 1) => {
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex(
          (i) => i.variantId === variant.id
        );

        if (existingIndex > -1) {
          const existing = currentItems[existingIndex];
          const nextQty = Math.min(
            variant.stock_qty,
            existing.quantity + qty
          );
          const updated = [...currentItems];
          updated[existingIndex] = {
            ...existing,
            quantity: nextQty,
            maxStock: variant.stock_qty,
          };
          set({ items: updated });
        } else {
          const newItem: CartItem = {
            variantId: variant.id,
            productId: product.id,
            productName: product.name,
            flavorCategory: product.flavor_category,
            sizeLabel: variant.size_label,
            weightGrams: variant.weight_grams,
            imageUrl: product.image_url,
            isSensitivePackaging: product.is_sensitive_packaging,
            basePrice: variant.base_price,
            webPrice: variant.web_price,
            shopeePrice: variant.shopee_price,
            resellerPrice: variant.reseller_price,
            quantity: Math.min(variant.stock_qty, Math.max(1, qty)),
            maxStock: variant.stock_qty,
          };
          set({ items: [...currentItems, newItem] });
        }
      },

      removeItem: (variantId) => {
        set({
          items: get().items.filter((i) => i.variantId !== variantId),
        });
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          set({
            items: get().items.filter((i) => i.variantId !== variantId),
          });
          return;
        }
        set({
          items: get().items.map((item) =>
            item.variantId === variantId
              ? {
                  ...item,
                  quantity: Math.min(item.maxStock, Math.round(quantity)),
                }
              : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      setResellerMode: (enabled) => set({ isResellerMode: enabled }),

      setReferralCode: (code) => set({ referralCode: code.toUpperCase() }),

      setCartDrawerOpen: (open) => set({ isCartDrawerOpen: open }),
    }),
    {
      name: "cimofood-cart-storage-v1",
      partialize: (state) => ({
        items: state.items,
        isResellerMode: state.isResellerMode,
        referralCode: state.referralCode,
      }),
    }
  )
);

/**
 * Helper untuk menghitung ringkasan keranjang belanja secara reaktif
 */
export function computeCartSummary(
  items: CartItem[],
  isResellerMode: boolean,
  referralCode?: string
) {
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalWeightGrams = items.reduce(
    (sum, i) => sum + i.weightGrams * i.quantity,
    0
  );
  const hasSensitiveOriginal = items.some((i) => i.isSensitivePackaging);

  const subtotalBase = items.reduce(
    (sum, i) => sum + i.basePrice * i.quantity,
    0
  );
  const subtotalSelling = items.reduce((sum, i) => {
    const unitPrice = isResellerMode ? i.resellerPrice : i.webPrice;
    return sum + unitPrice * i.quantity;
  }, 0);
  const totalShopeePrice = items.reduce(
    (sum, i) => sum + i.shopeePrice * i.quantity,
    0
  );

  const totalSavingsVsShopee = Math.max(0, totalShopeePrice - subtotalSelling);
  const packingFee = totalItems > 0 ? 2500 : 0;
  const referralDiscount =
    referralCode && referralCode.trim().length >= 4 && totalItems > 0
      ? 2000
      : 0;
  const estimatedTotalBeforeShipping = Math.max(
    0,
    subtotalSelling + packingFee - referralDiscount
  );

  return {
    totalItems,
    totalWeightGrams,
    hasSensitiveOriginal,
    subtotalBase,
    subtotalSelling,
    totalShopeePrice,
    totalSavingsVsShopee,
    packingFee,
    referralDiscount,
    estimatedTotalBeforeShipping,
  };
}

