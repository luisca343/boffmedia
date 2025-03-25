import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filters, EquipmentType } from "./types";
import { useTranslations } from "next-intl";

interface EquipmentFiltersProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  slotType: EquipmentType;
}

export const EquipmentFilters = ({ filters, setFilters, slotType }: EquipmentFiltersProps) => {
  const t = useTranslations("mhwilds");
  const hasActiveFilters = filters.rarity.length > 0 || filters.element;
  
  const elements = ["fire", "water", "thunder", "ice", "dragon"];
  
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
      water: "text-blue-400 border-blue-500",
      thunder: "text-yellow-400 border-yellow-500",
      ice: "text-cyan-400 border-cyan-500",
      dragon: "text-purple-400 border-purple-500",
    };
    
    return colorMap[element] || "text-surface-400";
  };
  
  const handleRankChange = (range: number[]) => {
    const isRankActive = range.every(r => filters.rarity.includes(r));
    
    if (isRankActive) {
      // If the rank is already active, remove it
      setFilters({
        ...filters, 
        rarity: filters.rarity.filter(r => !range.includes(r))
      });
    } else {
      // If selecting a new rank, toggle between ranks
      // First, remove all rarity filters
      const otherRankValues = rankRanges.flatMap(r => r.value);
      const clearedRarity = filters.rarity.filter(r => !otherRankValues.includes(r));
      
      // Then add the new rank values
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
  
  const clearFilters = () => {
    setFilters({
      ...filters,
      rarity: [],
      element: undefined
    });
  };
  
  // Get the currently active rank label
  const getActiveRankLabel = () => {
    if (rankRanges[0].isActive) return t("low_rank");
    if (rankRanges[1].isActive) return t("high_rank");
    
    // Check if it's a mix of rarities that don't exactly match any predefined range
    if (filters.rarity.length > 0) {
      return `Rareza: ${filters.rarity.sort().join(', ')}`;
    }
    
    return null;
  };
  
  const activeRankLabel = getActiveRankLabel();
  
  return (
    <div className="mb-4 space-y-3">
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
                  {(filters.rarity.length > 0 ? 1 : 0) + (filters.element ? 1 : 0)}
                </Badge>
              }
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-surface-800 border-surface-700">
            <DropdownMenuLabel>{t("build_planner.filters")}</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-surface-700" />
            
            <DropdownMenuLabel className="text-xs text-surface-400">Rango</DropdownMenuLabel>
            {rankRanges.map((rank) => (
              <DropdownMenuItem 
                key={rank.label} 
                onClick={() => handleRankChange(rank.value)}
                className="flex items-center justify-between cursor-pointer"
              >
                {rank.label}
                {rank.isActive && (
                  <Badge className="bg-primary-900 text-primary-300">✓</Badge>
                )}
              </DropdownMenuItem>
            ))}
            
            {slotType === 'weapon' || slotType === 'secondaryWeapon' && (
              <>
                <DropdownMenuSeparator className="bg-surface-700" />
                <DropdownMenuLabel className="text-xs text-surface-400">{t("element")}</DropdownMenuLabel>
                {elements.map((element) => (
                  <DropdownMenuItem 
                    key={element} 
                    onClick={() => handleElementChange(element)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span className={`capitalize ${element === filters.element ? getElementColor(element) : ''}`}>
                      {t(element)}
                    </span>
                    {element === filters.element && (
                      <Badge className="bg-primary-900 text-primary-300">✓</Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            
            {hasActiveFilters && (
              <>
                <DropdownMenuSeparator className="bg-surface-700" />
                <DropdownMenuItem onClick={clearFilters} className="text-red-400 cursor-pointer">
                  <X className="h-4 w-4 mr-1" /> {t("build_planner.clear_filters")}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button variant="outline" className="text-surface-300">
          <ArrowUpDown className="mr-1 h-4 w-4" /> {t("build_planner.sort")}
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
              {filters.element}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => setFilters({...filters, element: undefined})}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};