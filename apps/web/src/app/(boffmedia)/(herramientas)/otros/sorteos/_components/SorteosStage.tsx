"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Badge, Button, Icon, IconButton, Avatar, DataList, Empty, cn, Kbd, Seg } from "@boffmedia/ui"
import {
  SrtReelStage,
  SrtConfetti,
  SrtWinnerList,
  SrtSeedTag,
  oddsOf,
  initials,
  poolHash,
  buildShareText,
  type SrtDrawHandle,
  type SrtDrawMode,
  SRT_DRAW_MODES,
  SrtWheelStage,
  SrtSpotlightStage,
  SrtWheelPreview,
  SrtReelPreview,
  SrtSpotlightPreview,
} from "@/components/boffmedia/ui/giveaways"
import { toast } from "@boffmedia/ui"
import type { Draw, Phase } from "@/components/boffmedia/ui/giveaways"

export interface SorteosStageProps {
  phase: Phase
  draw: Draw | null
  entrants: { id: string; name: string; weight: number }[]
  pool: { id: string; name: string; weight: number }[]
  weighted: boolean
  exclude: boolean
  effCount: number
  wonNames: Set<string>
  sound: boolean
  isFullscreen: boolean
  roundNumber: number
  drawRef: React.Ref<SrtDrawHandle>
  drawMode: SrtDrawMode
  onDrawModeChange: (mode: SrtDrawMode) => void
  onFocusAdd?: () => void
  onRunDraw: () => void
  onSoundChange: (sound: boolean) => void
  onLand: () => void
  onDrawAgain: () => void
  onRemoveDrawn: () => void
  onTogglePresentation: () => void
}

/**
 * Stage component — broadcast surface with fullscreen support
 */
const MODE_ICONS: Record<SrtDrawMode, "layers" | "wheel" | "grid"> = {
  reel: "layers",
  wheel: "wheel",
  spotlight: "grid",
}

export const SorteosStage = React.forwardRef<HTMLDivElement, SorteosStageProps>(
  function SorteosStage(
    {
      phase,
      draw,
      entrants,
      pool,
      weighted,
      exclude,
      effCount,
      wonNames,
      sound,
      isFullscreen,
      roundNumber,
      drawRef,
      drawMode,
      onDrawModeChange,
      onFocusAdd,
      onRunDraw,
      onSoundChange,
      onLand,
      onDrawAgain,
      onRemoveDrawn,
      onTogglePresentation,
    },
    stageRef
  ) {
    const t = useTranslations("otros.sorteosApp")
    const tReel = useTranslations("common.giveaways.reel")

    const modeIcon = MODE_ICONS[drawMode]
    const modeLabel = `mode${drawMode.charAt(0).toUpperCase() + drawMode.slice(1)}`
    const statusBadgeTone = phase === "spin" ? "live" : phase === "reveal" ? "new" : "default"
    const statusText =
      phase === "setup"
        ? t("stageIdle")
        : phase === "reveal"
          ? t("stageResult")
          : ""

    const handleCopy = () => {
      if (!draw) return
      const txt = buildShareText({
        header: t("copyHeader", { seed: draw.seed }),
        seedLabel: t("seed"),
        hashLabel: t("poolHash"),
        seed: draw.seed,
        hash: poolHash(draw.pool, draw.weighted),
        winners: draw.winners.map((w) => w.name),
      })
      try {
        navigator.clipboard?.writeText(txt).then(
          () => {
            toast({ msg: t("toastCopied"), tone: "ok", icon: "check" })
          },
          () => {
            toast({ msg: t("toastCopyFailed"), tone: "bad" })
          }
        )
      } catch {
        toast({ msg: t("toastCopyFailed"), tone: "bad" })
      }
    }

    return (
      <div
        ref={stageRef}
        className={cn(
          isFullscreen
            ? "flex h-screen w-screen flex-col overflow-y-auto bg-base-deep"
            : "cut-corner cut-corner-edge [--cut-lg:14px] border border-line bg-panel",
        )}
      >
        {/* Accent signal bar */}
        <div className="h-[3px] bg-gradient-to-r from-accent-bright to-accent" />

        <div className={cn(isFullscreen && "flex min-h-0 w-full flex-1 flex-col")}>
          {/* Head row */}
          <div className="flex items-center justify-between gap-[12px] border-b border-line px-[18px] py-[13px]">
            <div className="flex items-center gap-[12px] min-w-0">
              <Badge tone={statusBadgeTone}>
                <Icon name={modeIcon} size={12} />
                {t(modeLabel)}
              </Badge>
              {statusText && (
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-txt-muted">
                  {statusText}
                </span>
              )}
            </div>

            <div className="flex items-center gap-[12px]">
              {draw && <SrtSeedTag seed={draw.seed} seedLabel={t("seed")} copyLabel={t("copy")} copiedLabel={t("copied")} />}
              {pool.length > 0 && (
                <div className="hidden [@media(pointer:fine)]:flex items-center gap-[8px]">
                  <Kbd>{t("kbdSpace")}</Kbd>
                  <span className="text-[11px] text-txt-muted">
                    {phase === "setup"
                      ? t("kbdSpaceDraw")
                      : phase === "spin"
                        ? t("kbdSpaceSkip")
                        : t("kbdSpaceAgain")}
                  </span>
                </div>
              )}
              {isFullscreen && (
                <div className="hidden [@media(pointer:fine)]:flex items-center gap-[8px]">
                  <Kbd>Esc</Kbd>
                  <span className="text-[11px] text-txt-muted">{t("kbdLegendEsc")}</span>
                </div>
              )}
              <IconButton
                name="fullscreen"
                label={isFullscreen ? t("presentationExit") : t("presentation")}
                variant="ghost"
                size="sm"
                onClick={onTogglePresentation}
              />
            </div>
          </div>

          {/* Body */}
          <div
            className={cn(
              "flex flex-col",
              isFullscreen ? "min-h-0 flex-1 px-[4vw] py-[2vh] justify-center" : "min-h-[420px] p-[20px]",
            )}
          >
            {entrants.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center">
                <Empty
                  icon="gift"
                  title={t("blankTitle")}
                  lead={t("blankText")}
                  className="py-[44px]"
                >
                  <Button variant="pri" icon="plus" onClick={onFocusAdd}>
                    {t("blankCta")}
                  </Button>
                </Empty>
              </div>
            ) : phase === "setup" ? (
              <div className="flex flex-1 flex-col justify-center gap-[20px]">
                {/* Mode picker */}
                <div className="flex flex-col gap-[8px]">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-txt-muted">
                    {t("modeTitle")}
                  </span>
                  <Seg
                    options={SRT_DRAW_MODES.map((mode) => ({
                      value: mode,
                      label: (
                        <span className="inline-flex items-center gap-[6px]">
                          <Icon
                            name={mode === "reel" ? "layers" : mode === "wheel" ? "wheel" : "grid"}
                            size={14}
                          />
                          {t(`mode${mode.charAt(0).toUpperCase() + mode.slice(1)}`)}
                        </span>
                      )
                    }))}
                    value={drawMode}
                    onChange={(val) => onDrawModeChange(val as SrtDrawMode)}
                  />
                  <p className="text-[11px] text-txt-muted font-mono leading-[1.4]">
                    {t("modeHint")}
                  </p>
                </div>

                {/* Pool summary strip */}
                <div className="flex flex-wrap items-center gap-[14px] border border-line bg-panel-2 px-[18px] py-[16px]">
                  <span className="cut-seal cut-seal-edge [--cut-line:var(--accent-line)] [--cut:9px] grid h-[46px] w-[46px] flex-none place-items-center border border-accent-line bg-accent-soft text-accent">
                    <Icon name="users" size={22} />
                  </span>
                  <div className="min-w-0">
                    <b className="font-display text-[26px] font-extrabold italic leading-[0.9] text-txt">
                      {pool.length}
                    </b>
                    <span className="mt-[5px] block font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-txt-muted">
                      {t("inDraw")}
                    </span>
                  </div>
                  <div className="ml-auto grid gap-[6px] text-right">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-txt-muted">
                      {t.rich("extractN", { n: effCount, b: (c) => <b className="text-accent">{c}</b> })}
                    </span>
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-txt-muted">
                      {weighted ? t("weightedMode") : t("equalMode")}
                      {exclude && wonNames.size ? ` · ${t("noRepeat")}` : ""}
                    </span>
                  </div>
                </div>

                {/* Mode preview */}
                {pool.length > 0 && (
                  <>
                    {drawMode === "wheel" && <SrtWheelPreview participants={pool} weighted={weighted} size={isFullscreen ? "large" : "default"} frame="inset" />}
                    {drawMode === "reel" && <SrtReelPreview participants={pool} size={isFullscreen ? "large" : "default"} frame="inset" />}
                    {drawMode === "spotlight" && <SrtSpotlightPreview participants={pool} weighted={weighted} size={isFullscreen ? "large" : "default"} frame="inset" />}
                  </>
                )}

                {/* Hero CTA */}
                <button
                  type="button"
                  disabled={pool.length === 0}
                  onClick={onRunDraw}
                  className="cut-corner [--cut-lg:14px] relative inline-flex w-full items-center justify-center gap-[12px] overflow-hidden border-0 p-[20px] font-display text-[22px] font-extrabold italic uppercase tracking-[0.03em] text-accent-ink transition-[filter,transform] [background:repeating-linear-gradient(-55deg,var(--accent)_0_14px,var(--accent-bright)_14px_28px)] enabled:hover:-translate-y-[2px] enabled:hover:brightness-[1.08] disabled:cursor-default disabled:bg-panel-2 disabled:bg-none disabled:text-txt-muted disabled:opacity-50 disabled:grayscale"
                >
                  <Icon name="bolt" size={20} className="flex-none" />
                  {effCount > 1 ? t("drawN", { n: effCount }) : t("drawOne")}
                  <Icon name="bolt" size={20} className="flex-none" />
                </button>
              </div>
            ) : phase === "spin" && draw ? (
              <div className="flex flex-1 flex-col justify-center">
                {drawMode === "reel" && (
                  <SrtReelStage
                    ref={drawRef}
                    participants={draw.pool}
                    winners={draw.winners.map((w) => w.name)}
                    weighted={draw.weighted}
                    muted={!sound}
                    onMutedChange={(muted) => onSoundChange(!muted)}
                    onComplete={onLand}
                    size={isFullscreen ? "large" : "default"}
                    frame="inset"
                  />
                )}
                {drawMode === "wheel" && (
                  <SrtWheelStage
                    ref={drawRef}
                    participants={draw.pool}
                    winners={draw.winners.map((w) => w.name)}
                    weighted={draw.weighted}
                    muted={!sound}
                    onMutedChange={(muted) => onSoundChange(!muted)}
                    onComplete={onLand}
                    size={isFullscreen ? "large" : "default"}
                    frame="inset"
                  />
                )}
                {drawMode === "spotlight" && (
                  <SrtSpotlightStage
                    ref={drawRef}
                    participants={draw.pool}
                    winners={draw.winners.map((w) => w.name)}
                    weighted={draw.weighted}
                    muted={!sound}
                    onMutedChange={(muted) => onSoundChange(!muted)}
                    onComplete={onLand}
                    size={isFullscreen ? "large" : "default"}
                    frame="inset"
                  />
                )}
              </div>
            ) : phase === "reveal" && draw ? (
              <div className="relative flex flex-1 flex-col justify-center">
                <SrtConfetti n={54} />

                <div className="mb-[18px] text-center">
                  <span className="inline-flex items-center gap-[7px] border border-accent-line px-[11px] py-[6px] font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
                    <Icon name="sparkles" size={12} />
                    {t("roundN", { n: roundNumber })}
                  </span>
                  <h2
                    className={cn(
                      "mt-[12px] font-display font-extrabold italic uppercase leading-none text-txt",
                      isFullscreen
                        ? "text-[clamp(34px,5vw,72px)]"
                        : "text-[clamp(26px,3vw,38px)]",
                    )}
                  >
                    {draw.winners.length > 1
                      ? t("winnersN", { n: draw.winners.length })
                      : t("gotWinner")}
                  </h2>
                </div>

                {draw.winners.length === 1 ? (
                  <div className="relative overflow-hidden pb-1 pt-2 text-center">
                    <div
                      className={cn(
                        "cut-seal cut-seal-edge [--cut-line:var(--accent-line)] [--cut:14px] mx-auto mb-[16px] grid place-items-center border border-accent-line bg-accent-soft text-accent",
                        isFullscreen ? "h-[clamp(76px,11vh,132px)] w-[clamp(76px,11vh,132px)]" : "h-[76px] w-[76px]",
                      )}
                    >
                      <Icon name="trophy" size={isFullscreen ? 58 : 36} />
                    </div>
                    <div className="inline-flex min-w-0 items-center gap-[14px]">
                      <Avatar
                        accent
                        className={cn(
                          isFullscreen
                            ? "h-[clamp(52px,9vh,104px)] w-[clamp(52px,9vh,104px)] text-[clamp(20px,3.4vh,40px)]"
                            : "h-[52px] w-[52px] text-[20px]",
                        )}
                      >
                        {initials(draw.winners[0].name)}
                      </Avatar>
                      <b
                        className={cn(
                          "min-w-0 max-w-full break-words font-display font-extrabold italic leading-none text-accent",
                          isFullscreen ? "text-[clamp(44px,7vw,120px)]" : "text-[40px]",
                        )}
                      >
                        {draw.winners[0].name}
                      </b>
                    </div>
                    <p
                      className={cn(
                        "mt-[12px] font-mono tracking-[0.04em] text-txt-muted",
                        isFullscreen ? "text-[clamp(12px,1.8vh,20px)]" : "text-[12px]",
                      )}
                    >
                      {t.rich("oddsLine", {
                        pct: oddsOf(draw.pool, draw.winners[0], draw.weighted).toFixed(1),
                        n: draw.pool.length,
                        b: (c) => <b className="text-txt">{c}</b>,
                      })}
                    </p>
                  </div>
                ) : (
                  <SrtWinnerList winners={draw.winners} pool={draw.pool} weighted={draw.weighted} />
                )}

                {/* Verification line */}
                <div className="mt-[20px] border-t border-line pt-[18px]">
                  <DataList
                    rows={[
                      {
                        icon: "key",
                        label: t("seed"),
                        value: `#${draw.seed}`,
                        mono: true,
                      },
                      {
                        icon: "users",
                        label: t("poolHash"),
                        value: poolHash(draw.pool, draw.weighted),
                        mono: true,
                      },
                      {
                        icon: "dice",
                        label: t("mode"),
                        value: draw.weighted ? t("weightedMode") : t("equalMode"),
                        mono: true,
                      },
                    ]}
                  />
                  <p className="mt-[12px] text-center font-mono text-[10px] leading-[1.4] text-txt-dim">
                    {t("verifyHint")}
                  </p>
                </div>

                {/* Action row */}
                <div className="mt-[18px] flex flex-wrap justify-center gap-[10px]">
                  <Button variant="pri" icon="bolt" onClick={onDrawAgain}>
                    {t("drawAgain")}
                  </Button>
                  <Button variant="default" icon="trash" onClick={onRemoveDrawn}>
                    {t("removeContinue")}
                  </Button>
                  <Button variant="ghost" icon="copy" onClick={handleCopy}>
                    {t("shareResult")}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )
  }
)
SorteosStage.displayName = "SorteosStage"
