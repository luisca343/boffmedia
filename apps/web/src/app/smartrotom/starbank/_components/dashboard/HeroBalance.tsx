"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { AccountAvatar, Button, Ico, Sparkline } from "../ui";
import { fmtInt, formatMoney } from "../../_utils/format";
import { displayName } from "../../_utils/account";
import type { SBAccount } from "../../_types";

const BASE = "/smartrotom/starbank";
const HERO_BG =
  "radial-gradient(600px 280px at 100% 0%, rgba(96,165,250,.35), transparent 70%)," +
  "radial-gradient(800px 400px at -10% 110%, rgba(36,99,235,.5), transparent 60%)," +
  "linear-gradient(135deg, #0b1638, #1e3a8a 55%, #2463eb)";
const GRID_OVERLAY =
  "linear-gradient(transparent 95%, rgba(255,255,255,.18) 95%)," +
  "linear-gradient(90deg, transparent 95%, rgba(255,255,255,.12) 95%)";

export function HeroBalance({ account, series, weekDelta }: { account: SBAccount; series: number[]; weekDelta?: { amount: number; pct: number } }) {
  const router = useRouter();
  const [hide, setHide] = React.useState(false);

  return (
    <div
      className="relative grid grid-cols-1 gap-7 overflow-hidden rounded-sb-xl p-6 text-white shadow-sb-brand md:grid-cols-[1.2fr_1fr] md:items-stretch md:p-7"
      style={{ background: HERO_BG }}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-35"
        aria-hidden
        style={{
          backgroundImage: GRID_OVERLAY,
          backgroundSize: "28px 28px",
          WebkitMaskImage: "radial-gradient(ellipse at 20% 30%, black 0%, transparent 70%)",
          maskImage: "radial-gradient(ellipse at 20% 30%, black 0%, transparent 70%)",
        }}
      />

      {/* Left */}
      <div className="relative flex flex-col gap-3.5">
        <div className="inline-flex self-start items-center gap-2 rounded-full border border-white/[0.18] bg-white/[0.12] py-[5px] pl-[5px] pr-[11px] text-[12px] font-medium backdrop-blur-[8px]">
          <span className="size-[22px] overflow-hidden rounded-full">
            <AccountAvatar account={account} size={22} />
          </span>
          <span>Cuenta principal · {displayName(account.name)}</span>
        </div>

        <div className="text-[12px] uppercase tracking-[0.15em] text-[#c8d4ec]">Balance disponible</div>

        <div className="inline-flex items-baseline gap-1.5 font-sb-display text-[clamp(40px,6vw,64px)] font-bold leading-none tracking-[-0.03em] tabular-nums">
          {hide ? "•••••• " : fmtInt(account.balance)}
          <span className="text-[0.42em] font-semibold text-sb-300">¥</span>
          <button
            type="button"
            onClick={() => setHide((v) => !v)}
            aria-label={hide ? "Mostrar saldo" : "Ocultar saldo"}
            className="ml-3 p-1 text-white/60 transition-opacity hover:text-white"
          >
            <Ico name={hide ? "eye" : "eyeOff"} size={20} />
          </button>
        </div>

        {weekDelta && (
          <div className="inline-flex items-center gap-1.5 text-[13px] text-[#b6d3ff]">
            <span className={weekDelta.pct >= 0 ? "font-semibold text-[#6ee7b7]" : "font-semibold text-[#fca5a5]"}>
              {weekDelta.pct >= 0 ? "▲" : "▼"} {formatMoney(Math.abs(weekDelta.amount))} ({weekDelta.pct.toFixed(1)}%)
            </span>
            <span className="text-[#9bb3da]">en los últimos 7 días</span>
          </div>
        )}

        <div className="mt-1.5 flex flex-wrap gap-2.5">
          <Button variant="solid" size="md" href={`${BASE}/enviar`} className="backdrop-blur-[8px]"><Ico name="send" size={14} /> Enviar</Button>
          <Button variant="glass" size="md"><Ico name="qrcode" size={14} /> Solicitar</Button>
          <Button variant="glass" size="md" onClick={() => router.push(`${BASE}/cuentas`)}><Ico name="plus" size={14} /> Mover entre cuentas</Button>
          <Button variant="glass" size="md" href={`${BASE}/graficas`}><Ico name="chart" size={14} /> Insights</Button>
        </div>
      </div>

      {/* Right — sparkline */}
      <div className="relative min-h-[170px]">
        <div className="absolute inset-0 px-2 pb-2 pt-5">
          <div className="mb-1.5 flex justify-between text-[11px] text-[#9bb3da]">
            <span>Hace {series.length} mov.</span>
            <span>Hoy</span>
          </div>
          <div className="absolute inset-x-2 bottom-2 top-11 overflow-hidden rounded-xl">
            <Sparkline data={series} height={170} color="#93c5fd" fillFrom="rgba(147,197,253,0.35)" fillTo="rgba(147,197,253,0)" strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </div>
  );
}
