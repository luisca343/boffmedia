"use client";

import { useCallback, useEffect } from "react";
import { EquipmentType, Filters, BuildDataWithIds } from "@/types/tools/mhwilds";
import { BuildHeader } from "./_components/build/BuildHeader";
import { EquipmentSelector } from "./_components/equipment/EquipmentSelector";
import { DecorationSelector } from "./_components/equipment/DecorationSelector";
import { BuildDisplay } from "./_components/build/BuildDisplay";
import { StatsDisplay } from "./_components/stats/StatsDisplay";
import { SkillsList } from "./_components/stats/SkillsList";
import { BuildImport } from "./_components/build/BuildImport";
import { CharmSelector } from "./_components/equipment/CharmSelector";
import { useBuildState } from "./_hooks/useBuildState";
import { calculateStats, calculateTotalSkills } from "./_utils/calculationUtils";
import { importBuildFromUrl } from "./_utils/buildUtils";
import { useState } from "react";
import { useGameData } from "./_hooks/useGameData";

export default function BuildPlanner() {
  const {
    skills: skillsData, 
    weapons,
    armor,
    charms,
    decorations,
    loadingWeapons,
    loadingArmor,
    loadingDecorations,
    loadingCharms,
    getWeaponById,
    getArmorById,
    getDecorationById,
    getCharmById
  } = useGameData();
  
  // State for filtering equipment
  const [filters, setFilters] = useState<Filters>({
    search: "",
    rarity: [],
    skills: [],
    slots: [],
  });
  
  const {
    currentBuild,
    setCurrentBuild,
    buildWithFullObjects,
    selectedSlot,
    selectedDecoration,
    handleSlotClick,
    handleDecorationClick,
    handleSwapWeapons,
    handleReset,
    closeSelector
  } = useBuildState({
    getWeaponById,
    getArmorById,
    getDecorationById,
    getCharmById
  });

  // Import build from URL if present
  useEffect(() => {
    const importedBuild = importBuildFromUrl();
    if (importedBuild) {
      setCurrentBuild(importedBuild);
      console.log("Imported build from URL:", importedBuild);
    }
  }, [setCurrentBuild]);
  
  // Calculate stats and skills
  const totalSkills = calculateTotalSkills(buildWithFullObjects, skillsData);
  const stats = calculateStats(buildWithFullObjects);
  const isLoading = loadingWeapons || loadingArmor || loadingDecorations;

  // Helper function to get equipment data based on slot type
  const getEquipmentBySlot = useCallback((slotType: EquipmentType) => {
    if (slotType === 'weapon' || slotType === 'secondaryWeapon') {
      return weapons;
    } else if (slotType === 'charm') {
      return charms;
    } else {
      return armor.filter(item => item.kind === slotType);
    }
  }, [armor, weapons, charms]);

  return (
    <div className="max-w-7xl mx-auto">
      <BuildHeader 
        buildName={currentBuild.name} 
        onBuildNameChange={(name) => setCurrentBuild({...currentBuild, name})}
        buildData={currentBuild}
        completeData={buildWithFullObjects}
        stats={stats}
        skills={totalSkills}
        onReset={handleReset}
        onLoadBuild={(loadedBuild) => setCurrentBuild(loadedBuild)}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left panel - Equipment Selection & Current Build */}
        <div className="lg:col-span-8">
          {selectedSlot ? (
            selectedSlot === 'charm' ? (
              <CharmSelector
                charms={charms}
                currentBuild={buildWithFullObjects}
                setCurrentBuild={(updatedBuild) => {
                  setCurrentBuild({
                    ...currentBuild,
                    charmId: updatedBuild.charm ? updatedBuild.charm.id.toString() : null
                  });
                }}
                filters={filters.rarity ? filters : { ...filters, rarity: [] }}
                setFilters={setFilters}
                onClose={closeSelector}
                isLoading={loadingCharms}
              />
            ) : (
              <EquipmentSelector 
                slotType={selectedSlot}
                currentBuild={buildWithFullObjects}
                setCurrentBuild={(updatedBuild) => {
                  // Extract the updated equipment and store its ID
                  const updatedEquipment = updatedBuild[selectedSlot];
                  setCurrentBuild({
                    ...currentBuild,
                    [`${selectedSlot}Id`]: updatedEquipment ? updatedEquipment.id : null
                  });
                }}
                filters={filters}
                setFilters={setFilters}
                onClose={closeSelector}
                isLoading={isLoading}
                equipmentData={getEquipmentBySlot(selectedSlot)}
              />
            )
          ) : selectedDecoration ? (
            <DecorationSelector
              decorations={decorations}
              equipmentType={selectedDecoration.equipmentType}
              slotIndex={selectedDecoration.slotIndex}
              slotSize={selectedDecoration.slotSize}
              currentBuild={buildWithFullObjects}
              setCurrentBuild={(updatedBuild) => {
                // Extract the decoration assignment that was modified
                const updatedDecorations = [...currentBuild.decorations];
                
                // Find if there's already a decoration at this slot
                const existingIndex = updatedDecorations.findIndex(
                  d => d.equipmentType === selectedDecoration.equipmentType && 
                      d.slotIndex === selectedDecoration.slotIndex
                );
                
                // Find the corresponding decoration in the updated build
                const newDecoration = updatedBuild.decorations.find(
                  d => d.equipmentType === selectedDecoration.equipmentType && 
                      d.slotIndex === selectedDecoration.slotIndex
                )?.decoration;
                
                // Update or remove the decoration
                if (newDecoration) {
                  // Add or update decoration
                  const decorationAssignment = {
                    equipmentType: selectedDecoration.equipmentType,
                    slotIndex: selectedDecoration.slotIndex,
                    slotSize: selectedDecoration.slotSize,
                    decorationId: String(newDecoration.id)
                  };
                  
                  if (existingIndex >= 0) {
                    updatedDecorations[existingIndex] = decorationAssignment;
                  } else {
                    updatedDecorations.push(decorationAssignment);
                  }
                } else if (existingIndex >= 0) {
                  // Remove decoration if it was deleted
                  updatedDecorations.splice(existingIndex, 1);
                }
                
                // Update the build with new decorations array
                setCurrentBuild({
                  ...currentBuild,
                  decorations: updatedDecorations
                });
              }}
              filters={filters}
              setFilters={setFilters}
              onClose={closeSelector}
            />
          ) : (
            <>
              <BuildDisplay 
                currentBuild={buildWithFullObjects}
                onSlotClick={handleSlotClick}
                onDecorationClick={handleDecorationClick}
                onSwapWeapons={handleSwapWeapons}
              />
              <BuildImport 
                onImport={(importedBuild) => {
                  setCurrentBuild(importedBuild);
                }} 
              />
            </>
          )}
        </div>

        {/* Right panel - Stats and Skills */}
        <div className="lg:col-span-4 space-y-6">
          <StatsDisplay stats={stats} />
          <SkillsList skills={totalSkills} skillsData={skillsData}/>
        </div>
      </div>
    </div>
  );
}