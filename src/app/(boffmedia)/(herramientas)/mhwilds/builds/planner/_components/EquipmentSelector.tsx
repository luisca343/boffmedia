import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/primitives/card";
import { Button } from "@/components/ui/primitives/button";
import { 
  ArrowDown,
  ArrowUp,
  ChevronLeft, 
  Loader2,
  X,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/primitives/scroll-area";
import { ArmorPiece, BuildData, Charm, EquipmentType, Filters, Weapon } from "../../../../../../../types/tools/mhwilds";
import { getEquipmentDisplayName, getEquipmentIcon, getIconColor } from "./equipment-utils";
import { EquipmentFilters } from "./EquipmentFilters";
import { EquipmentItem } from "./EquipmentItem";
import { CurrentEquipment } from "./CurrentEquipment";
import { useTranslations } from "next-intl";

interface EquipmentSelectorProps {
  slotType: EquipmentType;
  currentBuild: BuildData; // This now receives the build with full objects
  setCurrentBuild: (build: BuildData) => void; // This will be intercepted in page.tsx
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onClose: () => void;
  isLoading: boolean;
  equipmentData: ArmorPiece[] | Weapon[] | Charm[]
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

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Update equipment when equipmentData changes
  useEffect(() => {
    if (!isLoading && equipmentData.length > 0) {
      setEquipment(equipmentData);
      setError(null);
    }
  }, [equipmentData, isLoading]);

  // Set default filter for high rank equipment (rarity 5+)
  useEffect(() => {
    if (!initialFilterApplied && !isLoading && equipment.length > 0) {
      // Only apply if no filters are already set
      if (filters.rarity.length === 0) {
        setFilters(prev => ({
          ...prev,
          rarity: [5, 6, 7, 8, 9, 10]
        }));
      }
      setInitialFilterApplied(true);
    }
  }, [equipment, isLoading, filters.rarity, initialFilterApplied, setFilters]);

  // Apply filters whenever filters or equipment changes
  useEffect(() => {
    // Skip if still loading or has error
    if (isLoading || error) return;
    
    let result = [...equipment];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply rarity filter
    if (filters.rarity.length > 0) {
      result = result.filter(item => filters.rarity.includes(item.rarity));
    }
    
    // Apply weapon type filter (only for weapons)
    if (filters.weaponType && (slotType === 'weapon' || slotType === 'secondaryWeapon')) {
      result = result.filter(item => {
        const weapon = item as Weapon;
        return weapon.kind?.toLowerCase() === filters.weaponType?.toLowerCase();
      });
    }
    
    // Apply element filter (only for weapons)
    if (filters.element && (slotType === 'weapon' || slotType === 'secondaryWeapon')) {
      result = result.filter(item => {
        // Check both standard element and backward compatibility
        const weapon = item as Weapon;
        
        // Check modern structure
        if (weapon.element?.type?.toLowerCase() === filters.element) {
          return true;
        }
        
        // Check specials array for backward compatibility
        if (weapon.specials && Array.isArray(weapon.specials)) {
          for (const special of weapon.specials) {
            if (special.type && typeof special.type === 'string' && 
                special.type.toLowerCase() === filters.element) {
              return true;
            }
            
            if (special.element && typeof special.element === 'string' && 
                special.element.toLowerCase() === filters.element) {
              return true;
            }
            
            if (special.kind === 'element' && special.element && 
                typeof special.element === 'string' && 
                special.element.toLowerCase() === filters.element) {
              return true;
            }
          }
        }
        
        return false;
      });
    }
    
    setFilteredEquipment(result as ArmorPiece[] | Weapon[]);
  }, [equipment, filters, slotType, isLoading, error]);

  // Sort equipment by rarity as default
  const sortedEquipment = [...filteredEquipment].sort((a, b) => {
    return sortDirection === 'asc' 
      ? a.rarity - b.rarity 
      : b.rarity - a.rarity;
  });

  const selectEquipment = (item: ArmorPiece | Weapon | Charm) => {
    setCurrentBuild({
      ...currentBuild,
      [slotType]: item
    });
    onClose();
  };

  const removeEquipment = () => {
    setCurrentBuild({
      ...currentBuild,
      [slotType]: null
    });
    onClose();
  };

  return (
    <Card className="bg-surface-800 border-surface-700">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <EquipmentIcon className={`mr-2 h-5 w-5 ${iconColor}`} />
            {t("build_planner.select")} {getEquipmentDisplayName(slotType)}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4 mr-1" /> {t("build_planner.close")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Current equipment */}
        {currentBuild[slotType] && (
          <CurrentEquipment 
            equipment={currentBuild[slotType]!} 
            slotType={slotType} 
            onRemove={removeEquipment} 
          />
        )}

        {/* Filters */}
        <EquipmentFilters 
          filters={filters} 
          setFilters={setFilters} 
          slotType={slotType}
          sortDirection={sortDirection}
          toggleSortDirection={toggleSortDirection}
        />
        {/* Equipment list */}
        {renderEquipmentList()}
      </CardContent>
    </Card>
  );

  // Helper function to render equipment list with appropriate loading and error states
  function renderEquipmentList() {
    if (isLoading) {
      return (
        <div className="h-[400px] flex items-center justify-center bg-surface-800/50 rounded-md">
          <Loader2 className="h-8 w-8 text-primary-400 animate-spin" />
          <span className="ml-2 text-surface-300">{t("build_planner.loading", {item: t("equipment").toLowerCase()})}</span>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="h-[400px] flex flex-col items-center justify-center bg-surface-800/50 rounded-md">
          <div className="text-red-400 mb-2">{error}</div>
          <Button 
            variant="outline" 
            onClick={() => {
              setError(null);
            }}
          >
            {t("build_planner.retry")}
          </Button>
        </div>
      );
    }
    
    return (
      <ScrollArea className="h-[400px] rounded-md border border-surface-700 p-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {sortedEquipment.length > 0 ? (
            sortedEquipment.map((item, i) => (
              <EquipmentItem 
                key={item.id} 
                item={item} 
                slotType={slotType} 
                index={i} 
                onSelect={selectEquipment} 
              />
            ))
          ) : (
            <div className="col-span-2 text-center p-8 text-surface-400">
              <p>{t("build_planner.no_equipment_found")}</p>
            </div>
          )}
        </div>
      </ScrollArea>
    );
  }
}