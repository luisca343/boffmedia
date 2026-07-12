import { useState, useCallback, useMemo } from "react";
import {
  BuildData,
  BuildDataWithIds,
  EquipmentType,
} from "@/types/tools/mhwilds";
import { resolveBuild } from "../_utils/buildUtils";

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

  // Convert ID-based build to full object build (shared resolver)
  const buildWithFullObjects = useMemo<BuildData>(
    () => resolveBuild(currentBuild, { getWeaponById, getArmorById, getDecorationById, getCharmById }),
    [currentBuild, getWeaponById, getArmorById, getDecorationById, getCharmById],
  );

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