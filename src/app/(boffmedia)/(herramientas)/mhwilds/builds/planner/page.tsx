"use client";

import { useState, useCallback } from "react";
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
  Decoration, 
  DecorationAssignment,
  Filters, 
  Skill,
  StatsData, 
  Weapon,
  EquipmentType,
  SkillRank
} from "./_components/types";
import { useGameData } from "./_hooks/useGameData";

export default function BuildPlanner() {
  const {skills: skillData} = useGameData();
  
  // State for the current build
  const [currentBuild, setCurrentBuild] = useState<BuildData>({
    name: "Mi Build",
    weapon: null,
    head: null,
    chest: null,
    arms: null,
    waist: null,
    legs: null,
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
  
  // State for filtering equipment
  const [filters, setFilters] = useState<Filters>({
    search: "",
    rarity: [],
    skills: [],
    slots: [],
  });

  // Equipment cache to prevent repeated API calls
  const [equipmentCache, setEquipmentCache] = useState<{
    weapon: Weapon[];
    head: ArmorPiece[];
    chest: ArmorPiece[];
    arms: ArmorPiece[];
    waist: ArmorPiece[];
    legs: ArmorPiece[];
  }>({
    weapon: [],
    head: [],
    chest: [],
    arms: [],
    waist: [],
    legs: [],
  });

  // Decorations cache
  const [decorationsCache, setDecorationsCache] = useState<Decoration[]>([]);

  // Function to update the equipment cache
  const updateEquipmentCache = useCallback((slotType: EquipmentType, data: ArmorPiece[] | Weapon[]) => {
    setEquipmentCache(prev => ({
      ...prev,
      [slotType]: data
    }));
  }, []);

  // Function to update the decorations cache
  const updateDecorationsCache = useCallback((data: Decoration[]) => {
    setDecorationsCache(data);
  }, []);

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
            maxLevel: skillData[skillId]?.maxLevel || 0,
            description: skillRank.description || '',
            kind: skillRank.skill?.kind
          });
        }
      });
    };
    
    // Add skills from armor pieces
    ['head', 'chest', 'arms', 'waist', 'legs'].forEach(slotType => {
      const armor = currentBuild[slotType as keyof BuildData] as ArmorPiece | null;
      if (armor && armor.skills) {
        addSkillsFromItem(armor.skills);
      }
    });
    
    // Add skills from weapon if present
    if (currentBuild.weapon?.skills) {
      addSkillsFromItem(currentBuild.weapon.skills);
    }
    
    // Add skills from decorations
    if (currentBuild.decorations && currentBuild.decorations.length > 0) {
      currentBuild.decorations.forEach(decoAssign => {
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

  // Placeholder function for calculating stats
  const calculateStats = (): StatsData => {
    // Base stats
    let stats: StatsData = {
      defense: 0,
      fireRes: 0,
      waterRes: 0,
      thunderRes: 0,
      iceRes: 0,
      dragonRes: 0,
      attack: 0,
      affinity: 0,
      element: undefined,
      sharpness: {
        red: 0,
        orange: 0,
        yellow: 0,
        green: 0,
        blue: 0,
        white: 0,
        purple: 0,
      },
      //weapon: currentBuild.weapon || null,
    };
    
    // Add weapon stats
    if (currentBuild.weapon) {
      stats.attack = currentBuild.weapon.attack;
      stats.affinity = currentBuild.weapon.affinity;
      if (currentBuild.weapon.element) {
        stats.element = {...currentBuild.weapon.element};
      }
    }
    
    // Add armor stats
    ['head', 'chest', 'arms', 'waist', 'legs'].forEach(slot => {
      const armor = currentBuild[slot as keyof BuildData] as ArmorPiece | null;
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
    // First ensure we have the equipment with this slot
    const equipment = currentBuild[equipmentType as keyof BuildData] as any;
    
    if (equipment && equipment.slots && equipment.slots[slotIndex] !== undefined) {
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
              currentBuild={currentBuild}
              setCurrentBuild={setCurrentBuild}
              filters={filters}
              setFilters={setFilters}
              onClose={closeSelector}
              cachedData={equipmentCache[selectedSlot]}
              updateCache={(data) => updateEquipmentCache(selectedSlot, data)}
            />
          ) : selectedDecoration ? (
            <DecorationSelector
              equipmentType={selectedDecoration.equipmentType}
              slotIndex={selectedDecoration.slotIndex}
              slotSize={selectedDecoration.slotSize}
              currentBuild={currentBuild}
              setCurrentBuild={setCurrentBuild}
              filters={filters}
              setFilters={setFilters}
              onClose={closeSelector}
              cachedData={decorationsCache}
              updateCache={updateDecorationsCache}
            />
          ) : (
            <BuildDisplay 
              currentBuild={currentBuild}
              onSlotClick={handleSlotClick}
              onDecorationClick={handleDecorationClick}
            />
          )}
        </div>

        {/* Right panel - Stats and Skills */}
        <div className="lg:col-span-4 space-y-6">
          <StatsDisplay stats={stats} />
          <SkillsList skills={totalSkills} skillsData={skillData}/>
          <BuildActions />
        </div>
      </div>
    </div>
  );
}