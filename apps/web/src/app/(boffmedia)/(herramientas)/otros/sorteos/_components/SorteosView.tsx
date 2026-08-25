"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button, Icon, Input, Textarea, Seg, Toggle, Avatar, StatChip, ToolHeader } from "@boffmedia/ui"
import { useSorteos, oddsOf } from "../_lib/useSorteos"
import { SrtWeight, SrtRow, SrtWinnerList, SrtSeedTag, SrtConfetti, SrtPanel, SrtPanelHead } from "./ui/srt-kit"
// v3 «Señal» draw animation (horizontal reel), keeps the original tick/win sound.
import SpinnerAnimation from "./spinner/SpinnerAnimation"

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function SorteosView() {
  const t = useTranslations("otros.sorteosApp")
  const s = useSorteos()
  const {
    entrants, history, weighted, exclude, winnerCount, phase, draw, pool, maxWinners, effCount, totalWeight, wonNames,
    setWeighted, setExclude, setWinnerCount,
    addOne, addBulk, rename, setWeight, removeOne, shuffle, clearAll, resetHistory,
    runDraw, onLand, drawAgain, removeDrawn,
  } = s

  const [tab, setTab] = React.useState<"single" | "bulk">("single")
  const [single, setSingle] = React.useState("")
  const [singleW, setSingleW] = React.useState(1)
  const [bulk, setBulk] = React.useState("")

  const submitSingle = (e: React.FormEvent) => {
    e.preventDefault()
    addOne(single, weighted ? singleW : 1)
    setSingle("")
    setSingleW(1)
  }
  const submitBulk = () => {
    if (addBulk(bulk) > 0) setBulk("")
  }
  const copyResult = () => {
    if (!draw) return
    const txt = `${t("copyHeader", { seed: draw.seed })}\n` + draw.winners.map((w, i) => `${i + 1}. ${w.name}`).join("\n")
    try {
      navigator.clipboard?.writeText(txt).catch(() => {})
    } catch {
      /* noop */
    }
  }
  const bulkCount = bulk.split("\n").filter((l) => l.trim()).length

  const stageTitle = phase === "spin" ? t("stageSpinning") : phase === "reveal" ? t("stageResult") : t("stageIdle")

  return (
    <main className="pb-[10px]">
      <ToolHeader
        title={<>{t("titlePre")} <em>{t("titleEm")}</em></>}
        sub={t("sub")}
        meta={
          <>
            <StatChip icon="users" value={entrants.length} label={t("participants")} />
            <StatChip icon="trophy" value={history.length} label={t("rounds")} />
          </>
        }
        actions={
          (entrants.length > 0 || history.length > 0) && (
            <Button variant="ghost" size="sm" icon="trash" onClick={clearAll}>
              {t("clear")}
            </Button>
          )
        }
      />

      {/* ── layout ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 items-start gap-[18px] min-[961px]:grid-cols-[388px_1fr]">
        {/* LEFT: add · controls · list */}
        <div className="grid min-w-0 gap-[18px]">
          {/* add */}
          <SrtPanel>
            <SrtPanelHead icon="plus" title={t("addTitle")} />
            <div className="grid gap-[13px] p-[20px]">
              <div className="max-w-full overflow-x-auto">
                <Seg
                  className="w-max min-w-full [&>button]:flex-1 [&>button]:justify-center"
                  value={tab}
                  onChange={(v) => setTab(v as "single" | "bulk")}
                  options={[
                    { value: "single", label: t("tabSingle") },
                    { value: "bulk", label: t("tabBulk") },
                  ]}
                />
              </div>
              {tab === "single" ? (
                <form className="flex items-stretch gap-[9px]" onSubmit={submitSingle}>
                  <Input className="min-w-0 flex-1" placeholder={t("namePlaceholder")} value={single} onChange={(e) => setSingle(e.target.value)} />
                  {weighted && <SrtWeight value={singleW} onChange={setSingleW} lessLabel={t("weightLess")} moreLabel={t("weightMore")} />}
                  <Button variant="pri" type="submit" icon="plus">
                    {t("add")}
                  </Button>
                </form>
              ) : (
                <div className="grid gap-[10px]">
                  <Textarea rows={5} className="min-h-[120px] resize-y font-mono text-[13px] leading-[1.6]" placeholder={t("bulkPlaceholder")} value={bulk} onChange={(e) => setBulk(e.target.value)} />
                  <div className="flex items-start gap-[8px] font-mono text-[11px] leading-[1.5] text-txt-dim">
                    <Icon name="info" size={13} className="mt-[1px] flex-none text-signal" />
                    <span>{t.rich("bulkHint", { code: (c) => <code className="text-txt-muted">{c}</code> })}</span>
                  </div>
                  <Button variant="default" icon="download" onClick={submitBulk} disabled={!bulk.trim()}>
                    {t("addList", { n: bulkCount })}
                  </Button>
                </div>
              )}
            </div>
          </SrtPanel>

          {/* controls */}
          <SrtPanel>
            <SrtPanelHead icon="sliders" title={t("configTitle")} />
            <div className="grid gap-[14px] p-[20px]">
              <div className="flex items-center justify-between gap-[12px]">
                <span className="min-w-0">
                  <b className="block font-display text-[12px] font-bold uppercase tracking-[0.05em] text-txt">{t("cfgWinners")}</b>
                  <span className="mt-[4px] block font-mono text-[10px] leading-[1.4] text-txt-dim">{t("cfgWinnersSub")}</span>
                </span>
                <div className="inline-flex items-center border border-line-2 bg-panel-2">
                  <button type="button" aria-label={t("less")} disabled={winnerCount <= 1} onClick={() => setWinnerCount(Math.max(1, winnerCount - 1))} className="grid h-[34px] w-[34px] place-items-center text-txt-muted enabled:hover:bg-accent-soft enabled:hover:text-accent disabled:opacity-35">
                    <Icon name="minus" size={15} />
                  </button>
                  <span className="grid h-[34px] min-w-[40px] place-items-center border-x border-line-2 text-center font-display text-[18px] font-extrabold italic text-accent">{effCount}</span>
                  <button type="button" aria-label={t("more")} disabled={winnerCount >= maxWinners} onClick={() => setWinnerCount(Math.min(maxWinners, winnerCount + 1))} className="grid h-[34px] w-[34px] place-items-center text-txt-muted enabled:hover:bg-accent-soft enabled:hover:text-accent disabled:opacity-35">
                    <Icon name="plus" size={15} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-[12px]">
                <span className="min-w-0">
                  <b className="block font-display text-[12px] font-bold uppercase tracking-[0.05em] text-txt">{t("cfgWeighted")}</b>
                  <span className="mt-[4px] block font-mono text-[10px] leading-[1.4] text-txt-dim">{t("cfgWeightedSub")}</span>
                </span>
                <Toggle on={weighted} onChange={setWeighted} ariaLabel={t("cfgWeighted")} />
              </div>
              <div className="flex items-center justify-between gap-[12px]">
                <span className="min-w-0">
                  <b className="block font-display text-[12px] font-bold uppercase tracking-[0.05em] text-txt">{t("cfgExclude")}</b>
                  <span className="mt-[4px] block font-mono text-[10px] leading-[1.4] text-txt-dim">{t("cfgExcludeSub")}</span>
                </span>
                <Toggle on={exclude} onChange={setExclude} ariaLabel={t("cfgExclude")} />
              </div>
            </div>
          </SrtPanel>

          {/* participants list */}
          <SrtPanel>
            <div className="flex items-center gap-[12px] border-b border-line px-[16px] py-[12px]">
              <span className="font-display text-[13px] font-bold uppercase tracking-[0.08em] text-txt">{t("listTitle")}</span>
              <span className="ml-auto inline-flex items-center gap-[6px] border border-line-2 bg-panel-2 px-[8px] py-[5px] font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-txt-muted">
                <b className="text-txt">{entrants.length}</b>
                {weighted ? ` · ${totalWeight} ${t("tickets")}` : ""}
              </span>
              <button type="button" aria-label={t("shuffle")} onClick={shuffle} className="grid h-[30px] w-[30px] place-items-center border border-transparent text-txt-dim transition-colors hover:border-line-2 hover:text-accent">
                <Icon name="refresh" size={15} />
              </button>
            </div>
            {entrants.length === 0 ? (
              <div className="px-5 py-[44px] text-center text-txt-dim">
                <Icon name="users" size={30} className="mx-auto text-line-2" />
                <p className="mt-[10px] font-mono text-[12px] leading-[1.5]">{t.rich("listEmpty", { br: () => <br /> })}</p>
              </div>
            ) : (
              <div className="max-h-[460px] overflow-y-auto bm-scroll">
                {entrants.map((e, i) => (
                  <SrtRow
                    key={e.id}
                    index={i + 1}
                    entrant={e}
                    weighted={weighted}
                    won={wonNames.has(e.name)}
                    removeLabel={t("removeOne", { name: e.name })}
                    onRename={(name) => rename(e.id, name)}
                    onWeight={(w) => setWeight(e.id, w)}
                    onRemove={() => removeOne(e.id)}
                    weightLessLabel={t("weightLess")}
                    weightMoreLabel={t("weightMore")}
                  />
                ))}
              </div>
            )}
          </SrtPanel>
        </div>

        {/* RIGHT: draw stage */}
        <SrtPanel className="flex min-h-[420px] flex-col">
          <SrtPanelHead icon="target" title={stageTitle} right={draw ? <SrtSeedTag seed={draw.seed} seedLabel={t("seed")} copyLabel={t("copy")} copiedLabel={t("copied")} /> : undefined} />
          <div className="flex flex-1 flex-col p-[20px]">
            {entrants.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-[14px] p-[30px] text-center text-txt-dim">
                <span className="cut-seal cut-seal-edge [--cut-line:var(--line-2)] [--cut:14px] grid h-[76px] w-[76px] place-items-center border border-dashed border-line-2 text-line-2">
                  <Icon name="gift" size={34} />
                </span>
                <h3 className="font-display text-[20px] font-bold not-italic uppercase text-txt-muted">{t("blankTitle")}</h3>
                <p className="max-w-[34ch] font-mono text-[12px] leading-[1.5]">{t("blankText")}</p>
              </div>
            ) : phase === "setup" ? (
              <div className="flex flex-1 flex-col justify-center gap-[20px]">
                <div className="flex flex-wrap items-center gap-[14px] border border-line bg-panel-2 px-[18px] py-[16px]">
                  <span className="cut-seal cut-seal-edge [--cut-line:var(--accent-line)] [--cut:9px] grid h-[46px] w-[46px] flex-none place-items-center border border-accent-line bg-accent-soft text-accent">
                    <Icon name="users" size={22} />
                  </span>
                  <div className="min-w-0">
                    <b className="font-display text-[26px] font-extrabold italic leading-[0.9] text-txt">{pool.length}</b>
                    <span className="mt-[5px] block font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-txt-muted">{t("inDraw")}</span>
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
                {/* roster preview — fills the stage so the CTA isn't marooned at the bottom */}
                {pool.length > 0 && (
                  <div className="flex flex-wrap content-start justify-center gap-[8px]">
                    {pool.slice(0, 28).map((e) => (
                      <span key={e.id} className="inline-flex max-w-[190px] items-center gap-[8px] border border-line-2 bg-panel-2 px-[10px] py-[7px]">
                        <Avatar className="h-[24px] w-[24px] flex-none text-[10px]">{initialsOf(e.name)}</Avatar>
                        <span className="truncate font-mono text-[12px] text-txt-muted">{e.name}</span>
                      </span>
                    ))}
                    {pool.length > 28 && (
                      <span className="inline-flex items-center border border-line-2 bg-panel-2 px-[12px] py-[7px] font-mono text-[12px] font-semibold text-txt-dim">
                        +{pool.length - 28}
                      </span>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  disabled={pool.length === 0}
                  onClick={runDraw}
                  className="cut-corner [--cut-lg:14px] relative inline-flex w-full items-center justify-center gap-[12px] overflow-hidden border-0 p-[20px] font-display text-[22px] font-extrabold italic uppercase tracking-[0.03em] text-accent-ink transition-[filter,transform] [background:repeating-linear-gradient(-55deg,var(--accent)_0_14px,var(--accent-bright)_14px_28px)] enabled:hover:-translate-y-[2px] enabled:hover:brightness-[1.08] disabled:cursor-default disabled:bg-panel-2 disabled:bg-none disabled:text-txt-muted disabled:opacity-50 disabled:grayscale"
                >
                  <Icon name="bolt" size={20} className="flex-none" />
                  {effCount > 1 ? t("drawN", { n: effCount }) : t("drawOne")}
                  <Icon name="bolt" size={20} className="flex-none" />
                </button>
              </div>
            ) : phase === "spin" && draw ? (
              <div className="flex flex-1 flex-col justify-center">
                {/* v3 «Señal» spinner (reel physics + tick/win sound from useBaseSpinnerAnimation). */}
                <SpinnerAnimation
                  participants={draw.pool.map((e) => e.name)}
                  winner={draw.winners[0]?.name ?? null}
                  onComplete={onLand}
                />
              </div>
            ) : phase === "reveal" && draw ? (
              <div className="relative flex flex-1 flex-col">
                <SrtConfetti n={54} />
                <div className="mb-[18px] text-center">
                  <span className="inline-flex items-center gap-[7px] border border-accent-line px-[11px] py-[6px] font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
                    <Icon name="sparkles" size={12} />
                    {t("roundN", { n: history.length ? history[0].round : 1 })}
                  </span>
                  <h2 className="mt-[12px] text-[clamp(26px,3vw,38px)] leading-none">
                    {draw.winners.length > 1 ? t("winnersN", { n: draw.winners.length }) : t("gotWinner")}
                  </h2>
                </div>
                {draw.winners.length === 1 ? (
                  <div className="relative overflow-hidden pb-1 pt-2 text-center">
                    <div className="cut-seal cut-seal-edge [--cut-line:var(--accent-line)] [--cut:14px] mx-auto mb-[16px] grid h-[76px] w-[76px] place-items-center border border-accent-line bg-accent-soft text-accent">
                      <Icon name="trophy" size={36} />
                    </div>
                    <div className="inline-flex items-center gap-[14px]">
                      <Avatar accent className="h-[52px] w-[52px] text-[20px]">{initialsOf(draw.winners[0].name)}</Avatar>
                      <b className="break-words font-display text-[40px] font-extrabold italic leading-none text-accent">{draw.winners[0].name}</b>
                    </div>
                    <p className="mt-[12px] font-mono text-[12px] tracking-[0.04em] text-txt-muted">
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
                <div className="mt-[20px] flex flex-wrap justify-center gap-[10px] border-t border-line pt-[18px]">
                  <Button variant="pri" icon="bolt" onClick={drawAgain}>
                    {t("drawAgain")}
                  </Button>
                  <Button variant="default" icon="trash" onClick={removeDrawn}>
                    {t("removeContinue")}
                  </Button>
                  <Button variant="ghost" icon="copy" onClick={copyResult}>
                    {t("copyResult")}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </SrtPanel>
      </div>

      {/* ── history ────────────────────────────────────────────────────────── */}
      {history.length > 0 && (
        <SrtPanel className="mt-[18px]">
          <div className="flex items-center gap-[12px] border-b border-line px-[20px] py-[15px]">
            <h3 className="flex items-center gap-[10px] font-display text-[16px] font-bold not-italic uppercase tracking-[0.04em] text-txt">
              <Icon name="trophy" size={18} className="text-accent" />
              {t("historyTitle")}
            </h3>
            <Button className="ml-auto" variant="ghost" size="sm" icon="x" onClick={resetHistory}>
              {t("clearHistory")}
            </Button>
          </div>
          <div className="grid">
            {history.map((r) => (
              <div key={r.round + "-" + r.seed} className="flex items-center gap-[14px] border-b border-line px-[18px] py-[13px] last:border-b-0">
                <span className="cut-seal cut-seal-edge [--cut-line:var(--accent-line)] [--cut:8px] grid h-[40px] w-[40px] flex-none place-items-center border border-accent-line bg-accent-soft font-display text-[15px] font-extrabold italic text-accent">
                  #{r.round}
                </span>
                <div className="flex min-w-0 flex-1 flex-wrap gap-[7px]">
                  {r.winners.map((w, i) => (
                    <span key={i} className="inline-flex items-center gap-[7px] border border-line-2 bg-panel-2 px-[9px] py-[6px] font-mono text-[12px] font-semibold text-txt">
                      <Icon name="trophy" size={12} className="flex-none text-accent" />
                      {w.name}
                    </span>
                  ))}
                </div>
                <div className="grid flex-none gap-[4px] text-right">
                  <span className="font-mono text-[10px] text-txt-dim">
                    {t("seed")} <b className="text-txt-muted">#{r.seed}</b>
                  </span>
                  <time className="font-mono text-[10px] tracking-[0.06em] text-txt-dim">
                    {new Date(r.at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </time>
                </div>
              </div>
            ))}
          </div>
        </SrtPanel>
      )}
    </main>
  )
}
