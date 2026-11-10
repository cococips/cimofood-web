import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverElevation?: boolean;
  surface?: "storefront" | "warm" | "admin" | "spicyHighlight";
}

const surfaceClasses: Record<NonNullable<CardProps["surface"]>, string> = {
  storefront:
    "bg-white border-[#F3E8D6] shadow-sm",
  warm:
    "bg-[#FFFBEB]/90 border-[#FDE68A] shadow-sm",
  admin:
    "bg-white border-slate-200/90 shadow-xs",
  spicyHighlight:
    "bg-gradient-to-br from-white via-[#FFF7ED] to-[#FFEDD5]/70 border-[#FDBA74] shadow-md shadow-orange-500/10",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      hoverElevation = true,
      surface = "storefront",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border overflow-hidden transition-all duration-300 ease-out",
          surfaceClasses[surface],
          hoverElevation &&
            "hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-950/10 hover:border-[#FB923C]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("p-5 sm:p-6 flex flex-col gap-1.5", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-lg sm:text-xl font-bold tracking-tight text-stone-900",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-stone-600 leading-relaxed", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5 sm:px-6 sm:pb-6", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-5 py-4 sm:px-6 bg-stone-50/70 border-t border-stone-200/70 flex items-center justify-between gap-3",
        className
      )}
      {...props}
    />
  );
}

