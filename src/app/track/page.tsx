"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  PackageSearch,
  Phone,
  Search,
  ShieldAlert,
  Truck,
} from "lucide-react";
import { CartDrawer, StorefrontNavbar } from "@/components/storefront";
import {
  Badge,
  Button,
  Card,
  OrderStatusBadge,
  SensitivePackagingBadge,
  useToast,
} from "@/components/ui";
import { getOrdersWithItems } from "@/lib/data-service";
import { formatDateID, formatRupiah, normalizeWhatsAppNumber } from "@/lib/utils";
import type { OrderWithItems } from "@/types/database";

export default function TrackOrderSearchPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [query, setQuery] = React.useState("");
  const [orders, setOrders] = React.useState<OrderWithItems[]>([]);
  const [filteredOrders, setFilteredOrders] = React.useState<OrderWithItems[]>(
    []
  );
  const [hasSearched, setHasSearched] = React.useState(false);

  const loadOrders = React.useCallback(async () => {
    const all = await getOrdersWithItems();
    setOrders(all);
    setFilteredOrders(all);
  }, []);

  React.useEffect(() => {
    loadOrders();
    const onUpdated = () => loadOrders();
    window.addEventListener("cimofood-data-updated", onUpdated);
    return () => window.removeEventListener("cimofood-data-updated", onUpdated);
  }, [loadOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = query.trim();
    if (!raw) {
      setFilteredOrders(orders);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    const upper = raw.toUpperCase();
    const normalizedPhone = normalizeWhatsAppNumber(raw);

    // Cek kecocokan persis kode pesanan terlebih dahulu
    const exactCodeMatch = orders.find(
      (o) => o.order_code.toUpperCase() === upper
    );
    if (exactCodeMatch) {
      router.push(`/track/${exactCodeMatch.order_code}`);
      return;
    }

    const matched = orders.filter((o) => {
      const codeMatch = o.order_code.toUpperCase().includes(upper);
      const phoneMatch =
        normalizedPhone.length >= 6 &&
        normalizeWhatsAppNumber(o.customer_whatsapp).includes(normalizedPhone);
      const rawPhoneMatch = o.customer_whatsapp
        .toLowerCase()
        .includes(raw.toLowerCase());
      const nameMatch = o.customer_name
        .toLowerCase()
        .includes(raw.toLowerCase());
      return codeMatch || phoneMatch || rawPhoneMatch || nameMatch;
    });

    setFilteredOrders(matched);

    if (matched.length === 1) {
      router.push(`/track/${matched[0].order_code}`);
    } else if (matched.length === 0) {
      showToast({
        type: "warning",
        title: "Pesanan Tidak Ditemukan",
        description: `Tidak ada pesanan dengan kode atau nomor WhatsApp "${raw}".`,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <StorefrontNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Hero Search Card */}
        <Card
          surface="spicyHighlight"
          hoverElevation={false}
          className="p-6 sm:p-10 space-y-6"
        >
          <div className="max-w-2xl space-y-2.5">
            <Badge
              variant="spicy"
              size="sm"
              icon={<PackageSearch className="h-3.5 w-3.5" />}
            >
              Pelacakan Transparan Tanpa Perlu Login
            </Badge>
            <h1 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
              Lacak Timeline 8 Tahap Pesanan &amp; Bukti Kemasan 4 Lapis
            </h1>
            <p className="text-sm sm:text-base text-stone-700 leading-relaxed">
              Masukkan <strong>Kode Pesanan</strong> (contoh:{" "}
              <code className="font-mono font-bold text-[#C2410C]">
                CMF-20261110-002
              </code>
              ) atau <strong>Nomor WhatsApp</strong> Anda untuk melihat status
              stok, pembayaran QRIS, foto bukti kemas SOP 4 Lapis, hingga nomor
              resi pengiriman.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-3 max-w-2xl"
          >
            <div className="relative flex-1">
              <Search className="h-5 w-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Masukkan Kode Pesanan (CMF-...) atau Nomor WhatsApp (0812...)"
                className="w-full h-12 pl-12 pr-4 rounded-2xl border border-orange-300 bg-white text-sm font-semibold text-stone-900 shadow-xs focus:outline-none focus:border-[#EA580C]"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="h-5 w-5" />}
            >
              Cari &amp; Lacak Pesanan
            </Button>
          </form>

          {/* Quick Sample Order Pills */}
          <div className="pt-2 space-y-2">
            <span className="text-xs font-bold text-stone-600 block">
              Klik Cepat Pesanan Contoh Berbagai Tahap:
            </span>
            <div className="flex flex-wrap gap-2">
              {orders.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  href={`/track/${order.order_code}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-orange-200 hover:border-[#EA580C] text-xs font-bold text-stone-800 shadow-2xs transition-all"
                >
                  <span className="font-mono text-[#EA580C]">
                    {order.order_code}
                  </span>
                  <span className="text-stone-400">•</span>
                  <span>{order.customer_name}</span>
                  <OrderStatusBadge
                    status={order.status}
                    showStageNumber={false}
                    size="sm"
                  />
                </Link>
              ))}
            </div>
          </div>
        </Card>

        {/* 4 Highlight Capabilities of CimoFood Tracking */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            {
              icon: <Clock className="h-5 w-5 text-[#EA580C]" />,
              title: "Tahap 1–2: Cek Stok & Ongkir",
              desc: "Konfirmasi stok ke dapur produksi & hitung ongkir maks. 1 jam.",
            },
            {
              icon: <CreditCard className="h-5 w-5 text-[#DC2626]" />,
              title: "Tahap 3–4: QRIS & Transfer",
              desc: "Scan QRIS CimoFood & unggah foto bukti bayar langsung di web.",
            },
            {
              icon: <Camera className="h-5 w-5 text-amber-600" />,
              title: "Tahap 5–6: Foto SOP 4 Lapis",
              desc: "Lihat foto asli paket Anda yang sudah disegel & dilapisi kardus.",
            },
            {
              icon: <Truck className="h-5 w-5 text-emerald-600" />,
              title: "Tahap 7–8: Resi & Ulasan",
              desc: "Salin nomor resi ekspedisi & konfirmasi barang diterima utuh.",
            },
          ].map((step) => (
            <Card
              key={step.title}
              surface="storefront"
              hoverElevation={false}
              className="p-4 space-y-1.5"
            >
              <div className="h-9 w-9 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center">
                {step.icon}
              </div>
              <h2 className="text-sm font-extrabold text-stone-900">
                {step.title}
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                {step.desc}
              </p>
            </Card>
          ))}
        </div>

        {/* Orders List / Search Results */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-stone-900">
              {hasSearched
                ? `Hasil Pencarian Pesanan (${filteredOrders.length} ditemukan)`
                : `Daftar Pesanan Terbaru (${orders.length} Pesanan)`}
            </h2>
            {hasSearched && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilteredOrders(orders);
                  setHasSearched(false);
                }}
                className="text-xs font-bold text-[#EA580C] hover:underline cursor-pointer"
              >
                Tampilkan Semua Pesanan
              </button>
            )}
          </div>

          {filteredOrders.length === 0 ? (
            <Card
              surface="storefront"
              hoverElevation={false}
              className="p-8 text-center space-y-3"
            >
              <p className="text-base font-extrabold text-stone-900">
                Tidak ada pesanan yang cocok dengan &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-stone-600">
                Pastikan Kode Pesanan (misal: CMF-20261110-001) atau Nomor
                WhatsApp yang Anda masukkan sudah benar.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredOrders.map((order) => (
                <Card
                  key={order.id}
                  surface="storefront"
                  hoverElevation
                  className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-black text-[#EA580C]">
                        {order.order_code}
                      </span>
                      <OrderStatusBadge status={order.status} size="sm" />
                      {order.has_sensitive_original_item && (
                        <SensitivePackagingBadge label="Kemasan Ekstra Aman SOP Khusus" />
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                      <span className="font-bold text-stone-900">
                        {order.customer_name} ({order.customer_city})
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {order.customer_whatsapp}
                      </span>
                      <span>• Ekspedisi: {order.courier}</span>
                      <span>• Dibuat: {formatDateID(order.created_at)}</span>
                    </div>

                    <p className="text-xs text-stone-500">
                      Item:{" "}
                      {order.items
                        .map(
                          (i) =>
                            `${i.product_name_snapshot} (${i.size_label_snapshot}) ×${i.quantity}`
                        )
                        .join(", ")}
                    </p>

                    {order.packing_photo_url && (
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Foto Bukti Kemasan 4 Lapis Tersedia
                      </div>
                    )}
                    {order.has_sensitive_original_item &&
                      !order.packing_photo_url && (
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Wajib Bukti Foto Kemasan 4 Lapis (Varian Original)
                        </div>
                      )}
                  </div>

                  <div className="flex sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-stone-200/80">
                    <div className="text-left md:text-right">
                      <span className="text-xs text-stone-500 block">
                        Total Tagihan:
                      </span>
                      <span className="text-lg font-black text-[#C2410C]">
                        {formatRupiah(order.grand_total)}
                      </span>
                    </div>

                    <Link href={`/track/${order.order_code}`}>
                      <Button
                        variant="primary"
                        size="md"
                        rightIcon={<ArrowRight className="h-4 w-4" />}
                      >
                        Lihat Detail 8 Tahap
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <CartDrawer />
    </div>
  );
}

