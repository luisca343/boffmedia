"use client";
import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ContactAvatar } from "./ui";
import { resolveCategory } from "../_utils/categories";
import { formatMoney, fmtDate } from "../_utils/format";
import { isOutgoing, displayName } from "../_utils/account";
import type { SBTransaction } from "../_types";

export function TxRow({ tx, activeAccountId, onClick }: { tx: SBTransaction; activeAccountId: number; onClick?: (tx: SBTransaction) => void }) {
  const t = useTranslations("starbank");
  const locale = useLocale();
  const cat = resolveCategory(tx);
  const out = isOutgoing(tx, activeAccountId);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(tx)}
      onKeyDown={(e) => e.key === "Enter" && onClick?.(tx)}
      className="grid cursor-pointer grid-cols-[2.25rem_1fr_auto_auto] items-center gap-3 border-b border-sb-border px-5 py-3.5 transition-colors last:border-b-0 hover:bg-sb-surface-2"
    >
      <ContactAvatar name={tx.displayName} type={tx.displayAccountType} image={tx.displayImage} size={36} />
      <div className="min-w-0">
        <div className="truncate text-[0.84375rem] font-semibold text-sb-fg">{tx.reason}</div>
        <div className="flex items-center gap-2 text-[0.75rem] text-sb-fg-muted">
          <span className="truncate">{displayName(tx.displayName)}</span>
          <span className={cn("inline-flex h-[1.125rem] items-center gap-1.5 rounded-sb-pill px-2 text-[0.65625rem] font-semibold", cat.soft, cat.text)}>
            <span className={cn("size-1.5 rounded-full", cat.dotBg)} />
            {t(`categories.${cat.id}`)}
          </span>
        </div>
      </div>
      <div className={cn("text-right text-[0.875rem] font-semibold tabular-nums", out ? "text-sb-neg" : "text-sb-pos")}>
        {out ? "− " : "+ "}
        {formatMoney(tx.amount)}
      </div>
      <div className="text-right text-[0.75rem] tabular-nums text-sb-fg-muted">{fmtDate(tx.date, "rel", locale)}</div>
    </div>
  );
}
