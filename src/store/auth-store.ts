"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCartStore } from "@/store/cart-store";
import type { Reseller } from "@/types/database";

export type UserAuthRole = "guest" | "reseller" | "admin";

export interface AdminUserProfile {
  name: string;
  email: string;
  whatsapp: string;
  roleTitle: string;
}

interface AuthStoreState {
  role: UserAuthRole;
  reseller: Reseller | null;
  adminUser: AdminUserProfile | null;

  // Actions
  loginAsAdmin: (profile?: Partial<AdminUserProfile>) => void;
  loginAsReseller: (reseller: Reseller) => void;
  updateActiveReseller: (reseller: Reseller) => void;
  logout: () => void;
  syncCartWithRole: () => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      role: "guest",
      reseller: null,
      adminUser: null,

      loginAsAdmin: (profile) => {
        const adminProfile: AdminUserProfile = {
          name: profile?.name || "Admin Owner CimoFood",
          email: profile?.email || "admin@cimofood.id",
          whatsapp: profile?.whatsapp || "6281223344556",
          roleTitle: profile?.roleTitle || "Pengelola CimoFood & Owner Cimoring",
        };
        set({
          role: "admin",
          reseller: null,
          adminUser: adminProfile,
        });
      },

      loginAsReseller: (reseller) => {
        set({
          role: "reseller",
          reseller,
          adminUser: null,
        });
        // Otomatis mengunci harga katalog ke Harga Grosir Reseller
        const cart = useCartStore.getState();
        cart.setResellerMode(true);
        cart.setReferralCode(reseller.referral_code);
      },

      updateActiveReseller: (reseller) => {
        if (get().role === "reseller") {
          set({ reseller });
          const cart = useCartStore.getState();
          cart.setResellerMode(true);
          cart.setReferralCode(reseller.referral_code);
        }
      },

      logout: () => {
        set({
          role: "guest",
          reseller: null,
          adminUser: null,
        });
        // Kembali ke guest: mengunci mode harga kembali ke Harga Eceran Web
        const cart = useCartStore.getState();
        cart.setResellerMode(false);
        cart.setReferralCode("");
      },

      syncCartWithRole: () => {
        const { role, reseller } = get();
        const cart = useCartStore.getState();
        if (role === "reseller" && reseller) {
          if (!cart.isResellerMode) {
            cart.setResellerMode(true);
          }
          if (cart.referralCode !== reseller.referral_code) {
            cart.setReferralCode(reseller.referral_code);
          }
        } else if (role === "guest") {
          // Publik (guest) tidak bisa mengaktifkan harga reseller tanpa login
          if (cart.isResellerMode) {
            cart.setResellerMode(false);
          }
        }
      },
    }),
    {
      name: "cimofood-auth-storage-v1",
      partialize: (state) => ({
        role: state.role,
        reseller: state.reseller,
        adminUser: state.adminUser,
      }),
    }
  )
);

