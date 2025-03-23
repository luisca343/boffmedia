import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, 
  ChevronLeft, 
  Filter, 
  ArrowUpDown,
  Gem,
  Check,
  Loader2
} from "lucide-react";
import { 
  BuildData,
  EquipmentType, 
  Decoration,
  Filters
} from "./types";

interface DecorationSelectorProps {
  equipmentType: EquipmentType;
  slotIndex: number;
  slotSize: number;
  currentBuild: BuildData;
  setCurrentBuild: React.Dispatch<React.SetStateAction<BuildData>>;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onClose: () => void;
}

export function DecorationSelector({
  equipmentType,
  slotIndex,
  slotSize,
  currentBuild,
  setCurrentBuild,
  filters,
  setFilters,
  onClose
}: DecorationSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decorations, setDecorations] = useState<Decoration[]>([]);
  const [filteredDecorations, setFilteredDecorations] = useState<Decoration[]>([]);
  
  // Get the currently assigned decoration, if any
  const currentDecoration = currentBuild.decorations?.find(
    d => d.equipmentType === equipmentType && d.slotIndex === slotIndex
  )?.decoration;

  // Make sure we clear the rarity filter on mount
  useEffect(() => {
    if (filters.rarity.length > 0) {
      setFilters(prev => ({
        ...prev,
        rarity: []
      }));
    }
  }, []);

  // Fetch decorations data
  useEffect(() => {
    const fetchDecorations = async () => {
      setLoading(true);
      try {
        const response = await axios.get("https://api.ficuslab.es/data/mhwilds/decorations.json");
        setDecorations(response.data);
      } catch (err) {
        console.error("Error fetching decorations:", err);
        setError("Error al cargar las decoraciones. Por favor, inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDecorations();
  }, []);

  // Apply filters and slot size constraint
  useEffect(() => {
    if (loading) return;
    
    // Start with all decorations
    let filtered = [...decorations];
    
    // Only show decorations that fit in the slot
    filtered = filtered.filter(deco => deco.slot <= slotSize);
    
    // Filter by decoration kind - weapon decorations only go on weapons, armor only on armor
    filtered = filtered.filter(deco => {
      // If decoration has no kind specified, allow it on any equipment
      if (!deco.kind) return true;
      
      // For weapon decorations
      if (deco.kind === 'weapon') {
        return equipmentType === 'weapon';
      }
      
      // For armor decorations
      if (deco.kind === 'armor') {
        return equipmentType !== 'weapon';
      }
      
      // Any other kind, allow it on any equipment
      return true;
    });
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(deco => 
        deco.name.toLowerCase().includes(searchLower) ||
        (deco.description && deco.description.toLowerCase().includes(searchLower)) ||
        deco.skills.some(skill => skill.skill.name.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply rarity filter if needed
    if (filters.rarity && filters.rarity.length > 0) {
      filtered = filtered.filter(deco => filters.rarity.includes(deco.rarity));
    }
    
    // Sort by slot level (highest first), then by rarity
    filtered.sort((a, b) => {
      if (a.slot !== b.slot) return b.slot - a.slot;
      return b.rarity - a.rarity;
    });
    
    setFilteredDecorations(filtered);
  }, [decorations, filters, slotSize, loading, equipmentType]);
  
  // Get color class based on decoration slot size
  const getSlotColorClass = (size: number) => {
    switch(size) {
      case 4: return "bg-purple-400"; // Level 4 slots (purple)
      case 3: return "bg-blue-400";   // Level 3 slots (blue)
      case 2: return "bg-yellow-400"; // Level 2 slots (yellow)
      case 1: default: return "bg-gray-400"; // Level 1 slots (white/gray)
    }
  };

  // Assign decoration to slot
  const assignDecoration = (decoration: Decoration | null) => {
    let updatedDecorations = [...(currentBuild.decorations || [])];
    
    // Remove any existing decoration in this slot
    updatedDecorations = updatedDecorations.filter(
      d => !(d.equipmentType === equipmentType && d.slotIndex === slotIndex)
    );
    
    // Add new decoration if not null
    if (decoration) {
      updatedDecorations.push({
        equipmentType,
        slotIndex,
        slotSize,
        decoration
      });
    }
    
    // Update build with new decorations
    setCurrentBuild({
      ...currentBuild,
      decorations: updatedDecorations
    });
    
    // Close the selector
    onClose();
  };

  return (
    <Card className="bg-surface-800 border-surface-700">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center text-xl">
            <Gem className="h-5 w-5 text-green-400 mr-2" />
            Seleccionar Decoración
            <div className={`w-5 h-5 rounded-full ml-3 ${getSlotColorClass(slotSize)}`}>
              <span className="flex items-center justify-center text-xs text-surface-900">{slotSize}</span>
            </div>
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and filter controls */}
        <div className="flex space-x-2 mb-4">
          <div className="relative flex-1">
            <Input 
              placeholder="Buscar..." 
              className="bg-surface-700 border-surface-600 pl-8"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
            <div className="absolute left-2.5 top-2.5">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-surface-400"><path d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
            </div>
          </div>
        </div>

        {/* Show where this decoration is being placed */}
        <div className="bg-surface-700/20 p-3 rounded-md mb-4">
          <div className="text-sm text-surface-400 mb-1">Asignando a:</div>
          <div className="flex items-center text-surface-100">
            <span className="font-medium">
              {equipmentType.charAt(0).toUpperCase() + equipmentType.slice(1)}
            </span>
            <span className="mx-2">•</span>
            <span>Ranura {slotIndex + 1}</span>
            <span className="mx-2">•</span>
            <span className="flex items-center">
              Tamaño 
              <div className={`w-4 h-4 rounded-full ml-1 ${getSlotColorClass(slotSize)}`}></div>
            </span>
          </div>
        </div>

        {/* Decoration list */}
        <ScrollArea className="h-[350px]">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary-400 animate-spin" />
              <span className="ml-2 text-surface-300">Cargando decoraciones...</span>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-red-400 mb-2">{error}</div>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Reintentar
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {/* Option to remove current decoration */}
              {currentDecoration && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-surface-700 pb-2 mb-2"
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-between bg-red-900/20 hover:bg-red-900/30 text-red-300 p-3 h-auto"
                    onClick={() => assignDecoration(null)}
                  >
                    <span>Quitar {currentDecoration.name}</span>
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              {filteredDecorations.length > 0 ? (
                filteredDecorations.map((decoration) => (
                  <motion.div
                    key={decoration.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Button
                      variant="ghost"
                      className={`w-full justify-start p-3 h-auto ${
                        currentDecoration?.id === decoration.id
                          ? "bg-green-900/20 text-white border border-green-600"
                          : "bg-surface-700/50 hover:bg-surface-700"
                      }`}
                      onClick={() => assignDecoration(decoration)}
                    >
                      <div className="flex items-center w-full">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getSlotColorClass(decoration.slot)}`}>
                          <span className="text-lg font-bold text-surface-900">{decoration.slot}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between w-full">
                            <span className="font-medium text-surface-100">{decoration.name}</span>
                            {currentDecoration?.id === decoration.id && (
                              <Check className="h-4 w-4 text-green-400" />
                            )}
                          </div>
                          <div className="flex flex-wrap text-xs text-green-400 mt-1">
                            {decoration.skills.map((skillInfo, idx) => (
                              <span key={`${decoration.id}-skill-${idx}`} className="mr-3">
                                {skillInfo.skill.name} +{skillInfo.level}
                              </span>
                            ))}
                          </div>
                          {decoration.description && (
                            <p className="text-xs text-surface-400 mt-1 italic">{decoration.description}</p>
                          )}
                        </div>
                      </div>
                    </Button>
                  </motion.div>
                ))
              ) : (
                <div className="text-center p-8 text-surface-400">
                  <p>No se encontró ninguna decoración con los filtros actuales</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-2 border-t border-surface-700 flex justify-between">
        <Button variant="ghost" size="sm" onClick={onClose} className="text-surface-300">
          <ChevronLeft className="mr-1 h-4 w-4" /> Volver
        </Button>
      </CardFooter>
    </Card>
  );
}