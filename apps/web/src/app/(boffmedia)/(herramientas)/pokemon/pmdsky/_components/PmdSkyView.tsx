"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Button,
  Select,
  Field,
  Seg,
  Toggle,
  Disclosure,
  Banner,
  Kicker,
  OptionGroup,
  Icon,
} from "@/components/boffmedia/primitives"
import { getFloors } from "@/tools/pmd-sky/DungeonData"
import { useWmV3 } from "../_lib/useWmV3"
import { WmSection, WmStars, WmPokePicker, WmTicket, WmCombo } from "./ui/wm-kit"

export function PmdSkyView() {
  const t = useTranslations("")
  const tApp = useTranslations("pmdsky.app")
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
  const exportTxt = () => {
    const body = [
      `// WONDER MAIL S — ${region}`,
      ctx.codeText,
      "",
      summary.map((r) => `${r.k}: ${r.v}`).join("\n"),
    ].join("\n")
    const blob = new Blob([body], { type: "text/plain" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "wonder-mail.txt"
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      URL.revokeObjectURL(a.href)
      a.remove()
    }, 0)
  }

  const floorError = issues.find((i) => i.field === "floor")?.msg

  return (
    <div className="flex min-w-0 flex-col bg-base min-[961px]:h-[calc(100vh-var(--nav-h,66px))]">
      {/* ── top bar ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 flex flex-none flex-wrap items-end gap-5 border-b border-solid border-line bg-base px-[clamp(18px,2.4vw,40px)] py-4 max-[960px]:items-start">
        <div className="min-w-0 flex-1">
          <Kicker>{tApp("kicker")}</Kicker>
          <h1 className="mt-1 font-display text-[clamp(1.4rem,2.6vw,2rem)] font-extrabold not-italic uppercase leading-[1.02] tracking-[0.01em] text-txt">
            {tApp("title")}
          </h1>
        </div>
        <div className="flex flex-wrap items-end gap-[10px] max-[560px]:w-full max-[560px]:justify-between">
          <div className="grid gap-[6px]">
            <span className="font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.12em] text-txt-muted">
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
          </div>
          <Button size="sm" icon="refresh" onClick={randomize}>
            {tApp("randomize")}
          </Button>
          <Button size="sm" variant="ghost" icon="trash" onClick={reset}>
            {tApp("reset")}
          </Button>
        </div>
      </div>

      {/* ── body: builder + ticket ──────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-[clamp(18px,2.4vw,40px)] pb-[60px] pt-[22px]">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-start gap-[22px] min-[961px]:grid-cols-[minmax(0,1fr)_minmax(340px,400px)]">
          {/* CONSTRUCTOR */}
          <div className="flex min-w-0 flex-col gap-4">
            <WmSection
              n="01"
              icon="list"
              title={tApp("secType")}
              aside={<span className="max-w-[22ch] text-right font-mono text-[11px] leading-[1.3] text-txt-muted">{questLabel}</span>}
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
                <span className="inline-flex items-center gap-[9px]">
                  <WmStars n={difficulty} />
                  <span className="font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.1em] text-txt-muted">{diffLabel}</span>
                </span>
              }
            >
              <div className="grid grid-cols-2 gap-[14px] max-[560px]:grid-cols-1">
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
              <div className="grid grid-cols-2 gap-[14px] max-[560px]:grid-cols-1">
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
                  <div key={k} className="mt-[10px]">
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
              <div className="mt-3 grid grid-cols-2 gap-[14px] max-[560px]:grid-cols-1">
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
                  <div className="font-body text-[13px] font-semibold leading-[1.2] text-txt">{tApp("euTitle")}</div>
                  <div className="mt-[3px] font-body text-[12px] leading-[1.45] text-txt-dim">{tApp("euSub")}</div>
                </div>
                <Toggle on={form.europeanVersion} onChange={(v) => setEuropean(v)} />
              </div>
            </Disclosure>
          </div>

          {/* BILLETE + ACCIONES */}
          <aside className="min-w-0">
            <div className="flex flex-col gap-[14px] min-[961px]:sticky min-[961px]:top-[22px]">
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
                <div className="flex items-center gap-2 border-b border-solid border-line px-[14px] py-[11px] font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.12em] text-txt-muted">
                  <Icon name="list" size={13} />
                  {tApp("summaryHead")}
                </div>
                <dl className="m-0 px-[14px] py-[6px]">
                  {summary.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-baseline justify-between gap-3 border-b border-solid border-[color-mix(in_srgb,var(--line)_55%,transparent)] py-[7px] last:border-b-0"
                    >
                      <dt className="flex-none font-mono text-[11px] font-medium uppercase leading-[1.2] tracking-[0.06em] text-txt-dim">{r.k}</dt>
                      <dd className="m-0 min-w-0 text-right font-body text-[13px] font-semibold leading-[1.3] text-txt">{r.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {hasError && (
                <Banner tone="error" title={tApp("errorTitle")}>
                  {issues.find((i) => i.tone === "error")?.msg}
                </Banner>
              )}

              <div className="flex flex-col gap-[10px]">
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
                  <div className="grid grid-cols-2 gap-[10px]">
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
