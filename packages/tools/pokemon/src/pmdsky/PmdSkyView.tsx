"use client"

import * as React from "react"
import {
  Button,
  Select,
  Field,
  Seg,
  Toggle,
  Disclosure,
  Banner,
  OptionGroup,
  Icon,
  ToolHeader,
} from "@boffmedia/ui"
import { saveFile } from "@boffmedia/tool-kit"

import { PMDSKY_NS, useToolT } from "../i18n"
import { getFloors } from "./DungeonData"
import { useWmV3 } from "./useWmV3"
import { WmSection, WmStars, WmPokePicker, WmTicket, WmCombo } from "./wm-kit"

export function PmdSkyView() {
  // The package catalog merges both source files under one namespace (field
  // labels plus `questTypes.*` / `rewardTypes.*` beside `dungeons.*`), so one
  // bound translator serves all of them. A root translator here would make
  // every call site spell the namespace out again.
  const t = useToolT(PMDSKY_NS)
  const tApp = useToolT(`${PMDSKY_NS}.app`)
  const ctx = useWmV3(t, tApp)

  const {
    form, status, hasError, issues, summary, region, difficulty, diffLabel,
    questLabel, questOptions, subQuestData, dungeons, rewardTypes, items, floors, pokemon,
    isClientForced, clientIsTarget, targetActive, isItemQuest, rewardGivesItem, subActive,
    dungeonLabel, pokeLabel,
    setQuestType, setSubQuest, setDungeon, setFloor, setClient, setTarget,
    setRewardType, setTargetItem, setRewardItem, setEuropean,
    generate, randomize, reset,
  } = ctx

  const [shared, setShared] = React.useState(false)
  const share = () => {
    const text = summary.map((r) => `${r.k}: ${r.v}`).join(" · ") + (ctx.codeText ? `  —  ${ctx.codeText.replace(/\n/g, " ")}` : "")
    try {
      navigator.clipboard.writeText(text)
    } catch {
      /* noop */
    }
    setShared(true)
    setTimeout(() => setShared(false), 1600)
  }
  // Through the host capability rather than an anchor click: the launcher
  // webview cannot start a download, and this way the desktop gets its native
  // save dialog for free.
  const exportTxt = () => {
    const body = [
      `// WONDER MAIL S — ${region}`,
      ctx.codeText,
      "",
      summary.map((r) => `${r.k}: ${r.v}`).join("\n"),
    ].join("\n")
    void saveFile({
      suggestedName: "wonder-mail.txt",
      data: new Blob([body], { type: "text/plain" }),
      mimeType: "text/plain",
      filters: [{ name: "Text", extensions: ["txt"] }],
    })
  }

  const floorError = issues.find((i) => i.field === "floor")?.msg

  return (
    <div className="flex min-w-0 flex-col bg-base min-h-[var(--tool-vh,100%)]">
      {/* ── top bar. An App surface: it owns the viewport and carries a persistent
           region control, so it is a `bar`, and it sticks to `--tool-sticky-top`
           (via ToolStrip) rather than to a host-defined nav height. ─────────────────── */}
      <ToolHeader
        density="bar"
        icon="compass"
        title={tApp("title")}
        actions={
          <>
            <span className="flex items-center gap-2">
              <span className="font-mono text-[0.6875rem] font-semibold uppercase leading-none tracking-[0.12em] text-txt-muted">
                {tApp("region")}
              </span>
              <Seg
                value={form.europeanVersion ? "eu" : "us"}
                onChange={(v) => setEuropean(v === "eu")}
                options={[
                  { value: "us", label: tApp("regionIntl") },
                  { value: "eu", label: tApp("regionEU") },
                ]}
              />
            </span>
            <Button size="sm" icon="refresh" onClick={randomize}>
              {tApp("randomize")}
            </Button>
            <Button size="sm" variant="ghost" icon="trash" onClick={reset}>
              {tApp("reset")}
            </Button>
          </>
        }
      />

      {/* ── body: builder + ticket ──────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 px-[clamp(1.125rem,2.4vw,2.5rem)] pb-[3.75rem] pt-[1.375rem]">
        <div className="mx-auto grid max-w-[77.5rem] grid-cols-1 items-start gap-[1.375rem] min-[961px]:grid-cols-[minmax(0,1fr)_minmax(21.25rem,25rem)]">
          {/* CONSTRUCTOR */}
          <div className="flex min-w-0 flex-col gap-4">
            <WmSection
              n="01"
              icon="list"
              title={tApp("secType")}
              aside={<span className="max-w-[22ch] text-right font-mono text-[0.6875rem] leading-[1.3] text-txt-muted">{questLabel}</span>}
            >
              <OptionGroup
                options={questOptions}
                value={String(form.questType)}
                columns={4}
                ariaLabel={tApp("secType")}
                onChange={(v) => setQuestType(v as string)}
              />
              {subActive && (
                <div className="mt-3">
                  <Select
                    label={t("QUEST_SUBTYPE")}
                    value={String(form.specialQuestType)}
                    options={subQuestData}
                    onChange={setSubQuest}
                  />
                </div>
              )}
            </WmSection>

            <WmSection
              n="02"
              icon="globe"
              title={tApp("secLocation")}
              aside={
                <span className="inline-flex items-center gap-[0.5625rem]">
                  <WmStars n={difficulty} />
                  <span className="font-mono text-[0.625rem] font-semibold uppercase leading-none tracking-[0.1em] text-txt-muted">{diffLabel}</span>
                </span>
              }
            >
              <div className="grid grid-cols-2 gap-[0.875rem] max-[560px]:grid-cols-1">
                <Field label={t("DUNGEON")}>
                  <WmCombo
                    value={dungeonLabel(form.dungeon)}
                    placeholder={tApp("searchDungeon")}
                    ariaLabel={t("DUNGEON")}
                    getItems={(q) => dungeons.filter((d) => !q || d.label.toLowerCase().includes(q))}
                    itemKey={(it) => it.value}
                    onPick={(it) => setDungeon(it.value)}
                    renderItem={(it) => (
                      <>
                        <span>{it.label}</span>
                        <span className="tail">{getFloors(Number(it.value))}F</span>
                      </>
                    )}
                  />
                </Field>
                <Select
                  label={t("FLOOR")}
                  value={String(form.floor)}
                  options={floors}
                  onChange={setFloor}
                  error={floorError}
                />
              </div>
            </WmSection>

            <WmSection n="03" icon="users" title={tApp("secPokemon")}>
              <div className="grid grid-cols-2 gap-[0.875rem] max-[560px]:grid-cols-1">
                <WmPokePicker
                  label={t("CLIENT_POKEMON")}
                  valueLabel={pokeLabel(form.clientPokemon)}
                  sprite={form.clientSprite}
                  options={pokemon}
                  onPick={setClient}
                  disabled={isClientForced}
                  disabledReason={t("FORCED_BY_QUEST_TYPE")}
                  searchPlaceholder={tApp("searchPokemon")}
                />
                <WmPokePicker
                  label={t("TARGET_POKEMON")}
                  valueLabel={pokeLabel(form.targetPokemon)}
                  sprite={form.targetSprite}
                  options={pokemon}
                  onPick={setTarget}
                  disabled={!targetActive}
                  disabledReason={clientIsTarget ? t("CLIENT_IS_TARGET") : t("FORCED_BY_QUEST_TYPE")}
                  searchPlaceholder={tApp("searchPokemon")}
                />
              </div>
              {issues
                .filter((i) => i.field === "target")
                .map((i, k) => (
                  <div key={k} className="mt-[0.625rem]">
                    <Banner tone={i.tone}>{i.msg}</Banner>
                  </div>
                ))}
            </WmSection>

            <WmSection n="04" icon="trophy" title={tApp("secReward")}>
              <Select
                label={t("REWARD_TYPE")}
                value={String(form.rewardType)}
                options={rewardTypes}
                onChange={setRewardType}
              />
              <div className="mt-3 grid grid-cols-2 gap-[0.875rem] max-[560px]:grid-cols-1">
                <Select
                  label={t("TARGET_ITEM")}
                  value={String(form.targetItem)}
                  options={items}
                  onChange={setTargetItem}
                  disabled={!isItemQuest}
                  hint={!isItemQuest ? tApp("itemQuestOnly") : undefined}
                />
                <Select
                  label={t("REWARD_ITEM")}
                  value={String(form.rewardItem)}
                  options={items}
                  onChange={setRewardItem}
                  disabled={!rewardGivesItem}
                  hint={!rewardGivesItem ? tApp("rewardNoItem") : undefined}
                />
              </div>
            </WmSection>

            <Disclosure title={tApp("advanced")} icon="settings" sub={tApp("advancedSub")}>
              <div className="flex items-center gap-4 py-1">
                <div className="min-w-0 flex-1">
                  <div className="font-body text-[0.8125rem] font-semibold leading-[1.2] text-txt">{tApp("euTitle")}</div>
                  <div className="mt-[3px] font-body text-[0.75rem] leading-[1.45] text-txt-dim">{tApp("euSub")}</div>
                </div>
                <Toggle
                  on={form.europeanVersion}
                  onChange={(v) => setEuropean(v)}
                  ariaLabel={tApp("euTitle")}
                />
              </div>
            </Disclosure>
          </div>

          {/* BILLETE + ACCIONES */}
          <aside className="min-w-0">
            <div className="flex flex-col gap-[0.875rem] min-[961px]:sticky min-[961px]:top-[1.375rem]">
              <WmTicket
                status={status}
                codeLines={ctx.codeLines}
                codeText={ctx.codeText}
                region={region}
                label={tApp("mailLabel")}
                codeLabel={tApp("codeLabel")}
                emptyTitle={tApp("emptyTitle")}
                emptyText={tApp("emptyText")}
                loadingTitle={tApp("loadingTitle")}
                loadingText={tApp("loadingText")}
                readyHint={tApp("readyHint")}
              />

              <div className="border border-solid border-line bg-panel">
                <div className="flex items-center gap-2 border-b border-solid border-line px-[0.875rem] py-[0.6875rem] font-mono text-[0.625rem] font-semibold uppercase leading-none tracking-[0.12em] text-txt-muted">
                  <Icon name="list" size={13} />
                  {tApp("summaryHead")}
                </div>
                <dl className="m-0 px-[0.875rem] py-[0.375rem]">
                  {summary.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-baseline justify-between gap-3 border-b border-solid border-[color-mix(in_srgb,var(--line)_55%,transparent)] py-[0.4375rem] last:border-b-0"
                    >
                      <dt className="flex-none font-mono text-[0.6875rem] font-medium uppercase leading-[1.2] tracking-[0.06em] text-txt-dim">{r.k}</dt>
                      <dd className="m-0 min-w-0 text-right font-body text-[0.8125rem] font-semibold leading-[1.3] text-txt">{r.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {hasError && (
                <Banner tone="error" title={tApp("errorTitle")}>
                  {issues.find((i) => i.tone === "error")?.msg}
                </Banner>
              )}

              <div className="flex flex-col gap-[0.625rem]">
                <Button
                  variant="pri"
                  icon={status === "loading" ? "refresh" : "bolt"}
                  disabled={hasError || status === "loading"}
                  onClick={generate}
                  className="w-full justify-center"
                >
                  {status === "ready" ? tApp("regenerate") : status === "loading" ? tApp("generating") : tApp("generate")}
                </Button>
                {status === "ready" && (
                  <div className="grid grid-cols-2 gap-[0.625rem]">
                    <Button size="sm" icon={shared ? "check" : "link"} onClick={share} className="justify-center">
                      {shared ? tApp("copied") : tApp("share")}
                    </Button>
                    <Button size="sm" icon="download" onClick={exportTxt} className="justify-center">
                      {tApp("export")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
