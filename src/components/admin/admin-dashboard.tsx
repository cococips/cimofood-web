"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Calculator,
  Camera,
  Check,
  CheckCircle2,
  ClipboardList,
  Database,
  Download,
  ExternalLink,
  Eye,
  Flame,
  Gift,
  Lock,
  LogIn,
  LogOut,
  MessageCircle,
  Minus,
  PackageCheck,
  Plus,
  RefreshCw,
  Sparkles,
  Store,
  Trash2,
  Truck,
  Upload,
  Users,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Modal,
  OrderStatusBadge,
  useToast,
} from "@/components/ui";
import {
  createOfflinePosOrder,
  getGiveawayParticipants,
  getOrdersWithItems,
  getProductsWithVariants,
  getResellers,
  resetLocalDemoData,
  toggleVerifyGiveawayParticipant,
  updateOrderStage,
  updateVariantPrices,
  updateVariantStock,
} from "@/lib/data-service";
import { getDataLayerStatus } from "@/lib/supabase";
import {
  createAdminToCustomerWhatsAppUrl,
  exportOrdersToExcel,
  formatDateID,
  formatRupiah,
} from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import type {
  GiveawayParticipant,
  OrderWithItems,
  ProductVariant,
  ProductWithVariants,
  Reseller,
} from "@/types/database";

export type AdminTabId =
  | "reports"
  | "orders"
  | "pos"
  | "inventory"
  | "giveaway";

type OrderFilterGroup =
  | "ALL"
  | "NEED_CONFIRM"
  | "WAIT_PAYMENT_VERIFY"
  | "READY_PICK_PRODUCER"
  | "SOP_PACKING"
  | "IN_SHIPPING"
  | "COMPLETED";

type ReportPeriodFilter = "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "ALL_TIME";

const DEFAULT_SOP_PHOTO =
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80";
const DEFAULT_PAYMENT_PROOF =
  "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=700&q=80";

interface PosCartLine {
  key: string;
  variant_id: string;
  product_name: string;
  size_label: string;
  is_sensitive_packaging: boolean;
  unit_base_price: number;
  unit_selling_price: number;
  quantity: number;
}

interface VariantPriceDraft {
  base_price: number;
  reseller_price: number;
  web_price: number;
  shopee_price: number;
}

export function AdminDashboard({
  initialTab = "orders",
}: {
  initialTab?: AdminTabId;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = React.useState<AdminTabId>(initialTab);
  const [mounted, setMounted] = React.useState(false);

  const role = useAuthStore((s) => s.role);
  const adminUser = useAuthStore((s) => s.adminUser);
  const logout = useAuthStore((s) => s.logout);
  const isResellerMode = useCartStore((s) => s.isResellerMode);
  const setResellerMode = useCartStore((s) => s.setResellerMode);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [products, setProducts] = React.useState<ProductWithVariants[]>([]);
  const [orders, setOrders] = React.useState<OrderWithItems[]>([]);
  const [giveawayList, setGiveawayList] = React.useState<GiveawayParticipant[]>(
    []
  );
  const [resellers, setResellers] = React.useState<Reseller[]>([]);
  const [luckyWinner, setLuckyWinner] =
    React.useState<GiveawayParticipant | null>(null);
  const [orderFilterGroup, setOrderFilterGroup] =
    React.useState<OrderFilterGroup>("ALL");
  const [reportPeriod, setReportPeriod] =
    React.useState<ReportPeriodFilter>("ALL_TIME");

  // Shipping & Resi inline inputs per order
  const [shippingInputs, setShippingInputs] = React.useState<
    Record<string, number>
  >({});
  const [resiInputs, setResiInputs] = React.useState<Record<string, string>>(
    {}
  );

  // Payment proof preview modal state
  const [previewProofOrder, setPreviewProofOrder] =
    React.useState<OrderWithItems | null>(null);

  // SOP 4-Layer Modal State for Stage 5 -> Stage 6
  const [sopModalOrder, setSopModalOrder] =
    React.useState<OrderWithItems | null>(null);
  const [sopSealer, setSopSealer] = React.useState(false);
  const [sopCardboardSide, setSopCardboardSide] = React.useState(false);
  const [sopCardboardWrap, setSopCardboardWrap] = React.useState(false);
  const [sopBubbleWrap, setSopBubbleWrap] = React.useState(false);
  const [sopPhotoUrl, setSopPhotoUrl] = React.useState("");

  // POS Offline State
  const [posCart, setPosCart] = React.useState<PosCartLine[]>([]);
  const [posPaymentMethod, setPosPaymentMethod] = React.useState<
    "TUNAI_POS" | "QRIS"
  >("TUNAI_POS");
  const [posCustomerName, setPosCustomerName] = React.useState("");
  const [isProcessingPos, setIsProcessingPos] = React.useState(false);

  // Inventory 3-tier price edit state
  const [editingVariantPrices, setEditingVariantPrices] = React.useState<
    Record<string, VariantPriceDraft>
  >({});

  const [isExportingExcel, setIsExportingExcel] = React.useState(false);

  const dataLayer = getDataLayerStatus();

  const loadData = React.useCallback(async () => {
    const [prodList, orderList, gwList, resellerList] = await Promise.all([
      getProductsWithVariants({ includeHampers: true, activeOnly: false }),
      getOrdersWithItems(),
      getGiveawayParticipants(),
      getResellers(),
    ]);
    setProducts(prodList);
    setOrders(orderList);
    setGiveawayList(gwList);
    setResellers(resellerList);

    const nextShipping: Record<string, number> = {};
    const nextResi: Record<string, string> = {};
    for (const o of orderList) {
      nextShipping[o.id] = o.shipping_cost > 0 ? o.shipping_cost : 12000;
      nextResi[o.id] =
        o.tracking_number ||
        `JP${Math.floor(10000000 + Math.random() * 90000000)}`;
    }
    setShippingInputs((prev) => ({ ...nextShipping, ...prev }));
    setResiInputs((prev) => ({ ...nextResi, ...prev }));

    const nextPriceEdits: Record<string, VariantPriceDraft> = {};
    for (const p of prodList) {
      for (const v of p.variants) {
        nextPriceEdits[v.id] = {
          base_price: v.base_price,
          reseller_price: v.reseller_price,
          web_price: v.web_price,
          shopee_price: v.shopee_price,
        };
      }
    }
    setEditingVariantPrices((prev) => ({ ...nextPriceEdits, ...prev }));
  }, []);

  React.useEffect(() => {
    loadData();
    const onUpdated = () => loadData();
    window.addEventListener("cimofood-data-updated", onUpdated);
    return () => window.removeEventListener("cimofood-data-updated", onUpdated);
  }, [loadData]);

  // Filter orders based on the operational status tabs
  const filteredOrders = React.useMemo(() => {
    return orders.filter((o) => {
      switch (orderFilterGroup) {
        case "NEED_CONFIRM":
          return (
            o.status === "1_CHECKOUT_CREATED" ||
            o.status === "2_WAITING_STOCK_CONFIRMATION"
          );
        case "WAIT_PAYMENT_VERIFY":
          return o.status === "3_WAITING_PAYMENT";
        case "READY_PICK_PRODUCER":
          return o.status === "4_PAID_VERIFIED";
        case "SOP_PACKING":
          return o.status === "5_PICKED_FROM_PRODUCER";
        case "IN_SHIPPING":
          return (
            o.status === "6_PACKED_SOP_VERIFIED" || o.status === "7_SHIPPED"
          );
        case "COMPLETED":
          return o.status === "8_COMPLETED";
        case "ALL":
        default:
          return true;
      }
    });
  }, [orders, orderFilterGroup]);

  // Open SOP Modal for Stage 5 -> 6
  const handleOpenSopModal = (order: OrderWithItems) => {
    setSopModalOrder(order);
    setSopSealer(order.sop_sealer_checked);
    setSopCardboardSide(order.sop_cardboard_layered);
    setSopCardboardWrap(order.sop_cardboard_layered);
    setSopBubbleWrap(order.sop_bubble_wrap_checked);
    setSopPhotoUrl(order.packing_photo_url || "");
  };

  const isSopFormComplete =
    sopSealer &&
    sopCardboardSide &&
    sopCardboardWrap &&
    sopBubbleWrap &&
    sopPhotoUrl.trim().length > 0;

  const handleSopPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSopPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmSopPacking = async () => {
    if (!sopModalOrder || !isSopFormComplete) return;

    try {
      await updateOrderStage(sopModalOrder.id, "6_PACKED_SOP_VERIFIED", {
        sop_sealer_checked: true,
        sop_cardboard_layered: true,
        sop_bubble_wrap_checked: true,
        packing_photo_url: sopPhotoUrl.trim(),
      });
      setSopModalOrder(null);
      await loadData();
      showToast({
        type: "success",
        title: "Selesai Packing SOP 4 Lapis!",
        description: `Foto bukti kemasan untuk ${sopModalOrder.order_code} telah disimpan & siap input Nomor Resi.`,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Gagal Menyimpan SOP",
        description: err instanceof Error ? err.message : "Terjadi kesalahan.",
      });
    }
  };

  // POS Offline Handlers
  const handleAddPosItem = (line: Omit<PosCartLine, "quantity">) => {
    setPosCart((prev) => {
      const idx = prev.findIndex((i) => i.key === line.key);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { ...line, quantity: 1 }];
    });
  };

  const handleSaveOfflinePosTransaction = async () => {
    if (posCart.length === 0) {
      showToast({
        type: "warning",
        title: "Struk Kasir Masih Kosong",
        description:
          "Ketuk tombol produk di sebelah kiri untuk menambahkan ke struk.",
      });
      return;
    }

    setIsProcessingPos(true);
    try {
      const created = await createOfflinePosOrder({
        customer_name:
          posCustomerName.trim() || "Pembeli Eceran Rumah Produksi",
        payment_method: posPaymentMethod,
        items: posCart.map((c) => ({
          variant_id: c.variant_id,
          product_name: c.product_name,
          size_label: c.size_label,
          is_sensitive_packaging: c.is_sensitive_packaging,
          quantity: c.quantity,
          unit_base_price: c.unit_base_price,
          unit_selling_price: c.unit_selling_price,
        })),
      });

      setPosCart([]);
      setPosCustomerName("");
      await loadData();

      showToast({
        type: "success",
        title: `Transaksi Instan ${created.order_code} Tersimpan!`,
        description: `Status 8_COMPLETED (${posPaymentMethod === "TUNAI_POS" ? "Tunai" : "QRIS"}) sebesar ${formatRupiah(created.grand_total)} otomatis memotong stok & masuk Laporan Keuangan.`,
      });
    } catch {
      showToast({
        type: "error",
        title: "Gagal Menyimpan Transaksi POS",
        description: "Terjadi kesalahan saat menyimpan transaksi kasir.",
      });
    } finally {
      setIsProcessingPos(false);
    }
  };

  // Inventory Quick Stock & Price Handlers
  const handleQuickStockChange = async (
    variant: ProductVariant,
    nextQty: number,
    nextReady?: boolean
  ) => {
    await updateVariantStock(variant.id, nextQty, nextReady);
    await loadData();
    showToast({
      type: "info",
      title: `Stok ${variant.size_label} Diperbarui`,
      description: `Sisa stok sekarang: ${Math.max(0, nextQty)} pcs (${(nextReady ?? nextQty > 0) ? "Tersedia" : "Habis"}).`,
    });
  };

  const handleSaveVariantPrice = async (variant: ProductVariant) => {
    const edited = editingVariantPrices[variant.id];
    if (!edited) return;

    if (edited.web_price > edited.shopee_price) {
      showToast({
        type: "warning",
        title: "Peringatan Aturan Harga PRD!",
        description: `Harga Web (${formatRupiah(edited.web_price)}) melebihi Harga Shopee (${formatRupiah(edited.shopee_price)}). Sistem otomatis menyesuaikan agar tidak melebihi Harga Shopee.`,
      });
    }

    await updateVariantPrices(variant.id, edited);
    await loadData();
    showToast({
      type: "success",
      title: `Harga 3 Tingkat (${variant.size_label}) Disimpan`,
      description: `Dasar: ${formatRupiah(edited.base_price)} • Reseller: ${formatRupiah(edited.reseller_price)} • Web: ${formatRupiah(Math.min(edited.web_price, edited.shopee_price))}`,
    });
  };

  // Reports Filtering & Metrics Calculation
  const reportMetrics = React.useMemo(() => {
    const referenceNow = orders.reduce((maxTs, o) => {
      const ts = new Date(o.created_at).getTime();
      return ts > maxTs ? ts : maxTs;
    }, 0);
    const validOrders = orders.filter((o) => {
      if (o.status === "CANCELLED") return false;
      const createdTime = new Date(o.created_at).getTime();
      const diffHours = (referenceNow - createdTime) / (1000 * 60 * 60);
      if (reportPeriod === "TODAY") return diffHours <= 36;
      if (reportPeriod === "THIS_WEEK") return diffHours <= 24 * 7;
      if (reportPeriod === "THIS_MONTH") return diffHours <= 24 * 31;
      return true;
    });

    const grossRevenue = validOrders.reduce((s, o) => s + o.grand_total, 0);
    const producerBasePayout = validOrders.reduce(
      (s, o) => s + o.subtotal_base_price,
      0
    );
    const totalPackingFeeRevenue = validOrders.reduce(
      (s, o) => s + o.packing_fee,
      0
    );
    const netProfitCimofood = validOrders.reduce(
      (s, o) => s + o.net_profit_cimofood,
      0
    );
    const totalPacksSold = validOrders.reduce(
      (s, o) => s + o.items.reduce((acc, i) => acc + i.quantity, 0),
      0
    );
    return {
      validOrders,
      grossRevenue,
      producerBasePayout,
      totalPackingFeeRevenue,
      netProfitCimofood,
      totalPacksSold,
    };
  }, [orders, reportPeriod]);

  const navItems: Array<{
    id: AdminTabId;
    label: string;
    subtitle: string;
    icon: React.ReactNode;
    badge?: string | number;
  }> = [
    {
      id: "reports",
      label: "1. Ringkasan & Keuangan",
      subtitle: "4 KPI, Analitik & Export Excel",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      id: "orders",
      label: "2. Manajemen Pesanan (8 Tahap)",
      subtitle: "Ongkir WA, SOP 4 Lapis & Resi",
      icon: <ClipboardList className="h-5 w-5" />,
      badge: orders.length,
    },
    {
      id: "pos",
      label: "3. Kasir Cepat / POS Offline",
      subtitle: "Touch POS Instan 1-Klik",
      icon: <Calculator className="h-5 w-5" />,
    },
    {
      id: "inventory",
      label: "4. Stok & Harga 3 Tingkat",
      subtitle: "Tersedia/Habis & Validasi Shopee",
      icon: <Boxes className="h-5 w-5" />,
    },
    {
      id: "giveaway",
      label: "5. Peserta Giveaway & Reseller",
      subtitle: "Kupon Undian & Target Mitra",
      icon: <Gift className="h-5 w-5" />,
      badge: giveawayList.length,
    },
  ];

  const orderFilterTabs: Array<{
    id: OrderFilterGroup;
    label: string;
    count: number;
  }> = [
    { id: "ALL", label: "Semua Pesanan", count: orders.length },
    {
      id: "NEED_CONFIRM",
      label: "Perlu Konfirmasi Stok & Ongkir",
      count: orders.filter(
        (o) =>
          o.status === "1_CHECKOUT_CREATED" ||
          o.status === "2_WAITING_STOCK_CONFIRMATION"
      ).length,
    },
    {
      id: "WAIT_PAYMENT_VERIFY",
      label: "Menunggu Verifikasi Bayar",
      count: orders.filter((o) => o.status === "3_WAITING_PAYMENT").length,
    },
    {
      id: "READY_PICK_PRODUCER",
      label: "Siap Diambil dari Produsen",
      count: orders.filter((o) => o.status === "4_PAID_VERIFIED").length,
    },
    {
      id: "SOP_PACKING",
      label: "Pengemasan SOP 4 Lapis",
      count: orders.filter((o) => o.status === "5_PICKED_FROM_PRODUCER").length,
    },
    {
      id: "IN_SHIPPING",
      label: "Dalam Pengiriman",
      count: orders.filter(
        (o) => o.status === "6_PACKED_SOP_VERIFIED" || o.status === "7_SHIPPED"
      ).length,
    },
    {
      id: "COMPLETED",
      label: "Selesai",
      count: orders.filter((o) => o.status === "8_COMPLETED").length,
    },
  ];

  const activeNavMeta =
    navItems.find((n) => n.id === activeTab) || navItems[0];

  const handleAdminLogout = () => {
    logout();
    showToast({
      type: "info",
      title: "Berhasil Keluar dari Dasbor Admin",
      description: "Sesi pengelola telah diakhiri dengan aman.",
    });
    router.push("/login");
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white text-sm font-bold">
        Memeriksa Otorisasi Admin CimoFood...
      </div>
    );
  }

  // PROTEKSI RBAC: HANYA ROLE ADMIN YANG DAPAT MENGAKSES /ADMIN
  if (role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4 sm:p-6">
        <Card className="max-w-lg w-full p-6 sm:p-8 bg-slate-900 border-2 border-slate-800 text-white space-y-6 shadow-2xl">
          <div className="h-14 w-14 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
            <Lock className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <Badge variant="chili" size="sm">
              Area Terproteksi Role-Based Access Control (RBAC)
            </Badge>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Akses Terbatas Khusus Admin CimoFood
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Halaman Dasbor Operasional 8 Tahap, Kasir POS Offline, Kontrol
              Stok, dan Laporan Keuangan hanya dapat diakses oleh{" "}
              <strong className="text-amber-300">
                Pengelola CimoFood &amp; Owner UMKM Cimoring
              </strong>
              .
            </p>
          </div>

          <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-4 text-xs text-slate-300 space-y-1">
            <p className="font-bold text-amber-300">
              Status Sesi Anda Saat Ini:{" "}
              <span className="uppercase text-white">
                {role === "reseller"
                  ? "Mitra Reseller"
                  : "Pengunjung Publik (Guest)"}
              </span>
            </p>
            <p>
              Silakan masuk menggunakan akun resmi Admin (
              <code>admin@cimofood.id</code>) pada halaman autentikasi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Link href="/login?redirect=/admin" className="w-full">
              <Button
                variant="primary"
                size="admin"
                fullWidth
                leftIcon={<LogIn className="h-5 w-5" />}
              >
                Masuk Akun Admin
              </Button>
            </Link>
            <Link href="/" className="w-full">
              <Button
                variant="outline"
                size="admin"
                fullWidth
                leftIcon={<Store className="h-5 w-5" />}
                className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
              >
                Ke Etalase Pembeli
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row theme-admin">
      {/* LEFT SIDEBAR: LAPTOP & TABLET FIRST (md:flex, large touch targets >= 48px) */}
      <aside className="w-full md:w-72 lg:w-80 bg-slate-900 text-white shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
        <div className="p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#DC2626] flex items-center justify-center text-white shadow-md">
                <Flame className="h-6 w-6 fill-amber-200" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white block">
                  Cimo<span className="text-[#EA580C]">Food</span> Admin
                </span>
                <span className="text-xs text-slate-400">
                  {adminUser?.name || "Laptop & Tablet First UI"}
                </span>
              </div>
            </Link>
          </div>

          <div className="rounded-2xl bg-slate-800/90 border border-slate-700 p-3.5 flex items-center gap-2.5 text-xs">
            <Database className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-slate-200 truncate">
              {dataLayer.label}
            </span>
          </div>

          <nav className="grid grid-cols-2 md:grid-cols-1 gap-2.5">
            {navItems.map((item) => {
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`min-h-14 w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-gradient-to-r from-[#EA580C] to-[#C2410C] text-white border-orange-500 shadow-lg shadow-orange-950/30"
                      : "bg-slate-800/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <span className="text-sm font-extrabold block truncate">
                        {item.label}
                      </span>
                      <span
                        className={`text-[11px] hidden sm:block truncate ${
                          isSelected ? "text-orange-100" : "text-slate-400"
                        }`}
                      >
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                        isSelected
                          ? "bg-amber-300 text-stone-950"
                          : "bg-slate-700 text-slate-200"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-5 sm:p-6 border-t border-slate-800 space-y-2.5">
          <Link href="/" className="block">
            <Button
              variant="outline"
              size="admin"
              fullWidth
              leftIcon={<Store className="h-5 w-5" />}
              className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 hover:text-white"
            >
              Ke Etalase Pembeli
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="admin"
            fullWidth
            leftIcon={<RefreshCw className="h-4 w-4" />}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => {
              resetLocalDemoData();
              loadData();
              showToast({
                type: "info",
                title: "Seed Data Direset",
                description:
                  "Data pesanan & stok dikembalikan ke kondisi awal.",
              });
            }}
          >
            Reset Data Demo
          </Button>
          <Button
            variant="ghost"
            size="admin"
            fullWidth
            leftIcon={<LogOut className="h-4 w-4 text-red-400" />}
            className="text-red-300 hover:text-white hover:bg-red-950/60"
            onClick={handleAdminLogout}
          >
            Keluar Akun Admin
          </Button>
        </div>
      </aside>

      {/* RIGHT COLUMN: STICKY TOPBAR + MAIN ADMIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* STICKY TOPBAR LAPTOP & TABLET FIRST */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-orange-50 border border-orange-200 text-[#EA580C] flex items-center justify-center shrink-0">
              {activeNavMeta.icon}
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#EA580C] block">
                Dasbor Operasional UMKM Cimoring • Laptop &amp; Tablet First
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {activeNavMeta.label}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Indikator Status Teknis Supabase Cloud (Dipindahkan dari Publik ke Header Admin) */}
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white px-3.5 py-2 text-xs font-bold border border-slate-700">
              <Database className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>{dataLayer.label}</span>
            </span>

            {/* Simulasi Mode Harga Etalase (Khusus Admin) */}
            <div className="hidden xl:inline-flex items-center bg-slate-100 border border-slate-300 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setResellerMode(false)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  !isResellerMode
                    ? "bg-[#EA580C] text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Simulasi Harga Web
              </button>
              <button
                type="button"
                onClick={() => setResellerMode(true)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  isResellerMode
                    ? "bg-amber-500 text-slate-950"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Simulasi Reseller
              </button>
            </div>

            <Button
              variant={activeTab === "pos" ? "primary" : "outline"}
              size="admin"
              leftIcon={<Calculator className="h-5 w-5" />}
              onClick={() => setActiveTab("pos")}
            >
              Touch POS Kasir
            </Button>
            <Button
              variant="success"
              size="admin"
              isLoading={isExportingExcel}
              leftIcon={<Download className="h-5 w-5" />}
              onClick={async () => {
                setIsExportingExcel(true);
                await exportOrdersToExcel(
                  reportMetrics.validOrders,
                  `Laporan-CimoFood-${reportPeriod}`
                );
                setIsExportingExcel(false);
                showToast({
                  type: "success",
                  title: "Export Laporan ke Excel (.xlsx) Berhasil!",
                  description:
                    "File Excel multi-sheet siap dicadangkan ke Google Drive pemilik Cimoring.",
                });
              }}
            >
              Export Laporan ke Excel (.xlsx)
            </Button>
            <Button
              variant="outline"
              size="admin"
              leftIcon={<LogOut className="h-5 w-5 text-red-600" />}
              onClick={handleAdminLogout}
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              Keluar
            </Button>
          </div>
        </header>

        {/* MAIN ADMIN WORKSPACE */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-8">
          {/* ================================================================
              TAB 1: RINGKASAN & ANALITIK KEUANGAN (/admin/reports)
             ================================================================ */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <Badge variant="success" size="md">
                    Tab 1 • Ringkasan &amp; Analitik Keuangan Transparan
                  </Badge>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                    Ringkasan &amp; Analitik Keuangan CimoFood
                  </h1>
                  <p className="text-sm text-slate-600">
                    Pantau real-time Total Omzet Kotor, Setoran Modal Harga
                    Dasar ke Produsen Cimoring, Pendapatan Biaya Packing, dan
                    Laba Bersih Tim CimoFood (Markup/Ujrah).
                  </p>
                </div>

                <Button
                  variant="success"
                  size="admin"
                  isLoading={isExportingExcel}
                  leftIcon={<Download className="h-5 w-5" />}
                  onClick={async () => {
                    setIsExportingExcel(true);
                    await exportOrdersToExcel(
                      reportMetrics.validOrders,
                      `Laporan-CimoFood-${reportPeriod}`
                    );
                    setIsExportingExcel(false);
                    showToast({
                      type: "success",
                      title: "Export Laporan ke Excel (.xlsx) Berhasil!",
                      description:
                        "File Excel multi-sheet (Ringkasan Keuangan & Detail Transaksi Lengkap) siap disimpan ke Google Drive.",
                    });
                  }}
                >
                  Export Laporan ke Excel (.xlsx)
                </Button>
              </div>

              {/* Period Filter Pills: Hari Ini, Minggu Ini, Bulan Ini, Semua */}
              <div className="flex flex-wrap gap-2.5">
                {(
                  [
                    { id: "TODAY", label: "Hari Ini" },
                    { id: "THIS_WEEK", label: "Minggu Ini" },
                    { id: "THIS_MONTH", label: "Bulan Ini" },
                    { id: "ALL_TIME", label: "Semua" },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setReportPeriod(p.id)}
                    className={`min-h-12 px-5 rounded-xl text-xs sm:text-sm font-extrabold border transition-all cursor-pointer ${
                      reportPeriod === p.id
                        ? "bg-[#EA580C] text-white border-[#EA580C] shadow-sm"
                        : "bg-white text-slate-700 border-slate-300 hover:border-[#EA580C]"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* 4 KPI Cards Utama Sesuai Spesifikasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card surface="admin" hoverElevation={false} className="p-5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    1. Total Omzet Kotor
                  </span>
                  <p className="text-2xl font-black text-slate-900 mt-1.5">
                    {formatRupiah(reportMetrics.grossRevenue)}
                  </p>
                  <span className="text-xs text-slate-500 mt-1 block">
                    Dari {reportMetrics.validOrders.length} transaksi (
                    {reportMetrics.totalPacksSold} kemasan terjual)
                  </span>
                </Card>

                <Card surface="admin" hoverElevation={false} className="p-5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    2. Setoran Harga Dasar ke Produsen (Modal)
                  </span>
                  <p className="text-2xl font-black text-[#C2410C] mt-1.5">
                    {formatRupiah(reportMetrics.producerBasePayout)}
                  </p>
                  <span className="text-xs text-slate-500 mt-1 block">
                    Hak penuh pemilik UMKM Cimoring (∑ P_dasar × Q)
                  </span>
                </Card>

                <Card surface="admin" hoverElevation={false} className="p-5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    3. Total Pendapatan Biaya Packing
                  </span>
                  <p className="text-2xl font-black text-indigo-700 mt-1.5">
                    {formatRupiah(reportMetrics.totalPackingFeeRevenue)}
                  </p>
                  <span className="text-xs text-slate-500 mt-1 block">
                    Biaya kemas SOP 4 Lapis (Kardus + Bubble Wrap)
                  </span>
                </Card>

                <Card
                  surface="admin"
                  hoverElevation={false}
                  className="p-5 border-2 border-emerald-300 bg-emerald-50/40"
                >
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                    4. Laba Bersih Tim CimoFood (Markup/Ujrah)
                  </span>
                  <p className="text-2xl font-black text-emerald-700 mt-1.5">
                    +{formatRupiah(reportMetrics.netProfitCimofood)}
                  </p>
                  <span className="text-xs text-emerald-800 mt-1 block font-semibold">
                    Selisih Markup + Margin Packing SOP
                  </span>
                </Card>
              </div>

              {/* Tabel Rincian Transaksi Online & Offline */}
              <Card
                surface="admin"
                hoverElevation={false}
                className="overflow-hidden"
              >
                <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Rincian Transaksi Online &amp; POS Offline
                    </h3>
                    <p className="text-xs text-slate-500">
                      Menampilkan perbandingan Modal Produsen, Biaya Packing,
                      Total Tagihan, dan Laba Bersih Tim CimoFood.
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="p-4">Kode Pesanan</th>
                        <th className="p-4">Tanggal</th>
                        <th className="p-4">Kanal</th>
                        <th className="p-4">Pembeli</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Setor Produsen (Modal)</th>
                        <th className="p-4">Biaya Packing</th>
                        <th className="p-4">Total Omzet</th>
                        <th className="p-4">Laba Bersih (Ujrah)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {reportMetrics.validOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50">
                          <td className="p-4 font-mono font-bold text-[#EA580C]">
                            <Link href={`/track/${o.order_code}`}>
                              {o.order_code}
                            </Link>
                          </td>
                          <td className="p-4 text-slate-600">
                            {formatDateID(o.created_at)}
                          </td>
                          <td className="p-4 font-semibold">{o.channel}</td>
                          <td className="p-4 font-bold text-slate-900">
                            {o.customer_name}
                          </td>
                          <td className="p-4">
                            <OrderStatusBadge
                              status={o.status}
                              showStageNumber={false}
                              size="sm"
                            />
                          </td>
                          <td className="p-4 font-semibold text-slate-700">
                            {formatRupiah(o.subtotal_base_price)}
                          </td>
                          <td className="p-4 font-semibold text-indigo-700">
                            {formatRupiah(o.packing_fee)}
                          </td>
                          <td className="p-4 font-extrabold text-slate-900">
                            {formatRupiah(o.grand_total)}
                          </td>
                          <td className="p-4 font-black text-emerald-700">
                            +{formatRupiah(o.net_profit_cimofood)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ================================================================
              TAB 2: MANAJEMEN PESANAN (8 TAHAP WORKFLOW) (/admin/orders)
             ================================================================ */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <Badge variant="spicy" size="md">
                    Tab 2 • Workflow 8 Tahap &amp; SOP Packing 4 Lapis
                  </Badge>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                    Manajemen Pesanan (8 Tahap Workflow)
                  </h1>
                  <p className="text-sm text-slate-600">
                    Input Ongkir &amp; Kirim Tagihan ke WA Pembeli, Verifikasi
                    Lunas, Diambil dari Produsen, Upload Foto Bukti Kemasan SOP
                    4 Lapis, hingga Input Resi.
                  </p>
                </div>
              </div>

              {/* Filter Tab Cepat Berdasarkan Status Operasional (min-h-12) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {orderFilterTabs.map((tab) => {
                  const active = orderFilterGroup === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setOrderFilterGroup(tab.id)}
                      className={`min-h-12 px-4 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap border transition-all cursor-pointer ${
                        active
                          ? "bg-[#EA580C] text-white border-[#EA580C] shadow-sm"
                          : "bg-white text-slate-700 border-slate-300 hover:border-[#EA580C]"
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  );
                })}
              </div>

              {/* Orders List Cards */}
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <Card
                    key={order.id}
                    surface="admin"
                    hoverElevation={false}
                    className="p-5 sm:p-6 space-y-4 border-slate-200 shadow-sm"
                  >
                    {/* MANDATORY YELLOW ALERT BANNER FOR ORIGINAL VARIANT */}
                    {order.has_sensitive_original_item && (
                      <div className="rounded-2xl bg-amber-100 border-2 border-amber-400 p-4 text-amber-950 flex items-start gap-3">
                        <AlertTriangle className="h-6 w-6 text-[#C2410C] shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm font-extrabold leading-relaxed">
                          ⚠️ PERHATIAN SOP: Pesanan ini berisi Varian Original
                          (plastik tanpa bumbu lebih tipis). Jangan menekan
                          kardus terlalu kencang agar tidak jepot!
                        </p>
                      </div>
                    )}

                    {/* Top Row: Code, Status, Customer, Financials */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <Link
                            href={`/track/${order.order_code}`}
                            className="font-mono text-lg font-black text-[#EA580C] hover:underline flex items-center gap-1"
                          >
                            <span>{order.order_code}</span>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                          <OrderStatusBadge status={order.status} size="md" />
                          <Badge variant="neutral" size="sm">
                            {order.channel}
                          </Badge>
                          <Badge variant="info" size="sm">
                            Kurir: {order.courier}
                          </Badge>
                        </div>
                        <p className="text-sm font-bold text-slate-900">
                          {order.customer_name} •{" "}
                          <span className="font-mono text-slate-600">
                            {order.customer_whatsapp}
                          </span>{" "}
                          • {order.customer_city}
                        </p>
                        <p className="text-xs text-slate-500">
                          Alamat: {order.shipping_address}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-right">
                        <div>
                          <span className="text-[11px] font-semibold text-slate-500 block">
                            Setor Produsen
                          </span>
                          <span className="text-sm font-extrabold text-slate-800">
                            {formatRupiah(order.subtotal_base_price)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-slate-500 block">
                            Total Tagihan
                          </span>
                          <span className="text-sm font-black text-[#EA580C]">
                            {formatRupiah(order.grand_total)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-slate-500 block">
                            Laba CimoFood
                          </span>
                          <span className="text-sm font-extrabold text-emerald-700">
                            +{formatRupiah(order.net_profit_cimofood)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items Pills */}
                    <div className="flex flex-wrap gap-2">
                      {order.items.map((item) => (
                        <span
                          key={item.id}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                            item.is_sensitive_snapshot
                              ? "bg-amber-50 border-amber-300 text-amber-950"
                              : "bg-slate-100 border-slate-200 text-slate-800"
                          }`}
                        >
                          {item.product_name_snapshot} (
                          {item.size_label_snapshot}) × {item.quantity}
                        </span>
                      ))}
                    </div>

                    {/* STAGE-SPECIFIC LARGE TOUCH CONTROLS (h-12 minimum) */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                      {/* TAHAP KONFIRMASI (Stage 1 / 2 -> Stage 3): Input Ongkir + Kirim Tagihan ke WA Pembeli */}
                      {(order.status === "1_CHECKOUT_CREATED" ||
                        order.status === "2_WAITING_STOCK_CONFIRMATION") && (
                        <div className="w-full rounded-2xl bg-orange-50/70 border border-orange-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="text-xs font-extrabold text-slate-800">
                              Input Nominal Ongkir ({order.courier}) Rp:
                            </label>
                            <input
                              type="number"
                              value={shippingInputs[order.id] ?? 12000}
                              onChange={(e) =>
                                setShippingInputs((prev) => ({
                                  ...prev,
                                  [order.id]: Number(e.target.value) || 0,
                                }))
                              }
                              className="h-12 w-40 rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-black text-slate-900"
                            />
                          </div>
                          <Button
                            variant="primary"
                            size="admin"
                            leftIcon={<MessageCircle className="h-5 w-5" />}
                            onClick={async () => {
                              const ongkir = shippingInputs[order.id] ?? 12000;
                              const updated = await updateOrderStage(
                                order.id,
                                "3_WAITING_PAYMENT",
                                { shipping_cost: ongkir }
                              );
                              await loadData();
                              showToast({
                                type: "success",
                                title:
                                  "Ongkir Disimpan & Tagihan WA Disiapkan!",
                                description: `Total tagihan baru: ${formatRupiah(updated?.grand_total || 0)}.`,
                              });
                              if (updated) {
                                window.open(
                                  createAdminToCustomerWhatsAppUrl(
                                    updated,
                                    "PAYMENT_READY"
                                  ),
                                  "_blank",
                                  "noopener,noreferrer"
                                );
                              }
                            }}
                          >
                            Kirim Tagihan ke WA Pembeli
                          </Button>
                        </div>
                      )}

                      {/* TAHAP VERIFIKASI BAYAR (Stage 3 -> Stage 4) */}
                      {order.status === "3_WAITING_PAYMENT" && (
                        <div className="w-full rounded-2xl bg-amber-50/80 border border-amber-200 p-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="secondary"
                              size="admin"
                              leftIcon={<Eye className="h-5 w-5" />}
                              onClick={() => setPreviewProofOrder(order)}
                            >
                              Lihat Bukti Transfer / QRIS
                            </Button>
                            <span className="text-xs font-semibold text-slate-600">
                              Metode:{" "}
                              <strong>{order.payment_method}</strong> • Tagihan:{" "}
                              <strong>{formatRupiah(order.grand_total)}</strong>
                            </span>
                          </div>

                          <Button
                            variant="success"
                            size="admin"
                            leftIcon={<CheckCircle2 className="h-5 w-5" />}
                            onClick={async () => {
                              await updateOrderStage(
                                order.id,
                                "4_PAID_VERIFIED",
                                {
                                  payment_proof_url:
                                    order.payment_proof_url ||
                                    DEFAULT_PAYMENT_PROOF,
                                }
                              );
                              await loadData();
                              showToast({
                                type: "success",
                                title: "Verifikasi Lunas Berhasil!",
                                description:
                                  "Pesanan siap diambil dari rumah produksi Cimoring.",
                              });
                            }}
                          >
                            Verifikasi Lunas
                          </Button>
                        </div>
                      )}

                      {/* TAHAP PENGAMBILAN PRODUSEN (Stage 4 -> Stage 5) */}
                      {order.status === "4_PAID_VERIFIED" && (
                        <div className="w-full rounded-2xl bg-indigo-50 border border-indigo-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 block">
                              Setoran Tunai ke Pemilik UMKM Cimoring (Total
                              base_price)
                            </span>
                            <span className="text-lg font-black text-indigo-950">
                              Wajib Bayar Tunai ke Produsen:{" "}
                              {formatRupiah(order.subtotal_base_price)}
                            </span>
                          </div>
                          <Button
                            variant="primary"
                            size="admin"
                            leftIcon={<PackageCheck className="h-5 w-5" />}
                            onClick={async () => {
                              await updateOrderStage(
                                order.id,
                                "5_PICKED_FROM_PRODUCER"
                              );
                              await loadData();
                              showToast({
                                type: "info",
                                title: "Diambil dari Produsen!",
                                description:
                                  "Lanjutkan ke tahap Pengemasan SOP 4 Lapis & Upload Foto Bukti Kemasan.",
                              });
                            }}
                          >
                            Diambil dari Produsen
                          </Button>
                        </div>
                      )}

                      {/* TAHAP PACKING SOP 4 LAPIS (Stage 5 -> Stage 6) */}
                      {order.status === "5_PICKED_FROM_PRODUCER" && (
                        <div className="w-full rounded-2xl bg-orange-50 border border-orange-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-xs sm:text-sm font-bold text-slate-800">
                            Wajib centang 4 Checklist SOP (Segel Sealer, Apit
                            Kardus Kanan-Kiri, Kardus Melingkar, Bubble Wrap)
                            &amp; Upload Foto Bukti Kemasan:
                          </div>
                          <Button
                            variant="primary"
                            size="admin"
                            leftIcon={<Camera className="h-5 w-5" />}
                            onClick={() => handleOpenSopModal(order)}
                          >
                            Pengemasan SOP 4 Lapis &amp; Upload Foto
                          </Button>
                        </div>
                      )}

                      {/* TAHAP PENGIRIMAN (Stage 6 -> Stage 7) */}
                      {order.status === "6_PACKED_SOP_VERIFIED" && (
                        <div className="w-full rounded-2xl bg-emerald-50/70 border border-emerald-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="text-xs font-extrabold text-slate-800">
                              Input Nomor Resi ({order.courier}):
                            </label>
                            <input
                              type="text"
                              value={resiInputs[order.id] ?? ""}
                              onChange={(e) =>
                                setResiInputs((prev) => ({
                                  ...prev,
                                  [order.id]: e.target.value,
                                }))
                              }
                              placeholder="Masukkan No. Resi"
                              className="h-12 w-52 rounded-xl border border-slate-300 bg-white px-3.5 font-mono text-sm font-bold uppercase"
                            />
                          </div>
                          <Button
                            variant="success"
                            size="admin"
                            leftIcon={<Truck className="h-5 w-5" />}
                            onClick={async () => {
                              const resi =
                                resiInputs[order.id]?.trim() || "JP9988776655";
                              const updated = await updateOrderStage(
                                order.id,
                                "7_SHIPPED",
                                { tracking_number: resi }
                              );
                              await loadData();
                              showToast({
                                type: "success",
                                title:
                                  "Nomor Resi Tersimpan & Status SHIPPED!",
                                description: `Resi ${resi} telah disimpan.`,
                              });
                              if (updated) {
                                window.open(
                                  createAdminToCustomerWhatsAppUrl(
                                    updated,
                                    "SHIPPED"
                                  ),
                                  "_blank",
                                  "noopener,noreferrer"
                                );
                              }
                            }}
                          >
                            Simpan Resi &amp; Kirim WA ke Pembeli
                          </Button>
                        </div>
                      )}

                      {/* Stage 7 -> Stage 8 */}
                      {order.status === "7_SHIPPED" && (
                        <div className="w-full flex flex-wrap items-center justify-between gap-3">
                          <span className="text-xs font-bold text-slate-600">
                            Nomor Resi Aktif:{" "}
                            <strong className="font-mono text-slate-900">
                              {order.tracking_number}
                            </strong>
                          </span>
                          <Button
                            variant="secondary"
                            size="admin"
                            leftIcon={<Check className="h-5 w-5" />}
                            onClick={async () => {
                              await updateOrderStage(order.id, "8_COMPLETED");
                              await loadData();
                              showToast({
                                type: "success",
                                title: "Pesanan Selesai (8_COMPLETED)",
                                description: `Pesanan ${order.order_code} telah selesai.`,
                              });
                            }}
                          >
                            Tandai Pesanan Selesai (Diterima)
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 3: KASIR CEPAT / POS OFFLINE (/admin/pos)
             ================================================================ */}
          {activeTab === "pos" && (
            <div className="space-y-6">
              <div>
                <Badge variant="warning" size="md">
                  Tab 3 • Touch POS Kasir Rumah Produksi (1-Klik Selesai)
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  Kasir Cepat / POS Offline (Pembeli Datang Langsung)
                </h1>
                <p className="text-sm text-slate-600">
                  Klik kartu varian &amp; ukuran di kiri $\rightarrow$ pilih
                  metode bayar (Tunai/QRIS) $\rightarrow$ klik{" "}
                  <strong>&ldquo;Simpan Transaksi Instan (1-Klik)&rdquo;</strong>
                  . Stok otomatis berkurang &amp; langsung masuk ke Laporan
                  Keuangan!
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Grid Tombol Besar per Varian & Ukuran + Eceran Warung */}
                <div className="lg:col-span-8 space-y-5">
                  <Card
                    surface="admin"
                    hoverElevation={false}
                    className="p-5 bg-amber-50/80 border-amber-300 space-y-3"
                  >
                    <h2 className="text-sm font-black uppercase tracking-wider text-amber-950">
                      ⚡ Tombol Cepat: Eceran Warung / Rumah (Rp 1.000 – Rp
                      5.000)
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        {
                          label: "Eceran Warung Rp 1.000",
                          base: 800,
                          sell: 1000,
                        },
                        {
                          label: "Eceran Warung Rp 2.000",
                          base: 1600,
                          sell: 2000,
                        },
                        {
                          label: "Eceran Rumah Rp 3.000",
                          base: 2400,
                          sell: 3000,
                        },
                        {
                          label: "Eceran Rumah Rp 5.000",
                          base: 4000,
                          sell: 5000,
                        },
                      ].map((ecer) => (
                        <button
                          key={ecer.label}
                          type="button"
                          onClick={() =>
                            handleAddPosItem({
                              key: `ECER-${ecer.sell}`,
                              variant_id:
                                products[0]?.variants[0]?.id || "eceran-id",
                              product_name: ecer.label,
                              size_label: "Eceran",
                              is_sensitive_packaging: false,
                              unit_base_price: ecer.base,
                              unit_selling_price: ecer.sell,
                            })
                          }
                          className="min-h-16 p-3.5 rounded-2xl bg-white border-2 border-amber-400 hover:bg-amber-100 active:scale-[0.98] transition-all text-left cursor-pointer shadow-xs"
                        >
                          <span className="text-xs font-bold text-stone-600 block">
                            {ecer.label}
                          </span>
                          <span className="text-lg font-black text-[#C2410C]">
                            + {formatRupiah(ecer.sell)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </Card>

                  {/* Grid 6 Varian & 4 Ukuran + Hampers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {products.map((prod) => (
                      <Card
                        key={prod.id}
                        surface="admin"
                        hoverElevation={false}
                        className="p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-extrabold text-slate-900">
                            {prod.name}
                          </h3>
                          <Badge variant="spicy" size="sm">
                            {prod.flavor_category}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {prod.variants.map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              disabled={v.stock_qty <= 0}
                              onClick={() =>
                                handleAddPosItem({
                                  key: v.id,
                                  variant_id: v.id,
                                  product_name: prod.name,
                                  size_label: v.size_label,
                                  is_sensitive_packaging:
                                    prod.is_sensitive_packaging,
                                  unit_base_price: v.base_price,
                                  unit_selling_price: v.web_price,
                                })
                              }
                              className="min-h-14 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-[#EA580C] hover:bg-orange-50/60 active:scale-[0.98] transition-all text-left cursor-pointer disabled:opacity-40"
                            >
                              <div className="flex items-center justify-between text-xs font-extrabold text-slate-900">
                                <span>{v.size_label}</span>
                                <span className="text-[10px] text-slate-500">
                                  Stok: {v.stock_qty}
                                </span>
                              </div>
                              <span className="text-sm font-black text-[#EA580C] block mt-0.5">
                                {formatRupiah(v.web_price)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Right: Ringkasan Struk Kasir & Tombol Simpan Transaksi Instan (1-Klik) */}
                <div className="lg:col-span-4">
                  <Card
                    surface="admin"
                    hoverElevation={false}
                    className="p-6 space-y-5 sticky top-24 border-2 border-slate-300"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <h2 className="text-lg font-black text-slate-900">
                        Ringkasan Struk Kasir POS
                      </h2>
                      {posCart.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setPosCart([])}
                          className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                        >
                          Kosongkan
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Nama Pembeli / Catatan (Opsional):
                      </label>
                      <input
                        type="text"
                        value={posCustomerName}
                        onChange={(e) => setPosCustomerName(e.target.value)}
                        placeholder="Pembeli Eceran Rumah Produksi"
                        className="w-full h-12 rounded-xl border border-slate-300 px-3.5 text-sm font-semibold"
                      />
                    </div>

                    {posCart.length === 0 ? (
                      <div className="py-10 text-center text-xs text-slate-500">
                        Ketuk kartu varian &amp; ukuran di sebelah kiri untuk
                        memasukkan ke struk kasir.
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-64 overflow-y-auto">
                        {posCart.map((line) => (
                          <div
                            key={line.key}
                            className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-slate-900 truncate">
                                {line.product_name} ({line.size_label})
                              </p>
                              <p className="text-xs font-bold text-[#EA580C]">
                                {formatRupiah(line.unit_selling_price)} ×{" "}
                                {line.quantity} ={" "}
                                {formatRupiah(
                                  line.unit_selling_price * line.quantity
                                )}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setPosCart((prev) =>
                                    prev
                                      .map((i) =>
                                        i.key === line.key
                                          ? { ...i, quantity: i.quantity - 1 }
                                          : i
                                      )
                                      .filter((i) => i.quantity > 0)
                                  )
                                }
                                className="h-10 w-10 rounded-lg bg-white border border-slate-300 flex items-center justify-center cursor-pointer"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-7 text-center text-xs font-black">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setPosCart((prev) =>
                                    prev.map((i) =>
                                      i.key === line.key
                                        ? { ...i, quantity: i.quantity + 1 }
                                        : i
                                    )
                                  )
                                }
                                className="h-10 w-10 rounded-lg bg-white border border-slate-300 flex items-center justify-center cursor-pointer"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setPosCart((prev) =>
                                    prev.filter((i) => i.key !== line.key)
                                  )
                                }
                                className="h-10 w-10 text-slate-400 hover:text-red-600 flex items-center justify-center cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Payment Method Selector: Tunai or QRIS */}
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <span className="text-xs font-extrabold text-slate-700 block">
                        Pilih Metode Bayar (Tunai / QRIS):
                      </span>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setPosPaymentMethod("TUNAI_POS")}
                          className={`min-h-12 rounded-xl border font-extrabold text-sm cursor-pointer transition-all ${
                            posPaymentMethod === "TUNAI_POS"
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-300"
                          }`}
                        >
                          💵 Tunai
                        </button>
                        <button
                          type="button"
                          onClick={() => setPosPaymentMethod("QRIS")}
                          className={`min-h-12 rounded-xl border font-extrabold text-sm cursor-pointer transition-all ${
                            posPaymentMethod === "QRIS"
                              ? "bg-[#EA580C] text-white border-[#EA580C]"
                              : "bg-white text-slate-700 border-slate-300"
                          }`}
                        >
                          📱 QRIS
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-3 space-y-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-bold text-slate-700">
                          Total Bayar:
                        </span>
                        <span className="text-2xl font-black text-[#EA580C]">
                          {formatRupiah(
                            posCart.reduce(
                              (s, i) => s + i.unit_selling_price * i.quantity,
                              0
                            )
                          )}
                        </span>
                      </div>

                      <Button
                        variant="success"
                        size="admin"
                        fullWidth
                        isLoading={isProcessingPos}
                        leftIcon={<CheckCircle2 className="h-5 w-5" />}
                        onClick={handleSaveOfflinePosTransaction}
                      >
                        Simpan Transaksi Instan (1-Klik)
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 4: MANAJEMEN STOK & HARGA 3 TINGKAT (/admin/inventory)
             ================================================================ */}
          {activeTab === "inventory" && (
            <div className="space-y-6">
              <div>
                <Badge variant="info" size="md">
                  Tab 4 • Kontrol Stok 1 Detik &amp; Validasi Harga 3 Tingkat
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  Manajemen Stok &amp; Harga 3 Tingkat
                </h1>
                <p className="text-sm text-slate-600">
                  Tambah/kurangi stok harian dengan tombol{" "}
                  <strong>+ / -</strong> besar, ubah switch{" "}
                  <strong>Tersedia / Habis</strong> dalam 1 detik, dan atur
                  Harga Dasar Produsen/Reseller, Harga Eceran Web, serta Harga
                  Pembanding Marketplace (Shopee).
                </p>
              </div>

              <Card
                surface="admin"
                hoverElevation={false}
                className="overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="p-4">Varian Produk &amp; Ukuran</th>
                        <th className="p-4">
                          1. Harga Dasar Produsen &amp; Reseller
                        </th>
                        <th className="p-4">2. Harga Eceran Web CimoFood</th>
                        <th className="p-4">
                          3. Harga Pembanding Marketplace (Shopee)
                        </th>
                        <th className="p-4">Switch Tersedia / Habis</th>
                        <th className="p-4">Stok Harian (+ / -)</th>
                        <th className="p-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {products.flatMap((product) =>
                        product.variants.map((variant) => {
                          const priceState = editingVariantPrices[
                            variant.id
                          ] || {
                            base_price: variant.base_price,
                            reseller_price: variant.reseller_price,
                            web_price: variant.web_price,
                            shopee_price: variant.shopee_price,
                          };
                          const isReady =
                            variant.is_ready_stock && variant.stock_qty > 0;
                          const isExceedingShopee =
                            priceState.web_price > priceState.shopee_price;

                          return (
                            <tr
                              key={variant.id}
                              className={`transition-colors ${
                                isExceedingShopee
                                  ? "bg-red-50/70 hover:bg-red-50"
                                  : "hover:bg-slate-50/80"
                              }`}
                            >
                              <td className="p-4">
                                <div className="font-extrabold text-slate-900">
                                  {product.name}
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  <Badge variant="spicy" size="sm">
                                    {variant.size_label} ({variant.weight_grams}
                                    g)
                                  </Badge>
                                  {product.is_sensitive_packaging && (
                                    <Badge variant="sensitive" size="sm">
                                      SOP Original
                                    </Badge>
                                  )}
                                </div>
                              </td>

                              {/* Tingkat 1: Harga Dasar Produsen & Harga Reseller */}
                              <td className="p-4">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-bold text-slate-500 w-16">
                                      Produsen:
                                    </span>
                                    <input
                                      type="number"
                                      value={priceState.base_price}
                                      onChange={(e) =>
                                        setEditingVariantPrices((prev) => ({
                                          ...prev,
                                          [variant.id]: {
                                            ...priceState,
                                            base_price:
                                              Number(e.target.value) || 0,
                                          },
                                        }))
                                      }
                                      className="w-28 h-10 rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-bold text-amber-800 w-16">
                                      Reseller:
                                    </span>
                                    <input
                                      type="number"
                                      value={priceState.reseller_price}
                                      onChange={(e) =>
                                        setEditingVariantPrices((prev) => ({
                                          ...prev,
                                          [variant.id]: {
                                            ...priceState,
                                            reseller_price:
                                              Number(e.target.value) || 0,
                                          },
                                        }))
                                      }
                                      className="w-28 h-10 rounded-xl border border-amber-300 bg-amber-50/40 px-2.5 text-xs font-bold text-amber-950"
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* Tingkat 2: Harga Eceran Web CimoFood + Indikator Peringatan Otomatis */}
                              <td className="p-4">
                                <div className="space-y-1">
                                  <input
                                    type="number"
                                    value={priceState.web_price}
                                    onChange={(e) =>
                                      setEditingVariantPrices((prev) => ({
                                        ...prev,
                                        [variant.id]: {
                                          ...priceState,
                                          web_price:
                                            Number(e.target.value) || 0,
                                        },
                                      }))
                                    }
                                    className={`w-32 h-12 rounded-xl border px-3 text-sm font-black ${
                                      isExceedingShopee
                                        ? "border-red-500 bg-red-50 text-red-700"
                                        : "border-orange-300 bg-orange-50/40 text-[#EA580C]"
                                    }`}
                                  />
                                  {isExceedingShopee && (
                                    <div className="flex items-center gap-1 text-[11px] font-extrabold text-red-600">
                                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                      <span>
                                        Melebihi Harga Shopee! (Wajib ≤{" "}
                                        {formatRupiah(priceState.shopee_price)})
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Tingkat 3: Harga Pembanding Marketplace (Shopee) */}
                              <td className="p-4">
                                <input
                                  type="number"
                                  value={priceState.shopee_price}
                                  onChange={(e) =>
                                    setEditingVariantPrices((prev) => ({
                                      ...prev,
                                      [variant.id]: {
                                        ...priceState,
                                        shopee_price:
                                          Number(e.target.value) || 0,
                                      },
                                    }))
                                  }
                                  className="w-32 h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700"
                                />
                              </td>

                              {/* One-Touch Switch Tersedia / Habis */}
                              <td className="p-4">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleQuickStockChange(
                                      variant,
                                      isReady
                                        ? 0
                                        : Math.max(25, variant.stock_qty),
                                      !isReady
                                    )
                                  }
                                  className={`min-h-12 px-4 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                                    isReady
                                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                      : "bg-slate-200 text-slate-700 border-slate-300"
                                  }`}
                                >
                                  {isReady ? "✓ Tersedia" : "✕ Habis"}
                                </button>
                              </td>

                              {/* Large + / - Stock Stepper */}
                              <td className="p-4">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuickStockChange(
                                        variant,
                                        Math.max(0, variant.stock_qty - 1)
                                      )
                                    }
                                    className="h-12 w-12 rounded-xl bg-white border border-slate-300 hover:border-[#EA580C] flex items-center justify-center font-black text-base text-slate-800 cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="w-12 text-center text-base font-black text-slate-900">
                                    {variant.stock_qty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuickStockChange(
                                        variant,
                                        variant.stock_qty + 1,
                                        true
                                      )
                                    }
                                    className="h-12 w-12 rounded-xl bg-white border border-slate-300 hover:border-[#EA580C] flex items-center justify-center font-black text-base text-slate-800 cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>

                              <td className="p-4 text-right">
                                <Button
                                  variant="secondary"
                                  size="admin"
                                  onClick={() =>
                                    handleSaveVariantPrice(variant)
                                  }
                                >
                                  Simpan Harga
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ================================================================
              TAB 5: PESERTA GIVEAWAY & MITRA RESELLER (/admin/giveaway)
             ================================================================ */}
          {activeTab === "giveaway" && (
            <div className="space-y-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <Badge variant="spicy" size="md">
                    Tab 5 • Data Peserta Giveaway &amp; Mitra Reseller Resmi
                  </Badge>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                    Manajemen Peserta Giveaway &amp; Mitra Reseller
                  </h1>
                  <p className="text-sm text-slate-600">
                    Seluruh peserta yang mendaftar di halaman{" "}
                    <Link
                      href="/giveaway"
                      className="font-bold text-[#EA580C] underline"
                    >
                      /giveaway
                    </Link>{" "}
                    dan mitra di{" "}
                    <Link
                      href="/reseller"
                      className="font-bold text-[#EA580C] underline"
                    >
                      /reseller
                    </Link>{" "}
                    otomatis tercatat di sini.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="admin"
                  leftIcon={<Sparkles className="h-5 w-5" />}
                  onClick={() => {
                    if (giveawayList.length === 0) return;
                    const pool =
                      giveawayList.filter((p) => p.is_verified).length > 0
                        ? giveawayList.filter((p) => p.is_verified)
                        : giveawayList;
                    const chosen =
                      pool[Math.floor(Math.random() * pool.length)];
                    setLuckyWinner(chosen);
                    try {
                      confetti({
                        particleCount: 100,
                        spread: 75,
                        origin: { y: 0.6 },
                      });
                    } catch {
                      // ignore
                    }
                    showToast({
                      type: "success",
                      title: `🎉 Pemenang Terpilih: ${chosen.full_name}!`,
                      description: `Nomor Kupon: ${chosen.coupon_code} (${chosen.whatsapp})`,
                    });
                  }}
                >
                  Undi Pemenang Giveaway Beruntung
                </Button>
              </div>

              {luckyWinner && (
                <Card
                  surface="admin"
                  hoverElevation={false}
                  className="p-6 border-2 border-emerald-500 bg-emerald-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <Badge variant="success" size="md">
                      🏆 Pemenang Undian Giveaway Terpilih
                    </Badge>
                    <h3 className="text-xl font-black text-slate-900">
                      {luckyWinner.full_name} — Kupon:{" "}
                      <span className="font-mono text-[#EA580C]">
                        {luckyWinner.coupon_code}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600">
                      WhatsApp: {luckyWinner.whatsapp} • IG:{" "}
                      {luckyWinner.instagram_username} • TikTok:{" "}
                      {luckyWinner.tiktok_username} • Shopee:{" "}
                      {luckyWinner.shopee_username}
                    </p>
                  </div>
                  <a
                    href={`https://wa.me/${luckyWinner.whatsapp}?text=${encodeURIComponent(
                      `Selamat Kak *${luckyWinner.full_name}*! 🎉🎁\nNomor Kupon Undian Giveaway Cimoring Kakak (*${luckyWinner.coupon_code}*) terpilih sebagai PEMENANG Paket Hampers Cimoring CimoFood! Silakan balas pesan ini dengan alamat lengkap pengiriman ya Kak!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="success"
                      size="admin"
                      leftIcon={<MessageCircle className="h-5 w-5" />}
                    >
                      Hubungi Pemenang via WA
                    </Button>
                  </a>
                </Card>
              )}

              {/* Tabel Peserta Giveaway */}
              <Card
                surface="admin"
                hoverElevation={false}
                className="overflow-hidden"
              >
                <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      Daftar Peserta Kampanye Giveaway ({giveawayList.length}{" "}
                      Peserta)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Verifikasi syarat Follow Instagram @cimoring, TikTok
                      @cimoring, dan Shopee Cimoring.
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="p-4">Nomor Kupon</th>
                        <th className="p-4">Nama &amp; WhatsApp</th>
                        <th className="p-4">Akun IG / TikTok / Shopee</th>
                        <th className="p-4">Waktu Daftar</th>
                        <th className="p-4">Status Verifikasi</th>
                        <th className="p-4 text-right">Aksi Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {giveawayList.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-4 font-mono font-black text-[#EA580C]">
                            {p.coupon_code}
                          </td>
                          <td className="p-4">
                            <p className="font-extrabold text-slate-900">
                              {p.full_name}
                            </p>
                            <p className="font-mono text-xs text-slate-500">
                              {p.whatsapp}
                            </p>
                          </td>
                          <td className="p-4 text-xs text-slate-700">
                            <div>IG: {p.instagram_username}</div>
                            <div>TikTok: {p.tiktok_username}</div>
                            <div>Shopee: {p.shopee_username}</div>
                          </td>
                          <td className="p-4 text-xs text-slate-500">
                            {formatDateID(p.created_at)}
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={p.is_verified ? "success" : "warning"}
                              size="sm"
                            >
                              {p.is_verified
                                ? "✓ Terverifikasi Sah"
                                : "Menunggu Cek Follow"}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant={p.is_verified ? "ghost" : "success"}
                              size="admin"
                              onClick={async () => {
                                await toggleVerifyGiveawayParticipant(p.id);
                                await loadData();
                                showToast({
                                  type: "info",
                                  title: `Status Peserta ${p.full_name} Diperbarui`,
                                });
                              }}
                            >
                              {p.is_verified
                                ? "Batalkan Verifikasi"
                                : "Verifikasi Peserta"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Tabel Mitra Reseller Terdaftar */}
              <Card
                surface="admin"
                hoverElevation={false}
                className="overflow-hidden"
              >
                <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#EA580C]" />
                      <span>
                        Daftar Mitra Reseller &amp; Pencapaian Target Bulanan (
                        {resellers.length} Mitra)
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Memantau kode referral, progres penjualan bulanan, dan
                      estimasi pencairan bonus komisi 5%.
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="p-4">Nama Mitra &amp; Kota</th>
                        <th className="p-4">Kode Referral</th>
                        <th className="p-4">Omzet Bulan Ini</th>
                        <th className="p-4">Target Bulanan</th>
                        <th className="p-4">Estimasi Bonus (5%)</th>
                        <th className="p-4">Pesanan Referral</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {resellers.map((r) => {
                        const bonus = Math.round(
                          (r.current_month_sales * r.bonus_percentage) / 100
                        );
                        return (
                          <tr key={r.id} className="hover:bg-slate-50">
                            <td className="p-4">
                              <p className="font-extrabold text-slate-900">
                                {r.full_name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {r.city} • {r.phone_whatsapp}
                              </p>
                            </td>
                            <td className="p-4 font-mono font-black text-[#EA580C]">
                              {r.referral_code}
                            </td>
                            <td className="p-4 font-extrabold text-slate-900">
                              {formatRupiah(r.current_month_sales)}
                            </td>
                            <td className="p-4 font-semibold text-slate-600">
                              {formatRupiah(r.monthly_target_amount)}
                            </td>
                            <td className="p-4 font-black text-emerald-700">
                              +{formatRupiah(bonus)}
                            </td>
                            <td className="p-4 font-bold text-slate-700">
                              {r.total_orders_referred} Pesanan
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: PREVIEW BUKTI PEMBAYARAN */}
      <Modal
        isOpen={Boolean(previewProofOrder)}
        onClose={() => setPreviewProofOrder(null)}
        title={`Bukti Pembayaran — ${previewProofOrder?.order_code}`}
        description={`Pembeli: ${previewProofOrder?.customer_name} • Metode: ${previewProofOrder?.payment_method} • Tagihan: ${formatRupiah(previewProofOrder?.grand_total || 0)}`}
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              size="admin"
              onClick={() => setPreviewProofOrder(null)}
            >
              Tutup
            </Button>
            {previewProofOrder && (
              <Button
                variant="success"
                size="admin"
                leftIcon={<CheckCircle2 className="h-5 w-5" />}
                onClick={async () => {
                  await updateOrderStage(
                    previewProofOrder.id,
                    "4_PAID_VERIFIED",
                    {
                      payment_proof_url:
                        previewProofOrder.payment_proof_url ||
                        DEFAULT_PAYMENT_PROOF,
                    }
                  );
                  setPreviewProofOrder(null);
                  await loadData();
                  showToast({
                    type: "success",
                    title: "Verifikasi Lunas Berhasil!",
                    description:
                      "Status pesanan lanjut ke Tahap 4 (Siap Diambil dari Produsen).",
                  });
                }}
              >
                Verifikasi Lunas
              </Button>
            )}
          </>
        }
      >
        {previewProofOrder && (
          <div className="space-y-3">
            <img
              src={
                previewProofOrder.payment_proof_url || DEFAULT_PAYMENT_PROOF
              }
              alt="Bukti Pembayaran"
              className="w-full h-72 object-cover rounded-2xl border border-slate-200"
            />
            <p className="text-xs text-slate-600 text-center">
              Pastikan nominal mutasi masuk sesuai dengan total tagihan{" "}
              <strong>{formatRupiah(previewProofOrder.grand_total)}</strong>.
            </p>
          </div>
        )}
      </Modal>

      {/* MODAL 2: WAJIB CHECKLIST SOP PACKING 4 LAPIS + FOTO BUKTI KEMASAN */}
      <Modal
        isOpen={Boolean(sopModalOrder)}
        onClose={() => setSopModalOrder(null)}
        title={`SOP Packing 4 Lapis (WAJIB) — ${sopModalOrder?.order_code}`}
        description="Centang ke-4 kotak checklist SOP dan unggah/pilih URL Foto Bukti Kemasan untuk mengaktifkan tombol Selesai Packing."
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              size="admin"
              onClick={() => setSopModalOrder(null)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="admin"
              disabled={!isSopFormComplete}
              leftIcon={<Check className="h-5 w-5" />}
              onClick={handleConfirmSopPacking}
            >
              Selesai Packing
            </Button>
          </>
        }
      >
        {sopModalOrder && (
          <div className="space-y-4">
            {sopModalOrder.has_sensitive_original_item && (
              <div className="rounded-2xl bg-amber-100 border-2 border-amber-400 p-4 text-amber-950 flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-[#C2410C] shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm font-extrabold leading-relaxed">
                  ⚠️ PERHATIAN SOP: Pesanan ini berisi Varian Original (plastik
                  tanpa bumbu lebih tipis). Jangan menekan kardus terlalu
                  kencang agar tidak jepot!
                </p>
              </div>
            )}

            <div className="space-y-2.5">
              <p className="text-xs font-extrabold uppercase tracking-wider text-stone-600">
                Wajib Centang 4 Kotak Checklist SOP:
              </p>

              {[
                {
                  checked: sopSealer,
                  setChecked: setSopSealer,
                  title: "1. Segel Sealer Rapat",
                  desc: "Mulut kemasan disegel rapat kedap udara dengan mesin sealer.",
                },
                {
                  checked: sopCardboardSide,
                  setChecked: setSopCardboardSide,
                  title: "2. Apit Kardus Kanan-Kiri",
                  desc: "Bagian kanan dan kiri kemasan diapit kardus pelindung dengan tekanan aman.",
                },
                {
                  checked: sopCardboardWrap,
                  setChecked: setSopCardboardWrap,
                  title: "3. Kardus Melingkar",
                  desc: "Sabuk kardus melingkar mengunci struktur paket agar tahan tindihan.",
                },
                {
                  checked: sopBubbleWrap,
                  setChecked: setSopBubbleWrap,
                  title: "4. Bubble Wrap",
                  desc: "Seluruh luar paket dilapisi bubble wrap tebal & stiker Fragile.",
                },
              ].map((item) => (
                <label
                  key={item.title}
                  className={`flex items-start gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    item.checked
                      ? "bg-emerald-50 border-emerald-400"
                      : "bg-stone-50 border-stone-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => item.setChecked(e.target.checked)}
                    className="h-5 w-5 accent-emerald-600 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-extrabold text-stone-900 block">
                      {item.title}
                    </span>
                    <span className="text-xs text-stone-600">{item.desc}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t border-stone-200">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700">
                Foto Bukti Kemasan 4 Lapis (Wajib):
              </label>
              <div className="flex flex-wrap gap-2">
                <label className="min-h-12 px-4 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/50 hover:border-[#EA580C] flex items-center gap-2 text-xs font-extrabold text-stone-800 cursor-pointer">
                  <Upload className="h-4 w-4 text-[#EA580C]" />
                  <span>Upload File Foto Kemasan...</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSopPhotoUpload}
                    className="hidden"
                  />
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  size="admin"
                  onClick={() => setSopPhotoUrl(DEFAULT_SOP_PHOTO)}
                >
                  Gunakan Foto Sampel SOP 4 Lapis
                </Button>
              </div>
              <input
                type="text"
                value={sopPhotoUrl}
                onChange={(e) => setSopPhotoUrl(e.target.value)}
                placeholder="Atau tempel URL foto bukti kemasan..."
                className="w-full h-12 rounded-xl border border-stone-300 px-3.5 text-xs font-semibold"
              />
              {sopPhotoUrl && (
                <img
                  src={sopPhotoUrl}
                  alt="Preview SOP 4 Lapis"
                  className="w-full h-44 object-cover rounded-2xl border border-stone-200 mt-2"
                />
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
