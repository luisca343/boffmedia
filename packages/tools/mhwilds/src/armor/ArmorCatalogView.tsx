"use client"

import * as React from "react"
import { Button, Empty, Select, Spinner, ToolTitle, toast } from "@boffmedia/ui"
import { useLocale, useToolT } from "../i18n"
import { MhWildsService } from "../service"
import type { ArmorPiece } from "../types"
import {
  MhApp,
  MhBar,
  MhBarSide,
  MhBody,
  MhLoadError,
  MhMaterial,
  MhPanel,
  MhRarity,
  MhSearch,
  MhSeal,
  MhSlotPips,
  MhTag,
  MhTypeChip,
} from "../ui/mh-kit"
import { getArmorImagePath } from "../planner/_components/equipment-utils"
import { mhwildsArmorAsset } from "../bestiary/assets"
import { aggregateLoadoutRequirements } from "../planner/_utils/materials"
import { armorWishlistEntry, useWishlist } from "../planner/_utils/wishlist"
import { WishlistLink } from "../planner/_components/WishlistLink"
import { ARMOR_ORDER, groupArmor } from "./grouping"

const PENDING_ARMOR_KEY = "mhw-pending-armor"

function piecesForKind(pieces: ArmorPiece[], kind: string): ArmorPiece[] {
  return kind === "all" ? pieces : pieces.filter((piece) => piece.kind === kind)
}

function ArmorThumb({ piece, size = 36 }: { piece: ArmorPiece; size?: number }) {
  const generatedAsset = mhwildsArmorAsset(piece)
  const fallbackAsset = getArmorImagePath(piece.kind)
  const [fallback, setFallback] = React.useState(false)
  React.useEffect(() => setFallback(false), [piece.id, generatedAsset])
  const src = !fallback && generatedAsset ? generatedAsset : fallbackAsset
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      draggable={false}
      className="object-contain"
      style={{ width: size, height: size }}
      onError={() => setFallback(true)}
    />
  )
}

function ArmorDetailPreview({ piece }: { piece: ArmorPiece }) {
  const generatedAsset = mhwildsArmorAsset(piece)
  const fallbackAsset = getArmorImagePath(piece.kind)
  const sources = React.useMemo(
    () => [generatedAsset, fallbackAsset].filter(Boolean) as string[],
    [fallbackAsset, generatedAsset],
  )
  const [sourceIndex, setSourceIndex] = React.useState(0)
  React.useEffect(() => setSourceIndex(0), [piece.id, generatedAsset])
  const src = sources[Math.min(sourceIndex, sources.length - 1)] || fallbackAsset
  return (
    <div className="grid min-h-[9rem] place-items-center">
      <img
        src={src}
        alt={piece.name}
        width={144}
        height={144}
        draggable={false}
        className="h-36 w-36 object-contain"
        onError={() => setSourceIndex((current) => Math.min(current + 1, sources.length - 1))}
      />
    </div>
  )
}

export function ArmorCatalogView() {
  const locale = useLocale()
  const t = useToolT("tools.mhwilds.armor_page")
  const wishlistT = useToolT("tools.mhwilds")
  const [armor, setArmor] = React.useState<ArmorPiece[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState("")
  const [rank, setRank] = React.useState("all")
  const [rarity, setRarity] = React.useState("all")
  const [kind, setKind] = React.useState("all")
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null)
  const [selectedPieces, setSelectedPieces] = React.useState<Record<string, boolean>>({})
  const [detailPieceId, setDetailPieceId] = React.useState<string | null>(null)
  const detailRef = React.useRef<HTMLDivElement>(null)
  const wishlist = useWishlist()

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    MhWildsService.getArmor(locale)
      .then((response) => {
        if (cancelled) return
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error(response.error || response.message || "armor request failed")
        }
        setArmor(response.data)
        setError(null)
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [locale])

  const groups = React.useMemo(() => groupArmor(armor), [armor])
  const filteredGroups = React.useMemo(() => {
    const term = query.trim().toLowerCase()
    return groups.filter((group) => {
      if (term && !group.name.toLowerCase().includes(term) && !group.pieces.some((piece) => piece.name.toLowerCase().includes(term))) return false
      if (rank !== "all" && group.rank !== rank) return false
      if (rarity !== "all" && group.rarity !== Number(rarity)) return false
      if (kind !== "all" && !group.pieces.some((piece) => piece.kind === kind)) return false
      return true
    })
  }, [groups, kind, query, rank, rarity])

  React.useEffect(() => {
    if (!filteredGroups.length) {
      setSelectedKey(null)
      return
    }
    if (!selectedKey || !filteredGroups.some((group) => group.key === selectedKey)) {
      setSelectedKey(filteredGroups[0].key)
    }
  }, [filteredGroups, selectedKey])

  const selectedSet = filteredGroups.find((group) => group.key === selectedKey) || null
  React.useEffect(() => {
    if (!selectedSet) {
      setSelectedPieces({})
      setDetailPieceId(null)
      return
    }
    setSelectedPieces(Object.fromEntries(selectedSet.pieces.map((piece) => [String(piece.id), true])))
    // Prefer a piece with a verified local render for the large preview. Some
    // event/bonus sets (notably Akuma) have API rows for every slot but the
    // game only exposes a raster thumbnail for a subset of those slots. Using
    // the first API row blindly made the whole set look missing when its head
    // thumbnail was unavailable even though chest/legs assets were present.
    const previewPiece = selectedSet.pieces.find((piece) => piece.localAssetPath) || selectedSet.pieces[0]
    setDetailPieceId(String(previewPiece?.id || ""))
  }, [selectedSet])

  const visiblePieces = selectedSet ? piecesForKind(selectedSet.pieces, kind) : []
  const selectedArmor = visiblePieces.filter((piece) => selectedPieces[String(piece.id)])
  const detailPiece = visiblePieces.find((piece) => String(piece.id) === detailPieceId) || visiblePieces[0] || null
  const requirements = React.useMemo(
    () => aggregateLoadoutRequirements({ armor: selectedArmor }),
    [selectedArmor],
  )
  const ranks = [...new Set(groups.map((group) => group.rank))]
  const rarities = [...new Set(groups.map((group) => group.rarity))].sort((a, b) => a - b)
  const selectedCount = selectedArmor.length
  const selectedWishlistCount = React.useMemo(
    () => selectedArmor.filter((piece) => wishlist.has(armorWishlistEntry(piece).key)).length,
    [selectedArmor, wishlist.entries, wishlist.has],
  )
  const allSelectedWishlisted = selectedArmor.length > 0 && selectedWishlistCount === selectedArmor.length

  const planSet = () => {
    const ids: Record<string, string | null> = {
      headId: null,
      chestId: null,
      armsId: null,
      waistId: null,
      legsId: null,
    }
    for (const piece of selectedArmor) {
      const key = `${piece.kind}Id`
      if (key in ids) ids[key] = String(piece.id)
    }
    wishlist.addMany(selectedArmor.map(armorWishlistEntry))
    try {
      localStorage.setItem(PENDING_ARMOR_KEY, JSON.stringify(ids))
    } catch {
      /* The planner is still reachable if storage is unavailable. */
    }
    window.location.href = "/mhwilds/builds/planner"
  }

  const pickSet = (key: string) => {
    setSelectedKey(key)
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 40)
    }
  }

  const toggleSelectedWishlist = () => {
    if (!selectedArmor.length) {
      toast.info(t("noSelected"))
      return
    }
    const entries = selectedArmor.map(armorWishlistEntry)
    if (allSelectedWishlisted) {
      entries.forEach((entry) => wishlist.remove(entry.key))
      toast.success(t("removedFromWishlist", { count: entries.length }))
      return
    }
    const known = new Set(wishlist.entries.map((entry) => entry.key))
    const addedCount = entries.filter((entry) => !known.has(entry.key)).length
    wishlist.addMany(entries)
    toast.success(addedCount > 0 ? t("addedToWishlist", { count: addedCount }) : t("alreadyInWishlist"))
  }

  if (loading) {
    return <MhApp><div className="grid min-h-[16rem] place-items-center"><Spinner /></div></MhApp>
  }
  if (error) {
    return <MhApp><div className="py-16"><MhLoadError title={t("loadError")} detail={error} /></div></MhApp>
  }

  return (
    <MhApp>
      <MhBar>
        <div className="flex items-center gap-[0.6875rem] min-w-0">
          <MhSeal name="shield" />
          <ToolTitle title={<>{t("titlePrefix")} <em className="not-italic text-[var(--mh-bright)]">{t("titleAccent")}</em></>} sub={t("subtitle", { sets: filteredGroups.length, pieces: armor.length })} />
        </div>
        <MhBarSide><WishlistLink /><span className="font-mono text-[0.6875rem] text-txt-muted">{t("source")}</span></MhBarSide>
      </MhBar>

      <MhBody>
        <div className="grid grid-cols-1 items-start lg:grid-cols-[minmax(18.75rem,22.5rem)_minmax(0,1fr)]">
          <div className="flex min-h-0 flex-col bg-base-2 lg:sticky lg:top-[calc(var(--tool-sticky-top,0px)_+_var(--tool-bar-h,3.625rem))] lg:h-[calc(var(--tool-vh,100dvh)_-_var(--tool-bar-h,3.625rem))] lg:border-r lg:border-line">
            <div className="flex flex-col gap-2.5 border-b border-line p-[12px_13px]">
              <div className="flex items-center gap-2">
                <MhSearch value={query} onChange={setQuery} placeholder={t("search")} />
                <span className="flex-none font-mono text-[0.625rem] uppercase tracking-[0.08em] text-txt-dim">{filteredGroups.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select ariaLabel={t("rank")} value={rank} onChange={setRank} options={[{ value: "all", label: t("allRanks") }, ...ranks.map((value) => ({ value, label: t(value === "high" ? "highRank" : "lowRank") }))]} />
                <Select ariaLabel={t("rarity")} value={rarity} onChange={setRarity} options={[{ value: "all", label: t("allRarities") }, ...rarities.map((value) => ({ value: String(value), label: `${t("rarity")} ${value}` }))]} />
              </div>
              <div className="flex flex-wrap gap-1">
                <MhTypeChip label={t("allPieces")} on={kind === "all"} onClick={() => setKind("all")} />
                {ARMOR_ORDER.map((pieceKind) => <MhTypeChip key={pieceKind} label={t(pieceKind)} on={kind === pieceKind} onClick={() => setKind(pieceKind)} />)}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-[12px_13px_40px] bm-scroll">
              {filteredGroups.length === 0 ? (
                <Empty icon="search" title={t("noResults")} lead={t("noResultsLead")} />
              ) : filteredGroups.map((group) => {
                const groupPieces = piecesForKind(group.pieces, kind)
                const first = groupPieces[0] || group.pieces[0]
                return (
                  <button key={group.key} type="button" onClick={() => pickSet(group.key)} className={`mb-1.5 grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-2.5 border bg-panel px-2.5 py-2 text-left transition-colors hover:bg-panel-2 ${selectedKey === group.key ? "border-[var(--mh)] shadow-[0_0_0_1px_var(--mh)]" : "border-line"}`}>
                    <span className="grid h-10 w-10 place-items-center border border-[var(--mh-line)] bg-transparent"><ArmorThumb piece={first} size={34} /></span>
                    <span className="min-w-0"><span className="flex min-w-0 items-center gap-1.5"><span className="truncate font-body text-[0.875rem] font-semibold">{group.name}</span>{group.variant ? <MhTag>{group.variant}</MhTag> : null}</span><span className="mt-1 flex items-center gap-1.5"><MhRarity rarity={group.rarity} /><span className="font-mono text-[0.625rem] uppercase text-txt-dim">{t(group.rank === "high" ? "highRank" : "lowRank")}</span></span></span>
                    <span className="font-mono text-[0.6875rem] text-txt-muted">{t("pieceCount", { count: groupPieces.length })}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div ref={detailRef} className="min-w-0 p-[clamp(1rem,2.4vw,2.25rem)]">
            {selectedSet ? (
              <div className="flex flex-col gap-3.5">
                <MhPanel title={selectedSet.name} icon="shield" aside={<div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant={allSelectedWishlisted ? "pri" : "ghost"} icon={allSelectedWishlisted ? "check" : "plus"} onClick={toggleSelectedWishlist}>{allSelectedWishlisted ? t("removeSelected") : t("addSelected")}</Button><Button size="sm" variant="pri" icon="target" onClick={planSet}>{t("planSet")}</Button></div>}>
                  <div className="flex flex-wrap items-center gap-2"><MhRarity rarity={selectedSet.rarity} /><MhTag>{t(selectedSet.rank === "high" ? "highRank" : "lowRank")}</MhTag>{selectedSet.variant ? <MhTag>{selectedSet.variant}</MhTag> : null}<span className="font-mono text-[0.6875rem] text-txt-muted">{t("selectedPieces", { count: selectedCount, total: visiblePieces.length })}</span></div>
                  {detailPiece && (
                    <div className="mt-3 grid grid-cols-[9rem_minmax(0,1fr)] gap-3 border border-[var(--mh-line)] bg-[var(--mh-soft)] p-2.5">
                      <ArmorDetailPreview piece={detailPiece} />
                      <div className="min-w-0 self-center">
                        <div className="font-display text-[0.95rem] font-bold leading-tight">{detailPiece.name}</div>
                        <div className="mt-1 font-mono text-[0.6875rem] text-txt-muted">{t(detailPiece.kind)} · {t("defense")} {detailPiece.defense.base}</div>
                        <div className="mt-2 flex flex-wrap gap-1">{detailPiece.skills.slice(0, 4).map((skill) => <MhTag key={`detail-${skill.id}`} sk>{skill.skill?.name} +{skill.level}</MhTag>)}</div>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex flex-col gap-1.5">
                    {visiblePieces.map((piece) => {
                      const active = !!selectedPieces[String(piece.id)]
                      const wishlisted = wishlist.has(armorWishlistEntry(piece).key)
                      return (
                        <div key={piece.id} className={`grid grid-cols-[minmax(0,1fr)_auto] items-stretch border ${active ? "border-[var(--mh)] bg-[var(--mh-soft)]" : "border-line bg-base-2"}`}>
                          <button
                            type="button"
                            aria-pressed={active}
                            onClick={() => { setDetailPieceId(String(piece.id)); setSelectedPieces((current) => ({ ...current, [String(piece.id)]: !current[String(piece.id)] })) }}
                            className="grid min-w-0 w-full grid-cols-[2.5rem_1fr_auto] items-center gap-2.5 border-0 bg-transparent px-2.5 py-2 text-left hover:bg-panel-2"
                          >
                            <span className="grid h-10 w-10 place-items-center border border-line bg-transparent"><ArmorThumb piece={piece} size={34} /></span>
                            <span className="min-w-0"><span className="block truncate font-body text-[0.8125rem] font-semibold">{piece.name}</span><span className="mt-1 flex flex-wrap gap-1">{piece.skills.slice(0, 3).map((skill) => <MhTag key={`${piece.id}-${skill.id}`} sk>{skill.skill?.name} +{skill.level}</MhTag>)}{piece.localAssetPath === null ? <MhTag>{t("assetUnavailable")}</MhTag> : null}</span></span>
                            <span className="flex flex-col items-end gap-1"><span className="font-mono text-[0.6875rem] text-txt-muted">{t(piece.kind)}</span><MhSlotPips slots={piece.slots} /></span>
                          </button>
                          <div className="flex items-center border-l border-line px-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={wishlisted ? "pri" : "ghost"}
                              icon={wishlisted ? "check" : "plus"}
                              aria-label={wishlisted ? wishlistT("build_planner.wishlist.remove") : wishlistT("build_planner.wishlist.add")}
                              title={wishlisted ? wishlistT("build_planner.wishlist.remove") : wishlistT("build_planner.wishlist.add")}
                              className="px-2"
                              onClick={() => wishlist.toggle(armorWishlistEntry(piece))}
                            >
                              <span className="hidden sm:inline">{wishlisted ? wishlistT("build_planner.wishlist.added") : wishlistT("build_planner.wishlist.add")}</span>
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </MhPanel>

                <MhPanel title={t("materialsTitle")} icon="hammer" count={requirements.materials.length} aside={<span className="font-mono text-[0.6875rem] text-txt-muted">{t("zenny", { amount: requirements.zenny.toLocaleString() })}</span>}>
                  {requirements.materials.length === 0 ? <Empty icon="hammer" title={t("noMaterials")} lead={t("noMaterialsLead")} /> : <div className="flex flex-col gap-[0.3125rem]">{requirements.materials.map((material) => <MhMaterial key={String(material.item.gameId ?? material.item.id)} item={material.item} name={material.item.name} rarity={material.item.rarity} quantity={material.quantity} />)}</div>}
                  <div className="mt-3 border border-line bg-base-2 px-2.5 py-2 font-mono text-[0.6875rem] leading-[1.35] text-txt-muted">{t("assetNote")}</div>
                </MhPanel>
              </div>
            ) : (
              <Empty icon="shield" title={t("selectSet")} lead={t("selectSetLead")} />
            )}
          </div>
        </div>
      </MhBody>
    </MhApp>
  )
}
