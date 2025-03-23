"use client";

import { useState, useCallback, useMemo } from "react";
import { BuildHeader } from "./_components/BuildHeader";
import { EquipmentSelector } from "./_components/EquipmentSelector";
import { DecorationSelector } from "./_components/DecorationSelector";
import { BuildDisplay } from "./_components/BuildDisplay";
import { StatsDisplay } from "./_components/StatsDisplay";
import { SkillsList } from "./_components/SkillsList";
import { BuildActions } from "./_components/BuildActions";
import { 
  ArmorPiece, 
  BuildData, 
  DecorationAssignment,
  Filters, 
  Skill,
  StatsData, 
  EquipmentType,
  SkillRank,
  BuildDataWithIds
} from "./_components/types";
import { useGameData } from "./_hooks/useGameData";
import { getAllWeaponElements } from "./_components/equipment-utils";

export default function BuildPlanner() {
  const {
    skills: skillsData, 
    weapons,
    armor, 
    decorations,
    loadingWeapons,
    loadingArmor,
    loadingDecorations,
    getWeaponById,
    getArmorById,
    getDecorationById
  } = useGameData();
  
  // Store build data with just IDs
  const [currentBuild, setCurrentBuild] = useState<BuildDataWithIds>({
    name: "Mi Build",
    weaponId: null,
    headId: null,
    chestId: null,
    armsId: null,
    waistId: null,
    legsId: null,
    decorations: [],
  });

  console.log("Current Build:", currentBuild);
  
  // State for the currently selected equipment slot
  const [selectedSlot, setSelectedSlot] = useState<EquipmentType | null>(null);
  
  // State for selected decoration slot
  const [selectedDecoration, setSelectedDecoration] = useState<{
    equipmentType: EquipmentType;
    slotIndex: number;
    slotSize: number;
  } | null>(null);
  
  // State for filtering equipment
  const [filters, setFilters] = useState<Filters>({
    search: "",
    rarity: [],
    skills: [],
    slots: [],
  });
  
  const isLoading = loadingWeapons || loadingArmor || loadingDecorations;

  // Get equipment by slot type for direct passing to EquipmentSelector
  const getEquipmentBySlot = useCallback((slotType: EquipmentType) => {
    if (slotType === 'weapon') {
      return weapons;
    } else {
      return armor.filter(item => item.kind === slotType);
    }
  }, [armor, weapons]);
  
  // Convert the ID-based build to a full object build for components that need it
  const buildWithFullObjects = useMemo<BuildData>(() => {
    return {
      name: currentBuild.name,
      weapon: getWeaponById(currentBuild.weaponId),
      head: getArmorById(currentBuild.headId),
      chest: getArmorById(currentBuild.chestId),
      arms: getArmorById(currentBuild.armsId),
      waist: getArmorById(currentBuild.waistId),
      legs: getArmorById(currentBuild.legsId),
      decorations: currentBuild.decorations.map(decoAssign => ({
        equipmentType: decoAssign.equipmentType,
        slotIndex: decoAssign.slotIndex,
        slotSize: decoAssign.slotSize,
        decoration: getDecorationById(decoAssign.decorationId)
      })).filter(d => d.decoration !== null) as DecorationAssignment[]
    };
  }, [
    currentBuild, 
    getWeaponById, 
    getArmorById, 
    getDecorationById
  ]);

  const calculateTotalSkills = (): Skill[] => {
    // Use a Map to track skills by their name for proper merging
    const skillMap = new Map<string, Skill>();
    
    // Function to add skills from an equipment piece or decoration
    const addSkillsFromItem = (skills?: SkillRank[]) => {
      if (!skills || !Array.isArray(skills)) return;
      
      skills.forEach(skillRank => {
        // Extract skill info - handling different data structures
        const skillId = skillRank.skill?.id || skillRank.id;
        const skillName = skillRank.skill?.name || skillRank.name;
        
        if (!skillName) return;
        
        // Use name as the key for the map to handle duplicate skills with different IDs
        const existingSkill = skillMap.get(skillName);
        
        if (existingSkill) {
          // If skill already exists by name, add the levels
          existingSkill.level += skillRank.level;
        } else {
          
          skillMap.set(skillName, {
            id: skillId, // Keep the original ID
            name: skillName,
            level: skillRank.level,
            maxLevel: skillsData[skillId]?.maxLevel || 0,
            description: skillRank.description || '',
            kind: skillRank.skill?.kind
          });
        }
      });
    };
    
    // Add skills from armor pieces
    ['head', 'chest', 'arms', 'waist', 'legs'].forEach(slotType => {
      const armor = buildWithFullObjects[slotType as keyof BuildData] as ArmorPiece | null;
      if (armor && armor.skills) {
        addSkillsFromItem(armor.skills);
      }
    });
    
    // Add skills from weapon if present
    if (buildWithFullObjects.weapon?.skills) {
      addSkillsFromItem(buildWithFullObjects.weapon.skills);
    }
    
    // Add skills from decorations
    if (buildWithFullObjects.decorations && buildWithFullObjects.decorations.length > 0) {
      buildWithFullObjects.decorations.forEach(decoAssign => {
        if (decoAssign.decoration && decoAssign.decoration.skills) {
          // Convert decoration skills to SkillRank format for processing
          const skillRanks = decoAssign.decoration.skills.map(skill => ({
            skill: {
              id: typeof skill.skill.id === 'string' ? parseInt(skill.skill.id) : skill.skill.id,
              gameId: 0, // Not needed for calculation
              name: skill.skill.name,
              kind: "decoration" 
            },
            level: skill.level,
            description: skill.description || "", 
            id: typeof skill.id === 'string' ? parseInt(skill.id) : (skill.id || 0)
          }));
          
          addSkillsFromItem(skillRanks);
        }
      });
    }
    
    // Convert Map back to Array
    return Array.from(skillMap.values());
  };

  // Calculate stats using the full objects
  const calculateStats = (): StatsData => {
    let stats: StatsData = {
      weapon: buildWithFullObjects.weapon || null,
      defense: 0,
      fireRes: 0,
      waterRes: 0,
      thunderRes: 0,
      iceRes: 0,
      dragonRes: 0,
      attack: 0,
      affinity: 0,
      element: undefined,
      status: undefined,
      sharpness: {
        red: 0,
        orange: 0,
        yellow: 0,
        green: 0,
        blue: 0,
        white: 0,
        purple: 0,
      },
    };
    
    // Add weapon stats
    if (buildWithFullObjects.weapon) {
      stats.attack = buildWithFullObjects.weapon.attack ?? 0;
      stats.affinity = buildWithFullObjects.weapon.affinity;
      
      // Use getAllWeaponElements to get both elements and statuses
      try {
        const { elements, statuses } = getAllWeaponElements(buildWithFullObjects.weapon);
        
        // Set primary element (first one found)
        if (elements.length > 0) {
          stats.element = {
            type: elements[0].type,
            damage: elements[0].damage
          };
        }
        
        // Set primary status (first one found)
        if (statuses.length > 0) {
          stats.status = {
            type: statuses[0].type,
            damage: statuses[0].damage,
            hidden: statuses[0].hidden
          };
        }
      } catch (err) {
        console.error("Error extracting weapon elements/statuses:", err);
      }
    }
    
    // Add armor stats
    ['head', 'chest', 'arms', 'waist', 'legs'].forEach(slot => {
      const armor = buildWithFullObjects[slot as keyof BuildData] as ArmorPiece | null;
      if (armor) {
        // Add defense
        stats.defense += typeof armor.defense === 'number' ? 
          armor.defense : armor.defense.base;
        
        // Add resistances
        if (armor.resistances) {
          stats.fireRes += armor.resistances.fire;
          stats.waterRes += armor.resistances.water;
          stats.thunderRes += armor.resistances.thunder;
          stats.iceRes += armor.resistances.ice;
          stats.dragonRes += armor.resistances.dragon;
        }
      }
    });
    
    // Apply skill effects (simplified example)
    const skills = calculateTotalSkills();
    
    // Example: Attack Boost skill adds attack and affinity
    const attackBoost = skills.find(skill => skill.id === "attack_boost");
    if (attackBoost) {
      // Approximation of Attack Boost skill effect
      const attackBonus = [0, 3, 6, 9, 12, 15, 18, 21];
      const affinityBonus = attackBoost.level >= 4 ? 5 : 0;
      
      stats.attack += attackBonus[attackBoost.level];
      stats.affinity += affinityBonus;
    }
    
    // Example: Critical Eye increases affinity
    const criticalEye = skills.find(skill => skill.id === "critical_eye");
    if (criticalEye) {
      // Approximation of Critical Eye skill effect
      const affinityBonus = [0, 5, 10, 15, 20, 25, 30, 40];
      stats.affinity += affinityBonus[criticalEye.level];
    }
    
    return stats;
  };

  const totalSkills = calculateTotalSkills();
  const stats = calculateStats();

  // Function to handle equipment slot selection
  const handleSlotClick = (slot: EquipmentType) => {
    setSelectedSlot(slot);
    setSelectedDecoration(null);
  };

  // Function to handle decoration slot selection
  const handleDecorationClick = (equipmentType: EquipmentType, slotIndex: number) => {
    // Use the buildWithFullObjects to get the correct equipment
    const equipment = buildWithFullObjects[equipmentType];
    
    // Check if equipment has slots and the specified slot exists
    if (equipment && 'slots' in equipment && Array.isArray(equipment.slots) && 
        equipment.slots[slotIndex] !== undefined) {
      setSelectedDecoration({
        equipmentType,
        slotIndex,
        slotSize: equipment.slots[slotIndex]
      });
      setSelectedSlot(null);
    }
  };

  // Function to close the equipment/decoration selector
  const closeSelector = () => {
    setSelectedSlot(null);
    setSelectedDecoration(null);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <BuildHeader 
        buildName={currentBuild.name} 
        onBuildNameChange={(name) => setCurrentBuild({...currentBuild, name})}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left panel - Equipment Selection & Current Build */}
        <div className="lg:col-span-8">
          {selectedSlot ? (
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
            <BuildDisplay 
              currentBuild={buildWithFullObjects}
              onSlotClick={handleSlotClick}
              onDecorationClick={handleDecorationClick}
            />
          )}
        </div>

        {/* Right panel - Stats and Skills */}
        <div className="lg:col-span-4 space-y-6">
          <StatsDisplay stats={stats} />
          <SkillsList skills={totalSkills} skillsData={skillsData}/>
          <BuildActions />
        </div>
      </div>
    </div>
  );
}