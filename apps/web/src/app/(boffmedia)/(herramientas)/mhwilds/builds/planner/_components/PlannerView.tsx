"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Icon, toast } from "@/components/boffmedia/primitives"
import { EquipmentType, Weapon, ArmorPiece, Charm, Decoration, MhMonster } from "@/types/tools/mhwilds"
import { MhApp, MhBody, MhWrap } from "../../../_components/ui/mh-kit"
import { weaponAttack } from "../../../_components/mh-helpers"
import { useGameData } from "../_hooks/useGameData"
import { useBuildState } from "../_hooks/useBuildState"
import { calculateStats, calculateTotalSkills } from "../_utils/calculationUtils"
import { importBuildFromUrl, generateShareableLink, exportBuildAsJson, saveBuildToLocalStorage } from "../_utils/buildUtils"
import { PlannerBar } from "./PlannerBar"
import { Loadout } from "./Loadout"
import { Summary } from "./Summary"
import { PlannerCompare } from "./PlannerCompare"
import { TargetPanel } from "./TargetPanel"
import { TargetDrawer } from "./TargetDrawer"
import { SkillSearchDrawer, type SkillSource } from "./SkillSearchDrawer"
import { EquipDrawer, DecoDrawer, SavedDrawer, IoDrawer } from "./drawers"

export type SlotDef = { key: EquipmentType; icon: "sword" | "shield" | "sparkles"; kind: EquipmentType | "weapon" | "charm"; labelKey: string }

export const SLOTS: SlotDef[] = [
  { key: "weapon", icon: "sword", kind: "weapon", labelKey: "weapon" },
  { key: "secondaryWeapon", icon: "sword", kind: "weapon", labelKey: "secondaryWeapon" },
  { key: "head", icon: "shield", kind: "head", labelKey: "head" },
  { key: "chest", icon: "shield", kind: "chest", labelKey: "chest" },
  { key: "arms", icon: "shield", kind: "arms", labelKey: "arms" },
  { key: "waist", icon: "shield", kind: "waist", labelKey: "waist" },
  { key: "legs", icon: "shield", kind: "legs", labelKey: "legs" },
  { key: "charm", icon: "sparkles", kind: "charm", labelKey: "charm" },
]

type Drawer =
  | { type: "equip"; slot: EquipmentType }
  | { type: "deco"; slot: EquipmentType; idx: number; size: number }
  | { type: "saved" }
  | { type: "io" }
  | { type: "target" }
  | { type: "skillsearch" }
  | null

export function PlannerView() {
  const t = useTranslations("mhwilds")
  const {
    skills: skillsData, weapons, armor, charms, decorations,
    loadingWeapons, loadingArmor, loadingCharms, loadingDecorations,
    getWeaponById, getArmorById, getDecorationById, getCharmById,
  } = useGameData()

  const {
    currentBuild, setCurrentBuild, buildWithFullObjects,
    handleSwapWeapons, handleReset,
  } = useBuildState({ getWeaponById, getArmorById, getDecorationById, getCharmById })

  const [drawer, setDrawer] = useState<Drawer>(null)
  const [mode, setMode] = useState<"build" | "compare">("build")
  const [targetMon, setTargetMon] = useState<MhMonster | null>(null)
  const isLoading = loadingWeapons || loadingArmor || loadingDecorations || loadingCharms

  useEffect(() => {
    const imported = importBuildFromUrl(t("build_planner.defaultBuildName"))
    if (imported) setCurrentBuild(imported)
  }, [setCurrentBuild])

  const stats = useMemo(() => calculateStats(buildWithFullObjects), [buildWithFullObjects])
  const skills = useMemo(() => calculateTotalSkills(buildWithFullObjects, skillsData), [buildWithFullObjects, skillsData])
  const filled = SLOTS.filter((s) => buildWithFullObjects[s.key]).length
  const wp = buildWithFullObjects.weapon

  const equipmentBySlot = (slot: EquipmentType): (Weapon | ArmorPiece | Charm)[] => {
    if (slot === "weapon" || slot === "secondaryWeapon") return weapons
    if (slot === "charm") return charms
    return armor.filter((a) => a.kind === slot)
  }

  // ── mutations ───────────────────────────────────────────────────────────────
  const equip = (slot: EquipmentType, item: Weapon | ArmorPiece | Charm | null) => {
    const idKey = slot === "charm" ? "charmId" : `${slot}Id`
    const decos = currentBuild.decorations.filter((d) => d.equipmentType !== slot)
    setCurrentBuild({ ...currentBuild, [idKey]: item ? String(item.id) : null, decorations: decos })
    setDrawer(null)
  }
  const setDeco = (slot: EquipmentType, idx: number, deco: Decoration | null) => {
    const decos = currentBuild.decorations.filter((d) => !(d.equipmentType === slot && d.slotIndex === idx))
    if (deco) decos.push({ equipmentType: slot, slotIndex: idx, decorationId: String(deco.id) })
    setCurrentBuild({ ...currentBuild, decorations: decos })
    setDrawer(null)
  }

  // equip a skill source from the reverse-search: armor/charm into its slot, a
  // decoration into the first equipped piece with a free slot big enough.
  const equipSource = (src: SkillSource) => {
    if (src.kind === "armor") return equip(src.slot, src.item)
    if (src.kind === "charm") return equip("charm", src.item)
    for (const s of SLOTS) {
      const item = buildWithFullObjects[s.key] as { slots?: number[] } | null
      const slots = item?.slots || []
      for (let idx = 0; idx < slots.length; idx++) {
        const free = !currentBuild.decorations.some((d) => d.equipmentType === s.key && d.slotIndex === idx)
        if (slots[idx] >= src.decoSlot && free) return setDeco(s.key, idx, src.item)
      }
    }
    toast.error(t("build_planner.skillsearch.no_slot"))
  }

  const onSave = () => {
    try { saveBuildToLocalStorage(currentBuild); toast.success(t("build_planner.saved_local", { key: "" })) }
    catch { toast.error(t("build_planner.error_saving")) }
  }
  const onShare = () => {
    try { navigator.clipboard.writeText(generateShareableLink(currentBuild)); toast.success(t("build_planner.link_copied", { url: "" })) }
    catch { toast.error(t("build_planner.error_link")) }
  }
  const onExport = () => {
    try { exportBuildAsJson(currentBuild); toast.success(t("build_planner.exported_json", { fileName: currentBuild.name })) }
    catch { toast.error(t("build_planner.error_exporting")) }
  }

  return (
    <MhApp>
      <PlannerBar
        name={currentBuild.name}
        onName={(name) => setCurrentBuild({ ...currentBuild, name })}
        filled={filled}
        total={SLOTS.length}
        skillCount={skills.length}
        mode={mode}
        onMode={(m) => setMode(m === "compare" ? "compare" : "build")}
        onOpenSaved={() => setDrawer({ type: "saved" })}
        onIo={() => setDrawer({ type: "io" })}
        onShare={onShare}
        onReset={() => { handleReset(); toast(t("build_planner.reset")) }}
        onSave={onSave}
      />

      <MhBody>
        <MhWrap>
          {mode === "compare" ? (
            <PlannerCompare
              currentBuild={currentBuild}
              resolvers={{ getWeaponById, getArmorById, getDecorationById, getCharmById }}
              skillsData={skillsData}
              onBack={() => setMode("build")}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(330px,380px)] gap-4 items-start">
              <div className="flex flex-col gap-4">
                <Loadout
                  slots={SLOTS}
                  build={buildWithFullObjects}
                  filled={filled}
                  total={SLOTS.length}
                  skills={skills.length}
                  attack={weaponAttack(wp)}
                  defense={stats.defenseMin}
                  onSwap={handleSwapWeapons}
                  onOpenEquip={(slot) => setDrawer({ type: "equip", slot })}
                  onOpenDeco={(slot, idx, size) => setDrawer({ type: "deco", slot, idx, size })}
                  onClearDeco={(slot, idx) => setDeco(slot, idx, null)}
                />
                <button
                  type="button"
                  onClick={() => setDrawer({ type: "skillsearch" })}
                  className="flex w-full items-center gap-3 border border-line bg-panel px-3.5 py-3 text-left transition-colors cut-corner hover:border-[var(--mh)]"
                >
                  <Icon name="search" size={16} className="shrink-0 text-[var(--mh-bright)]" />
                  <span className="grid min-w-0 gap-0.5">
                    <b className="font-display text-[14px] leading-tight font-bold uppercase">{t("build_planner.skillsearch.ctaTitle")}</b>
                    <span className="font-mono text-[11px] leading-none text-txt-muted">{t("build_planner.skillsearch.ctaLead")}</span>
                  </span>
                  <Icon name="chevronRight" size={15} className="ml-auto shrink-0 text-txt-dim" />
                </button>
              </div>
              <div className="flex flex-col gap-3.5 lg:sticky lg:top-[74px]">
                <TargetPanel
                  target={targetMon}
                  weapons={weapons}
                  currentWeaponId={currentBuild.weaponId}
                  onPick={() => setDrawer({ type: "target" })}
                  onClear={() => setTargetMon(null)}
                  onEquipWeapon={(id) => equip("weapon", getWeaponById(id))}
                />
                <Summary stats={stats} skills={skills} skillsData={skillsData} weapon={wp} />
              </div>
            </div>
          )}
        </MhWrap>
      </MhBody>

      {drawer?.type === "equip" && (
        <EquipDrawer
          slot={drawer.slot}
          items={equipmentBySlot(drawer.slot)}
          current={buildWithFullObjects[drawer.slot]}
          isLoading={isLoading}
          onPick={(item) => equip(drawer.slot, item)}
          onRemove={() => equip(drawer.slot, null)}
          onClose={() => setDrawer(null)}
        />
      )}
      {drawer?.type === "deco" && (
        <DecoDrawer
          slot={drawer.slot}
          idx={drawer.idx}
          size={drawer.size}
          decorations={decorations}
          current={buildWithFullObjects.decorations.find((d) => d.equipmentType === drawer.slot && d.slotIndex === drawer.idx)?.decoration || null}
          onPick={(d) => setDeco(drawer.slot, drawer.idx, d)}
          onClose={() => setDrawer(null)}
        />
      )}
      {drawer?.type === "saved" && (
        <SavedDrawer
          onLoad={(b) => { setCurrentBuild(b); setDrawer(null); toast.success(t("build_planner.build_loaded", { name: b.name })) }}
          onSaveCurrent={() => { onSave() }}
          onClose={() => setDrawer(null)}
        />
      )}
      {drawer?.type === "io" && (
        <IoDrawer
          build={currentBuild}
          onImport={(b) => { setCurrentBuild(b); setDrawer(null); toast.success(t("build_planner.build_loaded", { name: b.name })) }}
          onShare={onShare}
          onExport={onExport}
          onClose={() => setDrawer(null)}
        />
      )}
      {drawer?.type === "target" && (
        <TargetDrawer
          onPick={(m) => { setTargetMon(m); setDrawer(null) }}
          onClose={() => setDrawer(null)}
        />
      )}
      {drawer?.type === "skillsearch" && (
        <SkillSearchDrawer
          armor={armor}
          charms={charms}
          decorations={decorations}
          onEquip={equipSource}
          onClose={() => setDrawer(null)}
        />
      )}
    </MhApp>
  )
}
