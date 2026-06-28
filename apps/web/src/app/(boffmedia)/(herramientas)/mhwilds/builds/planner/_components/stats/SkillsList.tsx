import { HelpCircle, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/primitives/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/primitives/tooltip";
import { Skill } from "@/types/tools/mhwilds";
import { useTranslations } from "next-intl";
import { MHWildsPanel, MHWildsPanelHeader, MHWildsPanelTitle } from "../MHWildsPanel";

interface ServerSkill {
  id: number;
  name: string;
  kind: string;
  description: string;
  ranks: {
    skill: { id: number };
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
    if (b.level !== a.level) return b.level - a.level;
    return a.name.localeCompare(b.name);
  });

  const overallocatedSkills = sortedSkills.filter(skill => skill.level > skill.maxLevel);
  const normalSkills = sortedSkills.filter(skill => skill.level <= skill.maxLevel);

  return (
    <MHWildsPanel>
      <MHWildsPanelHeader className="py-2">
        <MHWildsPanelTitle>{t("build_planner.active_skills")}</MHWildsPanelTitle>
        <span className="text-[10px] font-mono text-ink-muted">
          {t("build_planner.skill_count", { count: skills.length })}
        </span>
      </MHWildsPanelHeader>

      <div className="px-2 pt-0 pb-1">
        {!skillsData ? (
          <div className="text-center py-6 text-ink-muted">
            <HelpCircle className="h-6 w-6 mx-auto mb-1.5 opacity-50 animate-pulse" />
            <p className="text-xs">{t("build_planner.loading", { item: t("skills").toLowerCase() })}</p>
          </div>
        ) : sortedSkills.length > 0 ? (
          <ScrollArea className="pr-1">
            {/* Overallocated skills */}
            {overallocatedSkills.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-0.5 pl-1">
                  <AlertCircle className="h-3 w-3 text-yellow-400" />
                  <span className="text-xs font-medium text-yellow-400">
                    {t("build_planner.overallocated_skills")}
                  </span>
                </div>
                <div
                  className="rounded-lg overflow-hidden"
                  style={{
                    background: "rgba(234,179,8,0.05)",
                    border: "1px solid rgba(234,179,8,0.22)",
                  }}
                >
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

            {/* Normal skills */}
            <div
              className="rounded-lg overflow-hidden"
              style={{ border: "1px solid rgba(71,85,105,0.2)" }}
            >
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
          <div className="text-center py-6 text-ink-muted">
            <HelpCircle className="h-6 w-6 mx-auto mb-1.5 opacity-50" />
            <p className="text-xs">{t("build_planner.no_active_skills")}</p>
            <p className="text-xs mt-0.5 opacity-70">{t("build_planner.no_active_skills_description")}</p>
          </div>
        )}
      </div>
    </MHWildsPanel>
  );
}

// ─── CompactSkillItem ─────────────────────────────────────────────────────────

interface SkillItemProps {
  skill: Skill;
  serverSkillData: Record<string, ServerSkill>;
  isOverallocated: boolean;
  isLast?: boolean;
}

function CompactSkillItem({ skill, serverSkillData, isOverallocated, isLast = false }: SkillItemProps) {
  const t = useTranslations("mhwilds");

  const getSkillData = (skill: Skill): ServerSkill | null => {
    const idKey = String(skill.id);
    if (serverSkillData[idKey]) return serverSkillData[idKey];
    if (serverSkillData[skill.name]) return serverSkillData[skill.name];
    return null;
  };

  const getEffectDescription = (skill: Skill): string => {
    const serverSkill = getSkillData(skill);
    const effectiveLevel = Math.min(skill.level, skill.maxLevel);
    if (serverSkill) {
      const rank = serverSkill.ranks.find(r => r.level === effectiveLevel);
      if (rank) return rank.description;
    }
    return t("build_planner.skill_description_not_found");
  };

  const getSkillColor = (skill: Skill): string => {
    const serverSkill = getSkillData(skill);
    if (serverSkill) {
      switch (serverSkill.kind) {
        case "attack":  return "text-red-400";
        case "defense": return "text-secondary-hover";
        case "element": return "text-secondary-hover";
        default:        return "text-warning-hover";
      }
    }
    return "text-warning-hover";
  };

  const getSkillDescription = (skill: Skill): string => {
    const serverSkill = getSkillData(skill);
    if (serverSkill) return serverSkill.description;
    return t("build_planner.skill_description_not_found");
  };

  const effectiveLevel = Math.min(skill.level, skill.maxLevel);
  const wastedPoints = isOverallocated ? skill.level - skill.maxLevel : 0;
  const skillEffectDescription = getEffectDescription(skill);
  const skillColor = getSkillColor(skill);
  const skillDescription = getSkillDescription(skill);
  const borderClass = isLast ? "" : "border-b border-edge/20";

  return (
    <div className={`py-1.5 px-2 ${borderClass} hover:bg-layer-2/50 transition-colors`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild className="w-full text-left">
            <div className="flex justify-between items-center cursor-help">
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs text-ink truncate">{skill.name}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {Array.from({ length: skill.maxLevel }, (_, i) => {
                  const level = i + 1;
                  const isActive = level <= skill.level;

                  if (level > 7 && skill.maxLevel > 8) {
                    if (level === skill.maxLevel) {
                      return (
                        <div
                          key={i}
                          className="w-3.5 h-3.5 border rounded-sm"
                          style={isActive
                            ? { background: "rgba(245,158,11,0.7)", borderColor: "rgba(251,191,36,0.6)" }
                            : { background: "rgba(15,23,42,0.6)", borderColor: "rgba(71,85,105,0.4)" }}
                        />
                      );
                    }
                    return null;
                  }

                  return (
                    <div
                      key={i}
                      className="w-3.5 h-3.5 border rounded-sm"
                      style={isActive
                        ? { background: "rgba(245,158,11,0.7)", borderColor: "rgba(251,191,36,0.6)" }
                        : { background: "rgba(15,23,42,0.6)", borderColor: "rgba(71,85,105,0.4)" }}
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

// ─── SkillTooltipContent ──────────────────────────────────────────────────────

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
    <div className="bg-layer-1 space-y-3 py-2 px-4">
      <div>
        <h3 className="font-bold text-lg">{skill.name}</h3>
        <p className="text-sm text-ink-muted">{skillDescription}</p>
      </div>
      <div className="space-y-1.5">
        <div className="grid gap-1">
          {skillData?.ranks.map((rank) => (
            <div
              key={rank.level}
              className={`text-xs p-1.5 rounded ${
                rank.level === effectiveLevel ? 'text-primary-hover' : 'text-ink-muted'
              }`}
            >
              <span className="font-medium">{t("lv")} {rank.level}:</span> {rank.description}
            </div>
          ))}
        </div>
      </div>
      {isOverallocated && (
        <div className="mt-1.5 text-yellow-400 text-xs flex items-center bg-yellow-400/10 p-2 rounded">
          <AlertCircle className="h-3 w-3 mr-1" />
          <span>{t("build_planner.wasted_points", { count: wastedPoints })}</span>
        </div>
      )}
    </div>
  );
}
