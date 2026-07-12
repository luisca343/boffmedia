"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ContactAvatar } from "./ui";
import { resolveCategory } from "../_utils/categories";
import { formatMoney, fmtDate } from "../_utils/format";
import { isOutgoing, displayName } from "../_utils/account";
import type { SBTransaction } from "../_types";

export function TxRow({ tx, activeAccountId, onClick }: { tx: SBTransaction; activeAccountId: number; onClick?: (tx: SBTransaction) => void }) {
  const cat = resolveCategory(tx);
  const out = isOutgoing(tx, activeAccountId);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(tx)}
      onKeyDown={(e) => e.key === "Enter" && onClick?.(tx)}
      className="grid cursor-pointer grid-cols-[36px_1fr_auto_auto] items-center gap-3 border-b border-sb-border px-5 py-3.5 transition-colors last:border-b-0 hover:bg-sb-surface-2"
    >
      <ContactAvatar name={tx.displayName} type={tx.displayAccountType} image={tx.displayImage} size={36} />
      <div className="min-w-0">
        <div className="truncate text-[13.5px] font-semibold text-sb-fg">{tx.reason}</div>
        <div className="flex items-center gap-2 text-[12px] text-sb-fg-muted">
          <span className="truncate">{displayName(tx.displayName)}</span>
          <span className={cn("inline-flex h-[18px] items-center gap-1.5 rounded-sb-pill px-2 text-[10.5px] font-semibold", cat.soft, cat.text)}>
            <span className={cn("size-1.5 rounded-full", cat.dotBg)} />
            {cat.label}
          </span>
        </div>
      </div>
      <div className={cn("text-right text-[14px] font-semibold tabular-nums", out ? "text-sb-neg" : "text-sb-pos")}>
        {out ? "− " : "+ "}
        {formatMoney(tx.amount)}
      </div>
      <div className="text-right text-[12px] tabular-nums text-sb-fg-muted">{fmtDate(tx.date, "rel")}</div>
    </div>
  );
}
