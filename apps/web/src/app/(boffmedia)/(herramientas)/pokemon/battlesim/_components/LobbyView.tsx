"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Icon, type IconName } from "@/components/boffmedia/primitives"
import { cn } from "@/lib/utils"
import { DkSelect } from "@/components/boffmedia/ui/tools/datakit"
import { BSIM_MODES, BSIM_FORMATS, BSIM_FORMAT_KEY, type BsimMode, type BsimView } from "../_lib/bsim-data"

export function LobbyView({ go }: { go: (view: BsimView) => void }) {
  const t = useTranslations("battlesim")
  const router = useRouter()
  const [mode, setMode] = useState<BsimMode>("ia")
  const [format, setFormat] = useState<string>(BSIM_FORMATS[0].value)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(BSIM_FORMAT_KEY)
      if (saved && BSIM_FORMATS.some((f) => f.value === saved)) setFormat(saved)
    } catch { /* noop */ }
  }, [])

  const setFmt = (v: string) => {
    setFormat(v)
    try { localStorage.setItem(BSIM_FORMAT_KEY, v) } catch { /* noop */ }
  }

  const activeMode = BSIM_MODES.find((m) => m.id === mode)!
  const launch = () => {
    const q = mode === "ia" ? `?format=${encodeURIComponent(format)}` : ""
    router.push(`${activeMode.href}${q}`)
  }

  return (
    <div className="mx-auto grid max-w-[780px] gap-[14px]">
      {/* ============ GAME CONSOLE ============ */}
      <section className="cut-corner relative grid gap-[15px] overflow-hidden border border-solid border-line-2 border-t-[3px] border-t-accent px-[22px] pb-[22px] pt-5 [background:linear-gradient(180deg,var(--panel),var(--bg-2))]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-[-45%_35%_auto_-12%] h-[320px] [background:radial-gradient(50%_60%_at_30%_0,var(--accent-soft),transparent_70%)]" />

        <header className="relative grid gap-[6px]">
          <span className="inline-flex items-center gap-[7px] font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.16em] text-accent-bright">
            <Icon name="sword" size={13} />{t("app.lobby.kick")}
          </span>
          <h2 className="m-0 font-display text-[clamp(28px,4.5vw,36px)] font-extrabold italic uppercase leading-[0.95] tracking-[0.02em] text-txt">
            {t("app.lobby.title")}
          </h2>
        </header>

        {/* modes */}
        <div role="radiogroup" aria-label={t("app.lobby.modeLabel")} className="relative grid grid-cols-3 gap-2 max-[620px]:grid-cols-1">
          {BSIM_MODES.map((m) => {
            const on = mode === m.id
            return (
              <button key={m.id} type="button" role="radio" aria-checked={on} onClick={() => setMode(m.id)}
                className={cn(
                  "cut [--cut:8px] flex min-w-0 items-center gap-[9px] border border-solid px-3 py-[11px] text-left transition-colors",
                  on ? "border-accent bg-accent-soft text-txt" : "border-line bg-base text-txt-muted hover:border-line-2 hover:text-txt",
                )}>
                <Icon name={m.icon} size={17} className={cn("flex-none", on ? "text-accent-bright" : "text-txt-dim")} />
                <span className="grid min-w-0 gap-[2px]">
                  <b className="font-display text-[12.5px] font-bold uppercase leading-none tracking-[0.03em]">{t(`app.lobby.modes.${m.id}.label`)}</b>
                  <small className="truncate font-mono text-[9px] leading-[1.2] text-txt-dim">{t(`app.lobby.modes.${m.id}.sub`)}</small>
                </span>
              </button>
            )
          })}
        </div>

        {/* format (AI only) */}
        {mode === "ia" && (
          <div className="relative grid gap-[7px]">
            <span className="font-mono text-[9.5px] font-semibold uppercase leading-none tracking-[0.14em] text-txt-dim">{t("app.lobby.formatLabel")}</span>
            <DkSelect value={format} onChange={setFmt} ariaLabel={t("app.lobby.formatLabel")}
              options={BSIM_FORMATS.map((f) => ({ value: f.value, label: f.label }))} />
          </div>
        )}

        {/* launch */}
        <div className="relative grid gap-2">
          <button type="button" onClick={launch}
            className="cut [--cut:12px] relative flex w-full items-center justify-center gap-3 overflow-hidden border-0 bg-accent p-4 text-accent-ink transition-[background,transform,box-shadow] hover:-translate-y-px hover:bg-accent-bright hover:shadow-[0_10px_28px_color-mix(in_srgb,var(--accent)_42%,transparent)]">
            <Icon name={mode === "ia" ? "sword" : "search"} size={22} />
            <b className="font-display text-[19px] font-extrabold italic uppercase leading-none tracking-[0.05em]">{t(`app.lobby.launch.${mode}`)}</b>
          </button>
          <p className="m-0 text-center font-mono text-[10.5px] leading-[1.4] text-txt-dim">{t(`app.lobby.modes.${mode}.note`)}</p>
        </div>
      </section>

      {/* ============ QUICK ACCESS ============ */}
      <nav aria-label={t("app.tabs.lobby")} className="grid grid-cols-3 gap-[10px] max-[620px]:grid-cols-1">
        <LobbyTile icon="layers" title={t("app.lobby.tiles.builder")} sub={t("app.lobby.tiles.builderSub")} onClick={() => go("equipos")} />
        <LobbyTile icon="play" title={t("app.lobby.tiles.replays")} sub={t("app.lobby.tiles.replaysSub")} onClick={() => go("repeticiones")} />
        <LobbyTile icon="trending" title={t("app.lobby.tiles.ladder")} sub={t("app.lobby.tiles.ladderSub")} href="/clasificacion" />
      </nav>
    </div>
  )
}

function LobbyTile({ icon, title, sub, onClick, href }: { icon: IconName; title: string; sub: string; onClick?: () => void; href?: string }) {
  const cls =
    "cut group grid min-w-0 justify-items-start gap-[5px] border border-solid border-line bg-panel px-4 py-[15px] text-left text-txt-muted transition-[color,border-color,background,transform] hover:-translate-y-[2px] hover:border-accent-line hover:text-txt"
  const inner = (
    <>
      <Icon name={icon} size={20} className="text-accent-bright" />
      <b className="font-display text-[14px] font-bold uppercase leading-none tracking-[0.03em]">{title}</b>
      <small className="font-mono text-[10px] leading-[1.2] text-txt-dim">{sub}</small>
    </>
  )
  if (href) return <a href={href} className={cls}>{inner}</a>
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>
}
