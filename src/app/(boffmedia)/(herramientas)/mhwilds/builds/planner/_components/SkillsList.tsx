import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import { HelpCircle, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skill } from "./types";

// Define a type for the server-side skill data
interface ServerSkill {
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

interface SkillsListProps {
  skills: Skill[];
}

export function SkillsList({ skills }: SkillsListProps) {
  const [skillsData, setSkillsData] = useState<Record<string, ServerSkill>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch skills data from the server
  useEffect(() => {
    const fetchSkillsData = async () => {
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
        
        setSkillsData(skillsMap);
      } catch (error) {
        console.error("Error fetching skills data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkillsData();
  }, []);

  // Sort skills by level (highest first) and then by name for more user-friendly display
  const sortedSkills = [...skills].sort((a, b) => {
    // First sort by level (descending)
    if (b.level !== a.level) return b.level - a.level;
    
    // Then sort by name (alphabetical)
    return a.name.localeCompare(b.name);
  });

  // Group skills by whether they exceed max level
  const overallocatedSkills = sortedSkills.filter(skill => skill.level > skill.maxLevel);
  const normalSkills = sortedSkills.filter(skill => skill.level <= skill.maxLevel);

  return (
    <Card className="bg-surface-800 border-surface-700">
      <CardHeader className="py-2 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Habilidades Activas</CardTitle>
          <span className="text-xs text-surface-400">
            {skills.length} {skills.length === 1 ? 'habilidad' : 'habilidades'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-0 pb-1">
        {loading ? (
          <div className="text-center py-6 text-surface-400">
            <HelpCircle className="h-6 w-6 mx-auto mb-1.5 opacity-50 animate-pulse" />
            <p className="text-xs">Cargando habilidades...</p>
          </div>
        ) : sortedSkills.length > 0 ? (
          <ScrollArea className="h-80 pr-1">
            {/* Display overallocated skills first with warning */}
            {overallocatedSkills.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-0.5 pl-1">
                  <AlertCircle className="h-3 w-3 text-yellow-400" />
                  <span className="text-xs font-medium text-yellow-400">Habilidades con puntos extra</span>
                </div>
                
                <div className="rounded-md bg-yellow-900/10 border border-yellow-600/30 overflow-hidden">
                  {overallocatedSkills.map((skill) => (
                    <CompactSkillItem 
                      key={skill.name} 
                      skill={skill} 
                      serverSkillData={skillsData}
                      isOverallocated={true} 
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Display normal skills */}
            <div className="rounded-md border border-surface-700/30 overflow-hidden">
              {normalSkills.map((skill, index) => (
                <CompactSkillItem 
                  key={skill.name} 
                  skill={skill} 
                  serverSkillData={skillsData}
                  isOverallocated={false} 
                  isLast={index === normalSkills.length - 1} 
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-6 text-surface-400">
            <HelpCircle className="h-6 w-6 mx-auto mb-1.5 opacity-50" />
            <p className="text-xs">No hay habilidades activas</p>
            <p className="text-xs mt-0.5 opacity-70">Añade armas y armaduras con habilidades</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SkillItemProps {
  skill: Skill;
  serverSkillData: Record<string, ServerSkill>;
  isOverallocated: boolean;
  isLast?: boolean;
}

function CompactSkillItem({ skill, serverSkillData, isOverallocated, isLast = false }: SkillItemProps) {
  // Get skill data from server data if available
  const getSkillData = (skill: Skill): ServerSkill | null => {
    // Try to find by ID first
    const idKey = String(skill.id);
    if (serverSkillData[idKey]) {
      return serverSkillData[idKey];
    }
    
    // Otherwise try by name
    if (serverSkillData[skill.name]) {
      return serverSkillData[skill.name];
    }
    
    return null;
  };
  
  // Get effect description from server data
  const getEffectDescription = (skill: Skill): string => {
    const serverSkill = getSkillData(skill);
    const effectiveLevel = Math.min(skill.level, skill.maxLevel);
    
    if (serverSkill) {
      // Find the rank that matches the current level
      const rank = serverSkill.ranks.find(r => r.level === effectiveLevel);
      if (rank) {
        return rank.description;
      }
    }
    
    // Fallback to the hardcoded values if we don't have server data for this skill
    const fallbackEffects: Record<string, string[]> = {
      "Ataque": ["Ataque +3", "Ataque +6", "Ataque +9", "Ataque +12, Afinidad +5%", "Ataque +15, Afinidad +5%"],
      "Ojo crítico": ["Afinidad +5%", "Afinidad +10%", "Afinidad +15%", "Afinidad +20%", "Afinidad +25%"],
      "Punto débil": ["Afinidad +15% contra puntos débiles", "Afinidad +30% contra puntos débiles", "Afinidad +50% contra puntos débiles"],
      "Vitalidad": ["Vida máxima +15", "Vida máxima +30", "Vida máxima +50"],
      "Daño crítico": ["Daño crítico +30%", "Daño crítico +35%", "Daño crítico +40%"],
      "Desuello": ["Aumento leve a la eficacia de desuello", "Aumento moderado a la eficacia de desuello", "Aumento notable a la eficacia de desuello"]
    };
    
    if (fallbackEffects[skill.name] && effectiveLevel <= fallbackEffects[skill.name].length) {
      return fallbackEffects[skill.name][effectiveLevel - 1];
    }
    
    return `Nivel ${effectiveLevel}`;
  };
  
  // Get skill color based on type from server data or fallback to hardcoded categories
  const getSkillColor = (skill: Skill): string => {
    const serverSkill = getSkillData(skill);
    
    if (serverSkill) {
      switch (serverSkill.kind) {
        case "attack":
          return "text-red-400";
        case "defense":
          return "text-blue-400";
        case "element":
          return "text-purple-400";
        case "utility":
          return "text-green-400";
        default:
          return "text-green-400";
      }
    }
    
    // Fallback to hardcoded categories if server data unavailable
    const attackSkills = ["Ataque", "Ojo crítico", "Punto débil", "Daño crítico", "Agitador"];
    const defenseSkills = ["Defensa", "Bendición divina", "Vitalidad"];
    const elementSkills = ["Resistencia al fuego", "Resistencia al agua", "Resistencia al trueno", 
                          "Resistencia al hielo", "Resistencia al dragón", "Antidraco", "Convierte elemento"];
    
    if (attackSkills.includes(skill.name)) return "text-red-400";
    if (defenseSkills.includes(skill.name)) return "text-blue-400";
    if (elementSkills.includes(skill.name)) return "text-purple-400";
    
    return "text-green-400";
  };
  
  // Get skill description from server data
  const getSkillDescription = (skill: Skill): string => {
    const serverSkill = getSkillData(skill);
    if (serverSkill) {
      return serverSkill.description;
    }
    return `Descripción de ${skill.name}`;
  };
  
  const effectiveLevel = Math.min(skill.level, skill.maxLevel);
  const wastedPoints = isOverallocated ? skill.level - skill.maxLevel : 0;
  const skillEffectDescription = getEffectDescription(skill);
  const skillColor = getSkillColor(skill);
  const skillDescription = getSkillDescription(skill);
  const borderClass = isLast ? "" : "border-b border-surface-700/30";

  return (
    <div className={`py-1.5 px-2 ${borderClass} hover:bg-surface-700/30`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild className="w-full text-left">
            <div className="flex justify-between items-center cursor-help">
              {/* Skill name */}
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs text-surface-100 truncate">{skill.name}</p>
              </div>
              
              {/* Level indicators */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {Array.from({ length: skill.maxLevel }, (_, i) => {
                  const level = i + 1;
                  const isActive = level <= skill.level;
                  const isOvercappedActive = isOverallocated && level <= skill.maxLevel;
                  
                  if (level > 7 && skill.maxLevel > 8) {
                    // For skills with many levels, just show summary after 7 levels
                    if (level === skill.maxLevel) {
                      return (
                        <div 
                          key={i} 
                          className={`w-3.5 h-3.5 border rounded-sm ${
                            isOvercappedActive && isActive
                              ? "bg-amber-500/80 border-amber-400" 
                              : isActive 
                                ? "bg-amber-500/80 border-amber-400" 
                                : "bg-surface-700/50 border-surface-600/70"
                          }`}
                        />
                      );
                    }
                    return null;
                  }
                  
                  return (
                    <div 
                      key={i} 
                      className={`w-3.5 h-3.5 border rounded-sm ${
                        isOvercappedActive && isActive
                          ? "bg-amber-500/80 border-amber-400" 
                          : isActive 
                            ? "bg-amber-500/80 border-amber-400" 
                            : "bg-surface-700/50 border-surface-600/70"
                      }`}
                    />
                  );
                })}
                
                {isOverallocated && (
                  <span className="text-yellow-400 text-xs font-medium ml-0.5">+{wastedPoints}</span>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-2">
              <p>{skillDescription}</p>
              <div>
                <p className="text-sm font-medium mb-1">Nivel actual: {effectiveLevel}</p>
                <p className={`text-sm ${skillColor}`}>{skillEffectDescription}</p>
                
                {isOverallocated && (
                  <div className="mt-1.5 text-yellow-400 text-xs flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    <span>
                      {wastedPoints} punto{wastedPoints > 1 ? 's' : ''} sin efecto
                    </span>
                  </div>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}