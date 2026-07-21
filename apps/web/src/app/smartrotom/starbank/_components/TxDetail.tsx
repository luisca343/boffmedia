"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Sheet, ContactAvatar, Chip, CategoryChip, Button, Ico } from "./ui";
import { resolveCategory } from "../_utils/categories";
import { formatMoney, fmtDate, fmtTime } from "../_utils/format";
import { isOutgoing, displayName, balanceAfter } from "../_utils/account";
import type { SBTransaction } from "../_types";

function reference(tx: SBTransaction): string {
  const s = `${tx.date}|${tx.amount}|${tx.from}|${tx.to}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return "SR-" + (h % 1e8).toString().padStart(8, "0");
}

function DetailRow({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sb-fg-muted">{label}</span>
      <span className={cn("tabular-nums", strong && "font-semibold")}>{value}</span>
    </div>
  );
}

export function TxDetail({ tx, activeAccountId, onClose }: { tx: SBTransaction; activeAccountId: number; onClose: () => void }) {
  const t = useTranslations("starbank");
  const cat = resolveCategory(tx);
  const out = isOutgoing(tx, activeAccountId);
  return (
    <Sheet width={520} onClose={onClose} eyebrow={`${out ? t("txDetail.out") : t("txDetail.in")} · ${t(`categories.${cat.id}`)}`} title={tx.reason}>
      <div className="pb-6 pt-3 text-center">
        <div className="inline-block">
          <ContactAvatar name={tx.displayName} type={tx.displayAccountType} image={tx.displayImage} size={72} />
        </div>
        <div className="mt-3.5 text-[13px] text-sb-fg-muted">
          {out ? t("enviar.to") : t("enviar.from")} <strong className="text-sb-fg">{displayName(tx.displayName)}</strong>
        </div>
        <div className={cn("mt-2 font-sb-display text-[52px] font-bold tracking-[-0.02em] tabular-nums", out ? "text-sb-neg" : "text-sb-pos")}>
          {out ? "− " : "+ "}
          {formatMoney(tx.amount)}
        </div>
        <div className="mt-1.5">
          <CategoryChip category={cat} />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-sb-md bg-sb-surface-2 p-[18px] text-[13px]">
        <DetailRow label={t("txDetail.date")} value={fmtDate(tx.date, "long")} />
        <div className="h-px bg-sb-border" />
        <DetailRow label={t("txDetail.time")} value={fmtTime(tx.date)} />
        <div className="h-px bg-sb-border" />
        <DetailRow label={t("txDetail.balanceAfter")} value={formatMoney(balanceAfter(tx, activeAccountId))} strong />
        <div className="h-px bg-sb-border" />
        <DetailRow label={t("txDetail.reference")} value={<span className="font-mono text-[12px]">{reference(tx)}</span>} />
        <div className="h-px bg-sb-border" />
        <div className="flex items-center justify-between">
          <span className="text-sb-fg-muted">{t("txDetail.status")}</span>
          <Chip tone="pos"><Ico name="check" size={12} /> {t("txDetail.completed")}</Chip>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm"><Ico name="copy" size={14} /> {t("txDetail.copyReference")}</Button>
        <Button variant="secondary" size="sm"><Ico name="download" size={14} /> {t("txDetail.receipt")}</Button>
        <Button variant="ghost" size="sm" className="ml-auto"><Ico name="alert" size={14} /> {t("txDetail.report")}</Button>
      </div>
    </Sheet>
  );
}
