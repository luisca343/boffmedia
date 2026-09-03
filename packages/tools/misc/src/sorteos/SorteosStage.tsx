"use client"

import * as React from "react"
import { Badge, Button, Icon, IconButton, Avatar, DataList, Empty, cn, Kbd, Seg, toast } from "@boffmedia/ui"
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
  useGiveawaysT,
  type Draw,
  type Phase,
} from "@boffmedia/ui/giveaways"
import { useToolT, useToolRichT, SORTEOS_NS } from "../i18n"

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
    const t = useToolT(SORTEOS_NS)
    // `extractN` and `oddsLine` bold part of themselves; see `useToolRichT`.
    const tRich = useToolRichT(SORTEOS_NS)
    const tReel = useGiveawaysT("common.giveaways.reel")

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
          <div className="flex items-center justify-between gap-[0.75rem] border-b border-line px-[1.125rem] py-[0.8125rem]">
            <div className="flex items-center gap-[0.75rem] min-w-0">
              <Badge tone={statusBadgeTone}>
                <Icon name={modeIcon} size={12} />
                {t(modeLabel)}
              </Badge>
              {statusText && (
                <span className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-txt-muted">
                  {statusText}
                </span>
              )}
            </div>

            <div className="flex items-center gap-[0.75rem]">
              {draw && <SrtSeedTag seed={draw.seed} seedLabel={t("seed")} copyLabel={t("copy")} copiedLabel={t("copied")} />}
              {pool.length > 0 && (
                <div className="hidden [@media(pointer:fine)]:flex items-center gap-[0.5rem]">
                  <Kbd>{t("kbdSpace")}</Kbd>
                  <span className="text-[0.6875rem] text-txt-muted">
                    {phase === "setup"
                      ? t("kbdSpaceDraw")
                      : phase === "spin"
                        ? t("kbdSpaceSkip")
                        : t("kbdSpaceAgain")}
                  </span>
                </div>
              )}
              {isFullscreen && (
                <div className="hidden [@media(pointer:fine)]:flex items-center gap-[0.5rem]">
                  <Kbd>Esc</Kbd>
                  <span className="text-[0.6875rem] text-txt-muted">{t("kbdLegendEsc")}</span>
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
              isFullscreen ? "min-h-0 flex-1 px-[4vw] py-[2vh] justify-center" : "min-h-[26.25rem] p-[1.25rem]",
            )}
          >
            {entrants.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center">
                <Empty
                  icon="gift"
                  title={t("blankTitle")}
                  lead={t("blankText")}
                  className="py-[2.75rem]"
                >
                  <Button variant="pri" icon="plus" onClick={onFocusAdd}>
                    {t("blankCta")}
                  </Button>
                </Empty>
              </div>
            ) : phase === "setup" ? (
              <div className="flex flex-1 flex-col justify-center gap-[1.25rem]">
                {/* Mode picker */}
                <div className="flex flex-col gap-[0.5rem]">
                  <span className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-txt-muted">
                    {t("modeTitle")}
                  </span>
                  <Seg
                    options={SRT_DRAW_MODES.map((mode) => ({
                      value: mode,
                      label: (
                        <span className="inline-flex items-center gap-[0.375rem]">
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
                  <p className="text-[0.6875rem] text-txt-muted font-mono leading-[1.4]">
                    {t("modeHint")}
                  </p>
                </div>

                {/* Pool summary strip */}
                <div className="flex flex-wrap items-center gap-[0.875rem] border border-line bg-panel-2 px-[1.125rem] py-[1rem]">
                  <span className="cut-seal cut-seal-edge [--cut-line:var(--accent-line)] [--cut:9px] grid h-[2.875rem] w-[2.875rem] flex-none place-items-center border border-accent-line bg-accent-soft text-accent">
                    <Icon name="users" size={22} />
                  </span>
                  <div className="min-w-0">
                    <b className="font-display text-[1.625rem] font-extrabold italic leading-[0.9] text-txt">
                      {pool.length}
                    </b>
                    <span className="mt-[0.3125rem] block font-mono text-[0.625rem] font-medium uppercase tracking-[0.1em] text-txt-muted">
                      {t("inDraw")}
                    </span>
                  </div>
                  <div className="ml-auto grid gap-[0.375rem] text-right">
                    <span className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-txt-muted">
                      {tRich("extractN", { n: effCount, b: (c) => <b className="text-accent">{c}</b> })}
                    </span>
                    <span className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-txt-muted">
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
                  className="cut-corner [--cut-lg:14px] relative inline-flex w-full items-center justify-center gap-[0.75rem] overflow-hidden border-0 p-[1.25rem] font-display text-[1.375rem] font-extrabold italic uppercase tracking-[0.03em] text-accent-ink transition-[filter,transform] [background:repeating-linear-gradient(-55deg,var(--accent)_0_14px,var(--accent-bright)_14px_28px)] enabled:hover:-translate-y-[2px] enabled:hover:brightness-[1.08] disabled:cursor-default disabled:bg-panel-2 disabled:bg-none disabled:text-txt-muted disabled:opacity-50 disabled:grayscale"
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

                <div className="mb-[1.125rem] text-center">
                  <span className="inline-flex items-center gap-[0.4375rem] border border-accent-line px-[0.6875rem] py-[0.375rem] font-mono text-[0.625rem] font-bold uppercase tracking-[0.14em] text-accent">
                    <Icon name="sparkles" size={12} />
                    {t("roundN", { n: roundNumber })}
                  </span>
                  <h2
                    className={cn(
                      "mt-[0.75rem] font-display font-extrabold italic uppercase leading-none text-txt",
                      isFullscreen
                        ? "text-[clamp(2.125rem,5vw,4.5rem)]"
                        : "text-[clamp(1.625rem,3vw,2.375rem)]",
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
                        "cut-seal cut-seal-edge [--cut-line:var(--accent-line)] [--cut:14px] mx-auto mb-[1rem] grid place-items-center border border-accent-line bg-accent-soft text-accent",
                        isFullscreen ? "h-[clamp(4.75rem,11vh,8.25rem)] w-[clamp(4.75rem,11vh,8.25rem)]" : "h-[4.75rem] w-[4.75rem]",
                      )}
                    >
                      <Icon name="trophy" size={isFullscreen ? 58 : 36} />
                    </div>
                    <div className="inline-flex min-w-0 items-center gap-[0.875rem]">
                      <Avatar
                        accent
                        className={cn(
                          isFullscreen
                            ? "h-[clamp(3.25rem,9vh,6.5rem)] w-[clamp(3.25rem,9vh,6.5rem)] text-[clamp(1.25rem,3.4vh,2.5rem)]"
                            : "h-[3.25rem] w-[3.25rem] text-[1.25rem]",
                        )}
                      >
                        {initials(draw.winners[0].name)}
                      </Avatar>
                      <b
                        className={cn(
                          "min-w-0 max-w-full break-words font-display font-extrabold italic leading-none text-accent",
                          isFullscreen ? "text-[clamp(2.75rem,7vw,7.5rem)]" : "text-[2.5rem]",
                        )}
                      >
                        {draw.winners[0].name}
                      </b>
                    </div>
                    <p
                      className={cn(
                        "mt-[0.75rem] font-mono tracking-[0.04em] text-txt-muted",
                        isFullscreen ? "text-[clamp(0.75rem,1.8vh,1.25rem)]" : "text-[0.75rem]",
                      )}
                    >
                      {tRich("oddsLine", {
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
                <div className="mt-[1.25rem] border-t border-line pt-[1.125rem]">
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
                  <p className="mt-[0.75rem] text-center font-mono text-[0.625rem] leading-[1.4] text-txt-dim">
                    {t("verifyHint")}
                  </p>
                </div>

                {/* Action row */}
                <div className="mt-[1.125rem] flex flex-wrap justify-center gap-[0.625rem]">
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
