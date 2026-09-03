import * as React from "react";
import { cn } from "@/lib/utils";
import type { Category } from "../../_utils/categories";

type Tone = "default" | "brand" | "pos" | "neg" | "warn" | "info";

const TONE: Record<Tone, string> = {
  default: "bg-sb-surface-3 text-sb-fg-2 border-sb-border",
  brand: "bg-sb-50 text-sb-700 border-sb-100",
  pos: "bg-sb-pos-soft text-sb-pos border-transparent",
  neg: "bg-sb-neg-soft text-sb-neg border-transparent",
  warn: "bg-sb-warn-soft text-sb-warn border-transparent",
  info: "bg-sb-info-soft text-sb-info border-transparent",
};

const BASE = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sb-pill border px-2.5 font-semibold";

export function Chip({ tone = "default", lg = false, dot = false, className, children }: { tone?: Tone; lg?: boolean; dot?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn(BASE, lg ? "h-7 text-[0.78125rem] px-3" : "h-6 text-[0.71875rem]", TONE[tone], className)}>
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

/** Category chip — the reusable tint-at-10% pattern (table, detail, legends). */
export function CategoryChip({ category, className }: { category: Category; className?: string }) {
  return (
    <span className={cn(BASE, "h-6 text-[0.71875rem] border-transparent", category.soft, category.text, className)}>
      <span className={cn("size-1.5 rounded-full", category.dotBg)} />
      {category.label}
    </span>
  );
}
