import { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  Loader2,
  X,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArmorPiece, BuildData, EquipmentType, Filters, Weapon } from "./types";
import { getEquipmentDisplayName, getEquipmentIcon, getIconColor } from "./equipment-utils";
import { EquipmentFilters } from "./EquipmentFilters";
import { EquipmentItem } from "./EquipmentItem";
import { CurrentEquipment } from "./CurrentEquipment";

interface EquipmentSelectorProps {
  slotType: EquipmentType;
  currentBuild: BuildData;
  setCurrentBuild: React.Dispatch<React.SetStateAction<BuildData>>;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onClose: () => void;
  cachedData?: ArmorPiece[] | Weapon[];
  updateCache: (data: ArmorPiece[] | Weapon[]) => void;
}

export function EquipmentSelector({ 
  slotType, 
  currentBuild, 
  setCurrentBuild,
  filters,
  setFilters,
  onClose,
  cachedData = [],
  updateCache
}: EquipmentSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [equipment, setEquipment] = useState<ArmorPiece[] | Weapon[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<ArmorPiece[] | Weapon[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [initialFilterApplied, setInitialFilterApplied] = useState(false);

  const EquipmentIcon = getEquipmentIcon(slotType);
  const iconColor = getIconColor(slotType);

  // Set default filter for high rank equipment (rarity 5+)
  useEffect(() => {
    if (!initialFilterApplied && !loading && equipment.length > 0) {
      // Only apply if no filters are already set
      if (filters.rarity.length === 0) {
        setFilters(prev => ({
          ...prev,
          rarity: [5, 6, 7, 8, 9, 10]
        }));
      }
      setInitialFilterApplied(true);
    }
  }, [equipment, loading, filters.rarity, initialFilterApplied, setFilters]);

  // Fetch equipment data from API
  useEffect(() => {
    const fetchEquipment = async () => {
      // Use cached data if available, regardless of search filter
      if (cachedData.length > 0) {
        setEquipment(cachedData);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        if (slotType === 'weapon') {
          await fetchWeapons();
        } else {
          await fetchArmor();
        }
      } catch (err) {
        console.error("Error fetching equipment:", err);
        setError("Error al cargar el equipamiento. Por favor, inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchEquipment();
  }, [slotType, cachedData, updateCache]);

  // Apply filters whenever filters or equipment changes
  useEffect(() => {
    // Skip if still loading or has error
    if (loading || error) return;
    
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
    
    // Apply element filter (only for weapons)
    if (filters.element && slotType === 'weapon') {
      result = result.filter(item => {
        // Check both standard element and backward compatibility
        const weapon = item as Weapon;
        
        // Check modern structure
        if (weapon.element?.type?.toLowerCase() === filters.element) {
          return true;
        }
        
        // Check specials array for backward compatibility
        if (weapon.specials && Array.isArray(weapon.specials)) {
          // Handle different possible structures in specials
          for (const special of weapon.specials) {
            // Case 1: special has type property directly
            if (special.type && typeof special.type === 'string' && 
                special.type.toLowerCase() === filters.element) {
              return true;
            }
            
            // Case 2: special has element property (as seen in the error example)
            if (special.element && typeof special.element === 'string' && 
                special.element.toLowerCase() === filters.element) {
              return true;
            }
            
            // Case 3: special has kind="element" and element matches
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
  }, [equipment, filters, slotType, loading, error]);
  
  // Function to fetch weapons
  const fetchWeapons = async () => {
    const response = await axios.get("https://api.ficuslab.es/data/mhwilds/weapons.json");
    let weapons = response.data;

    // Add backward compatibility fields
    weapons = weapons.map((weapon: Weapon) => ({
      ...weapon,
      type: weapon.kind,
      attack: weapon.damage?.display || 0,
      element: weapon.specials?.find(s => 
        ["fire", "water", "thunder", "ice", "dragon"].includes(s.type)
      ) ? {
        type: weapon.specials.find(s => 
          ["fire", "water", "thunder", "ice", "dragon"].includes(s.type)
        )?.type || "",
        damage: weapon.specials.find(s => 
          ["fire", "water", "thunder", "ice", "dragon"].includes(s.type)
        )?.damage || 0
      } : undefined,
    }));
    
    setEquipment(weapons);
    updateCache(weapons);
  };

  // Function to fetch armor
  const fetchArmor = async () => {
    const data = await axios.get("https://api.ficuslab.es/data/mhwilds/armor.json");
    
    // Filter armor by the specified slot type
    const filteredArmor = data.data.filter((item: ArmorPiece) => item.kind === slotType);
    
    setEquipment(filteredArmor);
    updateCache(filteredArmor);
  };

  // Sort equipment by rarity as default
  const sortedEquipment = [...filteredEquipment].sort((a, b) => a.rarity - b.rarity);

  const selectEquipment = (item: ArmorPiece | Weapon) => {
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
            Seleccionar {getEquipmentDisplayName(slotType)}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4 mr-1" /> Cerrar
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
        />

        {/* Equipment list */}
        {renderEquipmentList()}
      </CardContent>
    </Card>
  );

  // Helper function to render equipment list with appropriate loading and error states
  function renderEquipmentList() {
    if (loading) {
      return (
        <div className="h-[400px] flex items-center justify-center bg-surface-800/50 rounded-md">
          <Loader2 className="h-8 w-8 text-primary-400 animate-spin" />
          <span className="ml-2 text-surface-300">Cargando equipamiento...</span>
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
              setLoading(true);
              setError(null);
              if (slotType === 'weapon') {
                fetchWeapons();
              } else {
                fetchArmor();
              }
            }}
          >
            Reintentar
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
              <p>No se encontró ningún equipamiento con los filtros actuales</p>
            </div>
          )}
        </div>
      </ScrollArea>
    );
  }
}