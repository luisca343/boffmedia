"use client"

import * as React from "react"
import { Select } from "@boffmedia/ui"
import { useToolT } from "../../i18n"
import { ArmorPiece, Charm, Decoration, Weapon } from "../../types"
import { MhLabel, MhMaterial, MhPanel } from "../../ui/mh-kit"
import { useForgePaths, type ForgePath } from "../_hooks/useForgePath"
import { aggregateLoadoutRequirements } from "../_utils/materials"

const OWNED_KEY = "mhw-owned-mats"

function routeLabel(path: ForgePath, index: number): string {
  const names = path.nodes.map((node) => node.name).filter(Boolean)
  const route = names.length > 3
    ? `${names[0]} -> ... -> ${names[names.length - 1]}`
    : names.join(" -> ")
  return `${index + 1}. ${route || path.key}`
}

function RouteChoice({
  weapon,
  paths,
  value,
  onChange,
}: {
  weapon: Weapon
  paths: ForgePath[]
  value: string | undefined
  onChange: (key: string) => void
}) {
  const t = useToolT("tools.mhwilds")
  if (paths.length < 2) return null
  return (
    <div className="mt-2.5 border border-[var(--mh-line)] bg-[var(--mh-soft)] p-2.5">
      <MhLabel className="mb-1.5">{t("build_planner.forge.choose_route", { name: weapon.name })}</MhLabel>
      <Select
        ariaLabel={t("build_planner.forge.choose_route", { name: weapon.name })}
        value={value || paths[0].key}
        onChange={onChange}
        options={paths.map((path, index) => ({ value: path.key, label: routeLabel(path, index) }))}
      />
    </div>
  )
}

export function ForgePanel({
  weapons,
  armor,
  charm,
  decorations,
}: {
  weapons: (Weapon | null)[]
  armor: (ArmorPiece | null)[]
  charm: Charm | null
  decorations: Decoration[]
}) {
  const t = useToolT("tools.mhwilds")
  const primary = weapons[0] || null
  const secondary = weapons[1] || null
  const primaryRoutes = useForgePaths(primary ? String(primary.id) : null, primary?.kind)
  const secondaryRoutes = useForgePaths(secondary ? String(secondary.id) : null, secondary?.kind)
  const [selectedRoutes, setSelectedRoutes] = React.useState<Record<string, string>>({})

  const selectedPrimary = primaryRoutes.paths.find((path) => path.key === selectedRoutes.primary) || primaryRoutes.paths[0] || null
  const selectedSecondary = secondaryRoutes.paths.find((path) => path.key === selectedRoutes.secondary) || secondaryRoutes.paths[0] || null
  const requirements = React.useMemo(
    () => aggregateLoadoutRequirements({
      weapons,
      weaponPaths: [selectedPrimary, selectedSecondary],
      armor,
      charm,
      decorations,
    }),
    [armor, charm, decorations, selectedPrimary, selectedSecondary, weapons],
  )

  const [owned, setOwned] = React.useState<Record<string, boolean>>({})
  React.useEffect(() => {
    try {
      setOwned(JSON.parse(localStorage.getItem(OWNED_KEY) || "{}"))
    } catch {
      /* ignore */
    }
  }, [])
  const toggle = (id: string) =>
    setOwned((current) => {
      const next = { ...current }
      if (next[id]) delete next[id]
      else next[id] = true
      try {
        localStorage.setItem(OWNED_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })

  const loading = primaryRoutes.loading || secondaryRoutes.loading
  const ownedCount = requirements.materials.filter((material) => owned[String(material.item.id)]).length
  const hasCurrentEquipment = weapons.some(Boolean) || armor.some(Boolean) || !!charm || decorations.length > 0
  const hasContent = hasCurrentEquipment || requirements.materials.length > 0 || requirements.zenny > 0 || requirements.untracked.length > 0
  if (!hasContent && !loading) return null

  return (
    <MhPanel
      title={t("build_planner.forge_materials")}
      icon="hammer"
      count={requirements.materials.length}
      aside={
        <span className="font-mono text-[0.6875rem] leading-none text-txt-muted">
          {t("build_planner.forge.owned", { owned: ownedCount, total: requirements.materials.length })}
        </span>
      }
    >
      {hasCurrentEquipment && (
        <div className="border border-[var(--mh-line)] bg-[var(--mh-soft)] p-2.5">
          <MhLabel className="mb-1.5">{t("build_planner.wishlist.currentBuild")}</MhLabel>
          {primary && <RouteChoice weapon={primary} paths={primaryRoutes.paths} value={selectedRoutes.primary} onChange={(key) => setSelectedRoutes((current) => ({ ...current, primary: key }))} />}
          {secondary && <RouteChoice weapon={secondary} paths={secondaryRoutes.paths} value={selectedRoutes.secondary} onChange={(key) => setSelectedRoutes((current) => ({ ...current, secondary: key }))} />}
          {!primary && !secondary && <div className="font-mono text-[0.6875rem] text-txt-dim">{t("build_planner.no_weapon")}</div>}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.6875rem] leading-none text-txt-muted">
        {requirements.steps > 0 && <span>{t("build_planner.forge.steps", { count: requirements.steps })}</span>}
        {requirements.zenny > 0 && <span>{t("build_planner.forge.zenny", { amount: requirements.zenny.toLocaleString() })}</span>}
      </div>

      {requirements.materials.length > 0 && (
        <div className="mt-2.5 flex flex-col gap-[0.3125rem]">
          {requirements.materials.map((material) => {
            const id = String(material.item.id)
            return (
              <MhMaterial
                key={id}
                item={material.item}
                name={material.item.name}
                rarity={material.item.rarity}
                quantity={material.quantity}
                owned={!!owned[id]}
                onToggle={() => toggle(id)}
              />
            )
          })}
        </div>
      )}

      {requirements.untracked.length > 0 && (
        <div className="mt-3 border border-line bg-base-2 px-2.5 py-2 font-mono text-[0.6875rem] leading-[1.35] text-txt-muted">
          <b className="text-txt">{t("build_planner.forge.untracked")}</b>{" "}
          {requirements.untracked.map((source) => source.label).join(", ")}
        </div>
      )}

      {loading && (
        <div className="mt-2 font-mono text-[0.625rem] uppercase leading-none tracking-[0.08em] text-txt-dim">
          {t("build_planner.forge.loading_path")}
        </div>
      )}
    </MhPanel>
  )
}
