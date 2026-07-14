"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { AccountAvatar, Ico } from "./ui";
import { formatMoney } from "../_utils/format";
import { displayName } from "../_utils/account";
import type { SBAccount } from "../_types";

const TITLES: Record<string, { t: string; c: string[] }> = {
  starbank: { t: "General", c: ["Inicio"] },
  cuentas: { t: "Cuentas", c: ["Personal", "Cuentas"] },
  transacciones: { t: "Transacciones", c: ["Personal", "Movimientos"] },
  enviar: { t: "Enviar dinero", c: ["Personal", "Transferencia"] },
  graficas: { t: "Gráficas", c: ["Análisis", "Gráficas"] },
  calendario: { t: "Calendario de pagos", c: ["Análisis", "Calendario"] },
};

export function TopBar({ currentPage, account, accounts, onSelectAccount, onOpenAccounts }: {
  currentPage: string;
  account?: SBAccount | null;
  accounts?: SBAccount[];
  onSelectAccount: (id: number) => void;
  onOpenAccounts: () => void;
}) {
  const info = TITLES[currentPage] ?? TITLES.starbank;
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const list = accounts ?? [];

  React.useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-sb-border bg-sb-surface/85 px-4 py-3 backdrop-blur-[10px] backdrop-saturate-[1.4] md:px-7 md:py-3.5">
      <div>
        <div className="text-[12px] text-sb-fg-muted">
          {info.c.map((c, i) => (
            <span key={i}>{i > 0 ? " / " : ""}<strong className="font-semibold text-sb-fg-2">{c}</strong></span>
          ))}
        </div>
        <div className="font-sb-display text-[18px] font-semibold tracking-[-0.01em]">{info.t}</div>
      </div>

      <div className="relative hidden max-w-[420px] flex-1 md:block">
        <Ico name="search" size={16} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-sb-fg-subtle" />
        <input
          placeholder="Buscar transacciones, cuentas, contactos…"
          aria-label="Buscar"
          className="h-[38px] w-full rounded-sb-md border border-sb-border bg-sb-surface-2 pl-9 pr-3 text-sb-fg outline-none transition-colors focus:border-sb-400 focus:bg-sb-surface"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-sb-border bg-sb-surface px-1.5 py-0.5 text-[10px] text-sb-fg-subtle">⌘K</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          aria-label="Notificaciones"
          className="relative grid size-[38px] place-items-center rounded-sb-md border border-sb-border bg-sb-surface text-sb-fg-2 transition-colors hover:border-sb-border-strong hover:bg-sb-surface-2 hover:text-sb-fg"
        >
          <Ico name="bell" size={16} />
          <span className="absolute right-[9px] top-2 size-2 rounded-full bg-sb-neg-2 shadow-[0_0_0_2px_rgb(var(--sb-surface))]" aria-hidden />
        </button>

        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="Cambiar cuenta"
            className="flex items-center gap-2.5 rounded-sb-pill border border-sb-border bg-sb-surface py-1 pl-1 pr-2.5 transition-colors hover:bg-sb-surface-2"
          >
            <span className="size-[30px] overflow-hidden rounded-full">
              <AccountAvatar account={account ?? undefined} size={30} />
            </span>
            <div className="hidden leading-[1.15] sm:block">
              <div className="text-[12.5px] font-semibold">{account ? displayName(account.name) : "—"}</div>
              <div className="text-[11px] tabular-nums text-sb-fg-muted">{formatMoney(account?.balance ?? 0)}</div>
            </div>
            <Ico name="arrD" size={14} className={cn("transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-sb-md border border-sb-border bg-sb-surface shadow-sb-3">
              <div className="border-b border-sb-border px-4 py-2.5">
                <div className="text-[11px] uppercase tracking-[0.1em] text-sb-fg-subtle">Cambiar cuenta</div>
              </div>
              <div className="max-h-72 overflow-y-auto py-1">
                {list.length === 0 ? (
                  <div className="px-4 py-3 text-[13px] text-sb-fg-muted">No hay cuentas disponibles</div>
                ) : (
                  list.map((acc) => {
                    const active = account?.id === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => { onSelectAccount(acc.id); setOpen(false); }}
                        className={cn("flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-sb-surface-2", active && "bg-sb-50")}
                      >
                        <AccountAvatar account={acc} size={32} square />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-semibold">{displayName(acc.name)}</div>
                          <div className="text-[11.5px] tabular-nums text-sb-fg-muted">{formatMoney(acc.balance)}</div>
                        </div>
                        {active && <span className="size-2 shrink-0 rounded-full bg-sb-pos-2" />}
                      </button>
                    );
                  })
                )}
              </div>
              <div className="border-t border-sb-border">
                <button type="button" onClick={() => { setOpen(false); onOpenAccounts(); }} className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-sb-700 transition-colors hover:bg-sb-50">
                  Gestionar cuentas
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
