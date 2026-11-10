"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "chili"
  | "golden"
  | "secondary"
  | "outline"
  | "ghost"
  | "success"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg" | "admin" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-[#EA580C] to-[#C2410C] text-white shadow-md shadow-orange-600/20 hover:from-[#F97316] hover:to-[#EA580C] hover:shadow-lg hover:shadow-orange-600/30 border border-orange-700/20",
  chili:
    "bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white shadow-md shadow-red-600/20 hover:from-[#EF4444] hover:to-[#DC2626] hover:shadow-lg hover:shadow-red-600/30 border border-red-700/20",
  golden:
    "bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-stone-950 font-bold shadow-md shadow-amber-500/20 hover:from-[#FBBF24] hover:to-[#F59E0B] border border-amber-500/30",
  secondary:
    "bg-[#FFFBEB] text-[#C2410C] border border-[#FED7AA] hover:bg-[#FFEDD5] hover:border-[#FDBA74]",
  outline:
    "bg-white/90 text-stone-800 border border-stone-300 hover:border-[#EA580C] hover:text-[#EA580C] hover:bg-orange-50/50",
  ghost:
    "bg-transparent text-stone-700 hover:bg-orange-100/60 hover:text-[#C2410C]",
  success:
    "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 border border-emerald-700/20",
  danger:
    "bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-xs rounded-xl gap-1.5",
  md: "h-11 px-4.5 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-base rounded-2xl gap-2.5",
  admin: "min-h-12 px-5 py-3 text-base rounded-xl gap-2.5", // Laptop & Tablet First (min 48px height)
  icon: "h-11 w-11 rounded-xl justify-center",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center font-semibold tracking-tight select-none cursor-pointer",
          "transition-all duration-150 ease-out active:scale-[0.97]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:ring-offset-2",
          "disabled:opacity-55 disabled:pointer-events-none disabled:active:scale-100",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <span>{loadingText || children || "Memproses..."}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

