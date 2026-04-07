import { useState, useCallback, useMemo } from "react";
import { 
  BuildData, 
  BuildDataWithIds, 
  EquipmentType,
  DecorationAssignment 
} from "@/types/tools/mhwilds";

export interface BuildStateProps {
  getWeaponById: (id: string | null) => any;
  getArmorById: (id: string | null) => any;
  getDecorationById: (id: string) => any;
  getCharmById: (id: string | null) => any;
}

export function useBuildState({
  getWeaponById,
  getArmorById,
  getDecorationById,
  getCharmById
}: BuildStateProps) {
  const [currentBuild, setCurrentBuild] = useState<BuildDataWithIds>({
    name: "Mi Build",
    weaponId: null,
    secondaryWeaponId: null,
    headId: null,
    chestId: null,
    armsId: null,
    waistId: null,
    legsId: null,
    charmId: null,
    decorations: [],
  });

  // State for the currently selected equipment slot
  const [selectedSlot, setSelectedSlot] = useState<EquipmentType | null>(null);
  
  // State for selected decoration slot
  const [selectedDecoration, setSelectedDecoration] = useState<{
    equipmentType: EquipmentType;
    slotIndex: number;
    slotSize: number;
  } | null>(null);

  // Convert ID-based build to full object build
  const buildWithFullObjects = useMemo<BuildData>(() => {
    const result: BuildData = {
      name: currentBuild.name,
      weapon: getWeaponById(currentBuild.weaponId),
      secondaryWeapon: getWeaponById(currentBuild.secondaryWeaponId),
      head: getArmorById(currentBuild.headId),
      chest: getArmorById(currentBuild.chestId),
      arms: getArmorById(currentBuild.armsId),
      waist: getArmorById(currentBuild.waistId),
      legs: getArmorById(currentBuild.legsId),
      charm: getCharmById(currentBuild.charmId),
      decorations: currentBuild.decorations
        .map((decoAssign: { equipmentType: EquipmentType; slotIndex: number; decorationId: string }) => ({
          equipmentType: decoAssign.equipmentType,
          slotIndex: decoAssign.slotIndex,
          decoration: getDecorationById(decoAssign.decorationId)
        }))
        .filter((d: { decoration: any }) => d.decoration !== null) as DecorationAssignment[]
    };
    
    return result;
  }, [
    currentBuild, 
    getWeaponById, 
    getArmorById, 
    getDecorationById,
    getCharmById
  ]);

  // Handle equipment slot selection
  const handleSlotClick = useCallback((slot: EquipmentType) => {
    setSelectedSlot(slot);
    setSelectedDecoration(null);
  }, []);

  // Handle decoration slot selection
  const handleDecorationClick = useCallback((equipmentType: EquipmentType, slotIndex: number) => {
    const equipment = buildWithFullObjects[equipmentType];
    
    if (equipment && 'slots' in equipment && Array.isArray(equipment.slots) && 
        equipment.slots[slotIndex] !== undefined) {
      setSelectedDecoration({
        equipmentType,
        slotIndex,
        slotSize: equipment.slots[slotIndex]
      });
      setSelectedSlot(null);
    }
  }, [buildWithFullObjects]);

  // Handler for swapping primary and secondary weapons
  const handleSwapWeapons = useCallback(() => {
    setCurrentBuild((prev: BuildDataWithIds): BuildDataWithIds => ({
      ...prev,
      weaponId: prev.secondaryWeaponId,
      secondaryWeaponId: prev.weaponId
    }));
  }, []);

  // Reset build to default values
  const handleReset = useCallback(() => {
    setCurrentBuild({
      name: "Mi Build",
      weaponId: null,
      secondaryWeaponId: null,
      headId: null,
      chestId: null,
      armsId: null,
      waistId: null,
      legsId: null,
      charmId: null,
      decorations: [],
    });
  }, []);

  // Close all selectors
  const closeSelector = useCallback(() => {
    setSelectedSlot(null);
    setSelectedDecoration(null);
  }, []);

  return {
    currentBuild,
    setCurrentBuild,
    buildWithFullObjects,
    selectedSlot,
    setSelectedSlot,
    selectedDecoration,
    setSelectedDecoration,
    handleSlotClick,
    handleDecorationClick,
    handleSwapWeapons,
    handleReset,
    closeSelector,
  };
}