"use client"

import * as React from "react"
import { Button, Empty, Icon, Select, Spinner, ToolTitle } from "@boffmedia/ui"
import { useToolT } from "../../i18n"
import type { ArmorPiece, Charm, Decoration, Weapon, WishlistEntry } from "../../types"
import {
  MhApp,
  MhBar,
  MhBarSide,
  MhBody,
  MhLabel,
  MhLoadError,
  MhMaterial,
  MhPanel,
  MhRarity,
  MhSeal,
  MhWrap,
} from "../../ui/mh-kit"
import { useGameData } from "../_hooks/useGameData"
import { useForgePathsForWeapons, type ForgePath } from "../_hooks/useForgePath"
import { aggregateLoadoutRequirements } from "../_utils/materials"
import { useWishlist } from "../_utils/wishlist"
import { WishlistAddPanel } from "./WishlistAddPanel"
import { WishlistItemVisual } from "./WishlistItemVisual"

const OWNED_KEY = "mhw-owned-mats"
const WEAPON_KIND_KEYS = new Set([
  "great-sword",
  "long-sword",
  "sword-shield",
  "dual-blades",
  "hammer",
  "hunting-horn",
  "lance",
  "gunlance",
  "switch-axe",
  "charge-blade",
  "insect-glaive",
  "light-bowgun",
  "heavy-bowgun",
  "bow",
])
const ARMOR_KIND_KEYS = new Set(["head", "chest", "arms", "waist", "legs"])

function wishlistWeaponKindLabel(t: ReturnType<typeof useToolT>, kind: string | undefined): string {
  if (!kind) return t("build_planner.wishlist.weapon")
  return WEAPON_KIND_KEYS.has(kind) ? t(`weapons.${kind}`) : kind
}

function wishlistArmorKindLabel(t: ReturnType<typeof useToolT>, kind: string | undefined): string {
  if (!kind) return t("build_planner.wishlist.armor")
  return ARMOR_KIND_KEYS.has(kind) ? t(kind) : kind
}

function routeLabel(path: ForgePath, index: number): string {
  const names = path.nodes.map((node) => node.name).filter(Boolean)
  const route = names.length > 3
    ? `${names[0]} -> ... -> ${names[names.length - 1]}`
    : names.join(" -> ")
  return `${index + 1}. ${route || path.key}`
}

function WishlistRouteChoice({
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

function WishlistTargetRow({
  entry,
  weapon,
  armor,
  charm,
  decoration,
  item,
  paths,
  selectedPath,
  onRoute,
  onRemove,
}: {
  entry: WishlistEntry
  weapon?: Weapon
  armor?: ArmorPiece
  charm?: Charm
  decoration?: Decoration
  item?: Weapon | ArmorPiece | Charm | Decoration
  paths?: ForgePath[]
  selectedPath?: string
  onRoute: (key: string) => void
  onRemove: () => void
}) {
  const t = useToolT("tools.mhwilds")
  const kindLabel = entry.kind === "weapon"
    ? t("build_planner.wishlist.weapon")
    : entry.kind === "armor"
      ? t("build_planner.wishlist.armor")
      : entry.kind === "charm"
        ? t("build_planner.wishlist.charm")
        : t("build_planner.wishlist.decoration")
  const resolved = entry.kind === "weapon"
    ? !!weapon
    : entry.kind === "armor"
      ? !!armor
      : entry.kind === "charm"
        ? !!charm
        : !!decoration
  const detail = entry.kind === "weapon"
    ? wishlistWeaponKindLabel(t, weapon?.kind || entry.weaponKind)
    : entry.kind === "armor"
      ? `${wishlistArmorKindLabel(t, entry.armorKind)}${entry.rank ? ` / ${entry.rank}` : ""}`
      : entry.kind === "charm"
        ? t("build_planner.wishlist.charmLevel", { level: entry.charmLevel || charm?.level || 0 })
        : t("build_planner.deco_level", { size: entry.decorationSlot || decoration?.slot || 0 })

  return (
    <div className="group border border-line bg-base-2 p-2.5 transition-colors hover:border-[var(--mh-line)]">
      <div className="flex min-w-0 items-center gap-3">
        <WishlistItemVisual kind={entry.kind} item={item} />
        {entry.rarity != null && <MhRarity rarity={entry.rarity} />}
        <span className="min-w-0 flex-1">
          <b className="block truncate font-body text-[0.8125rem] leading-tight">{entry.name}</b>
          <span className="mt-0.5 block truncate font-mono text-[0.625rem] uppercase leading-none tracking-[0.06em] text-txt-dim">{kindLabel} / {detail}</span>
        </span>
        <button
          type="button"
          onClick={onRemove}
          title={t("build_planner.wishlist.remove")}
          aria-label={t("build_planner.wishlist.remove")}
          className="grid h-7 w-7 shrink-0 place-items-center border border-line-2 text-txt-dim transition-colors hover:border-bad hover:text-bad"
        >
          <Icon name="x" size={13} />
        </button>
      </div>
      {!resolved && <div className="mt-2 font-mono text-[0.625rem] uppercase tracking-[0.06em] text-warn">{t("build_planner.wishlist.targetMissing")}</div>}
      {weapon && paths && <WishlistRouteChoice weapon={weapon} paths={paths} value={selectedPath} onChange={onRoute} />}
    </div>
  )
}

export function WishlistView() {
  const t = useToolT("tools.mhwilds")
  const wishlist = useWishlist()
  const {
    weapons,
    armor,
    charms,
    decorations,
    loadingWeapons,
    loadingArmor,
    loadingCharms,
    loadingDecorations,
    weaponsError,
    armorError,
    charmsError,
    decorationsError,
    getWeaponById,
    getArmorById,
    getCharmById,
    getDecorationById,
  } = useGameData()

  const wishlistWeapons = React.useMemo(
    () => wishlist.entries
      .filter((entry) => entry.kind === "weapon")
      .map((entry) => getWeaponById(entry.id))
      .filter((weapon): weapon is Weapon => !!weapon),
    [getWeaponById, wishlist.entries, weapons],
  )
  const wishlistArmor = React.useMemo(
    () => wishlist.entries
      .filter((entry) => entry.kind === "armor")
      .map((entry) => getArmorById(entry.id))
      .filter((piece): piece is ArmorPiece => !!piece),
    [armor, getArmorById, wishlist.entries],
  )
  const wishlistCharms = React.useMemo(
    () => wishlist.entries
      .filter((entry) => entry.kind === "charm")
      .map((entry) => getCharmById(entry.id))
      .filter((charm): charm is Charm => !!charm),
    [charms, getCharmById, wishlist.entries],
  )
  const wishlistDecorations = React.useMemo(
    () => wishlist.entries
      .filter((entry) => entry.kind === "decoration")
      .map((entry) => getDecorationById(entry.id))
      .filter((decoration): decoration is Decoration => !!decoration),
    [decorations, getDecorationById, wishlist.entries],
  )
  const weaponIndexById = React.useMemo(
    () => new Map(wishlistWeapons.map((weapon, index) => [String(weapon.id), index])),
    [wishlistWeapons],
  )
  const weaponPaths = useForgePathsForWeapons(wishlistWeapons)
  const [selectedRoutes, setSelectedRoutes] = React.useState<Record<string, string>>({})
  const selectedWishlistPaths = React.useMemo(
    () => wishlistWeapons.map((weapon, index) => {
      const paths = weaponPaths.paths[index] || []
      return paths.find((path) => path.key === selectedRoutes[String(weapon.id)]) || paths[0] || null
    }),
    [selectedRoutes, wishlistWeapons, weaponPaths.paths],
  )
  const requirements = React.useMemo(
    () => aggregateLoadoutRequirements({
      weapons: wishlistWeapons,
      weaponPaths: selectedWishlistPaths,
      armor: wishlistArmor,
      charms: wishlistCharms,
      decorations: wishlistDecorations,
    }),
    [selectedWishlistPaths, wishlistArmor, wishlistCharms, wishlistDecorations, wishlistWeapons],
  )

  const [owned, setOwned] = React.useState<Record<string, boolean>>({})
  React.useEffect(() => {
    try {
      setOwned(JSON.parse(localStorage.getItem(OWNED_KEY) || "{}"))
    } catch {
      /* ignore */
    }
  }, [])
  const toggleOwned = (id: string) =>
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

  const resolvedCount = wishlistWeapons.length + wishlistArmor.length + wishlistCharms.length + wishlistDecorations.length
  const unresolvedCount = Math.max(0, wishlist.entries.length - resolvedCount)
  const ownedCount = requirements.materials.filter((material) => owned[String(material.item.id)]).length
  const loading = loadingWeapons || loadingArmor || loadingCharms || loadingDecorations
  const error = weaponsError || armorError || charmsError || decorationsError

  if (loading) {
    return <MhApp><div className="grid min-h-[16rem] place-items-center"><Spinner /></div></MhApp>
  }
  if (error) {
    return <MhApp><div className="py-16"><MhLoadError title={t("build_planner.errors.loadWishlist")} detail={error} /></div></MhApp>
  }

  return (
    <MhApp>
      <MhBar>
        <div className="flex min-w-0 items-center gap-[0.6875rem]">
          <MhSeal name="list" />
          <ToolTitle
            title={t("build_planner.wishlist.title")}
            sub={t("build_planner.wishlist.itemCount", { count: wishlist.entries.length })}
          />
        </div>
        <MhBarSide>
          <Button size="sm" icon="back" href="/mhwilds/builds/planner">
            {t("build_planner.wishlist.toPlanner")}
          </Button>
          <WishlistAddPanel weapons={weapons} armor={armor} charms={charms} decorations={decorations} />
          {wishlist.entries.length > 0 && (
            <Button size="sm" variant="danger" icon="trash" onClick={wishlist.clear}>
              {t("build_planner.wishlist.clear")}
            </Button>
          )}
        </MhBarSide>
      </MhBar>

      <MhBody>
        <MhWrap>
          {wishlist.entries.length === 0 ? (
            <MhPanel title={t("build_planner.wishlist.title")} icon="list">
              <Empty icon="list" title={t("build_planner.wishlist.empty")} lead={t("build_planner.wishlist.emptyLead")} />
            </MhPanel>
          ) : (
            <div className="grid items-start gap-4 xl:grid-cols-[minmax(19rem,0.82fr)_minmax(0,1.18fr)]">
              <MhPanel
                title={t("build_planner.wishlist.title")}
                icon="list"
                count={t("build_planner.wishlist.itemCount", { count: wishlist.entries.length })}
              >
                {unresolvedCount > 0 && (
                  <div className="mb-2.5 flex items-start gap-2 border border-warn bg-base-2 px-2.5 py-2 font-mono text-[0.6875rem] leading-[1.35] text-txt-muted">
                    <Icon name="alert" size={14} className="mt-px shrink-0 text-warn" />
                    <span>{t("build_planner.wishlist.unresolved", { count: unresolvedCount })}</span>
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  {wishlist.entries.map((entry) => {
                    const weapon = entry.kind === "weapon" ? wishlistWeapons[weaponIndexById.get(entry.id) ?? -1] : undefined
                    const piece = entry.kind === "armor" ? wishlistArmor.find((candidate) => String(candidate.id) === entry.id) : undefined
                    const charm = entry.kind === "charm" ? wishlistCharms.find((candidate) => String(candidate.id) === entry.id) : undefined
                    const decoration = entry.kind === "decoration" ? wishlistDecorations.find((candidate) => String(candidate.id) === entry.id) : undefined
                    const weaponIndex = weaponIndexById.get(entry.id)
                    return (
                      <WishlistTargetRow
                        key={entry.key}
                        entry={entry}
                        weapon={weapon}
                        armor={piece}
                        charm={charm}
                        decoration={decoration}
                        item={weapon || piece || charm || decoration}
                        paths={weaponIndex == null ? undefined : weaponPaths.paths[weaponIndex]}
                        selectedPath={selectedRoutes[entry.id]}
                        onRoute={(key) => setSelectedRoutes((current) => ({ ...current, [entry.id]: key }))}
                        onRemove={() => wishlist.remove(entry.key)}
                      />
                    )
                  })}
                </div>
              </MhPanel>

              <MhPanel
                title={t("build_planner.forge_materials")}
                icon="hammer"
                count={requirements.materials.length}
                className="xl:sticky xl:top-[4.625rem]"
                aside={<span className="font-mono text-[0.6875rem] leading-none text-txt-muted">{t("build_planner.forge.owned", { owned: ownedCount, total: requirements.materials.length })}</span>}
              >
                <p className="mb-3 font-mono text-[0.6875rem] leading-[1.4] text-txt-muted">{t("build_planner.wishlist.materialsLead")}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.6875rem] leading-none text-txt-muted">
                  <span>{t("build_planner.forge.steps", { count: requirements.steps })}</span>
                  <span>{t("build_planner.forge.zenny", { amount: requirements.zenny.toLocaleString() })}</span>
                  {weaponPaths.loading && <span>{t("build_planner.forge.loading_path")}</span>}
                </div>

                {requirements.materials.length > 0 ? (
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
                          onToggle={() => toggleOwned(id)}
                        />
                      )
                    })}
                  </div>
                ) : (
                  <div className="mt-3">
                    <Empty icon="hammer" title={t("build_planner.wishlist.noMaterials")} lead={t("build_planner.wishlist.noMaterialsLead")} />
                  </div>
                )}

                {requirements.untracked.length > 0 && (
                  <div className="mt-3 border border-line bg-base-2 px-2.5 py-2 font-mono text-[0.6875rem] leading-[1.35] text-txt-muted">
                    <b className="text-txt">{t("build_planner.forge.untracked")}</b>{" "}
                    {requirements.untracked.map((source) => source.label).join(", ")}
                  </div>
                )}
              </MhPanel>
            </div>
          )}
        </MhWrap>
      </MhBody>
    </MhApp>
  )
}
