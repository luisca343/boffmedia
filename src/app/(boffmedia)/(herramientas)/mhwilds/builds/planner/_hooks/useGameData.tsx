import { useState, useEffect, useMemo } from 'react';
import { Decoration, ArmorPiece, Weapon, Charm } from '../../../../../../../types/tools/mhwilds';
import { mhWildsService } from '@/services/api/tools/mhWildsService';
import { useLocale } from "next-intl"

// Define a type for the server-side skill data
export interface ServerSkill {
  id: number;
  name: string;
  kind: string;
  description: string;
  ranks: {
    skill: {
      id: number;
    };
    level: number;
    description: string;
    id: number;
  }[];
  gameId: number;
}

// Enhanced skill type that includes maxLevel
export interface EnhancedSkill extends ServerSkill {
  maxLevel: number;
}

export function useGameData() {
  const locale = useLocale()
  // Decorations state
  const [decorations, setDecorations] = useState<Decoration[]>([]);
  const [loadingDecorations, setLoadingDecorations] = useState(true);
  const [decorationsError, setDecorationsError] = useState<string | null>(null);
  
  // Weapons state
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loadingWeapons, setLoadingWeapons] = useState(true);
  const [weaponsError, setWeaponsError] = useState<string | null>(null);
  
  // Armor state
  const [armor, setArmor] = useState<ArmorPiece[]>([]);
  const [loadingArmor, setLoadingArmor] = useState(true);
  const [armorError, setArmorError] = useState<string | null>(null);
  
  // Skills state
  const [skills, setSkills] = useState<Record<string, EnhancedSkill>>({});
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  
  // Charms state
  const [charms, setCharms] = useState<Charm[]>([]);
  const [loadingCharms, setLoadingCharms] = useState(true);
  const [charmsError, setCharmsError] = useState<string | null>(null);

  // Create memoized lookup maps for equipment and decorations
  const weaponsMap = useMemo(() => {
    const map: Record<string, Weapon> = {};
    weapons.forEach(weapon => {
      map[weapon.id] = weapon;
    });
    return map;
  }, [weapons]);
  
  const armorMap = useMemo(() => {
    const map: Record<string, ArmorPiece> = {};
    armor.forEach(piece => {
      map[piece.id] = piece;
    });
    return map;
  }, [armor]);
  
  const decorationsMap = useMemo(() => {
    const map: Record<string, Decoration> = {};
    decorations.forEach(deco => {
      map[deco.id] = deco;
    });
    return map;
  }, [decorations]);
  
  const charmsMap = useMemo(() => {
    const map: Record<string, Charm> = {};
    charms.forEach(charm => {
      map[charm.id] = charm;
    });
    return map;
  }, [charms]);

  // Fetch decorations data
  const fetchDecorations = async () => {
    setLoadingDecorations(true);
    try {
      const response = await mhWildsService.getDecorations(locale);
      setDecorations(response.data!);
      setDecorationsError(null);
    } catch (err) {
      console.error("Error fetching decorations:", err);
      setDecorationsError("Error al cargar las decoraciones. Por favor, inténtalo de nuevo.");
    } finally {
      setLoadingDecorations(false);
    }
  };

  // Fetch weapons data
  const fetchWeapons = async () => {
    setLoadingWeapons(true);
    try {
      const response = await mhWildsService.getWeapons(locale);
      setWeapons(response.data!);
      setWeaponsError(null);
    } catch (err) {
      console.error("Error fetching weapons:", err);
      setWeaponsError("Error al cargar las armas. Por favor, inténtalo de nuevo.");
    } finally {
      setLoadingWeapons(false);
    }
  };

  // Fetch armor data
  const fetchArmor = async () => {
    setLoadingArmor(true);
    try {
      const response = await mhWildsService.getArmor(locale);
      setArmor(response.data!);
      setArmorError(null);
    } catch (err) {
      console.error("Error fetching armor:", err);
      setArmorError("Error al cargar las armaduras. Por favor, inténtalo de nuevo.");
    } finally {
      setLoadingArmor(false);
    }
  };

  // Fetch skills data
  const fetchSkills = async () => {
    setLoadingSkills(true);
    try {
      const response = await mhWildsService.getSkills(locale);
      
      // Create a lookup map by both ID and name for faster access
      const skillsMap: Record<string, EnhancedSkill> = {};
      
      response.data!.forEach((skill: ServerSkill) => {
        // Calculate max level for each skill
        const maxLevel = skill.ranks.reduce((max, rank) => 
          rank.level > max ? rank.level : max, 0);
        
        // Add the skill to the map with maxLevel property
        const enhancedSkill = {
          ...skill,
          maxLevel
        };
        
        // Index by ID as string
        skillsMap[String(skill.id)] = enhancedSkill;
        // Also index by name for name-based lookups
        skillsMap[skill.name] = enhancedSkill;
      });
      
      setSkills(skillsMap);
      setSkillsError(null);
    } catch (err) {
      console.error("Error fetching skills:", err);
      setSkillsError("Error al cargar las habilidades. Por favor, inténtalo de nuevo.");
    } finally {
      setLoadingSkills(false);
    }
  };
  
  // Fetch charms data
  const fetchCharms = async () => {
    setLoadingCharms(true);
    try {
      const response = await mhWildsService.getCharms(locale);
      setCharms(response.data!);
      setCharmsError(null);
    } catch (err) {
      console.error("Error fetching charms:", err);
      setCharmsError("Error al cargar los amuletos. Por favor, inténtalo de nuevo.");
    } finally {
      setLoadingCharms(false);
    }
  };

  // Initialize all data fetching on component mount
  useEffect(() => {
    fetchDecorations();
    fetchWeapons();
    fetchArmor();
    fetchSkills();
    fetchCharms();
  }, [locale]);

  // Helper function to get armor by slot type
  const getArmorBySlot = (slotType: string): ArmorPiece[] => {
    return armor.filter(item => item.kind === slotType);
  };
  
  // Equipment lookup functions
  const getWeaponById = (id: string | null): Weapon | null => {
    if (!id) return null;
    return weaponsMap[id] || null;
  };
  
  const getArmorById = (id: string | null): ArmorPiece | null => {
    if (!id) return null;
    return armorMap[id] || null;
  };
  
  const getDecorationById = (id: string | null): Decoration | null => {
    if (!id) return null;
    return decorationsMap[id] || null;
  };
  
  const getCharmById = (id: string | null): Charm | null => {
    if (!id) return null;
    return charmsMap[id] || null;
  };

  return {
    // Decorations
    decorations,
    loadingDecorations,
    decorationsError,
    refreshDecorations: fetchDecorations,
    
    // Weapons
    weapons,
    loadingWeapons,
    weaponsError,
    refreshWeapons: fetchWeapons,
    
    // Armor
    armor,
    loadingArmor,
    armorError,
    refreshArmor: fetchArmor,
    getArmorBySlot,
    
    // Skills
    skills,
    loadingSkills,
    skillsError,
    refreshSkills: fetchSkills,
    
    // Charms
    charms,
    loadingCharms,
    charmsError,
    refreshCharms: fetchCharms,
    
    // Lookup functions
    getWeaponById,
    getArmorById,
    getDecorationById,
    getCharmById,
    
    // General loading state
    isLoading: loadingDecorations || loadingWeapons || loadingArmor || loadingSkills || loadingCharms
  };
}