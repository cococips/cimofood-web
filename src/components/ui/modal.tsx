"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  mode?: "modal" | "drawer";
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const modalSizeClasses = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  mode = "modal",
  size = "md",
  children,
  footer,
}: ModalProps) {
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Dialog or Right Drawer Panel */}
      <div
        className={cn(
          "relative z-10 flex flex-col bg-white text-stone-900 shadow-2xl border border-stone-200/80 w-full transition-all duration-200",
          mode === "drawer"
            ? "sm:ml-auto sm:h-full sm:max-w-md rounded-t-3xl sm:rounded-none sm:rounded-l-3xl max-h-[90vh] sm:max-h-full"
            : cn(
                "rounded-t-3xl sm:rounded-3xl max-h-[88vh] sm:mx-4",
                modalSizeClasses[size]
              )
        )}
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-stone-300" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 border-b border-stone-200/80 bg-[#FAF8F5]">
          <div>
            <h2
              id="modal-title"
              className="text-lg sm:text-xl font-bold text-stone-900"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs sm:text-sm text-stone-600">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup jendela"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-stone-500 hover:bg-orange-100 hover:text-[#EA580C] transition-colors cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-4 sm:px-6 bg-stone-50 border-t border-stone-200/80 flex flex-wrap items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

