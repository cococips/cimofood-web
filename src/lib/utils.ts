import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { OrderWithItems } from "@/types/database";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format angka menjadi mata uang Rupiah (contoh: Rp13.500)
 */
export function formatRupiah(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? Math.round(amount) : 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeAmount);
}

/**
 * Format tanggal ke Bahasa Indonesia yang ramah (contoh: 10 Nov 2026, 08:30 WIB)
 */
export function formatDateID(
  dateString?: string | null,
  includeTime = true
): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...(includeTime
        ? {
            hour: "2-digit",
            minute: "2-digit",
          }
        : {}),
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Perhitungan keuangan pesanan sesuai Rumus PRD Bagian 3.1:
 * T_bayar = sum(P_item * Q_item) + C_packing + C_ongkir - D_promo
 * L_cimofood = sum((P_item - P_dasar) * Q_item) + (C_packing - M_kemasan)
 */
export function calculateOrderFinancials(params: {
  items: Array<{
    unit_base_price: number;
    unit_selling_price: number;
    quantity: number;
  }>;
  packingFee?: number;
  packagingMaterialCost?: number;
  shippingCost?: number;
  discountAmount?: number;
}) {
  const packingFee = params.packingFee ?? 2500;
  const packagingMaterialCost = params.packagingMaterialCost ?? 1500;
  const shippingCost = params.shippingCost ?? 0;
  const discountAmount = params.discountAmount ?? 0;

  let subtotalBasePrice = 0;
  let subtotalSellingPrice = 0;
  let itemMarginTotal = 0;

  for (const item of params.items) {
    const qty = Math.max(0, item.quantity);
    subtotalBasePrice += item.unit_base_price * qty;
    subtotalSellingPrice += item.unit_selling_price * qty;
    itemMarginTotal += (item.unit_selling_price - item.unit_base_price) * qty;
  }

  const grandTotal = Math.max(
    0,
    subtotalSellingPrice + packingFee + shippingCost - discountAmount
  );

  const packingMargin = packingFee - packagingMaterialCost;
  const netProfitCimofood = itemMarginTotal + packingMargin - discountAmount;

  return {
    subtotal_base_price: subtotalBasePrice,
    subtotal_selling_price: subtotalSellingPrice,
    packing_fee: packingFee,
    packaging_material_cost: packagingMaterialCost,
    shipping_cost: shippingCost,
    discount_amount: discountAmount,
    grand_total: grandTotal,
    net_profit_cimofood: netProfitCimofood,
  };
}

/**
 * Generator kode pesanan unik berformat CMF-YYYYMMDD-XXX
 */
export function generateOrderCode(sequenceNumber?: number): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const suffix =
    sequenceNumber !== undefined
      ? String(sequenceNumber).padStart(3, "0")
      : String(Math.floor(100 + Math.random() * 900));
  return `CMF-${yyyy}${mm}${dd}-${suffix}`;
}

/**
 * Nomor WhatsApp Admin CimoFood
 */
export function getAdminWhatsApp(): string {
  return process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "6281223344556";
}

/**
 * Bersihkan nomor telepon ke format internasional 628xxx
 */
export function normalizeWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return "62" + digits.slice(1);
  }
  if (digits.startsWith("8")) {
    return "62" + digits;
  }
  return digits;
}

/**
 * Buat Deep Link WhatsApp saat Pembeli selesai Checkout (Tahap 2: Konfirmasi Stok & Ongkir)
 */
export function createWhatsAppCheckoutUrl(order: OrderWithItems): string {
  const adminPhone = getAdminWhatsApp();
  const itemsText = order.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.product_name_snapshot} (${item.size_label_snapshot}) x${item.quantity} = ${formatRupiah(item.subtotal_selling)}`
    )
    .join("\n");

  const message = [
    `Halo Admin *CimoFood*! 👋`,
    `Saya ingin konfirmasi stok & ongkir untuk pesanan baru saya:`,
    ``,
    `🧾 *Kode Pesanan:* ${order.order_code}`,
    `👤 *Nama:* ${order.customer_name}`,
    `📍 *Kota/Alamat:* ${order.customer_city} - ${order.shipping_address}`,
    `🚚 *Ekspedisi Pilihan:* ${order.courier}`,
    ``,
    `📦 *Daftar Pesanan:*`,
    itemsText,
    ``,
    `💰 *Subtotal Produk:* ${formatRupiah(order.subtotal_selling_price)}`,
    `🛡️ *Biaya Kemasan SOP 4 Lapis:* ${formatRupiah(order.packing_fee)}`,
    ...(order.discount_amount > 0
      ? [`🎁 *Potongan Promo:* -${formatRupiah(order.discount_amount)}`]
      : []),
    ``,
    `Mohon info ketersediaan stok harian dan total ongkir ke alamat saya ya Kak. Terima kasih! 🙏🌶️`,
  ].join("\n");

  return `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Buat Deep Link WhatsApp dari Admin ke Pembeli (Info Tagihan / Resi Pengiriman)
 */
export function createAdminToCustomerWhatsAppUrl(
  order: OrderWithItems,
  type: "PAYMENT_READY" | "SHIPPED"
): string {
  const customerPhone = normalizeWhatsAppNumber(order.customer_whatsapp);

  if (type === "PAYMENT_READY") {
    const message = [
      `Halo Kak *${order.customer_name}*! 👋`,
      `Kabar gembira dari *CimoFood*! Stok Cimoring pesanan Kakak (*${order.order_code}*) *TERSEDIA* dan siap kami amankan.`,
      ``,
      `🧾 *Rincian Tagihan Akhir:*`,
      `• Subtotal Produk: ${formatRupiah(order.subtotal_selling_price)}`,
      `• Kemasan Aman SOP 4 Lapis: ${formatRupiah(order.packing_fee)}`,
      `• Ongkir (${order.courier}): ${formatRupiah(order.shipping_cost)}`,
      ...(order.discount_amount > 0
        ? [`• Diskon Promo: -${formatRupiah(order.discount_amount)}`]
        : []),
      `*TOTAL BAYAR: ${formatRupiah(order.grand_total)}*`,
      ``,
      `Silakan lakukan pembayaran dan unggah bukti bayar di halaman Lacak Pesanan CimoFood berikut: /track/${order.order_code}`,
      `Terima kasih Kak! 🙏🔥`,
    ].join("\n");
    return `https://wa.me/${customerPhone}?text=${encodeURIComponent(message)}`;
  }

  const message = [
    `Halo Kak *${order.customer_name}*! 🚚💨`,
    `Pesanan Cimoring Kakak (*${order.order_code}*) sudah dikemas dengan *SOP Aman 4 Lapis* dan telah diserahkan ke kurir *${order.courier}*!`,
    ``,
    `📦 *Nomor Resi:* ${order.tracking_number || "-"}`,
    `📸 Foto bukti kemasan 4 lapis paket Kakak juga sudah bisa dilihat langsung di halaman Lacak Pesanan: /track/${order.order_code}`,
    ``,
    `Semoga paket sampai dengan selamat, utuh, dan renyah ya Kak! Jangan lupa klik "Pesanan Diterima" jika sudah sampai. Terima kasih! 🙏🌶️`,
  ].join("\n");

  return `https://wa.me/${customerPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Export daftar pesanan ke Microsoft Excel (.xlsx) Multi-Sheet
 * (Sheet 1: Ringkasan Keuangan & Sheet 2: Detail Transaksi Lengkap)
 * siap disimpan ke Google Drive pemilik UMKM Cimoring.
 */
export async function exportOrdersToExcel(
  orders: OrderWithItems[],
  filenamePrefix = "Laporan-Keuangan-CimoFood"
) {
  const XLSX = await import("xlsx");

  const validOrders = orders.filter((o) => o.status !== "CANCELLED");
  const totalGrossRevenue = validOrders.reduce(
    (sum, o) => sum + o.grand_total,
    0
  );
  const totalProducerBasePayout = validOrders.reduce(
    (sum, o) => sum + o.subtotal_base_price,
    0
  );
  const totalSellingSubtotal = validOrders.reduce(
    (sum, o) => sum + o.subtotal_selling_price,
    0
  );
  const totalPackingRevenue = validOrders.reduce(
    (sum, o) => sum + o.packing_fee,
    0
  );
  const totalNetProfit = validOrders.reduce(
    (sum, o) => sum + o.net_profit_cimofood,
    0
  );
  const totalPacksSold = validOrders.reduce(
    (sum, o) => sum + o.items.reduce((acc, i) => acc + i.quantity, 0),
    0
  );

  // Sheet 1: Ringkasan Keuangan & Bagi Hasil Produsen
  const summaryRows = [
    {
      "Metrik Keuangan CimoFood": "Total Transaksi Aktif",
      "Nilai / Nominal": `${validOrders.length} Pesanan`,
      Keterangan: "Seluruh pesanan aktif (Online Web, Reseller, POS Offline)",
    },
    {
      "Metrik Keuangan CimoFood": "Total Kemasan Terjual",
      "Nilai / Nominal": `${totalPacksSold} Kemasan`,
      Keterangan: "Total seluruh ukuran kemasan (200g, 250g, 500g, Bal 2kg, Hampers, Eceran)",
    },
    {
      "Metrik Keuangan CimoFood": "Total Omzet Penjualan Kotor (Rp)",
      "Nilai / Nominal": totalGrossRevenue,
      Keterangan: "Total keseluruhan pembayaran yang diterima dari pembeli",
    },
    {
      "Metrik Keuangan CimoFood": "Subtotal Penjualan Produk (Rp)",
      "Nilai / Nominal": totalSellingSubtotal,
      Keterangan: "Total harga jual produk sebelum ongkir & biaya packing",
    },
    {
      "Metrik Keuangan CimoFood":
        "Total Setoran Harga Dasar ke Produsen Cimoring (Modal Rp)",
      "Nilai / Nominal": totalProducerBasePayout,
      Keterangan: "Rumus: Sum(P_dasar * Q) — Wajib disetorkan ke pemilik UMKM Cimoring",
    },
    {
      "Metrik Keuangan CimoFood": "Total Pendapatan Biaya Packing SOP 4 Lapis (Rp)",
      "Nilai / Nominal": totalPackingRevenue,
      Keterangan: "Total biaya pengemasan aman 4 lapis (Kardus + Bubble Wrap)",
    },
    {
      "Metrik Keuangan CimoFood": "Laba Bersih Tim CimoFood / Markup Ujrah (Rp)",
      "Nilai / Nominal": totalNetProfit,
      Keterangan: "Rumus: Sum((P_jual - P_dasar) * Q) + Margin Packing - Diskon",
    },
  ];

  // Sheet 2: Detail Transaksi Lengkap
  const detailRows = orders.map((order, idx) => ({
    No: idx + 1,
    "Kode Pesanan": order.order_code,
    "Tanggal Transaksi": formatDateID(order.created_at),
    "Kanal Penjualan":
      order.channel === "OFFLINE_POS"
        ? "Kasir POS Offline"
        : order.channel === "RESELLER_WEB"
          ? "Reseller Portal"
          : "Website Online",
    "Status Pesanan": order.status,
    "Nama Pembeli": order.customer_name,
    "No. WhatsApp": order.customer_whatsapp,
    Kota: order.customer_city || "-",
    Ekspedisi: order.courier,
    "No. Resi": order.tracking_number || "-",
    "Rincian Item": order.items
      .map(
        (i) =>
          `${i.product_name_snapshot} (${i.size_label_snapshot}) x${i.quantity}`
      )
      .join("; "),
    "Jumlah Kemasan": order.items.reduce((acc, i) => acc + i.quantity, 0),
    "Ada Varian Original (Rawan Jepot)": order.has_sensitive_original_item
      ? "YA - SOP Ketat"
      : "Tidak",
    "Setor Harga Dasar ke Produsen (Rp)": order.subtotal_base_price,
    "Subtotal Harga Jual (Rp)": order.subtotal_selling_price,
    "Biaya Packing SOP (Rp)": order.packing_fee,
    "Ongkos Kirim (Rp)": order.shipping_cost,
    "Diskon Promo (Rp)": order.discount_amount,
    "Total Tagihan Pembeli (Rp)": order.grand_total,
    "Laba Bersih CimoFood (Rp)": order.net_profit_cimofood,
    "Metode Pembayaran": order.payment_method,
    "Kode Referral Reseller": order.referral_code_used || "-",
  }));

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  const detailSheet = XLSX.utils.json_to_sheet(detailRows);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan Keuangan");
  XLSX.utils.book_append_sheet(
    workbook,
    detailSheet,
    "Detail Transaksi Lengkap"
  );

  const datePart = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${filenamePrefix}-${datePart}.xlsx`);
}

