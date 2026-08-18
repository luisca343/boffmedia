import { Skill, SkillRank, ArmorPiece, BuildData, StatsData } from "../../types";
import { getAllWeaponElements } from "../_components/equipment-utils";

/**
 * Calculates all active skills from the build's equipment
 */
export const calculateTotalSkills = (buildWithFullObjects: BuildData, skillsData: Record<string, any>): Skill[] => {
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
  
  // Add skills from charm if present
  if (buildWithFullObjects.charm?.skills) {
    addSkillsFromItem(buildWithFullObjects.charm.skills.map(skill => ({
      skill: {
        id: skill.skill.id,
        gameId: 0,
        name: skill.skill.name,
        kind: 'charm'
      },
      level: skill.level,
      description: skill.description,
      id: skill.id
    })));
  }
  
  // Add skills from decorations - exclude those on the secondary weapon
  if (buildWithFullObjects.decorations && buildWithFullObjects.decorations.length > 0) {
    buildWithFullObjects.decorations.forEach(decoAssign => {
      // Skip decorations on secondary weapon
      if (decoAssign.equipmentType === 'secondaryWeapon') return;
      
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

/**
 * Calculates stats from the build's equipment
 */
export const calculateStats = (buildWithFullObjects: BuildData): StatsData => {
  let stats: StatsData = {
    weapon: buildWithFullObjects.weapon || null,
    defenseMin: 0,
    defenseMax: 0,
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
      stats.defenseMin += armor.defense.base
      stats.defenseMax += armor.defense.max || 0;
      
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
  
  return stats;
};