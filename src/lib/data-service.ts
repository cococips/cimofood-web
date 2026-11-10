import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  SEED_GIVEAWAY_PARTICIPANTS,
  SEED_ORDER_ITEMS,
  SEED_ORDERS,
  SEED_PRODUCTS,
  SEED_RESELLERS,
  SEED_VARIANTS,
} from "@/lib/seed-data";
import {
  calculateOrderFinancials,
  generateOrderCode,
  normalizeWhatsAppNumber,
} from "@/lib/utils";
import type {
  CourierType,
  GiveawayParticipant,
  Order,
  OrderChannel,
  OrderItem,
  OrderStatus,
  OrderWithItems,
  Product,
  ProductVariant,
  ProductWithVariants,
  Reseller,
} from "@/types/database";

const STORAGE_KEYS = {
  PRODUCTS: "cimofood_db_products_v1",
  VARIANTS: "cimofood_db_variants_v1",
  ORDERS: "cimofood_db_orders_v1",
  ORDER_ITEMS: "cimofood_db_order_items_v1",
  RESELLERS: "cimofood_db_resellers_v1",
  GIVEAWAY: "cimofood_db_giveaway_v1",
} as const;

const isBrowser = typeof window !== "undefined";

function readLocal<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      window.localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, data: T): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("cimofood-data-updated"));
  } catch (err) {
    console.error("Gagal menyimpan ke LocalStorage:", err);
  }
}

function createUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================================================
// 1. KATALOG PRODUK & VARIAN UKURAN
// ============================================================================

export async function getProductsWithVariants(options?: {
  includeHampers?: boolean;
  onlyHampers?: boolean;
  activeOnly?: boolean;
}): Promise<ProductWithVariants[]> {
  const includeHampers = options?.includeHampers ?? true;
  const onlyHampers = options?.onlyHampers ?? false;
  const activeOnly = options?.activeOnly ?? true;

  if (isSupabaseConfigured() && supabase) {
    try {
      const [{ data: productsData, error: prodErr }, { data: variantsData, error: varErr }] =
        await Promise.all([
          supabase.from("products").select("*").order("created_at", { ascending: true }),
          supabase
            .from("product_variants")
            .select("*")
            .order("weight_grams", { ascending: true }),
        ]);

      if (!prodErr && !varErr && productsData && productsData.length > 0) {
        const variants = (variantsData || []) as ProductVariant[];
        return (productsData as Product[])
          .filter((p) => (activeOnly ? p.is_active : true))
          .filter((p) => (onlyHampers ? p.is_hampers : includeHampers ? true : !p.is_hampers))
          .map((product) => ({
            ...product,
            variants: variants
              .filter((v) => v.product_id === product.id)
              .sort((a, b) => a.weight_grams - b.weight_grams),
          }));
      }
    } catch (err) {
      console.warn("Supabase fallback ke LocalStorage (getProductsWithVariants):", err);
    }
  }

  const products = readLocal<Product[]>(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
  const variants = readLocal<ProductVariant[]>(STORAGE_KEYS.VARIANTS, SEED_VARIANTS);

  return products
    .filter((p) => (activeOnly ? p.is_active : true))
    .filter((p) => (onlyHampers ? p.is_hampers : includeHampers ? true : !p.is_hampers))
    .map((product) => ({
      ...product,
      variants: variants
        .filter((v) => v.product_id === product.id)
        .sort((a, b) => a.weight_grams - b.weight_grams),
    }));
}

export async function updateVariantStock(
  variantId: string,
  newStockQty: number,
  isReadyStock?: boolean
): Promise<ProductVariant | null> {
  const clampedStock = Math.max(0, Math.round(newStockQty));
  const ready = isReadyStock !== undefined ? isReadyStock : clampedStock > 0;
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("product_variants")
        .update({
          stock_qty: clampedStock,
          is_ready_stock: ready,
          updated_at: now,
        })
        .eq("id", variantId)
        .select("*")
        .single();

      if (!error && data) {
        return data as ProductVariant;
      }
    } catch (err) {
      console.warn("Supabase fallback ke LocalStorage (updateVariantStock):", err);
    }
  }

  const variants = readLocal<ProductVariant[]>(STORAGE_KEYS.VARIANTS, SEED_VARIANTS);
  let updated: ProductVariant | null = null;
  const nextVariants = variants.map((v) => {
    if (v.id === variantId) {
      updated = {
        ...v,
        stock_qty: clampedStock,
        is_ready_stock: ready,
        updated_at: now,
      };
      return updated;
    }
    return v;
  });

  writeLocal(STORAGE_KEYS.VARIANTS, nextVariants);
  return updated;
}

export async function updateVariantPrices(
  variantId: string,
  prices: {
    base_price?: number;
    web_price?: number;
    shopee_price?: number;
    reseller_price?: number;
  }
): Promise<ProductVariant | null> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("product_variants")
        .update({
          ...prices,
          updated_at: now,
        })
        .eq("id", variantId)
        .select("*")
        .single();

      if (!error && data) {
        return data as ProductVariant;
      }
    } catch (err) {
      console.warn("Supabase fallback ke LocalStorage (updateVariantPrices):", err);
    }
  }

  const variants = readLocal<ProductVariant[]>(
    STORAGE_KEYS.VARIANTS,
    SEED_VARIANTS
  );
  let updated: ProductVariant | null = null;
  const nextVariants = variants.map((v) => {
    if (v.id === variantId) {
      const nextShopee = prices.shopee_price ?? v.shopee_price;
      const nextWeb = Math.min(nextShopee, prices.web_price ?? v.web_price);
      updated = {
        ...v,
        base_price: prices.base_price ?? v.base_price,
        web_price: nextWeb,
        shopee_price: nextShopee,
        reseller_price: prices.reseller_price ?? v.reseller_price,
        updated_at: now,
      };
      return updated;
    }
    return v;
  });

  writeLocal(STORAGE_KEYS.VARIANTS, nextVariants);
  return updated;
}

// ============================================================================
// 2. PESANAN (8-STAGE ORDER STATE MACHINE & POS OFFLINE)
// ============================================================================

export interface CreateOrderCartItem {
  variant_id: string;
  product_name: string;
  size_label: string;
  is_sensitive_packaging: boolean;
  quantity: number;
  unit_base_price: number;
  unit_selling_price: number;
}

export interface CreateOnlineOrderInput {
  customer_name: string;
  customer_whatsapp: string;
  customer_city: string;
  shipping_address: string;
  courier: CourierType;
  payment_method?: string;
  referral_code?: string;
  discount_amount?: number;
  notes?: string;
  items: CreateOrderCartItem[];
}

export async function getOrdersWithItems(filter?: {
  status?: OrderStatus | "ALL";
  channel?: OrderChannel | "ALL";
  search?: string;
}): Promise<OrderWithItems[]> {
  let orders: Order[] = [];
  let orderItems: OrderItem[] = [];

  if (isSupabaseConfigured() && supabase) {
    try {
      const [{ data: ordData, error: ordErr }, { data: itemData, error: itemErr }] =
        await Promise.all([
          supabase.from("orders").select("*").order("created_at", { ascending: false }),
          supabase.from("order_items").select("*"),
        ]);

      if (!ordErr && !itemErr && ordData) {
        orders = ordData as Order[];
        orderItems = (itemData || []) as OrderItem[];
      }
    } catch (err) {
      console.warn("Supabase fallback ke LocalStorage (getOrdersWithItems):", err);
    }
  }

  if (orders.length === 0) {
    orders = readLocal<Order[]>(STORAGE_KEYS.ORDERS, SEED_ORDERS);
    orderItems = readLocal<OrderItem[]>(STORAGE_KEYS.ORDER_ITEMS, SEED_ORDER_ITEMS);
  }

  let combined: OrderWithItems[] = orders
    .map((order) => ({
      ...order,
      items: orderItems.filter((item) => item.order_id === order.id),
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (filter?.status && filter.status !== "ALL") {
    combined = combined.filter((o) => o.status === filter.status);
  }

  if (filter?.channel && filter.channel !== "ALL") {
    combined = combined.filter((o) => o.channel === filter.channel);
  }

  if (filter?.search && filter.search.trim() !== "") {
    const q = filter.search.trim().toLowerCase();
    combined = combined.filter(
      (o) =>
        o.order_code.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_whatsapp.toLowerCase().includes(q) ||
        (o.customer_city && o.customer_city.toLowerCase().includes(q))
    );
  }

  return combined;
}

export async function getOrderByCode(orderCode: string): Promise<OrderWithItems | null> {
  const normalizedCode = orderCode.trim().toUpperCase();
  const allOrders = await getOrdersWithItems();
  return (
    allOrders.find((o) => o.order_code.toUpperCase() === normalizedCode) || null
  );
}

export async function createOnlineOrder(
  input: CreateOnlineOrderInput
): Promise<OrderWithItems> {
  const existingOrders = readLocal<Order[]>(STORAGE_KEYS.ORDERS, SEED_ORDERS);
  const orderCode = generateOrderCode(existingOrders.length + 1);
  const orderId = createUuid();
  const now = new Date().toISOString();

  // Cek apakah memakai kode referral Reseller
  let matchedReseller: Reseller | null = null;
  if (input.referral_code) {
    matchedReseller = await getResellerByReferralCode(input.referral_code);
  }

  const hasSensitiveItem = input.items.some((i) => i.is_sensitive_packaging);
  const financials = calculateOrderFinancials({
    items: input.items,
    packingFee: 2500,
    packagingMaterialCost: 1500,
    shippingCost: 0, // Diinput Admin pada tahap 2 -> 3
    discountAmount: input.discount_amount ?? (matchedReseller ? 2000 : 0),
  });

  const newOrder: Order = {
    id: orderId,
    order_code: orderCode,
    channel: matchedReseller ? "RESELLER_WEB" : "ONLINE_WEB",
    status: "2_WAITING_STOCK_CONFIRMATION",
    customer_name: input.customer_name.trim(),
    customer_whatsapp: normalizeWhatsAppNumber(input.customer_whatsapp),
    customer_city: input.customer_city.trim(),
    shipping_address: input.shipping_address.trim(),
    reseller_id: matchedReseller ? matchedReseller.id : null,
    referral_code_used: matchedReseller
      ? matchedReseller.referral_code
      : input.referral_code || null,
    courier: input.courier,
    tracking_number: null,
    has_sensitive_original_item: hasSensitiveItem,
    sop_sealer_checked: false,
    sop_cardboard_layered: false,
    sop_bubble_wrap_checked: false,
    packing_photo_url: null,
    ...financials,
    payment_method: input.payment_method || "QRIS",
    payment_proof_url: null,
    paid_at: null,
    completed_at: null,
    notes: input.notes || null,
    created_at: now,
    updated_at: now,
  };

  const newOrderItems: OrderItem[] = input.items.map((item) => ({
    id: createUuid(),
    order_id: orderId,
    variant_id: item.variant_id,
    product_name_snapshot: item.product_name,
    size_label_snapshot: item.size_label,
    is_sensitive_snapshot: item.is_sensitive_packaging,
    quantity: item.quantity,
    unit_base_price: item.unit_base_price,
    unit_selling_price: item.unit_selling_price,
    subtotal_base: item.unit_base_price * item.quantity,
    subtotal_selling: item.unit_selling_price * item.quantity,
  }));

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from("orders").insert(newOrder);
      await supabase.from("order_items").insert(newOrderItems);
    } catch (err) {
      console.warn("Supabase fallback ke LocalStorage (createOnlineOrder):", err);
    }
  }

  const allOrders = readLocal<Order[]>(STORAGE_KEYS.ORDERS, SEED_ORDERS);
  const allItems = readLocal<OrderItem[]>(STORAGE_KEYS.ORDER_ITEMS, SEED_ORDER_ITEMS);
  writeLocal(STORAGE_KEYS.ORDERS, [newOrder, ...allOrders]);
  writeLocal(STORAGE_KEYS.ORDER_ITEMS, [...newOrderItems, ...allItems]);

  return {
    ...newOrder,
    items: newOrderItems,
  };
}

export interface CreateOfflinePosOrderInput {
  customer_name?: string;
  payment_method: "TUNAI_POS" | "QRIS";
  items: CreateOrderCartItem[];
}

export async function createOfflinePosOrder(
  input: CreateOfflinePosOrderInput
): Promise<OrderWithItems> {
  const existingOrders = readLocal<Order[]>(STORAGE_KEYS.ORDERS, SEED_ORDERS);
  const orderCode = generateOrderCode(existingOrders.length + 1);
  const orderId = createUuid();
  const now = new Date().toISOString();

  const financials = calculateOrderFinancials({
    items: input.items,
    packingFee: 0,
    packagingMaterialCost: 0,
    shippingCost: 0,
    discountAmount: 0,
  });

  const posOrder: Order = {
    id: orderId,
    order_code: orderCode,
    channel: "OFFLINE_POS",
    status: "8_COMPLETED",
    customer_name: input.customer_name?.trim() || "Pembeli Eceran Rumah Produksi",
    customer_whatsapp: "-",
    customer_city: "Rumah Produksi Cimoring",
    shipping_address: "Transaksi Kasir Langsung (POS Offline)",
    reseller_id: null,
    referral_code_used: null,
    courier: "AMBIL_DI_TEMPAT",
    tracking_number: "POS-LANGSUNG",
    has_sensitive_original_item: input.items.some(
      (i) => i.is_sensitive_packaging
    ),
    sop_sealer_checked: true,
    sop_cardboard_layered: false,
    sop_bubble_wrap_checked: false,
    packing_photo_url: null,
    ...financials,
    payment_method: input.payment_method,
    payment_proof_url: null,
    paid_at: now,
    completed_at: now,
    notes: "Dicatat cepat melalui Kasir POS Offline CimoFood",
    created_at: now,
    updated_at: now,
  };

  const posItems: OrderItem[] = input.items.map((item) => ({
    id: createUuid(),
    order_id: orderId,
    variant_id: item.variant_id,
    product_name_snapshot: item.product_name,
    size_label_snapshot: item.size_label,
    is_sensitive_snapshot: item.is_sensitive_packaging,
    quantity: item.quantity,
    unit_base_price: item.unit_base_price,
    unit_selling_price: item.unit_selling_price,
    subtotal_base: item.unit_base_price * item.quantity,
    subtotal_selling: item.unit_selling_price * item.quantity,
  }));

  // Potong stok varian secara otomatis untuk item non-eceran kustom
  const currentVariants = readLocal<ProductVariant[]>(
    STORAGE_KEYS.VARIANTS,
    SEED_VARIANTS
  );
  const updatedVariants = currentVariants.map((v) => {
    const sold = input.items.find((i) => i.variant_id === v.id);
    if (!sold) return v;
    const nextQty = Math.max(0, v.stock_qty - sold.quantity);
    return {
      ...v,
      stock_qty: nextQty,
      is_ready_stock: nextQty > 0,
      updated_at: now,
    };
  });
  writeLocal(STORAGE_KEYS.VARIANTS, updatedVariants);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from("orders").insert(posOrder);
      await supabase.from("order_items").insert(posItems);
    } catch (err) {
      console.warn(
        "Supabase fallback ke LocalStorage (createOfflinePosOrder):",
        err
      );
    }
  }

  const allOrders = readLocal<Order[]>(STORAGE_KEYS.ORDERS, SEED_ORDERS);
  const allItems = readLocal<OrderItem[]>(
    STORAGE_KEYS.ORDER_ITEMS,
    SEED_ORDER_ITEMS
  );
  writeLocal(STORAGE_KEYS.ORDERS, [posOrder, ...allOrders]);
  writeLocal(STORAGE_KEYS.ORDER_ITEMS, [...posItems, ...allItems]);

  return {
    ...posOrder,
    items: posItems,
  };
}

export interface OrderStageTransitionInput {
  shipping_cost?: number;
  payment_proof_url?: string;
  sop_sealer_checked?: boolean;
  sop_cardboard_layered?: boolean;
  sop_bubble_wrap_checked?: boolean;
  packing_photo_url?: string;
  tracking_number?: string;
  notes?: string;
}

export async function updateOrderStage(
  orderId: string,
  nextStatus: OrderStatus,
  payload?: OrderStageTransitionInput
): Promise<OrderWithItems | null> {
  const orders = readLocal<Order[]>(STORAGE_KEYS.ORDERS, SEED_ORDERS);
  const items = readLocal<OrderItem[]>(STORAGE_KEYS.ORDER_ITEMS, SEED_ORDER_ITEMS);
  const targetOrder = orders.find((o) => o.id === orderId);
  if (!targetOrder) return null;

  const orderItems = items.filter((i) => i.order_id === orderId);

  // Validasi wajib untuk tahap 6_PACKED_SOP_VERIFIED sesuai PRD Bagian 3.2 & 6.2
  if (nextStatus === "6_PACKED_SOP_VERIFIED") {
    const sealer = payload?.sop_sealer_checked ?? targetOrder.sop_sealer_checked;
    const cardboard =
      payload?.sop_cardboard_layered ?? targetOrder.sop_cardboard_layered;
    const bubble =
      payload?.sop_bubble_wrap_checked ?? targetOrder.sop_bubble_wrap_checked;
    const photo = payload?.packing_photo_url ?? targetOrder.packing_photo_url;

    if (!sealer || !cardboard || !bubble || !photo) {
      throw new Error(
        "Wajib mencentang seluruh checklist SOP 4 Lapis dan mengunggah Foto Bukti Kemasan sebelum lanjut!"
      );
    }
  }

  const nextShippingCost = payload?.shipping_cost ?? targetOrder.shipping_cost;
  const recalculated = calculateOrderFinancials({
    items: orderItems,
    packingFee: targetOrder.packing_fee,
    packagingMaterialCost: targetOrder.packaging_material_cost,
    shippingCost: nextShippingCost,
    discountAmount: targetOrder.discount_amount,
  });

  const now = new Date().toISOString();
  const updatedOrder: Order = {
    ...targetOrder,
    ...recalculated,
    status: nextStatus,
    payment_proof_url:
      payload?.payment_proof_url !== undefined
        ? payload.payment_proof_url
        : targetOrder.payment_proof_url,
    sop_sealer_checked:
      payload?.sop_sealer_checked !== undefined
        ? payload.sop_sealer_checked
        : targetOrder.sop_sealer_checked,
    sop_cardboard_layered:
      payload?.sop_cardboard_layered !== undefined
        ? payload.sop_cardboard_layered
        : targetOrder.sop_cardboard_layered,
    sop_bubble_wrap_checked:
      payload?.sop_bubble_wrap_checked !== undefined
        ? payload.sop_bubble_wrap_checked
        : targetOrder.sop_bubble_wrap_checked,
    packing_photo_url:
      payload?.packing_photo_url !== undefined
        ? payload.packing_photo_url
        : targetOrder.packing_photo_url,
    tracking_number:
      payload?.tracking_number !== undefined
        ? payload.tracking_number
        : targetOrder.tracking_number,
    notes: payload?.notes !== undefined ? payload.notes : targetOrder.notes,
    paid_at:
      nextStatus === "4_PAID_VERIFIED" && !targetOrder.paid_at
        ? now
        : targetOrder.paid_at,
    completed_at:
      nextStatus === "8_COMPLETED" && !targetOrder.completed_at
        ? now
        : targetOrder.completed_at,
    updated_at: now,
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from("orders").update(updatedOrder).eq("id", orderId);
    } catch (err) {
      console.warn("Supabase fallback ke LocalStorage (updateOrderStage):", err);
    }
  }

  const nextOrders = orders.map((o) => (o.id === orderId ? updatedOrder : o));
  writeLocal(STORAGE_KEYS.ORDERS, nextOrders);

  return {
    ...updatedOrder,
    items: orderItems,
  };
}

// ============================================================================
// 3. RESELLER & PORTAL MITRA
// ============================================================================

export async function getResellers(): Promise<Reseller[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("resellers")
        .select("*")
        .order("current_month_sales", { ascending: false });
      if (!error && data && data.length > 0) {
        return data as Reseller[];
      }
    } catch (err) {
      console.warn("Supabase fallback ke LocalStorage (getResellers):", err);
    }
  }
  return readLocal<Reseller[]>(STORAGE_KEYS.RESELLERS, SEED_RESELLERS);
}

export async function getResellerByReferralCode(
  code: string
): Promise<Reseller | null> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return null;
  const resellers = await getResellers();
  return (
    resellers.find((r) => r.referral_code.toUpperCase() === cleanCode) || null
  );
}

export interface RegisterResellerInput {
  full_name: string;
  phone_whatsapp: string;
  city: string;
  address: string;
  preferred_code?: string;
}

export async function registerNewReseller(
  input: RegisterResellerInput
): Promise<Reseller> {
  const existing = readLocal<Reseller[]>(STORAGE_KEYS.RESELLERS, SEED_RESELLERS);
  const rawNameCode = input.full_name
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 5);
  const baseCode =
    input.preferred_code?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() ||
    `${rawNameCode || "MITRA"}CIMO`;
  const finalCode = existing.some((r) => r.referral_code === baseCode)
    ? `${baseCode}${Math.floor(10 + Math.random() * 89)}`
    : baseCode;

  const now = new Date().toISOString();
  const newReseller: Reseller = {
    id: createUuid(),
    full_name: input.full_name.trim(),
    phone_whatsapp: normalizeWhatsAppNumber(input.phone_whatsapp),
    city: input.city.trim(),
    address: input.address.trim(),
    referral_code: finalCode,
    tier_level: "MITRA_AKTIF",
    monthly_target_amount: 1000000,
    current_month_sales: 0,
    bonus_percentage: 5.0,
    total_orders_referred: 0,
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from("resellers").insert(newReseller);
    } catch (err) {
      console.warn(
        "Supabase fallback ke LocalStorage (registerNewReseller):",
        err
      );
    }
  }

  writeLocal(STORAGE_KEYS.RESELLERS, [newReseller, ...existing]);
  return newReseller;
}

// ============================================================================
// 4. GIVEAWAY CAMPAIGN PARTICIPANTS
// ============================================================================

export interface RegisterGiveawayInput {
  full_name: string;
  whatsapp: string;
  instagram_username: string;
  tiktok_username: string;
  shopee_username: string;
  followed_all_proof_url?: string;
}

export async function getGiveawayParticipants(): Promise<GiveawayParticipant[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("giveaway_participants")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data as GiveawayParticipant[];
      }
    } catch (err) {
      console.warn(
        "Supabase fallback ke LocalStorage (getGiveawayParticipants):",
        err
      );
    }
  }
  return readLocal<GiveawayParticipant[]>(
    STORAGE_KEYS.GIVEAWAY,
    SEED_GIVEAWAY_PARTICIPANTS
  );
}

export async function registerGiveawayParticipant(
  input: RegisterGiveawayInput
): Promise<GiveawayParticipant> {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const participant: GiveawayParticipant = {
    id: createUuid(),
    full_name: input.full_name.trim(),
    whatsapp: normalizeWhatsAppNumber(input.whatsapp),
    instagram_username: input.instagram_username.trim(),
    tiktok_username: input.tiktok_username.trim(),
    shopee_username: input.shopee_username.trim(),
    followed_all_proof_url: input.followed_all_proof_url || null,
    coupon_code: `GWCIMO-2026-${randomDigits}`,
    is_verified: false,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from("giveaway_participants").insert(participant);
    } catch (err) {
      console.warn(
        "Supabase fallback ke LocalStorage (registerGiveawayParticipant):",
        err
      );
    }
  }

  const current = readLocal<GiveawayParticipant[]>(
    STORAGE_KEYS.GIVEAWAY,
    SEED_GIVEAWAY_PARTICIPANTS
  );
  writeLocal(STORAGE_KEYS.GIVEAWAY, [participant, ...current]);
  return participant;
}

export async function toggleVerifyGiveawayParticipant(
  participantId: string
): Promise<GiveawayParticipant | null> {
  const current = readLocal<GiveawayParticipant[]>(
    STORAGE_KEYS.GIVEAWAY,
    SEED_GIVEAWAY_PARTICIPANTS
  );
  let updated: GiveawayParticipant | null = null;
  const nextList = current.map((p) => {
    if (p.id === participantId) {
      updated = { ...p, is_verified: !p.is_verified };
      return updated;
    }
    return p;
  });

  if (updated && isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from("giveaway_participants")
        .update({ is_verified: (updated as GiveawayParticipant).is_verified })
        .eq("id", participantId);
    } catch (err) {
      console.warn(
        "Supabase fallback ke LocalStorage (toggleVerifyGiveawayParticipant):",
        err
      );
    }
  }

  writeLocal(STORAGE_KEYS.GIVEAWAY, nextList);
  return updated;
}

// ============================================================================
// 5. RINGKASAN METRIK & RESET DATA DEMO
// ============================================================================

export async function getSummaryMetrics() {
  const [products, orders, resellers, giveaway] = await Promise.all([
    getProductsWithVariants(),
    getOrdersWithItems(),
    getResellers(),
    getGiveawayParticipants(),
  ]);

  const activeOrders = orders.filter((o) => o.status !== "CANCELLED");
  const totalGrossRevenue = activeOrders.reduce((sum, o) => sum + o.grand_total, 0);
  const totalProducerPayout = activeOrders.reduce(
    (sum, o) => sum + o.subtotal_base_price,
    0
  );
  const totalNetProfit = activeOrders.reduce(
    (sum, o) => sum + o.net_profit_cimofood,
    0
  );
  const totalPacksSold = activeOrders.reduce(
    (sum, o) => sum + o.items.reduce((acc, i) => acc + i.quantity, 0),
    0
  );

  return {
    totalProducts: products.length,
    totalVariants: products.reduce((acc, p) => acc + p.variants.length, 0),
    totalOrders: orders.length,
    totalResellers: resellers.length,
    totalGiveawayParticipants: giveaway.length,
    totalGrossRevenue,
    totalProducerPayout,
    totalNetProfit,
    totalPacksSold,
  };
}

/**
 * Mereset data LocalStorage kembali ke Seed Data awal agar pengujian selalu bersih
 */
export function resetLocalDemoData(): void {
  if (!isBrowser) return;
  writeLocal(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
  writeLocal(STORAGE_KEYS.VARIANTS, SEED_VARIANTS);
  writeLocal(STORAGE_KEYS.ORDERS, SEED_ORDERS);
  writeLocal(STORAGE_KEYS.ORDER_ITEMS, SEED_ORDER_ITEMS);
  writeLocal(STORAGE_KEYS.RESELLERS, SEED_RESELLERS);
  writeLocal(STORAGE_KEYS.GIVEAWAY, SEED_GIVEAWAY_PARTICIPANTS);
}

