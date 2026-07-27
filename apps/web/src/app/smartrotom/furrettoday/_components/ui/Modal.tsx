"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ModalShell } from "@/components/smartrotom/behavior/ModalShell";

/** The `.ft-app` scope-root classes, for the shared `ModalShell`'s portal. */
export const FT_SCOPE = "ft-app font-ft";

/**
 * A skin over the shared `ModalShell` — portal, Escape, scrim dismiss, scroll lock,
 * focus trap/restore and dialog semantics all come from there (SMARTROTOM_V3 §2).
 */
export function Modal({
  open,
  onClose,
  label,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const t = useTranslations("furrettoday.modal");
  if (!open) return null;

  return (
    <ModalShell
      onClose={onClose}
      label={label}
      scope={FT_SCOPE}
      scrimClassName="z-[80] flex items-center justify-center bg-ft-ink/55 p-6 backdrop-blur-[2px]"
      className={[
        "border-ft rounded-ft-lg relative w-full max-w-[520px] border-ft-ink bg-white shadow-ft-pop",
        "animate-ft-burst motion-reduce:animate-none",
        className ?? "",
      ].join(" ")}
    >
      <button
        onClick={onClose}
        aria-label={t("close")}
        className="border-ft absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border-ft-ink bg-ft-yellow font-extrabold text-ft-ink"
      >
        ✕
      </button>
      {children}
    </ModalShell>
  );
}
