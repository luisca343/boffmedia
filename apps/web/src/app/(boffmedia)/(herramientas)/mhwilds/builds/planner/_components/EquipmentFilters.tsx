import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Search, ArrowUpDown, Filter, ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/primitives/badge";
import { X } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/primitives/dropdown-menu";
import { Filters, EquipmentType } from "../../../../../../../types/tools/mhwilds";
import { useTranslations } from "next-intl";

interface EquipmentFiltersProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  slotType: EquipmentType;
  sortDirection: 'asc' | 'desc';
  toggleSortDirection: () => void;
}

export const EquipmentFilters = ({ filters, setFilters, slotType, sortDirection, toggleSortDirection }: EquipmentFiltersProps) => {
  const t = useTranslations("mhwilds");
  const hasActiveFilters = filters.rarity.length > 0 || filters.element || filters.weaponType;
  
  const elements = ["fire", "water", "thunder", "ice", "dragon"];
  
  // Simpler weapon types as string array
  const weaponTypes = [
    "great-sword", "long-sword", "sword-shield", "dual-blades",
    "hammer", "hunting-horn", "lance", "gunlance", 
    "switch-axe", "charge-blade", "insect-glaive", 
    "light-bowgun", "heavy-bowgun", "bow"
  ];
  
  // Simplified rank ranges
  const rankRanges = [
    { label: t("low_rank"), value: [1, 2, 3, 4], isActive: false },
    { label: t("high_rank"), value: [5, 6, 7, 8, 9, 10], isActive: false },
  ];
  
  // Check which rank range is currently active
  rankRanges[0].isActive = rankRanges[0].value.every(r => filters.rarity.includes(r));
  rankRanges[1].isActive = rankRanges[1].value.every(r => filters.rarity.includes(r));
  
  const getElementColor = (element: string) => {
    const colorMap: Record<string, string> = {
      fire: "text-red-400 border-red-500",
      water: "text-secondary-400 border-secondary-500",
      thunder: "text-yellow-400 border-yellow-500",
      ice: "text-cyan-400 border-cyan-500",
      dragon: "text-accent-400 border-accent-500",
    };
    
    return colorMap[element] || "text-surface-400";
  };
  
  const handleRankChange = (range: number[]) => {
    const isRankActive = range.every(r => filters.rarity.includes(r));
    
    if (isRankActive) {
      setFilters({
        ...filters, 
        rarity: filters.rarity.filter(r => !range.includes(r))
      });
    } else {
      const otherRankValues = rankRanges.flatMap(r => r.value);
      const clearedRarity = filters.rarity.filter(r => !otherRankValues.includes(r));
      
      setFilters({
        ...filters,
        rarity: [...clearedRarity, ...range]
      });
    }
  };
  
  const handleElementChange = (element: string) => {
    setFilters({
      ...filters,
      element: filters.element === element ? undefined : element
    });
  };
  
  const handleWeaponTypeChange = (weaponType: string) => {
    setFilters({
      ...filters,
      weaponType: filters.weaponType === weaponType ? undefined : weaponType
    });
  };
  
  const clearFilters = () => {
    setFilters({
      ...filters,
      rarity: [],
      element: undefined,
      weaponType: undefined
    });
  };
  
  const getActiveRankLabel = () => {
    if (rankRanges[0].isActive) return t("low_rank");
    if (rankRanges[1].isActive) return t("high_rank");
    
    if (filters.rarity.length > 0) {
      return `Rareza: ${filters.rarity.sort().join(', ')}`;
    }
    
    return null;
  };
  
  const activeRankLabel = getActiveRankLabel();

  return (
    <div className="mb-4 space-y-2">
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-surface-500" />
          <Input 
            placeholder={t("build_planner.search")}
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="bg-surface-700 border-surface-600 pl-8"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className={`${hasActiveFilters ? 'text-primary-300 border-primary-700' : 'text-surface-300'}`}>
              <Filter className="mr-1 h-4 w-4" />
              {t("build_planner.filters")}
              {hasActiveFilters && 
                <Badge variant="secondary" className="ml-1 px-1 bg-primary-900 text-primary-300">
                  {(filters.rarity.length > 0 ? 1 : 0) + 
                   (filters.element ? 1 : 0) + 
                   (filters.weaponType ? 1 : 0)}
                </Badge>
              }
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-surface-800 border-surface-700" style={{ width: "340px" }}>
            <DropdownMenuLabel>{t("build_planner.filters")}</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-surface-700" />
            
            <div className="p-2 space-y-2">
              {/* Rank filters */}
              <div className="mb-2">
                <h4 className="text-xs text-surface-400 mb-1">Rango</h4>
                <div className="flex gap-2">
                  {rankRanges.map((rank) => (
                    <Button 
                      key={rank.label} 
                      variant={rank.isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleRankChange(rank.value)}
                      className={`text-xs h-6 px-2`}
                    >
                      {rank.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              {(slotType === 'weapon' || slotType === 'secondaryWeapon') && (
                <div className="space-y-2 pt-1">
                  {/* Weapon type filters in a more spacious grid */}
                  <div>
                    <h4 className="text-xs text-surface-400 mb-1">{t("weapon_type")}</h4>
                    <div className="grid grid-cols-3 gap-1">
                      {weaponTypes.map((weaponType) => (
                        <Button 
                          key={weaponType} 
                          variant={filters.weaponType === weaponType ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleWeaponTypeChange(weaponType)}
                          className={`text-xs h-6 px-2`}
                        >
                          {t(`weapons.${weaponType}`)}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Element filters in a single row */}
                  <div>
                    <h4 className="text-xs text-surface-400 mb-1">{t("element")}</h4>
                    <div className="grid grid-cols-5 gap-1">
                      {elements.map((element) => (
                        <Button 
                          key={element} 
                          variant={filters.element === element ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => handleElementChange(element)}
                          className={`text-xs h-6 px-2 ${
                            filters.element === element 
                              ? `bg-surface-800 ${getElementColor(element)}` 
                              : ""
                          }`}
                        >
                          {t(element)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {hasActiveFilters && (
                <Button 
                  onClick={clearFilters} 
                  variant="error" 
                  size="sm"
                  className="w-full mt-2"
                >
                  <X className="h-4 w-4 mr-1" /> {t("build_planner.clear_filters")}
                </Button>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button 
          variant="outline" 
          className="text-surface-300"
          onClick={toggleSortDirection}
        >
          {sortDirection === 'asc' ? (
            <ArrowUp className="mr-1 h-4 w-4" />
          ) : (
            <ArrowDown className="mr-1 h-4 w-4" />
          )}
          {t("build_planner.sort")}
        </Button>
      </div>
      
      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-surface-400">{t("build_planner.active_filters")}:</span>
          
          {activeRankLabel && (
            <Badge variant="outline" className="bg-surface-700 text-surface-200 border-surface-600">
              {activeRankLabel}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => setFilters({...filters, rarity: []})}
              />
            </Badge>
          )}
          
          {filters.element && (
            <Badge 
              variant="outline" 
              className={`bg-surface-700 capitalize ${getElementColor(filters.element)}`}
            >
              {t(filters.element)}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => setFilters({...filters, element: undefined})}
              />
            </Badge>
          )}
          
          {filters.weaponType && (
            <Badge 
              variant="outline" 
              className="bg-surface-700 text-surface-200 border-surface-600"
            >
              {t(`weapons.${filters.weaponType}`)}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => setFilters({...filters, weaponType: undefined})}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};