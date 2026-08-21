// The front board. A hard leaf: navy buckram, gold foil, an embossed rule.

import { useTranslations } from "next-intl"
import type { Passport } from "../../_types"
import { ASSET, staticAsset } from '@/lib/assets'
import { Icon } from "../ui"

/** r = 52 in the 120-unit viewBox. The ring is the real completion, not a decoration. */
const R = 52
const CIRCUMFERENCE = 2 * Math.PI * R

/** The buckram cloth. A stack of gradients, which is the one thing Tailwind cannot say. */
const CLOTH = {
  background:
    "radial-gradient(140% 100% at 50% 0%, rgba(255,255,255,.05), transparent 50%), linear-gradient(160deg, rgb(var(--ps-navy)), rgb(var(--ps-navy-deep)) 55%, rgb(12 21 40))",
}

export function Cover({ profile }: { profile?: Passport | null }) {
  const t = useTranslations("pasaporte")
  const pct = Math.max(0, Math.min(100, Math.round(profile?.completionPct ?? 0)))
  const offset = CIRCUMFERENCE * (1 - pct / 100)

  return (
    <div
      style={CLOTH}
      className="ps-buckram ps-emboss relative flex h-full w-full flex-col items-center justify-between overflow-hidden px-[8%] py-[7%] text-ps-chrome-fg"
    >
      <div className="relative z-[2] text-center">
        <p className="font-ps-mono text-[11px] uppercase tracking-[.42em] text-ps-gild/85">
          Gobierno de Teras
        </p>
        <h1 className="ps-foil mt-2 font-ps-display text-[clamp(34px,7vh,64px)] leading-[.98] tracking-[.14em]">
          PASAPORTE
        </h1>
        <p className="mt-2 font-ps-mono text-[11px] uppercase tracking-[.34em] text-ps-chrome-fg/60">
          {t("cover.subtitle")}
        </p>
      </div>

      <div className="relative z-[2] grid place-items-center">
        <svg width="196" height="196" viewBox="0 0 120 120" aria-hidden="true" className="-rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="7" />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="rgb(var(--ps-gild))"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE.toFixed(1)}
            strokeDashoffset={offset.toFixed(1)}
          />
        </svg>
        {/* The state crest, keyed off the original cover art. It is the emblem the passport
            has always carried, so it is an asset, not an icon — the wreath and the feathering
            do not survive being redrawn as a stroked glyph. */}
        <span className="absolute inset-0 grid place-items-center">
          <img
            src={staticAsset(ASSET.smartrotom.img, 'apps/pasaporte/emblema.webp')}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="h-[124px] w-auto drop-shadow-[0_0_16px_rgba(244,227,161,.28)]"
          />
        </span>
        <span className="ps-num absolute -bottom-1.5 whitespace-nowrap font-ps-display text-[14px] font-bold text-ps-gild-hi [text-shadow:0_1px_3px_rgba(0,0,0,.6)]">
          {t("cover.complete", { pct })}
        </span>
      </div>

      <div className="relative z-[2] w-full text-center">
        <p className="ps-foil font-ps-ceremony text-[clamp(20px,3.4vh,30px)] tracking-[.02em]">
          {profile?.username ?? "—"}
        </p>
        <div className="ps-num mt-2.5 flex justify-center gap-4 font-ps-mono text-[10.5px] uppercase tracking-[.12em] text-ps-chrome-fg/60">
          <span>
            {t("cover.id")} <b className="font-bold text-ps-gild">{profile?.trainerId ?? "—"}</b>
          </span>
          <span>
            {t("cover.region")} <b className="font-bold text-ps-gild">{profile?.region ?? "—"}</b>
          </span>
          <span>
            {t("cover.rank")} <b className="font-bold text-ps-gild">{String(profile?.rank ?? 0).padStart(2, "0")}</b>
          </span>
        </div>
      </div>

      <p className="ps-loop absolute bottom-[26px] left-1/2 z-[2] flex -translate-x-1/2 items-center gap-[7px] font-ps-mono text-[10px] tracking-[.2em] text-ps-chrome-fg/40 animate-ps-hint motion-reduce:animate-none">
        <Icon name="book" className="h-3.5 w-3.5" />
        {t("cover.hint")}
      </p>
    </div>
  )
}
