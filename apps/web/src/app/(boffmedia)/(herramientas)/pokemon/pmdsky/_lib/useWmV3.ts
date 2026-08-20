"use client"

import * as React from "react"
import type { IconName } from "@boffmedia/ui"
import { useFormStore, type SkyFormData } from "@/tools/pmd-sky/store"
import { useSkyFormHandlers } from "@/tools/pmd-sky/_hooks"
import { generateWonderMail } from "@/tools/pmd-sky/Generate"
import {
  missionTypes,
  getQuestData,
  getSubQuestData,
  getRewardTypes,
  getForceClient,
  getClientIsTarget,
  getUseTargetItem,
  givesItem,
} from "@/tools/pmd-sky/QuestData"
import { getValidDungeons, getFloors } from "@/tools/pmd-sky/DungeonData"
import { getValidPokemon } from "@/tools/pmd-sky/PokemonData"
import { getItemData } from "@/tools/pmd-sky/ItemData"

type Tr = (key: string) => string

export type WmStatus = "empty" | "loading" | "ready"
export interface WmIssue {
  tone: "warn" | "error"
  field: string
  msg: string
}

/** Icon per real quest mainType (missionTypes: 0–9, 11, 12). */
const QUEST_ICON: Record<number, IconName> = {
  0: "shield",
  1: "shield",
  2: "search",
  3: "globe",
  4: "search",
  5: "users",
  6: "search",
  7: "mail",
  8: "search",
  9: "target",
  11: "sword",
  12: "trophy",
}

function diffFromFloors(f: number): number {
  if (f <= 5) return 1
  if (f <= 9) return 2
  if (f <= 13) return 3
  if (f <= 18) return 4
  return 5
}

function formatCode(code: string): string[] {
  // The real generator already returns a `\n`-delimited multi-row code.
  return code.split("\n")
}

// v3 «Señal» ctx over the REAL engine (store + generateWonderMail + real data).
export function useWmV3(t: Tr, tApp: Tr) {
  const { formData: f, setFormData } = useFormStore()
  const h = useSkyFormHandlers({ generateMail: () => {}, clearMail: () => {} })

  const [status, setStatus] = React.useState<WmStatus>("empty")
  const [code, setCode] = React.useState<string | null>(null)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── real, localized catalogs ────────────────────────────────────────────────
  const questData = React.useMemo(() => getQuestData(t), [t])
  const rewardTypes = React.useMemo(() => getRewardTypes(t), [t])
  // Dungeon names live one level deeper than the rest of the catalog
  // (`pmdsky.dungeons.<id>`), so they need their own key prefix.
  const dungeons = React.useMemo(() => getValidDungeons((key) => t(`dungeons.${key}`)), [t])
  const items = React.useMemo(() => getItemData(), [])
  const pokemon = React.useMemo(() => getValidPokemon(t("selectPokemon")).filter((o) => o.value !== "0"), [t])
  const subQuestData = React.useMemo(() => getSubQuestData(f.questType, t), [f.questType, t])

  // ── derived ─────────────────────────────────────────────────────────────────
  const quest = missionTypes.find((m) => m.mainType === f.questType)
  const questLabel = quest ? t(`questTypes.${quest.name}`) : ""
  const questIcon: IconName = QUEST_ICON[f.questType] ?? "list"

  const isClientForced = getForceClient(f.questType, f.specialQuestType) > 0
  const clientIsTarget = getClientIsTarget(f.questType)
  const targetActive = !isClientForced && !clientIsTarget
  const isItemQuest = getUseTargetItem(f.questType)
  const rewardGivesItem = givesItem(f.rewardType)
  const subActive = subQuestData.length > 0

  const maxFloors = getFloors(f.dungeon)
  const floors = React.useMemo(
    () => Array.from({ length: Math.max(1, maxFloors) }, (_, i) => ({ value: String(i + 1), label: `${i + 1}F` })),
    [maxFloors],
  )
  const difficulty = diffFromFloors(maxFloors)
  const diffLabel = tApp(`diff.${difficulty}`)
  const region = f.europeanVersion ? tApp("regionEU") : tApp("regionIntl")

  const dungeonLabel = (v: number) => dungeons.find((d) => d.value === String(v))?.label ?? "—"
  const pokeLabel = (v: number) => pokemon.find((p) => p.value === String(v))?.label ?? (v === 0 ? "" : "—")
  const itemLabel = (v: number) => items.find((it) => it.value === String(v))?.label ?? "—"
  const rewardLabel = () => rewardTypes.find((r) => r.value === String(f.rewardType))?.label ?? "—"

  // ── validation ──────────────────────────────────────────────────────────────
  const issues = React.useMemo<WmIssue[]>(() => {
    const out: WmIssue[] = []
    if (f.clientPokemon === 0) out.push({ tone: "error", field: "client", msg: tApp("needClient") })
    if (f.floor > maxFloors) out.push({ tone: "error", field: "floor", msg: tApp("floorExceeds") })
    if (targetActive && f.clientPokemon !== 0 && f.clientPokemon === f.targetPokemon && (f.questType === 0 || f.questType === 1))
      out.push({ tone: "warn", field: "target", msg: tApp("sameMon") })
    return out
  }, [f.clientPokemon, f.floor, f.targetPokemon, f.questType, maxFloors, targetActive, tApp])
  const hasError = issues.some((i) => i.tone === "error")

  // ── readable summary ────────────────────────────────────────────────────────
  const summary = React.useMemo(() => {
    const rows: { k: string; v: string }[] = [
      { k: tApp("sumMission"), v: questLabel || "—" },
      { k: tApp("sumDungeon"), v: `${dungeonLabel(f.dungeon)} · ${f.floor}F` },
      { k: tApp("sumClient"), v: pokeLabel(f.clientPokemon) || "—" },
    ]
    if (targetActive) rows.push({ k: tApp("sumTarget"), v: pokeLabel(f.targetPokemon) || "—" })
    if (isItemQuest) rows.push({ k: tApp("sumItem"), v: itemLabel(f.targetItem) })
    rows.push({ k: tApp("sumReward"), v: rewardLabel() })
    if (rewardGivesItem) rows.push({ k: tApp("sumPrize"), v: itemLabel(f.rewardItem) })
    return rows
  }, [f, questLabel, targetActive, isItemQuest, rewardGivesItem, tApp, dungeons, pokemon, items, rewardTypes])

  // invalidate a generated code whenever a meaningful input changes
  const sig = [
    f.questType, f.specialQuestType, f.dungeon, f.floor, f.clientPokemon,
    f.targetPokemon, f.rewardType, f.targetItem, f.rewardItem, f.europeanVersion,
  ].join("|")
  React.useEffect(() => {
    setStatus("empty")
    setCode(null)
    if (timer.current) clearTimeout(timer.current)
  }, [sig])

  // ── actions ─────────────────────────────────────────────────────────────────
  const generate = () => {
    if (hasError) return
    setStatus("loading")
    setCode(null)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const mail = generateWonderMail(f)
      if (mail) {
        setCode(mail)
        setStatus("ready")
      } else {
        setStatus("empty")
      }
    }, 560)
  }

  const rnd = <X,>(arr: X[]): X => arr[Math.floor(Math.random() * arr.length)]
  const randomize = () => {
    const dNum = Number(rnd(dungeons).value)
    const mf = getFloors(dNum)
    setFormData({
      questType: rnd([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
      specialQuestType: 0,
      forceClient: 0,
      forceTarget: 0,
      dungeon: dNum,
      floor: 1 + Math.floor(Math.random() * mf),
      clientPokemon: Number(rnd(pokemon).value),
      targetPokemon: Number(rnd(pokemon).value),
      rewardType: rnd([0, 1, 2, 3, 4, 5, 6]),
      targetItem: Number(rnd(items).value),
      rewardItem: Number(rnd(items).value),
    })
  }
  const reset = () =>
    setFormData({
      questType: 0, specialQuestType: 0, forceClient: 0, forceTarget: 0,
      dungeon: 1, floor: 1, clientPokemon: 0, targetPokemon: 0,
      rewardType: 0, targetItem: 0, rewardItem: 0, clientSprite: "", targetSprite: "",
    } as Partial<SkyFormData>)

  return {
    form: f,
    // setters (real handlers)
    setQuestType: h.handleQuestTypeChange,
    setSubQuest: h.handleSubQuestChange,
    setDungeon: (v: string) => h.handleFieldChange("dungeon")(v),
    setFloor: (v: string) => h.handleFieldChange("floor")(v),
    setClient: (v: string) => h.handleFieldChange("clientPokemon")(v),
    setTarget: (v: string) => h.handleFieldChange("targetPokemon")(v),
    setRewardType: (v: string) => h.handleFieldChange("rewardType")(v),
    setTargetItem: h.handleItemChange("targetItem"),
    setRewardItem: h.handleItemChange("rewardItem"),
    setEuropean: (b: boolean) => h.handleEuropeanVersionChange(b),
    // catalogs
    questData, questOptions: questData.map((q) => ({ value: q.value, label: q.label, icon: QUEST_ICON[Number(q.value)] as IconName })),
    rewardTypes, dungeons, items, pokemon, subQuestData, floors,
    // derived
    questLabel, questIcon, isClientForced, clientIsTarget, targetActive, isItemQuest,
    rewardGivesItem, subActive, difficulty, diffLabel, region, maxFloors,
    dungeonLabel, pokeLabel,
    issues, hasError, summary,
    // result
    status, code, codeText: code ?? "", codeLines: code ? formatCode(code) : [],
    // actions
    generate, randomize, reset,
  }
}
