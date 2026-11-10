import * as React from "react";
import { AlertTriangle, CheckCircle2, Clock, Flame, ShieldAlert, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_MAP, type OrderStatus } from "@/types/database";

export type BadgeVariant =
  | "spicy"
  | "chili"
  | "golden"
  | "success"
  | "warning"
  | "info"
  | "indigo"
  | "purple"
  | "neutral"
  | "sensitive";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  pulseDot?: boolean;
}

const badgeVariantClasses: Record<BadgeVariant, string> = {
  spicy: "bg-orange-100 text-[#C2410C] border-orange-300/80",
  chili: "bg-red-100 text-[#B91C1C] border-red-300/80",
  golden: "bg-amber-100 text-amber-900 border-amber-300",
  success: "bg-emerald-100 text-emerald-800 border-emerald-300/80",
  warning: "bg-amber-100 text-amber-900 border-amber-400/90",
  info: "bg-sky-100 text-sky-800 border-sky-300/80",
  indigo: "bg-indigo-100 text-indigo-800 border-indigo-300/80",
  purple: "bg-purple-100 text-purple-800 border-purple-300/80",
  neutral: "bg-stone-200/90 text-stone-600 border-stone-300",
  sensitive:
    "bg-amber-100/95 text-amber-950 border-amber-400 font-bold shadow-xs",
};

const dotColors: Record<BadgeVariant, string> = {
  spicy: "bg-[#EA580C]",
  chili: "bg-[#DC2626]",
  golden: "bg-[#F59E0B]",
  success: "bg-emerald-600",
  warning: "bg-amber-500",
  info: "bg-sky-600",
  indigo: "bg-indigo-600",
  purple: "bg-purple-600",
  neutral: "bg-stone-500",
  sensitive: "bg-amber-600",
};

export function Badge({
  className,
  variant = "spicy",
  size = "md",
  icon,
  pulseDot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-tight whitespace-nowrap",
        size === "sm" && "px-2.5 py-0.5 text-[11px]",
        size === "md" && "px-3 py-1 text-xs",
        size === "lg" && "px-3.5 py-1.5 text-sm",
        badgeVariantClasses[variant],
        className
      )}
      {...props}
    >
      {pulseDot && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              dotColors[variant]
            )}
          />
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              dotColors[variant]
            )}
          />
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

/**
 * Badge khusus untuk menampilkan status 8 Tahap Pesanan CimoFood secara konsisten
 */
export function OrderStatusBadge({
  status,
  showStageNumber = true,
  size = "md",
}: {
  status: OrderStatus;
  showStageNumber?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const meta = ORDER_STATUS_MAP[status];
  if (!meta) {
    return <Badge variant="neutral">{status}</Badge>;
  }

  const toneToVariant: Record<typeof meta.badgeTone, BadgeVariant> = {
    amber: "golden",
    orange: "spicy",
    red: "chili",
    blue: "info",
    indigo: "indigo",
    purple: "purple",
    emerald: "success",
    slate: "neutral",
  };

  return (
    <Badge
      variant={toneToVariant[meta.badgeTone]}
      size={size}
      pulseDot={status !== "8_COMPLETED" && status !== "CANCELLED"}
    >
      {showStageNumber ? meta.label : meta.shortLabel}
    </Badge>
  );
}

/**
 * Badge indikator informasi khusus pada varian Original:
 * "Kemasan Ekstra Aman SOP Khusus"
 */
export function SensitivePackagingBadge({
  className,
  label = "Kemasan Ekstra Aman SOP Khusus",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <Badge
      variant="sensitive"
      size="sm"
      icon={<ShieldAlert className="h-3.5 w-3.5 text-[#C2410C]" />}
      className={className}
    >
      {label}
    </Badge>
  );
}

/**
 * Badge level kepedasan cabai 0-5
 */
export function SpicyLevelBadge({ level }: { level: number }) {
  if (level <= 0) {
    return (
      <Badge
        variant="golden"
        size="sm"
        icon={<Sparkles className="h-3 w-3 text-amber-600" />}
      >
        Gurih Tidak Pedas
      </Badge>
    );
  }

  return (
    <Badge
      variant={level >= 4 ? "chili" : "spicy"}
      size="sm"
      icon={<Flame className="h-3 w-3 fill-current" />}
    >
      Level Pedas {level}/5
    </Badge>
  );
}

/**
 * Badge Ketersediaan Stok Real-time:
 * - "Ready Stock Siap Kirim" (hijau)
 * - "Stok Menipis" (kuning)
 * - "Habis" (abu-abu)
 */
export function StockStatusBadge({
  isReady,
  stockQty,
  showCount = true,
}: {
  isReady: boolean;
  stockQty: number;
  showCount?: boolean;
}) {
  if (!isReady || stockQty <= 0) {
    return (
      <Badge
        variant="neutral"
        size="sm"
        icon={<Clock className="h-3 w-3 text-stone-500" />}
      >
        Habis
      </Badge>
    );
  }

  if (stockQty <= 12) {
    return (
      <Badge
        variant="warning"
        size="sm"
        pulseDot
        icon={<AlertTriangle className="h-3 w-3 text-amber-700" />}
      >
        Stok Menipis{showCount ? ` (Sisa ${stockQty})` : ""}
      </Badge>
    );
  }

  return (
    <Badge
      variant="success"
      size="sm"
      icon={<CheckCircle2 className="h-3 w-3 text-emerald-700" />}
    >
      Ready Stock Siap Kirim{showCount ? ` (${stockQty})` : ""}
    </Badge>
  );
}
