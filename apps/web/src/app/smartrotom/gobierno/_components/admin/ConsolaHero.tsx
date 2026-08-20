"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Card, Icon, type IconName } from "../ui"
import { TONES, type Tone } from "../../_utils/tones"

/**
 * The status strip every Administración tool opens with — internal-service branding on
 * civic paper, not terminal chrome. `status` is optional and must only be passed when it
 * reflects something real (Rendimiento's TPS-derived state, Actividad's live/paused
 * toggle) — never a hardcoded "CONECTADO".
 */
export function ConsolaHero({
  title,
  code,
  icon = "server",
  dep = "seguridad",
  status,
  statusTone = "ok",
}: {
  title: string
  code: string
  icon?: IconName
  dep?: Tone
  status?: string
  statusTone?: Tone
}) {
  const t = useTranslations("gobierno")
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const iv = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])
  const tone = TONES[dep]
  const st = TONES[statusTone]
  const pad = (n: number) => String(n).padStart(2, "0")

  return (
    <Card dep={dep} className="mb-4 px-[18px] py-[13px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`grid h-9 w-9 flex-none place-items-center rounded-gt border ${tone.softBorder} ${tone.softBg}`}
          >
            <Icon name={icon} size={18} className={tone.text} />
          </div>
          <div className="min-w-0">
            <div className="font-gt-display text-base font-bold tracking-[.01em] text-gt-ink-900">{title}</div>
            <div className="mt-[3px] font-gt-mono text-[9px] uppercase tracking-[.14em] text-gt-ink-400">
              {t("chrome.servicioInterno", { code })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-gt-mono text-xs tabular-nums tracking-[.04em] text-gt-ink-500">
            {now ? (
              <>
                {pad(now.getHours())}
                <span className="animate-gt-blink motion-reduce:animate-none">:</span>
                {pad(now.getMinutes())}:{pad(now.getSeconds())}
              </>
            ) : (
              "—:—:—"
            )}
          </div>
          {status && (
            <span className={`flex items-center gap-1.5 font-gt-mono text-[10px] font-bold tracking-[.1em] ${st.text}`}>
              <span className={`h-2 w-2 rounded-full ${st.dot}`} />
              {status}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
