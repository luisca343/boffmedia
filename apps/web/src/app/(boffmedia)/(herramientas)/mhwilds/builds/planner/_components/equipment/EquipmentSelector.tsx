import { useState, useEffect } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Loader2, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/primitives/scroll-area";
import { ArmorPiece, BuildData, Charm, EquipmentType, Filters, Weapon } from "@/types/tools/mhwilds";
import { getEquipmentDisplayName, getEquipmentIcon, getIconColor } from "../equipment-utils";
import { EquipmentFilters } from "./EquipmentFilters";
import { EquipmentItem } from "./EquipmentItem";
import { CurrentEquipment } from "./CurrentEquipment";
import { useTranslations } from "next-intl";
import { MHWildsPanel, MHWildsPanelHeader, MHWildsPanelTitle } from "../MHWildsPanel";

interface EquipmentSelectorProps {
  slotType: EquipmentType;
  currentBuild: BuildData;
  setCurrentBuild: (build: BuildData) => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onClose: () => void;
  isLoading: boolean;
  equipmentData: ArmorPiece[] | Weapon[] | Charm[];
}

export function EquipmentSelector({
  slotType,
  currentBuild,
  setCurrentBuild,
  filters,
  setFilters,
  onClose,
  isLoading,
  equipmentData
}: EquipmentSelectorProps) {
  const t = useTranslations("mhwilds");
  const [equipment, setEquipment] = useState<ArmorPiece[] | Weapon[] | Charm[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<ArmorPiece[] | Weapon[] | Charm[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [initialFilterApplied, setInitialFilterApplied] = useState(false);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const EquipmentIcon = getEquipmentIcon(slotType);
  const iconColor = getIconColor(slotType);

  const toggleSortDirection = () => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');

  useEffect(() => {
    if (!isLoading && equipmentData.length > 0) {
      setEquipment(equipmentData);
      setError(null);
    }
  }, [equipmentData, isLoading]);

  useEffect(() => {
    if (!initialFilterApplied && !isLoading && equipment.length > 0) {
      if (filters.rarity.length === 0) {
        setFilters(prev => ({ ...prev, rarity: [5, 6, 7, 8, 9, 10] }));
      }
      setInitialFilterApplied(true);
    }
  }, [equipment, isLoading, filters.rarity, initialFilterApplied, setFilters]);

  useEffect(() => {
    if (isLoading || error) return;
    let result = [...equipment];
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower))
      );
    }
    if (filters.rarity.length > 0) {
      result = result.filter(item => filters.rarity.includes(item.rarity));
    }
    if (filters.weaponType && (slotType === 'weapon' || slotType === 'secondaryWeapon')) {
      result = result.filter(item => {
        const weapon = item as Weapon;
        return weapon.kind?.toLowerCase() === filters.weaponType?.toLowerCase();
      });
    }
    if (filters.element && (slotType === 'weapon' || slotType === 'secondaryWeapon')) {
      result = result.filter(item => {
        const weapon = item as Weapon;
        if (weapon.element?.type?.toLowerCase() === filters.element) return true;
        if (weapon.specials && Array.isArray(weapon.specials)) {
          for (const special of weapon.specials) {
            if (special.type && typeof special.type === 'string' && special.type.toLowerCase() === filters.element) return true;
            if (special.element && typeof special.element === 'string' && special.element.toLowerCase() === filters.element) return true;
            if (special.kind === 'element' && special.element && typeof special.element === 'string' && special.element.toLowerCase() === filters.element) return true;
          }
        }
        return false;
      });
    }
    setFilteredEquipment(result as ArmorPiece[] | Weapon[]);
  }, [equipment, filters, slotType, isLoading, error]);

  const sortedEquipment = [...filteredEquipment].sort((a, b) =>
    sortDirection === 'asc' ? a.rarity - b.rarity : b.rarity - a.rarity
  );

  const selectEquipment = (item: ArmorPiece | Weapon | Charm) => {
    setCurrentBuild({ ...currentBuild, [slotType]: item });
    onClose();
  };

  const removeEquipment = () => {
    setCurrentBuild({ ...currentBuild, [slotType]: null });
    onClose();
  };

  function renderEquipmentList() {
    if (isLoading) {
      return (
        <div
          className="h-[400px] flex items-center justify-center gap-2 rounded-lg"
          style={{ background: "rgba(15,23,42,0.4)" }}
        >
          <Loader2 className="h-6 w-6 text-primary-hover animate-spin" />
          <span className="text-ink-muted text-sm">
            {t("build_planner.loading", { item: t("equipment").toLowerCase() })}
          </span>
        </div>
      );
    }

    if (error) {
      return (
        <div
          className="h-[400px] flex flex-col items-center justify-center gap-3 rounded-lg"
          style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <p className="text-sm" style={{ color: "rgba(252,165,165,0.9)" }}>{error}</p>
          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
            onClick={() => setError(null)}>
            {t("build_planner.retry")}
          </Button>
        </div>
      );
    }

    return (
      <ScrollArea
        className="h-[400px] rounded-lg p-2"
        style={{ border: "1px solid rgba(71,85,105,0.3)" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {sortedEquipment.length > 0 ? (
            sortedEquipment.map((item, i) => (
              <EquipmentItem key={item.id} item={item} slotType={slotType} index={i} onSelect={selectEquipment} />
            ))
          ) : (
            <div className="col-span-2 text-center p-8 text-ink-muted">
              <p>{t("build_planner.no_equipment_found")}</p>
            </div>
          )}
        </div>
      </ScrollArea>
    );
  }

  return (
    <MHWildsPanel>
      <MHWildsPanelHeader>
        <div className="flex items-center gap-2">
          <EquipmentIcon className={`h-5 w-5 ${iconColor}`} />
          <MHWildsPanelTitle>
            {t("build_planner.select")} {getEquipmentDisplayName(slotType)}
          </MHWildsPanelTitle>
        </div>
        <Button variant="ghost" size="sm" className="text-ink-muted hover:text-ink" onClick={onClose}>
          <X className="h-4 w-4 mr-1" /> {t("build_planner.close")}
        </Button>
      </MHWildsPanelHeader>

      <div className="p-4">
        {currentBuild[slotType] && (
          <CurrentEquipment equipment={currentBuild[slotType]!} slotType={slotType} onRemove={removeEquipment} />
        )}
        <EquipmentFilters
          filters={filters}
          setFilters={setFilters}
          slotType={slotType}
          sortDirection={sortDirection}
          toggleSortDirection={toggleSortDirection}
        />
        {renderEquipmentList()}
      </div>
    </MHWildsPanel>
  );
}
