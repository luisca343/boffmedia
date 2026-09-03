"use client"

// PAPER — but a card ON the paper: the carné is its own pale-blue laminate, so its ink is
// `ps-info-*` and `ps-ink`, never desk chrome.

import { useLocale, useTranslations } from "next-intl"
import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { MinecraftStats } from "@/services/api/smartrotom/playerService"
import { usePassportStore } from "../../_stores/usePassportStore"
import type { Passport } from "../../_types"
import { docDate, expiryDate } from "../../_utils/dates"
import { qrMatrix, qrSeed } from "../../_utils/qr"
import { playtime } from "../../_utils/stats"
import { PassportPhoto } from "../PassportPhoto"
import { Icon, PageHead, Skeleton, toast } from "../ui"

/** The laminate itself: guilloché over a pale blue wash. Multi-layer, so it is an inline style. */
const LAMINATE = {
  background: "linear-gradient(135deg, #eaf0f8, #dde8f4 48%, #cedcee)",
}
const GUILLOCHE = {
  background:
    "repeating-radial-gradient(circle at 28% 124%, transparent 0 6px, rgba(40,90,150,.055) 6px 7px), repeating-radial-gradient(circle at 82% -24%, transparent 0 5px, rgba(120,40,150,.045) 5px 6px)",
}
const BAND = {
  background: "linear-gradient(90deg, rgb(var(--ps-navy-deep)), rgb(var(--ps-navy-hi)))",
}
const SCANLINE = {
  background: "linear-gradient(180deg, transparent, rgb(var(--ps-teal) / .55), transparent)",
}

const QR_MODULES = 25
const QR_CELL = 4
const QR_QUIET = 3
const QR_DIM = (QR_MODULES + QR_QUIET * 2) * QR_CELL

function Field({ label, value, wide = false }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={cn("min-w-0", wide && "col-span-2")}>
      <div className="font-ps-mono text-[0.5rem] uppercase tracking-[.14em] text-ps-info-deep/70">{label}</div>
      <div className="truncate font-ps-ceremony text-[1rem] leading-[1.08] text-ps-ink">{value}</div>
    </div>
  )
}

function Code({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="font-ps-mono text-[0.5rem] uppercase tracking-[.14em] text-ps-info-deep/70">{label}</div>
      <div className="ps-num truncate font-ps-mono text-[0.75rem] font-bold text-ps-ink">{value}</div>
    </div>
  )
}

export function Carne({
  profile,
  stats,
  loading,
}: {
  profile?: Passport | null
  stats?: MinecraftStats | null
  loading: boolean
}) {
  const t = useTranslations("pasaporte")
  const locale = useLocale()
  // Read here rather than taken as a prop — see the note in `Identidad`.
  const inspect = usePassportStore((s) => s.inspect)
  const [verified, setVerified] = useState(false)

  if (loading || !profile) {
    return (
      <>
        <PageHead eyebrow={t("carne.eyebrow")} title={t("carne.title")} />
        <Skeleton className="h-[18.75rem] rounded-2xl" />
      </>
    )
  }

  const hours = playtime(stats).hours
  const issued = profile.memberSince ?? profile.createdAt
  const expires = expiryDate(issued)
  const modules = qrMatrix(qrSeed(profile), QR_MODULES)

  const fold = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
  const surname = fold(profile.username).replace(/[^A-Z]/g, "<")
  const region3 = fold(profile.region).slice(0, 3)
  const carneMrz = `P<TRS${region3}${surname}<<<<<<<<<<<<${profile.trainerId.replace(/-/g, "")}<<${expires?.getFullYear() ?? "----"}M`

  function onScan() {
    if (!inspect) {
      toast(t("carne.inspectPrompt"))
      return
    }
    setVerified(true)
    toast(t("carne.verifiedToast"))
  }

  return (
    <>
      <PageHead eyebrow={t("carne.eyebrow")} title={t("carne.title")} />

      <div
        style={LAMINATE}
        className="relative overflow-hidden rounded-2xl border border-ps-info/30 shadow-[0_5px_16px_rgba(40,60,90,.2),inset_0_1px_0_rgba(255,255,255,.8)]"
      >
        <div aria-hidden="true" style={GUILLOCHE} className="pointer-events-none absolute inset-0 z-0 opacity-55" />
        {/* The fold: a real carné is creased before it is carried. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-[62%] top-0 z-[1] w-0.5 bg-gradient-to-b from-transparent via-ps-info/20 to-transparent"
        />
        <div
          aria-hidden="true"
          className="ps-holo pointer-events-none absolute left-1/2 top-[56%] z-[1] grid h-[5.5rem] w-[5.5rem] -translate-x-1/2 -translate-y-1/2 -rotate-12 place-items-center rounded-full font-ps-mono text-[0.5rem] tracking-[.14em] text-ps-info-deep opacity-40 mix-blend-multiply"
        >
          <Icon name="shield" className="h-[1.375rem] w-[1.375rem]" />
        </div>

        <div style={BAND} className="relative z-[2] flex items-center gap-2.5 px-3.5 py-2.5">
          <Icon name="globe" className="h-[1.625rem] w-[1.625rem] flex-none text-ps-chrome-fg/80" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-ps-mono text-[0.59375rem] tracking-[.2em] text-ps-chrome-fg/70">
              {t("carne.bandAuthority")}
            </div>
            <div className="truncate font-ps-ceremony text-[1rem] tracking-[.02em] text-ps-chrome-fg">
              {t("carne.bandCardTitle")}
            </div>
          </div>
          <span className="flex-none rounded-md border border-white/45 px-2.5 py-[3px] font-ps-mono text-[0.65625rem] font-bold tracking-[.08em] text-ps-chrome-fg">
            {t("carne.classA")}
          </span>
        </div>

        <div className="relative z-[2] grid grid-cols-[5.75rem_1fr_5.75rem] items-start gap-3 p-3.5">
          <div className="text-center">
            <div className="rounded-lg border border-ps-info/30 bg-white p-[0.3125rem] shadow-[inset_0_0_8px_rgba(40,60,90,.15)]">
              <PassportPhoto uuid={profile.uuid} />
            </div>
            <p className="mt-1.5 truncate border-t border-ps-info/30 pt-1 font-ps-ceremony text-[0.8125rem] text-ps-info-deep">
              {profile.username}
            </p>
          </div>

          <div className="grid grid-cols-2 content-start gap-x-3 gap-y-[0.5625rem]">
            <Field label={t("carne.field.name")} value={profile.username} wide />
            <Field label={t("carne.field.docNumber")} value={profile.trainerId} />
            <Field label={t("carne.field.region")} value={profile.region} />
            <Field label={t("carne.field.class")} value={profile.title} wide />
            <div className="col-span-2 grid grid-cols-3 gap-2.5">
              <Code label={t("carne.field.issued")} value={docDate(issued, locale)} />
              <Code label={t("carne.field.expires")} value={docDate(expires, locale)} />
              <Code label={t("carne.field.hours")} value={`${hours}h`} />
            </div>
            <Code label={t("carne.field.rank")} value={String(profile.rank).padStart(2, "0")} />
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onScan}
              aria-label={t("carne.scanAria")}
              className={cn(
                "relative block w-full overflow-hidden rounded-lg border border-ps-info/30 bg-ps-paper p-[0.3125rem]",
                "shadow-[0_1px_3px_rgba(0,0,0,.15)] transition-shadow duration-300 motion-reduce:transition-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ps-teal",
                verified
                  ? "shadow-[0_0_0_2px_rgb(var(--ps-ok)),0_0_14px_rgb(var(--ps-ok)/.55)]"
                  : inspect
                    ? "shadow-[0_0_0_2px_rgb(var(--ps-teal)),0_0_14px_rgb(var(--ps-teal)/.5)]"
                    : "",
              )}
            >
              <svg
                viewBox={`0 0 ${QR_DIM} ${QR_DIM}`}
                shapeRendering="crispEdges"
                aria-hidden="true"
                className="block h-20 w-20"
              >
                <rect width={QR_DIM} height={QR_DIM} fill="#f5efe1" />
                <g fill="#1a1206">
                  {modules.map((row, r) =>
                    row.map((on, c) =>
                      on ? (
                        <rect
                          key={`${r}-${c}`}
                          x={(c + QR_QUIET) * QR_CELL}
                          y={(r + QR_QUIET) * QR_CELL}
                          width={QR_CELL}
                          height={QR_CELL}
                        />
                      ) : null,
                    ),
                  )}
                </g>
              </svg>
              {inspect && !verified && (
                <span
                  aria-hidden="true"
                  style={SCANLINE}
                  className="ps-loop pointer-events-none absolute left-[0.3125rem] right-[0.3125rem] h-4 shadow-[0_0_10px_rgb(var(--ps-teal)/.7)] animate-ps-qrscan motion-reduce:animate-none"
                />
              )}
            </button>
            <span
              className={cn(
                "mt-1.5 flex items-center justify-center gap-1 font-ps-mono text-[0.5rem] tracking-[.1em]",
                verified ? "text-ps-ok" : "text-ps-info-deep/70",
              )}
            >
              <Icon name={verified ? "shield" : "scan"} className="h-[0.6875rem] w-[0.6875rem]" />
              {verified ? t("carne.verified") : t("carne.scan")}
            </span>
          </div>
        </div>

        <div className="ps-num relative z-[2] mx-3.5 mb-3.5 overflow-hidden whitespace-nowrap rounded-b-md border-t border-ps-info/25 bg-white/55 px-2 py-1.5 font-ps-mono text-[0.6875rem] tracking-[.14em] text-ps-info-deep">
          {carneMrz}
        </div>
      </div>

      {/* Modo Inspección has no button — this line is the only place the reader is told the
          key, now that Rotom's marginalia (which used to say it) is gone. Printed instructions
          are what a real document carries anyway. */}
      <p className="mt-3 px-0.5 text-[0.6875rem] leading-[1.45] text-ps-ink-soft">
        {t.rich("carne.footer", {
          key: (chunks) => <b className="ps-num font-ps-mono text-ps-ink">{chunks}</b>,
          mode: (chunks) => <b className="text-ps-ink">{chunks}</b>,
        })}
      </p>
    </>
  )
}
