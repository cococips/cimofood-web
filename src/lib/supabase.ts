import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  "";

/**
 * Mengecek apakah kredensial Supabase sudah dikonfigurasi dengan URL yang valid.
 * Jika belum diisi, sistem otomatis menggunakan mode Smart Fallback (LocalStorage + Seed Data).
 */
export function isSupabaseConfigured(): boolean {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (
    supabaseUrl.includes("your-project") ||
    supabaseUrl.includes("placeholder") ||
    !supabaseUrl.startsWith("http")
  ) {
    return false;
  }
  return true;
}

/**
 * Instance Supabase Client (bernilai null apabila berjalan dalam mode Smart Fallback LocalStorage)
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Informasi status mode penyimpanan aktif untuk ditampilkan di indikator UI
 */
export function getDataLayerStatus() {
  const connected = isSupabaseConfigured();
  return {
    mode: connected
      ? ("SUPABASE_CLOUD" as const)
      : ("LOCAL_SMART_FALLBACK" as const),
    label: connected
      ? "Supabase Cloud Aktif"
      : "Mode Demo Pintar (LocalStorage + Seed Data)",
    isCloud: connected,
  };
}
