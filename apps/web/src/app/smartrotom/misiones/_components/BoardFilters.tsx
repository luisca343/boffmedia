"use client"

import { useTranslations } from "next-intl"
import type { Region, SealStatus } from "../_types"
import { SEAL_STATUSES, STATUS_LABEL } from "../_utils/status"
import { Button, Chip, Icon, SearchField, Select } from "./ui"

export type SortKey = "status" | "level" | "name"

/** The reinos strip — one chip per real category on the board. */
export function RegionStrip({
  regions,
  active,
  onSelect,
}: {
  regions: Region[]
  active: string | null
  onSelect: (id: string | null) => void
}) {
  const t = useTranslations("misiones.boardFilters")
  if (regions.length === 0) return null

  return (
    <div className="mb-[18px]">
      <div className="mb-2.5 flex items-center gap-3 text-ms-gold-1">
        <span className="font-ms-display text-lg tracking-[.04em]">{t("filterByKingdom")}</span>
        <div className="h-px flex-1 bg-gradient-to-r from-ms-gold-3 to-transparent opacity-50" />
        {active && (
          <Button variant="dark" sm onClick={() => onSelect(null)}>
            <Icon.X size={11} /> {t("remove")}
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {regions.map((region) => (
          <Chip
            key={region.id}
            active={active === region.id}
            onClick={() => onSelect(active === region.id ? null : region.id)}
          >
            <Icon.Pin size={11} /> {region.name}
            <span className="opacity-65">({region.questIds.length})</span>
          </Chip>
        ))}
      </div>
    </div>
  )
}

/** Search, the five seals, and the order the papers hang in. */
export function BoardFilters({
  search,
  onSearch,
  status,
  onStatus,
  sort,
  onSort,
  counts,
}: {
  search: string
  onSearch: (value: string) => void
  status: SealStatus | "ALL"
  onStatus: (value: SealStatus | "ALL") => void
  sort: SortKey
  onSort: (value: SortKey) => void
  counts: Record<string, number>
}) {
  const t = useTranslations("misiones.boardFilters")
  return (
    <div className="ms-filters mb-6 flex flex-wrap items-center gap-3">
      <SearchField
        className="max-w-[320px] flex-[1_1_240px]"
        placeholder={t("searchPlaceholder")}
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        aria-label={t("searchLabel")}
      />

      <div className="flex flex-wrap gap-1.5">
        {(["ALL", ...SEAL_STATUSES] as const).map((key) => (
          <Chip key={key} active={status === key} onClick={() => onStatus(key)}>
            {key === "ALL" ? t("all") : STATUS_LABEL[key]}
            <span className="opacity-65">({counts[key] ?? 0})</span>
          </Chip>
        ))}
      </div>

      <div className="flex-1" />

      <Select value={sort} onChange={(event) => onSort(event.target.value as SortKey)} aria-label={t("searchLabel")}>
        <option value="status">{t("sortOrder")}</option>
        <option value="level">{t("sortLevel")}</option>
        <option value="name">{t("sortName")}</option>
      </Select>
    </div>
  )
}
