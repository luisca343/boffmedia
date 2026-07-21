"use client";
import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { AccountAvatar, Ico, type IconName } from "./ui";
import { formatMoney } from "../_utils/format";
import { displayName } from "../_utils/account";
import type { SBAccount } from "../_types";

const BASE = "/smartrotom/starbank";

interface NavItem { seg: string; href: string; key: string; icon: IconName }

const SIDE_BG = "linear-gradient(180deg, #0b1638 0%, #172554 60%, #1e3a8a 100%)";
const LOGO_BG = "conic-gradient(from 220deg, #93c5fd, #2463eb 35%, #1e3a8a 70%, #93c5fd)";

export function Sidebar({ currentPage, account, onOpenAccounts }: { currentPage: string; account?: SBAccount | null; onOpenAccounts: () => void }) {
  const t = useTranslations("starbank");

  const NAV: { groupKey: string; items: NavItem[] }[] = [
    {
      groupKey: "sidebar.groups.personal",
      items: [
        { seg: "starbank", href: BASE, key: "sidebar.nav.general", icon: "home" },
        { seg: "cuentas", href: `${BASE}/cuentas`, key: "sidebar.nav.accounts", icon: "card" },
        { seg: "transacciones", href: `${BASE}/transacciones`, key: "sidebar.nav.transactions", icon: "list" },
        { seg: "enviar", href: `${BASE}/enviar`, key: "sidebar.nav.sendMoney", icon: "send" },
      ],
    },
    {
      groupKey: "sidebar.groups.analysis",
      items: [
        { seg: "graficas", href: `${BASE}/graficas`, key: "sidebar.nav.charts", icon: "chart" },
        { seg: "calendario", href: `${BASE}/calendario`, key: "sidebar.nav.calendar", icon: "cal" },
      ],
    },
  ];

  return (
    <aside
      className="relative z-[1] hidden h-full flex-col gap-2 overflow-hidden border-r border-white/[0.06] px-3.5 py-[18px] text-[#c8d4ec] md:flex"
      style={{ background: SIDE_BG }}
    >
      {/* Brand */}
      <div className="mb-2.5 flex items-center gap-2.5 border-b border-white/[0.06] px-2 pb-3.5 pt-1.5">
        <div
          className="relative grid size-9 place-items-center rounded-[10px]"
          style={{ background: LOGO_BG, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.18), 0 6px 20px -8px rgba(59,130,246,.8)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3 14.5 8.5 20 9.5 16 13.5 17 19 12 16.5 7 19 8 13.5 4 9.5 9.5 8.5 12 3Z" />
          </svg>
          <span className="pointer-events-none absolute inset-1.5 rounded-md" style={{ background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,.7), rgba(255,255,255,0) 55%)" }} />
        </div>
        <div className="font-sb-display text-[18px] font-bold tracking-[-0.02em] text-white">
          {t("sidebar.title")}
          <small className="block text-[10px] font-medium uppercase tracking-[0.14em] text-[#9bb3da]">{t("sidebar.subtitle")}</small>
        </div>
      </div>

      {/* Account switcher */}
      <div
        role="button"
        tabIndex={0}
        onClick={onOpenAccounts}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpenAccounts()}
        className="flex cursor-pointer items-center gap-2.5 rounded-sb-md border border-white/[0.07] bg-white/[0.04] p-3"
      >
        <span className="size-9 shrink-0 overflow-hidden rounded-[10px] bg-white shadow-[0_0_0_2px_rgba(255,255,255,.1)]">
          <AccountAvatar account={account ?? undefined} size={36} square />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13px] font-semibold text-white">{account ? displayName(account.name) : "—"}</span>
          <span className="text-[12px] tabular-nums text-[#9bb3da]">{formatMoney(account?.balance ?? 0)}</span>
        </div>
        <button
          type="button"
          aria-label={t("sidebar.switchAccount")}
          onClick={(e) => { e.stopPropagation(); onOpenAccounts(); }}
          className="rounded-lg p-1.5 text-[#9bb3da] transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <Ico name="arrows" size={14} />
        </button>
      </div>

      {/* Nav */}
      {NAV.map((g) => (
        <div key={g.groupKey}>
          <div className="px-3 pb-1.5 pt-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6e84ab]">{t(g.groupKey)}</div>
          <div className="flex flex-col gap-0.5">
            {g.items.map((item) => {
              const active = currentPage === item.seg;
              return (
                <Link
                  key={item.seg}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-[10px] px-3 py-[9px] text-[13.5px] font-medium transition-colors",
                    active ? "text-white" : "text-[#b2c0dc] hover:bg-white/[0.06] hover:text-white",
                  )}
                  style={active ? { background: "linear-gradient(90deg, rgba(59,130,246,.22), rgba(59,130,246,.06))" } : undefined}
                >
                  {active && <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r bg-sb-400" />}
                  <Ico name={item.icon} size={18} />
                  <span>{t(item.key)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Foot */}
      <div className="mt-auto flex items-center gap-2 border-t border-white/[0.07] pt-3 text-[12px] text-[#8597b6]">
        <span className="size-1.5 rounded-full bg-sb-pos-2 shadow-[0_0_0_3px_rgba(5,150,105,.25)]" aria-hidden />
        {t("sidebar.systemStatus")}
      </div>
    </aside>
  );
}
