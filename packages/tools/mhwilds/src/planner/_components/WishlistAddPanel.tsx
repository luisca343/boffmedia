"use client"

import * as React from "react"
import { Button, Empty, Icon, Modal, Select } from "@boffmedia/ui"
import { useToolT } from "../../i18n"
import type { ArmorPiece, Charm, Decoration, Weapon, WishlistEntry } from "../../types"
import { MH_ATTRIBUTE_DEFINITIONS, attributeColor, normalizeAttributeKey } from "../../ui/mh-helpers"
import { MhAttributeIcon, MhModes, MhRarity, MhSearch } from "../../ui/mh-kit"
import { getAllWeaponElements } from "./equipment-utils"
import { WishlistItemVisual } from "./WishlistItemVisual"
import {
  armorWishlistEntry,
  charmWishlistEntry,
  decorationWishlistEntry,
  useWishlist,
  weaponWishlistEntry,
} from "../_utils/wishlist"

type SearchKind = "weapon" | "armor" | "charm" | "decoration"
type SearchItem = Weapon | ArmorPiece | Charm | Decoration

const ALL = "all"
const NONE = "none"
const RESULT_LIMIT = 48
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
const LOCALIZED_ATTRIBUTE_KEYS = new Set(MH_ATTRIBUTE_DEFINITIONS.map(({ key }) => key))

function normalize(value: unknown): string {
  return String(value || "").trim().toLocaleLowerCase()
}

function uniqueValues(values: unknown[]): string[] {
  const unique = new Map<string, string>()
  for (const value of values) {
    const display = String(value || "").trim()
    if (display && !unique.has(normalize(display))) unique.set(normalize(display), display)
  }
  return [...unique.values()].sort((a, b) => a.localeCompare(b))
}

function numericValues(values: unknown[]): number[] {
  return [...new Set(values.map(Number).filter((value) => Number.isFinite(value)))].sort((a, b) => a - b)
}

function itemSkillNames(item: SearchItem): string[] {
  const skills = "skills" in item && Array.isArray(item.skills) ? item.skills : []
  return skills
    .map((skill) => {
      const value = skill as { skill?: { name?: string }; name?: string }
      return value.skill?.name || value.name || ""
    })
    .filter(Boolean)
}

function maxSlotLevel(item: SearchItem): number {
  if (!("slots" in item) || !Array.isArray(item.slots)) return 0
  return Math.max(0, ...item.slots.map(Number).filter((value) => Number.isFinite(value)))
}

function itemSearchText(item: SearchItem): string {
  const values = [item.name, "description" in item ? item.description : "", ...itemSkillNames(item)]
  if ("armorSet" in item) values.push(item.armorSet?.name || "")
  if ("kind" in item && item.kind) values.push(item.kind)
  return values.filter(Boolean).join(" ").toLocaleLowerCase()
}

function localizedWeaponKind(t: ReturnType<typeof useToolT>, kind: string): string {
  return WEAPON_KIND_KEYS.has(kind) ? t(`weapons.${kind}`) : kind
}

function localizedArmorKind(t: ReturnType<typeof useToolT>, kind: string): string {
  return ARMOR_KIND_KEYS.has(kind) ? t(kind) : kind
}

function localizedRank(t: ReturnType<typeof useToolT>, rank: string): string {
  if (rank === "low") return t("lowRank")
  if (rank === "high") return t("highRank")
  return rank
}

function localizedEquipmentKind(t: ReturnType<typeof useToolT>, kind: string): string {
  return kind === "weapon" || kind === "armor" ? t(kind) : kind
}

function localizedAttribute(t: ReturnType<typeof useToolT>, value: string, noneKey: string): string {
  if (value === NONE) return t(noneKey)
  const key = normalizeAttributeKey(value)
  return LOCALIZED_ATTRIBUTE_KEYS.has(key) ? t(key) : value
}

function wishlistEntryFor(kind: SearchKind, item: SearchItem): WishlistEntry {
  if (kind === "weapon") return weaponWishlistEntry(item as Weapon)
  if (kind === "armor") return armorWishlistEntry(item as ArmorPiece)
  if (kind === "charm") return charmWishlistEntry(item as Charm)
  return decorationWishlistEntry(item as Decoration)
}

function WeaponAttributeList({ weapon }: { weapon: Weapon }) {
  const t = useToolT("tools.mhwilds")
  const { elements, statuses } = getAllWeaponElements(weapon)
  const attributes = [
    ...elements.map((value) => ({ ...value, group: "element" })),
    ...statuses.map((value) => ({ ...value, group: "status" })),
  ]

  if (attributes.length === 0) {
    return (
      <span className="mt-1 inline-flex items-center gap-1 font-mono text-[0.625rem] uppercase tracking-[0.05em] text-txt-dim">
        <Icon name="info" size={11} />
        {t("build_planner.wishlist.noElement")}
      </span>
    )
  }

  return (
    <div className="mt-1 flex min-w-0 flex-wrap gap-x-2 gap-y-1">
      {attributes.map((attribute, index) => {
        const label = localizedAttribute(t, attribute.type, "build_planner.wishlist.noElement")
        const color = attributeColor(attribute.type)
        return (
          <span
            key={`${attribute.group}-${attribute.type}-${index}`}
            className={`inline-flex min-w-0 items-center gap-1 font-mono text-[0.625rem] uppercase leading-none tracking-[0.04em] ${attribute.hidden ? "opacity-60" : ""}`}
            style={{ color }}
            title={`${label}${attribute.hidden ? ` ${t("hidden")}` : ""}`}
          >
            <MhAttributeIcon type={attribute.type} size={11} />
            <span className="truncate">{label}</span>
            {attribute.damage > 0 && <span>{attribute.damage}</span>}
            {attribute.hidden && <span className="text-[0.5625rem]">{t("hidden")}</span>}
          </span>
        )
      })}
    </div>
  )
}

function AddResultRow({
  kind,
  item,
  onToggle,
  added,
}: {
  kind: SearchKind
  item: SearchItem
  onToggle: () => void
  added: boolean
}) {
  const t = useToolT("tools.mhwilds")
  const detail = (() => {
    if (kind === "weapon") {
      const weapon = item as Weapon
      const { elements, statuses } = getAllWeaponElements(weapon)
      const special = elements[0] || statuses[0]
      return `${localizedWeaponKind(t, weapon.kind)} / ${special ? localizedAttribute(t, special.type, "build_planner.wishlist.noElement") : t("build_planner.wishlist.noElement")}`
    }
    if (kind === "armor") {
      const piece = item as ArmorPiece
      return `${localizedArmorKind(t, piece.kind)} / ${localizedRank(t, piece.rank)}`
    }
    if (kind === "charm") {
      const charm = item as Charm
      return `${t("build_planner.wishlist.charm")} / ${t("build_planner.wishlist.charmLevel", { level: charm.level })}`
    }
    return `${t("build_planner.wishlist.decoration")} / ${t("build_planner.deco_level", { size: (item as Decoration).slot })}`
  })()

  return (
    <div className="grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-2.5 border border-line bg-base-2 px-2.5 py-2 transition-colors hover:border-[var(--mh-line)]">
      <WishlistItemVisual kind={kind} item={item} />
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <MhRarity rarity={item.rarity} />
          <b className="min-w-0 truncate font-body text-[0.8125rem] leading-tight">{item.name}</b>
        </div>
        <span className="mt-0.5 block truncate font-mono text-[0.625rem] uppercase leading-none tracking-[0.06em] text-txt-dim">{detail}</span>
        {kind === "weapon" && <WeaponAttributeList weapon={item as Weapon} />}
      </div>
      <Button
        type="button"
        size="sm"
        variant={added ? "ghost" : "pri"}
        icon={added ? "check" : "plus"}
        onClick={onToggle}
        title={added ? t("build_planner.wishlist.remove") : t("build_planner.wishlist.add")}
        aria-label={`${added ? t("build_planner.wishlist.remove") : t("build_planner.wishlist.add")}: ${item.name}`}
      >
        {added ? t("build_planner.wishlist.added") : t("build_planner.wishlist.add")}
      </Button>
    </div>
  )
}

export function WishlistAddPanel({
  weapons,
  armor,
  charms,
  decorations,
}: {
  weapons: Weapon[]
  armor: ArmorPiece[]
  charms: Charm[]
  decorations: Decoration[]
}) {
  const t = useToolT("tools.mhwilds")
  const wishlist = useWishlist()
  const [kind, setKind] = React.useState<SearchKind>("weapon")
  const [query, setQuery] = React.useState("")
  const [rarity, setRarity] = React.useState(ALL)
  const [skill, setSkill] = React.useState(ALL)
  const [slotMin, setSlotMin] = React.useState(ALL)
  const [weaponKind, setWeaponKind] = React.useState(ALL)
  const [weaponElement, setWeaponElement] = React.useState(ALL)
  const [weaponAilment, setWeaponAilment] = React.useState(ALL)
  const [weaponAffinity, setWeaponAffinity] = React.useState(ALL)
  const [armorKind, setArmorKind] = React.useState(ALL)
  const [armorRank, setArmorRank] = React.useState(ALL)
  const [charmLevel, setCharmLevel] = React.useState(ALL)
  const [decorationSlot, setDecorationSlot] = React.useState(ALL)
  const [decorationKind, setDecorationKind] = React.useState(ALL)
  const [open, setOpen] = React.useState(false)

  const activeItems = React.useMemo<SearchItem[]>(() => {
    if (kind === "weapon") return weapons
    if (kind === "armor") return armor
    if (kind === "charm") return charms
    return decorations
  }, [armor, charms, decorations, kind, weapons])
  const rarities = React.useMemo(() => numericValues(activeItems.map((item) => item.rarity)), [activeItems])
  const skills = React.useMemo(
    () => uniqueValues(activeItems.flatMap((item) => itemSkillNames(item))),
    [activeItems],
  )
  const maxAvailableSlot = React.useMemo(
    () => Math.max(0, ...activeItems.map(maxSlotLevel)),
    [activeItems],
  )
  const slotLevels = React.useMemo(
    () => Array.from({ length: maxAvailableSlot }, (_, index) => index + 1),
    [maxAvailableSlot],
  )
  const weaponKinds = React.useMemo(
    () => uniqueValues(weapons.map((weapon) => weapon.kind)),
    [weapons],
  )
  const weaponElements = React.useMemo(() => {
    const values = new Set<string>()
    let hasNone = false
    for (const weapon of weapons) {
      const elements = getAllWeaponElements(weapon).elements.map((value) => normalize(value.type))
      if (!elements.length) hasNone = true
      elements.forEach((value) => values.add(value))
    }
    if (hasNone) values.add(NONE)
    return [...values].sort()
  }, [weapons])
  const weaponAilments = React.useMemo(() => {
    const values = new Set<string>()
    let hasNone = false
    for (const weapon of weapons) {
      const statuses = getAllWeaponElements(weapon).statuses.map((value) => normalize(value.type))
      if (!statuses.length) hasNone = true
      statuses.forEach((value) => values.add(value))
    }
    if (hasNone) values.add(NONE)
    return [...values].sort()
  }, [weapons])
  const armorKinds = React.useMemo(
    () => uniqueValues(armor.map((piece) => piece.kind)),
    [armor],
  )
  const armorRanks = React.useMemo(
    () => uniqueValues(armor.map((piece) => piece.rank)),
    [armor],
  )
  const charmLevels = React.useMemo(
    () => numericValues(charms.map((charm) => charm.level)),
    [charms],
  )
  const decorationSlots = React.useMemo(
    () => numericValues(decorations.map((decoration) => decoration.slot)),
    [decorations],
  )
  const decorationKinds = React.useMemo(
    () => uniqueValues(decorations.map((decoration) => decoration.kind)),
    [decorations],
  )

  React.useEffect(() => {
    setQuery("")
    setRarity(ALL)
    setSkill(ALL)
    setSlotMin(ALL)
    setWeaponKind(ALL)
    setWeaponElement(ALL)
    setWeaponAilment(ALL)
    setWeaponAffinity(ALL)
    setArmorKind(ALL)
    setArmorRank(ALL)
    setCharmLevel(ALL)
    setDecorationSlot(ALL)
    setDecorationKind(ALL)
  }, [kind])

  const term = query.trim().toLocaleLowerCase()
  const allMatches = React.useMemo<SearchItem[]>(() => {
    const matchesCommon = (item: SearchItem): boolean => {
      if (rarity !== ALL && item.rarity !== Number(rarity)) return false
      if (skill !== ALL && !itemSkillNames(item).some((name) => normalize(name) === normalize(skill))) return false
      if (kind !== "decoration" && slotMin !== ALL && maxSlotLevel(item) < Number(slotMin)) return false
      if (term && !itemSearchText(item).includes(term)) return false
      return true
    }

    if (kind === "weapon") {
      return weapons.filter((weapon) => {
        if (!matchesCommon(weapon)) return false
        if (weaponKind !== ALL && weapon.kind !== weaponKind) return false
        const { elements, statuses } = getAllWeaponElements(weapon)
        const elementTypes = elements.map((value) => normalize(value.type))
        const ailmentTypes = statuses.map((value) => normalize(value.type))
        if (weaponElement !== ALL && (weaponElement === NONE ? elementTypes.length > 0 : !elementTypes.includes(weaponElement))) return false
        if (weaponAilment !== ALL && (weaponAilment === NONE ? ailmentTypes.length > 0 : !ailmentTypes.includes(weaponAilment))) return false
        const affinity = Number(weapon.affinity) || 0
        if (weaponAffinity === "negative" && affinity >= 0) return false
        if (weaponAffinity === "neutral" && affinity !== 0) return false
        if (weaponAffinity === "positive" && affinity <= 0) return false
        return true
      })
    }
    if (kind === "armor") {
      return armor.filter((piece) =>
        matchesCommon(piece) &&
        (armorKind === ALL || piece.kind === armorKind) &&
        (armorRank === ALL || piece.rank === armorRank),
      )
    }
    if (kind === "charm") {
      return charms.filter((charm) =>
        matchesCommon(charm) &&
        (charmLevel === ALL || charm.level === Number(charmLevel)),
      )
    }
    return decorations.filter((decoration) =>
      matchesCommon(decoration) &&
      (decorationSlot === ALL || decoration.slot === Number(decorationSlot)) &&
      (decorationKind === ALL || decoration.kind === decorationKind),
    )
  }, [
    armor,
    armorKind,
    armorRank,
    charmLevel,
    charms,
    decorationKind,
    decorationSlot,
    decorations,
    kind,
    rarity,
    skill,
    slotMin,
    term,
    weaponAffinity,
    weaponAilment,
    weaponElement,
    weaponKind,
    weapons,
  ])
  const results = allMatches.slice(0, RESULT_LIMIT)

  const placeholder = kind === "weapon"
    ? t("build_planner.wishlist.searchWeapons")
    : kind === "armor"
      ? t("build_planner.wishlist.searchArmor")
      : kind === "charm"
        ? t("build_planner.wishlist.searchCharms")
        : t("build_planner.wishlist.searchDecorations")

  return (
    <>
      <Button type="button" size="sm" icon="plus" onClick={() => setOpen(true)}>
        {t("build_planner.wishlist.addButton")}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("build_planner.wishlist.addTitle")}
        size="lg"
      >
        <div className="flex flex-col gap-3">
          <div className="overflow-x-auto">
            <MhModes
              value={kind}
              onChange={(value) => setKind(value as SearchKind)}
              options={[
                { value: "weapon", label: <><Icon name="sword" size={13} />{t("build_planner.wishlist.searchWeaponsTab")}</> },
                { value: "armor", label: <><Icon name="shield" size={13} />{t("build_planner.wishlist.searchArmorTab")}</> },
                { value: "charm", label: <><Icon name="sparkles" size={13} />{t("build_planner.wishlist.searchCharmsTab")}</> },
                { value: "decoration", label: <><Icon name="sparkles" size={13} />{t("build_planner.wishlist.searchDecorationsTab")}</> },
              ]}
            />
          </div>

          <div className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_minmax(10rem,15rem)]">
            <MhSearch value={query} onChange={setQuery} placeholder={placeholder} />
            <Select
              ariaLabel={t("build_planner.wishlist.rarityFilter")}
              value={rarity}
              onChange={setRarity}
              options={[
                { value: ALL, label: t("build_planner.wishlist.allRarities") },
                ...rarities.map((value) => ({ value: String(value), label: `${t("rarity")} ${value}` })),
              ]}
            />
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              ariaLabel={t("build_planner.wishlist.skillFilter")}
              value={skill}
              onChange={setSkill}
              options={[
                { value: ALL, label: t("build_planner.wishlist.allSkills") },
                ...skills.map((value) => ({ value, label: value })),
              ]}
            />
            {kind !== "decoration" && (
              <Select
                ariaLabel={t("build_planner.wishlist.slotFilter")}
                value={slotMin}
                onChange={setSlotMin}
                options={[
                  { value: ALL, label: t("build_planner.wishlist.allSlotCounts") },
                  ...slotLevels.map((value) => ({ value: String(value), label: t("build_planner.wishlist.atLeastSlots", { count: value }) })),
                ]}
              />
            )}
            {kind === "weapon" && (
              <Select
                ariaLabel={t("build_planner.wishlist.weaponFilter")}
                value={weaponKind}
                onChange={setWeaponKind}
                options={[
                  { value: ALL, label: t("build_planner.wishlist.allWeaponTypes") },
                  ...weaponKinds.map((value) => ({ value, label: localizedWeaponKind(t, value) })),
                ]}
              />
            )}
            {kind === "armor" && (
              <>
                <Select
                  ariaLabel={t("build_planner.wishlist.armorFilter")}
                  value={armorKind}
                  onChange={setArmorKind}
                  options={[
                    { value: ALL, label: t("build_planner.wishlist.allArmorPieces") },
                    ...armorKinds.map((value) => ({ value, label: localizedArmorKind(t, value) })),
                  ]}
                />
                <Select
                  ariaLabel={t("build_planner.wishlist.rankFilter")}
                  value={armorRank}
                  onChange={setArmorRank}
                  options={[
                    { value: ALL, label: t("build_planner.wishlist.allRanks") },
                    ...armorRanks.map((value) => ({ value, label: localizedRank(t, value) })),
                  ]}
                />
              </>
            )}
            {kind === "charm" && (
              <Select
                ariaLabel={t("build_planner.wishlist.charmFilter")}
                value={charmLevel}
                onChange={setCharmLevel}
                options={[
                  { value: ALL, label: t("build_planner.wishlist.allCharmLevels") },
                  ...charmLevels.map((value) => ({ value: String(value), label: t("build_planner.wishlist.charmLevel", { level: value }) })),
                ]}
              />
            )}
            {kind === "decoration" && (
              <>
                <Select
                  ariaLabel={t("build_planner.wishlist.decorationFilter")}
                  value={decorationSlot}
                  onChange={setDecorationSlot}
                  options={[
                    { value: ALL, label: t("build_planner.wishlist.allDecorationSlots") },
                    ...decorationSlots.map((value) => ({ value: String(value), label: t("build_planner.deco_level", { size: value }) })),
                  ]}
                />
                {decorationKinds.length > 0 && (
                  <Select
                    ariaLabel={t("build_planner.wishlist.decorationKindFilter")}
                    value={decorationKind}
                    onChange={setDecorationKind}
                    options={[
                      { value: ALL, label: t("build_planner.wishlist.allEquipment") },
                      ...decorationKinds.map((value) => ({ value, label: localizedEquipmentKind(t, value) })),
                    ]}
                  />
                )}
              </>
            )}
            {kind === "weapon" && (
              <>
                <Select
                  ariaLabel={t("build_planner.wishlist.elementFilter")}
                  value={weaponElement}
                  onChange={setWeaponElement}
                  options={[
                    { value: ALL, label: t("build_planner.wishlist.allElements") },
                    ...weaponElements.map((value) => ({ value, label: localizedAttribute(t, value, "build_planner.wishlist.noElement") })),
                  ]}
                />
                <Select
                  ariaLabel={t("build_planner.wishlist.ailmentFilter")}
                  value={weaponAilment}
                  onChange={setWeaponAilment}
                  options={[
                    { value: ALL, label: t("build_planner.wishlist.allAilments") },
                    ...weaponAilments.map((value) => ({ value, label: localizedAttribute(t, value, "build_planner.wishlist.noAilment") })),
                  ]}
                />
                <Select
                  ariaLabel={t("build_planner.wishlist.affinityFilter")}
                  value={weaponAffinity}
                  onChange={setWeaponAffinity}
                  options={[
                    { value: ALL, label: t("build_planner.wishlist.allAffinity") },
                    { value: "negative", label: t("build_planner.wishlist.negativeAffinity") },
                    { value: "neutral", label: t("build_planner.wishlist.neutralAffinity") },
                    { value: "positive", label: t("build_planner.wishlist.positiveAffinity") },
                  ]}
                />
              </>
            )}
          </div>
        </div>

        {results.length === 0 ? (
          <div className="mt-3">
            <Empty icon="search" title={t("build_planner.wishlist.noMatches")} lead={t("build_planner.wishlist.noMatchesLead")} />
          </div>
        ) : (
          <>
            <div className="mt-3 flex items-center justify-between gap-2 font-mono text-[0.625rem] uppercase tracking-[0.08em] text-txt-dim">
              <span>{t("build_planner.wishlist.resultCount", { count: allMatches.length })}</span>
              {allMatches.length > RESULT_LIMIT && <span>{t("build_planner.wishlist.resultLimit", { count: RESULT_LIMIT })}</span>}
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              {results.map((item) => {
                const entry = wishlistEntryFor(kind, item)
                const added = wishlist.has(entry.key)
                return (
                  <AddResultRow
                    key={entry.key}
                    kind={kind}
                    item={item}
                    added={added}
                    onToggle={() => wishlist.toggle(entry)}
                  />
                )
              })}
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
