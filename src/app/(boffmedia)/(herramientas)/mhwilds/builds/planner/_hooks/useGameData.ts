import { useState, useEffect } from 'react';
import axios from 'axios';
import { Decoration, ArmorPiece, Weapon } from '../_components/types';

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

export function useGameData() {
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
  const [skills, setSkills] = useState<Record<string, ServerSkill>>({});
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [skillsError, setSkillsError] = useState<string | null>(null);

  // Fetch decorations data
  const fetchDecorations = async () => {
    setLoadingDecorations(true);
    try {
      const response = await axios.get("https://api.ficuslab.es/data/mhwilds/decorations.json");
      setDecorations(response.data);
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
      const response = await axios.get("https://api.ficuslab.es/data/mhwilds/weapons.json");
      let weapons = response.data;

      // Add backward compatibility fields
      weapons = weapons.map((weapon: Weapon) => ({
        ...weapon,
        type: weapon.kind,
        attack: weapon.damage?.display || 0,
        element: weapon.specials?.find(s => 
          s.type !== undefined && ["fire", "water", "thunder", "ice", "dragon"].includes(s.type || "")
        ) ? {
          type: weapon.specials.find(s => 
            s.type && ["fire", "water", "thunder", "ice", "dragon"].includes(s.type)
          )?.type || "",
          damage: weapon.specials.find(s => 
            s.type && ["fire", "water", "thunder", "ice", "dragon"].includes(s.type)
          )?.damage || 0
        } : undefined,
      }));
      
      setWeapons(weapons);
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
      const response = await axios.get("https://api.ficuslab.es/data/mhwilds/armor.json");
      setArmor(response.data);
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
      const response = await axios.get("https://api.ficuslab.es/data/mhwilds/skills.json");
      
      // Create a lookup map by both ID and name for faster access
      const skillsMap: Record<string, ServerSkill> = {};
      
      response.data.forEach((skill: ServerSkill) => {
        // Index by ID as string
        skillsMap[String(skill.id)] = skill;
        // Also index by name for name-based lookups
        skillsMap[skill.name] = skill;
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

  // Initialize all data fetching on component mount
  useEffect(() => {
    fetchDecorations();
    fetchWeapons();
    fetchArmor();
    fetchSkills();
  }, []);

  // Helper function to get armor by slot type
  const getArmorBySlot = (slotType: string): ArmorPiece[] => {
    return armor.filter(item => item.kind === slotType);
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
    
    // General loading state
    isLoading: loadingDecorations || loadingWeapons || loadingArmor || loadingSkills
  };
}