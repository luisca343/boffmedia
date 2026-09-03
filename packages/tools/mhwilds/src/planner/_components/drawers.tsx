"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useToolT } from "../../i18n"
import { Button, Empty, Icon, Select, Spinner } from "@boffmedia/ui"
import { ArmorPiece, BuildDataWithIds, Charm, Decoration, EquipmentType, Weapon } from "../../types"
import {
  MhDrawer, MhItem, MhRarity, MhTag, MhSlotPips, MhTypeChip, MhSearch, MhLabel,
} from "../../ui/mh-kit"
import { WEAPON_TYPES, weaponAttack } from "../../ui/mh-helpers"
import { getSavedBuilds, loadBuildFromLocalStorage, deleteBuildFromLocalStorage } from "../_utils/buildUtils"

type Item = Weapon | ArmorPiece | Charm
const isWeaponSlot = (s: EquipmentType) => s === "weapon" || s === "secondaryWeapon"

function itemSkills(item: any): string[] {
  return (item.skills || [])
    .map((s: any) => { const n = s.skill?.name || s.name; return n ? `${n} +${s.level}` : null })
    .filter(Boolean)
}

// ── equipment selector ────────────────────────────────────────────────────────
export function EquipDrawer({
  slot, items, current, isLoading, onPick, onRemove, onClose,
}: {
  slot: EquipmentType; items: Item[]; current: Item | null; isLoading: boolean
  onPick: (item: Item) => void; onRemove: () => void; onClose: () => void
}) {
  const t = useToolT("tools.mhwilds")
  const [q, setQ] = useState("")
  const [rar, setRar] = useState("all")
  const [type, setType] = useState("all")

  const typesPresent = useMemo(() => {
    if (!isWeaponSlot(slot)) return []
    const set = new Set(items.map((i) => (i as Weapon).kind))
    return WEAPON_TYPES.filter((k) => set.has(k))
  }, [items, slot])

  const list = useMemo(() => {
    let out = [...items]
    const term = q.trim().toLowerCase()
    if (term) out = out.filter((i) => i.name.toLowerCase().includes(term) || itemSkills(i).some((s) => s.toLowerCase().includes(term)))
    if (rar !== "all") out = out.filter((i) => i.rarity === +rar)
    if (isWeaponSlot(slot) && type !== "all") out = out.filter((i) => (i as Weapon).kind === type)
    return out.sort((a, b) => a.rarity - b.rarity)
  }, [items, q, rar, type, slot])

  const label = t(slot === "secondaryWeapon" ? "secondaryWeapon" : slot)
  const rarOptions = [{ value: "all", label: t("tree.allRarity") }, ...[1, 2, 3, 4, 5, 6, 7, 8].map((r) => ({ value: String(r), label: `${t("rarity")} ${r}` }))]

  return (
    <MhDrawer
      iconName={isWeaponSlot(slot) ? "sword" : slot === "charm" ? "sparkles" : "shield"}
      title={`${t("build_planner.select")} ${label.toLowerCase()}`}
      sub={t("build_planner.optionsCount", { count: list.length })}
      onClose={onClose}
      tools={
        <>
          <div className="flex gap-2 items-center">
            <MhSearch value={q} onChange={setQ} placeholder={t("build_planner.search")} />
            {current && <Button size="sm" variant="ghost" icon="x" onClick={onRemove}>{t("build_planner.remove")}</Button>}
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <Select ariaLabel={t("rarity")} value={rar} onChange={setRar} options={rarOptions} className="min-w-[8.125rem]" />
            {isWeaponSlot(slot) && (
              <div className="flex gap-1.5 flex-wrap">
                <MhTypeChip label={t("build_planner.all")} on={type === "all"} onClick={() => setType("all")} />
                {typesPresent.map((k) => <MhTypeChip key={k} label={t(`weapons.${k}`)} on={type === k} onClick={() => setType(k)} />)}
              </div>
            )}
          </div>
        </>
      }
    >
      {isLoading ? (
        <div className="h-[18.75rem] grid place-items-center"><Spinner /></div>
      ) : list.length === 0 ? (
        <Empty icon="search" title={t("build_planner.no_results")} lead={t("build_planner.no_equipment_found")} />
      ) : (
        <div className="flex flex-col gap-[0.4375rem]">
          {list.map((item) => {
            const active = current?.id === item.id
            const skills = itemSkills(item)
            const stat = isWeaponSlot(slot)
              ? <><b className="text-txt">{t("attack")} {weaponAttack(item as Weapon)}</b><br />{(item as Weapon).affinity >= 0 ? "+" : ""}{(item as Weapon).affinity}%</>
              : slot === "charm" ? <b className="text-txt">{t("rarity")} {item.rarity}</b>
              : <b className="text-txt">{t("def")} {(item as ArmorPiece).defense?.base}</b>
            return (
              <MhItem key={item.id} active={active} onPick={() => onPick(item)}>
                <MhRarity rarity={item.rarity} />
                <span className="min-w-0">
                  <span className="block font-body text-[0.875rem] leading-tight truncate font-semibold">{item.name}</span>
                  {skills.length > 0 && <span className="flex flex-wrap gap-1 mt-[0.3125rem]">{skills.map((s) => <MhTag key={s} sk>{s}</MhTag>)}</span>}
                </span>
                <span className="text-right font-mono text-[0.75rem] leading-[1.4] text-txt-muted flex-none whitespace-nowrap">
                  {stat}
                  {(item as any).slots?.some((x: number) => x > 0) && <MhSlotPips slots={(item as any).slots} />}
                </span>
              </MhItem>
            )
          })}
        </div>
      )}
    </MhDrawer>
  )
}

// ── decoration selector ───────────────────────────────────────────────────────
export function DecoDrawer({
  slot, idx, size, decorations, current, onPick, onClose,
}: {
  slot: EquipmentType; idx: number; size: number; decorations: Decoration[]; current: Decoration | null
  onPick: (d: Decoration | null) => void; onClose: () => void
}) {
  const t = useToolT("tools.mhwilds")
  const [q, setQ] = useState("")

  const list = useMemo(() => {
    let out = decorations.filter((d) => d.slot <= size)
    out = out.filter((d) => { if (!d.kind) return true; if (d.kind === "weapon") return slot === "weapon" || slot === "secondaryWeapon"; if (d.kind === "armor") return slot !== "weapon" && slot !== "secondaryWeapon"; return true })
    const term = q.trim().toLowerCase()
    if (term) out = out.filter((d) => d.name.toLowerCase().includes(term) || d.skills.some((s) => s.skill.name.toLowerCase().includes(term)))
    return out.sort((a, b) => (a.slot !== b.slot ? b.slot - a.slot : b.rarity - a.rarity))
  }, [decorations, size, slot, q])

  return (
    <MhDrawer
      iconName="puzzle"
      title={t("build_planner.deco_level", { size })}
      sub={t("build_planner.compatibleCount", { count: list.length })}
      onClose={onClose}
      tools={
        <div className="flex gap-2 items-center">
          <MhSearch value={q} onChange={setQ} placeholder={t("build_planner.search")} />
          {current && <Button size="sm" variant="ghost" icon="x" onClick={() => onPick(null)}>{t("build_planner.remove")}</Button>}
        </div>
      }
    >
      {list.length === 0 ? (
        <Empty icon="search" title={t("build_planner.no_decorations_found")} lead={t("build_planner.no_decorations_found")} />
      ) : (
        <div className="flex flex-col gap-[0.4375rem]">
          {list.map((d) => {
            const active = current?.id === d.id
            const skills = d.skills.map((s) => `${s.skill.name} +${s.level}`)
            return (
              <MhItem key={d.id} active={active} onPick={() => onPick(d)}>
                <span className="w-9 h-9 grid place-items-center flex-none rotate-45 border border-[var(--mh-line)] text-[var(--mh-bright)]"><span className="-rotate-45 font-mono text-[0.8125rem] font-bold">{d.slot}</span></span>
                <span className="min-w-0">
                  <span className="block font-body text-[0.875rem] leading-tight truncate font-semibold">{d.name}</span>
                  <span className="flex flex-wrap gap-1 mt-[0.3125rem]">{skills.map((s) => <MhTag key={s} sk>{s}</MhTag>)}</span>
                </span>
                <span className="text-right flex-none"><MhRarity rarity={d.rarity} /></span>
              </MhItem>
            )
          })}
        </div>
      )}
    </MhDrawer>
  )
}

// ── saved builds ──────────────────────────────────────────────────────────────
export function SavedDrawer({
  onLoad, onSaveCurrent, onClose,
}: { onLoad: (b: BuildDataWithIds) => void; onSaveCurrent: () => void; onClose: () => void }) {
  const t = useToolT("tools.mhwilds")
  const [builds, setBuilds] = useState(() => getSavedBuilds())
  const [q, setQ] = useState("")
  const [confirm, setConfirm] = useState<string | null>(null)

  const filtered = builds.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()))
  const del = (key: string) => { if (deleteBuildFromLocalStorage(key)) { setBuilds((bs) => bs.filter((b) => b.key !== key)); setConfirm(null) } }
  const load = (key: string) => { const b = loadBuildFromLocalStorage(key); if (b) onLoad(b) }

  return (
    <MhDrawer
      iconName="bookmark"
      title={t("build_planner.saved_builds")}
      sub={t("build_planner.build_count", { count: builds.length })}
      onClose={onClose}
      tools={<MhSearch value={q} onChange={setQ} placeholder={t("build_planner.search_builds")} />}
    >
      {filtered.length === 0 ? (
        <Empty icon="bookmark" title={t("build_planner.no_saved_builds")} lead={t("build_planner.saved_builds_description")}>
          <Button size="sm" variant="pri" icon="download" onClick={onSaveCurrent}>{t("build_planner.save_current")}</Button>
        </Empty>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filtered.map((b) => (
            <div key={b.key} className="grid grid-cols-[1fr_auto] items-center gap-2 py-[0.5625rem] px-[0.6875rem] bg-base-2 border border-line">
              <button type="button" onClick={() => load(b.key)} className="min-w-0 text-left font-body text-[0.8125rem] leading-tight font-semibold truncate cursor-pointer bg-transparent border-0 p-0" title={b.name}>{b.name}</button>
              <span className="flex gap-1 items-center flex-none">
                {confirm === b.key ? (
                  <>
                    <Button size="sm" variant="danger" onClick={() => del(b.key)}>{t("build_planner.confirm")}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>{t("build_planner.cancel")}</Button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => setConfirm(b.key)} aria-label={t("build_planner.remove")} className="text-txt-dim hover:text-bad grid place-items-center p-1"><Icon name="trash" size={15} /></button>
                    <Button size="sm" icon="download" onClick={() => load(b.key)}>{t("build_planner.load")}</Button>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </MhDrawer>
  )
}

// ── import / export ───────────────────────────────────────────────────────────
export function IoDrawer({
  build, onImport, onShare, onExport, onClose,
}: { build: BuildDataWithIds; onImport: (b: BuildDataWithIds) => void; onShare: () => void; onExport: () => void; onClose: () => void }) {
  const t = useToolT("tools.mhwilds")
  const [code, setCode] = useState("")
  const [err, setErr] = useState(false)

  const parsed = useMemo(() => {
    if (!code.trim()) return null
    try { const b = JSON.parse(code.trim()); return (b.name && Array.isArray(b.decorations)) ? (b as BuildDataWithIds) : null } catch { return null }
  }, [code])

  useEffect(() => { setErr(false) }, [code])
  const doImport = () => { if (parsed) onImport(parsed); else setErr(true) }

  return (
    <MhDrawer iconName="download" title={t("build_planner.import_export")} sub={t("build_planner.import_export_sub")} onClose={onClose}>
      <MhLabel>{t("build_planner.export")}</MhLabel>
      <div className="flex gap-2 mb-4">
        <Button size="sm" icon="link" onClick={onShare}>{t("build_planner.share_link")}</Button>
        <Button size="sm" icon="download" onClick={onExport}>{t("build_planner.export_json")}</Button>
        <Button size="sm" icon="copy" onClick={() => { try { navigator.clipboard.writeText(JSON.stringify(build, null, 2)) } catch { /* ignore */ } }}>{t("build_planner.copy_json")}</Button>
      </div>
      <div className="h-px bg-line my-4" />
      <MhLabel>{t("build_planner.import_build")}</MhLabel>
      <textarea
        className="w-full min-h-[6.875rem] bg-base-2 border border-line text-txt font-mono text-[0.75rem] p-3 resize-y outline-none focus:border-[var(--mh)] placeholder:text-txt-dim"
        placeholder={t("build_planner.import_placeholder")}
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      {err && <div className="text-bad font-mono text-[0.75rem] leading-tight mt-2">{t("build_planner.error_invalid_file_format")}</div>}
      {parsed && <div className="text-ok font-mono text-[0.75rem] leading-tight mt-2">✓ «{parsed.name}»</div>}
      <div className="mt-3.5"><Button size="sm" variant="pri" icon="check" onClick={doImport} disabled={!parsed}>{t("build_planner.import_build")}</Button></div>
    </MhDrawer>
  )
}
