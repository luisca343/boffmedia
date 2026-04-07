import { Input } from "@/components/ui/primitives/input";
import { Search, ArrowUp, ArrowDown, Filter, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/primitives/dropdown-menu";
import { Button } from "@/components/ui/primitives/button";
import { Filters, EquipmentType } from "@/types/tools/mhwilds";
import { useTranslations } from "next-intl";

interface EquipmentFiltersProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  slotType: EquipmentType;
  sortDirection: 'asc' | 'desc';
  toggleSortDirection: () => void;
}

// ─── Filter pill ──────────────────────────────────────────────────────────────

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-widest transition-all duration-150 ${
        active ? "text-primary-300" : "text-surface-400 hover:text-surface-200"
      }`}
      style={
        active
          ? { background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.35)" }
          : { background: "transparent", border: "1px solid rgba(71,85,105,0.25)" }
      }
    >
      {children}
    </button>
  );
}

// ─── Active badge ─────────────────────────────────────────────────────────────

function ActiveBadge({
  label,
  onRemove,
  colorClass = "text-surface-300",
}: {
  label: string;
  onRemove: () => void;
  colorClass?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest ${colorClass}`}
      style={{ background: "rgba(30,41,59,0.8)", border: "1px solid rgba(71,85,105,0.4)" }}
    >
      {label}
      <X className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100" onClick={onRemove} />
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const EquipmentFilters = ({
  filters,
  setFilters,
  slotType,
  sortDirection,
  toggleSortDirection,
}: EquipmentFiltersProps) => {
  const t = useTranslations("mhwilds");
  const hasActiveFilters = filters.rarity.length > 0 || filters.element || filters.weaponType;

  const elements = ["fire", "water", "thunder", "ice", "dragon"];
  const weaponTypes = [
    "great-sword", "long-sword", "sword-shield", "dual-blades",
    "hammer", "hunting-horn", "lance", "gunlance",
    "switch-axe", "charge-blade", "insect-glaive",
    "light-bowgun", "heavy-bowgun", "bow"
  ];
  const rankRanges = [
    { label: t("low_rank"),  value: [1, 2, 3, 4],          isActive: false },
    { label: t("high_rank"), value: [5, 6, 7, 8, 9, 10],   isActive: false },
  ];
  rankRanges[0].isActive = rankRanges[0].value.every(r => filters.rarity.includes(r));
  rankRanges[1].isActive = rankRanges[1].value.every(r => filters.rarity.includes(r));

  const getElementColor = (element: string) => {
    const map: Record<string, string> = {
      fire:    "text-red-400",
      water:   "text-secondary-400",
      thunder: "text-yellow-400",
      ice:     "text-cyan-400",
      dragon:  "text-accent-400",
    };
    return map[element] || "text-surface-400";
  };

  const handleRankChange = (range: number[]) => {
    const isRankActive = range.every(r => filters.rarity.includes(r));
    if (isRankActive) {
      setFilters({ ...filters, rarity: filters.rarity.filter(r => !range.includes(r)) });
    } else {
      const otherRankValues = rankRanges.flatMap(r => r.value);
      const clearedRarity = filters.rarity.filter(r => !otherRankValues.includes(r));
      setFilters({ ...filters, rarity: [...clearedRarity, ...range] });
    }
  };

  const getActiveRankLabel = () => {
    if (rankRanges[0].isActive) return t("low_rank");
    if (rankRanges[1].isActive) return t("high_rank");
    if (filters.rarity.length > 0) return `Rareza: ${filters.rarity.sort().join(', ')}`;
    return null;
  };

  const activeRankLabel = getActiveRankLabel();

  return (
    <div className="mb-4 space-y-2">
      <div className="flex space-x-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-surface-500" />
          <Input
            placeholder={t("build_planner.search")}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="bg-surface-900/60 border-surface-700/60 pl-8 placeholder:text-surface-500"
          />
        </div>

        {/* Filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={hasActiveFilters ? "text-primary-300 border-primary-500/40" : "text-surface-300"}
            >
              <Filter className="mr-1 h-4 w-4" />
              {t("build_planner.filters")}
              {hasActiveFilters && (
                <span
                  className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono"
                  style={{ background: "rgba(249,115,22,0.15)", color: "rgba(251,146,60,0.9)" }}
                >
                  {(filters.rarity.length > 0 ? 1 : 0) +
                    (filters.element ? 1 : 0) +
                    (filters.weaponType ? 1 : 0)}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="border-0"
            style={{
              width: "340px",
              background: "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(9,13,27,0.99))",
              border: "1px solid rgba(249,115,22,0.18)",
            }}
          >
            <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-widest text-surface-500">
              {t("build_planner.filters")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator style={{ background: "rgba(71,85,105,0.3)" }} />
            <div className="p-3 space-y-3">
              {/* Rank filters */}
              <div>
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-surface-500 mb-1.5">
                  Rango
                </h4>
                <div className="flex gap-2">
                  {rankRanges.map(rank => (
                    <FilterPill
                      key={rank.label}
                      active={rank.isActive}
                      onClick={() => handleRankChange(rank.value)}
                    >
                      {rank.label}
                    </FilterPill>
                  ))}
                </div>
              </div>

              {(slotType === 'weapon' || slotType === 'secondaryWeapon') && (
                <>
                  {/* Weapon type filters */}
                  <div>
                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-surface-500 mb-1.5">
                      {t("weapon_type")}
                    </h4>
                    <div className="grid grid-cols-3 gap-1">
                      {weaponTypes.map(weaponType => (
                        <FilterPill
                          key={weaponType}
                          active={filters.weaponType === weaponType}
                          onClick={() => setFilters({
                            ...filters,
                            weaponType: filters.weaponType === weaponType ? undefined : weaponType
                          })}
                        >
                          {t(`weapons.${weaponType}`)}
                        </FilterPill>
                      ))}
                    </div>
                  </div>

                  {/* Element filters */}
                  <div>
                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-surface-500 mb-1.5">
                      {t("element")}
                    </h4>
                    <div className="grid grid-cols-5 gap-1">
                      {elements.map(element => (
                        <FilterPill
                          key={element}
                          active={filters.element === element}
                          onClick={() => setFilters({
                            ...filters,
                            element: filters.element === element ? undefined : element
                          })}
                        >
                          <span className={getElementColor(element)}>{t(element)}</span>
                        </FilterPill>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, rarity: [], element: undefined, weaponType: undefined })}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs text-red-400 hover:text-red-300 transition-colors mt-1"
                  style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  <X className="h-3.5 w-3.5" /> {t("build_planner.clear_filters")}
                </button>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort direction */}
        <Button variant="outline" className="text-surface-300" onClick={toggleSortDirection}>
          {sortDirection === 'asc'
            ? <ArrowUp className="mr-1 h-4 w-4" />
            : <ArrowDown className="mr-1 h-4 w-4" />}
          {t("build_planner.sort")}
        </Button>
      </div>

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono text-surface-500">{t("build_planner.active_filters")}:</span>
          {activeRankLabel && (
            <ActiveBadge label={activeRankLabel} onRemove={() => setFilters({ ...filters, rarity: [] })} />
          )}
          {filters.element && (
            <ActiveBadge
              label={t(filters.element)}
              colorClass={`capitalize ${getElementColor(filters.element)}`}
              onRemove={() => setFilters({ ...filters, element: undefined })}
            />
          )}
          {filters.weaponType && (
            <ActiveBadge
              label={t(`weapons.${filters.weaponType}`)}
              onRemove={() => setFilters({ ...filters, weaponType: undefined })}
            />
          )}
        </div>
      )}
    </div>
  );
};
