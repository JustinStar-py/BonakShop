"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatToTomanParts } from "@/utils/currencyFormatter";

type TomanPriceProps = {
  value: string | number | null | undefined;
  className?: string;
  amountClassName?: string;
  suffixClassName?: string;
  fallback?: ReactNode;
};

export default function TomanPrice({
  value,
  className,
  amountClassName,
  suffixClassName,
  fallback = null,
}: TomanPriceProps) {
  const parts = value === null || value === undefined ? null : formatToTomanParts(value);
  if (!parts) return fallback;

  return (
    <span className={cn("inline-flex items-baseline gap-1", className)}>
      <span>{parts.amount}</span>
      <span className={cn("text-[11px] font-semibold leading-none opacity-70", suffixClassName)}>{parts.suffix}</span>
    </span>
  );
}
