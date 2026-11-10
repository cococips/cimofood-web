export type UserRole = "ADMIN" | "RESELLER";

export type OrderChannel = "ONLINE_WEB" | "OFFLINE_POS" | "RESELLER_WEB";

export type OrderStatus =
  | "1_CHECKOUT_CREATED"
  | "2_WAITING_STOCK_CONFIRMATION"
  | "3_WAITING_PAYMENT"
  | "4_PAID_VERIFIED"
  | "5_PICKED_FROM_PRODUCER"
  | "6_PACKED_SOP_VERIFIED"
  | "7_SHIPPED"
  | "8_COMPLETED"
  | "CANCELLED";

export type CourierType =
  | "ANTERAJA"
  | "JNT"
  | "JNE"
  | "COD_MANDIRI"
  | "AMBIL_DI_TEMPAT";

export type FlavorCategory =
  | "Original"
  | "Pedas"
  | "Balado"
  | "Barbecue"
  | "Balado Asin"
  | "Ekstra Pedas"
  | "Hampers";

export type SizeLabel =
  | "200g"
  | "250g"
  | "500g"
  | "Bal 2kg"
  | "Paket 4 Pouch (1kg)"
  | "Paket Sultan (2kg)"
  | "Eceran";

export interface ProductVariant {
  id: string;
  product_id: string;
  sku?: string;
  size_label: string;
  weight_grams: number;
  base_price: number;     // P_dasar: Harga setor ke produsen Cimoring
  web_price: number;      // P_web: Harga jual eceran web CimoFood (<= shopee_price)
  shopee_price: number;   // P_shopee: Harga referensi di Shopee
  reseller_price: number; // P_reseller: Harga khusus Reseller tanpa minimal order
  stock_qty: number;
  is_ready_stock: boolean;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  flavor_category: FlavorCategory;
  spicy_level: number; // 0 - 5
  description: string;
  image_url: string;
  badge_text?: string;
  is_hampers: boolean;
  is_sensitive_packaging: boolean; // TRUE untuk varian Original (plastik tanpa bumbu lebih tipis)
  pirt_number: string;
  is_halal_certified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  product_name_snapshot: string;
  size_label_snapshot: string;
  is_sensitive_snapshot?: boolean;
  quantity: number;
  unit_base_price: number;
  unit_selling_price: number;
  subtotal_base: number;
  subtotal_selling: number;
}

export interface Order {
  id: string;
  order_code: string;
  channel: OrderChannel;
  status: OrderStatus;

  // Data Pembeli
  customer_name: string;
  customer_whatsapp: string;
  customer_city: string;
  shipping_address: string;

  // Relasi Reseller (Opsional)
  reseller_id: string | null;
  referral_code_used: string | null;

  // Pengiriman & SOP Kemasan 4 Lapis
  courier: CourierType;
  tracking_number: string | null;
  has_sensitive_original_item: boolean;
  sop_sealer_checked: boolean;
  sop_cardboard_layered: boolean;
  sop_bubble_wrap_checked: boolean;
  packing_photo_url: string | null;

  // Keuangan Pesanan
  subtotal_base_price: number;
  subtotal_selling_price: number;
  packing_fee: number;
  packaging_material_cost: number;
  shipping_cost: number;
  discount_amount: number;
  grand_total: number;
  net_profit_cimofood: number;

  // Pembayaran
  payment_method: string;
  payment_proof_url: string | null;
  paid_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface Reseller {
  id: string;
  full_name: string;
  phone_whatsapp: string;
  city: string;
  address: string;
  referral_code: string;
  tier_level: "PEMULA" | "MITRA_AKTIF" | "SULTAN_CIMORING";
  monthly_target_amount: number;
  current_month_sales: number;
  bonus_percentage: number;
  total_orders_referred: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GiveawayParticipant {
  id: string;
  full_name: string;
  whatsapp: string;
  instagram_username: string;
  tiktok_username: string;
  shopee_username: string;
  followed_all_proof_url: string | null;
  coupon_code: string;
  is_verified: boolean;
  created_at: string;
}

export interface OrderStageMetadata {
  status: OrderStatus;
  stageNumber: number; // 1 - 8 (0 for CANCELLED)
  label: string;
  shortLabel: string;
  customerDescription: string;
  adminActionLabel?: string;
  nextStatus?: OrderStatus;
  badgeTone:
    | "amber"
    | "orange"
    | "red"
    | "blue"
    | "indigo"
    | "purple"
    | "emerald"
    | "slate";
}

export const ORDER_STAGES: OrderStageMetadata[] = [
  {
    status: "1_CHECKOUT_CREATED",
    stageNumber: 1,
    label: "1. Pesanan Dibuat",
    shortLabel: "Checkout",
    customerDescription:
      "Pesanan Anda telah tercatat di sistem CimoFood dan siap diteruskan ke WhatsApp Admin.",
    adminActionLabel: "Lanjut ke Konfirmasi Stok",
    nextStatus: "2_WAITING_STOCK_CONFIRMATION",
    badgeTone: "amber",
  },
  {
    status: "2_WAITING_STOCK_CONFIRMATION",
    stageNumber: 2,
    label: "2. Konfirmasi Stok & Ongkir",
    shortLabel: "Cek Stok & Ongkir",
    customerDescription:
      "Admin sedang mengecek ketersediaan stok harian ke dapur produksi Cimoring dan menghitung ongkir ekspedisi terbaik (maks. 1 jam).",
    adminActionLabel: "Konfirmasi Stok & Input Ongkir",
    nextStatus: "3_WAITING_PAYMENT",
    badgeTone: "orange",
  },
  {
    status: "3_WAITING_PAYMENT",
    stageNumber: 3,
    label: "3. Menunggu Pembayaran",
    shortLabel: "Menunggu Bayar",
    customerDescription:
      "Stok & ongkir sudah dikonfirmasi! Silakan lakukan pembayaran via QRIS / Transfer Bank dan unggah bukti bayar.",
    adminActionLabel: "Verifikasi Bukti Pembayaran",
    nextStatus: "4_PAID_VERIFIED",
    badgeTone: "red",
  },
  {
    status: "4_PAID_VERIFIED",
    stageNumber: 4,
    label: "4. Pembayaran Terverifikasi",
    shortLabel: "Dibayar",
    customerDescription:
      "Pembayaran Anda telah diverifikasi oleh Admin CimoFood. Pesanan dijadwalkan diambil dari rumah produksi Cimoring.",
    adminActionLabel: "Tandai Diambil dari Produsen",
    nextStatus: "5_PICKED_FROM_PRODUCER",
    badgeTone: "blue",
  },
  {
    status: "5_PICKED_FROM_PRODUCER",
    stageNumber: 5,
    label: "5. Diambil dari Produsen Cimoring",
    shortLabel: "Diambil Produsen",
    customerDescription:
      "Cimoring segar baru saja diambil langsung dari rumah produksi mitra dan siap masuk meja pengemasan.",
    adminActionLabel: "Verifikasi SOP Packing 4 Lapis",
    nextStatus: "6_PACKED_SOP_VERIFIED",
    badgeTone: "indigo",
  },
  {
    status: "6_PACKED_SOP_VERIFIED",
    stageNumber: 6,
    label: "6. Dikemas SOP 4 Lapis",
    shortLabel: "SOP 4 Lapis",
    customerDescription:
      "Paket Anda telah dikemas dengan Standar Aman 4 Lapis (Sealer + Apit Kardus + Kardus Melingkar + Bubble Wrap) beserta foto bukti.",
    adminActionLabel: "Input Resi & Kirim Paket",
    nextStatus: "7_SHIPPED",
    badgeTone: "purple",
  },
  {
    status: "7_SHIPPED",
    stageNumber: 7,
    label: "7. Dikirim via Ekspedisi",
    shortLabel: "Dikirim",
    customerDescription:
      "Paket sudah diserahkan ke kurir ekspedisi. Anda dapat memantau nomor resi dan foto kemasan di halaman ini.",
    adminActionLabel: "Selesaikan Pesanan",
    nextStatus: "8_COMPLETED",
    badgeTone: "emerald",
  },
  {
    status: "8_COMPLETED",
    stageNumber: 8,
    label: "8. Pesanan Selesai",
    shortLabel: "Selesai",
    customerDescription:
      "Alhamdulillah pesanan telah diterima dengan utuh dan renyah. Terima kasih telah berbelanja di CimoFood!",
    badgeTone: "emerald",
  },
  {
    status: "CANCELLED",
    stageNumber: 0,
    label: "Dibatalkan",
    shortLabel: "Batal",
    customerDescription:
      "Pesanan ini telah dibatalkan karena stok habis atau permintaan pembatalan sebelum pembayaran.",
    badgeTone: "slate",
  },
];

export const ORDER_STATUS_MAP: Record<OrderStatus, OrderStageMetadata> =
  ORDER_STAGES.reduce(
    (acc, item) => {
      acc[item.status] = item;
      return acc;
    },
    {} as Record<OrderStatus, OrderStageMetadata>
  );

