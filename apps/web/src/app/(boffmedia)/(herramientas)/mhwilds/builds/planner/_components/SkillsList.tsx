import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/primitives/card";
import { HelpCircle, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/primitives/scroll-area";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/primitives/tooltip";
import { Skill } from "../../../../../../../types/tools/mhwilds";
import { useTranslations } from "next-intl";

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
  skillsData: Record<string, ServerSkill>;  
}

export function SkillsList({ skills, skillsData }: SkillsListProps) {
  const t = useTranslations("mhwilds");
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
          <CardTitle className="text-base">{t("build_planner.active_skills")}</CardTitle>
          <span className="text-xs text-surface-400">
            {t("build_planner.skill_count", { count: skills.length })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-0 pb-1">
        {!skillsData ? (
          <div className="text-center py-6 text-surface-400">
            <HelpCircle className="h-6 w-6 mx-auto mb-1.5 opacity-50 animate-pulse" />
            <p className="text-xs">{t("build_planner.loading", {item: t("skills").toLowerCase()})}</p>
          </div>
        ) : sortedSkills.length > 0 ? (
          <ScrollArea className="pr-1">
            {/* Display overallocated skills first with warning */}
            {overallocatedSkills.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-0.5 pl-1">
                  <AlertCircle className="h-3 w-3 text-yellow-400" />
                  <span className="text-xs font-medium text-yellow-400">{t("build_planner.overallocated_skills")}</span>
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
            <p className="text-xs">{t("build_planner.no_active_skills")}</p>
            <p className="text-xs mt-0.5 opacity-70">{t("build_planner.no_active_skills_description")}</p>
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
  const t = useTranslations("mhwilds");
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

    return t("build_planner.skill_description_not_found");
  };
  
  // Get skill color based on type from server data or fallback to hardcoded categories
  const getSkillColor = (skill: Skill): string => {
    const serverSkill = getSkillData(skill);
    
    if (serverSkill) {
      switch (serverSkill.kind) {
        case "attack":
          return "text-red-400";
        case "defense":
          return "text-secondary-400";
        case "element":
          return "text-accent-400";
        case "utility":
          return "text-highlight-400";
        default:
          return "text-highlight-400";
      }
    }
    
    return "text-highlight-400";
  };
  
  // Get skill description from server data
  const getSkillDescription = (skill: Skill): string => {
    const serverSkill = getSkillData(skill);
    if (serverSkill) {
      return serverSkill.description;
    }
    return t("build_planner.skill_description_not_found");
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
          <TooltipContent side="top" className="max-w-md">
          <SkillTooltipContent
            skill={skill}
            skillDescription={skillDescription}
            skillColor={skillColor}
            skillEffectDescription={skillEffectDescription}
            effectiveLevel={effectiveLevel}
            isOverallocated={isOverallocated}
            wastedPoints={wastedPoints}
            skillData={getSkillData(skill)}
          />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// Update the props interface first
interface SkillTooltipContentProps {
  skill: Skill;
  skillDescription: string;
  skillColor: string;
  skillEffectDescription: string;
  effectiveLevel: number;
  isOverallocated: boolean;
  wastedPoints: number;
  skillData: ServerSkill | null;
}

function SkillTooltipContent({
  skill,
  skillDescription,
  skillColor,
  skillEffectDescription,
  effectiveLevel,
  isOverallocated,
  wastedPoints,
  skillData,
}: SkillTooltipContentProps) {
  const t = useTranslations("mhwilds");

  return (
    <div className="bg-surface-900 space-y-3 py-2 px-4">
      {/* Skill Title */}
      <div>
        <h3 className="font-bold text-lg">{skill.name}</h3>
        <p className="text-sm text-surface-400">{skillDescription}</p>
      </div>

      {/* Skill Levels */}
      <div className="space-y-1.5">
        <div className="grid gap-1">
          {skillData?.ranks.map((rank) => (
            <div 
              key={rank.level}
              className={`text-xs p-1.5 rounded ${
                rank.level === effectiveLevel 
                  ? 'text-primary-400' 
                  : 'text-surface-400'
              }`}
            >
              <span className="font-medium">
                {t("lv")} {rank.level}:
              </span> {rank.description}
            </div>
          ))}
        </div>
      </div>

      {/* Warning for overallocated points */}
      {isOverallocated && (
        <div className="mt-1.5 text-yellow-400 text-xs flex items-center bg-yellow-400/10 p-2 rounded">
          <AlertCircle className="h-3 w-3 mr-1" />
          <span>
            {t("build_planner.wasted_points", { count: wastedPoints })}
          </span>
        </div>
      )}
    </div>
  );
}