import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/primitives/card";
import { Separator } from "@/components/ui/primitives/separator";
import { SharpnessBar } from "./SharpnessBar";
import { ElementalResistances } from "./ElementalResistances";
import { EyeOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/primitives/tooltip";
import { Weapon, StatsData } from "../../../../../../../types/tools/mhwilds";
import { getAllWeaponElements, getElementColor, getStatusColor } from "./equipment-utils";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

// Helper function to safely get attack value from weapon
const getWeaponAttack = (weapon: Weapon | null | undefined): number => {
  if (!weapon) return 0;
  
  if (typeof weapon.attack === 'number') {
    return weapon.attack;
  }
  
  if (weapon.damage && typeof weapon.damage.display === 'number') {
    return weapon.damage.display;
  }
  
  if (weapon.damage && typeof weapon.damage.raw === 'number') {
    return weapon.damage.raw;
  }
  
  return 0;
};

export function StatsDisplay({ stats }: {stats: StatsData}) {
  const t = useTranslations("mhwilds");
  const [weaponElements, setWeaponElements] = useState<{ type: string; damage: number; hidden?: boolean; }[]>([]);
  const [weaponStatuses, setWeaponStatuses] = useState<{ type: string; damage: number; hidden?: boolean; }[]>([]);

  const weapon = stats.weapon;
  const attackValue = getWeaponAttack(weapon);
  
  useEffect(() => {
    try {
      if (weapon) {
        const { elements, statuses } = getAllWeaponElements(weapon);
        setWeaponElements(elements);
        setWeaponStatuses(statuses);
      } else {
        setWeaponElements([]);
        setWeaponStatuses([]);
      }
    } catch (err) {
      console.error("Error extracting weapon effects:", err);
      setWeaponElements([]);
      setWeaponStatuses([]);
    }
  }, [weapon]);

  const renderStatItem = (
    icon: string, 
    label: string, 
    value: string | number, 
    color: string, 
    extra?: React.ReactNode
  ) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 bg-surface-700/40 rounded px-2 py-1.5">
            <Image src={`/img/games/mhwilds/${icon}.webp`} alt={label} width={18} height={18} />
            <span className={`font-medium ${color}`}>{value}{extra}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <span>{t(label)}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
  
  return (
    <Card className="bg-surface-800 border-surface-700">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-base">{t("stats")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-3">
        {/* Primary stats in a row */}
        <div className="grid grid-cols-3 gap-2">
          {renderStatItem("defense", "defense", `${stats.defenseMin} - ${stats.defenseMax}`, "text-secondary-400")}
          {renderStatItem("attack", "attack", attackValue || stats.attack || 0, "text-red-400")}
          {renderStatItem(
            "affinity", 
            "affinity", 
            stats.affinity >= 0 ? `+${stats.affinity || 0}` : stats.affinity || 0, 
            stats.affinity >= 0 ? 'text-highlight-400' : 'text-red-400',
            <span>%</span>
          )}
        </div>
        
        {/* Elements and status effects in a grid */}
        {(weaponElements.length > 0 || weaponStatuses.length > 0 || weapon?.elderseal) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {/* Elements */}
            {weaponElements.map((element, idx) => (
              <TooltipProvider key={`element-${idx}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 bg-surface-700/40 rounded px-2 py-1.5">
                      <Image 
                        src={`/img/games/mhwilds/${element.type.toLowerCase() || 'element'}.webp`}
                        alt={element.type}
                        width={18}
                        height={18}
                      />
                      <span className={`font-medium ${getElementColor(element.type)}`}>
                        {element.damage}
                      </span>
                      {element.hidden && <EyeOff className="h-3 w-3 text-surface-400" />}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <span>{element.hidden ? `${t("hidden")} ` : ""}{t(element.type)}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            
            {/* Status Effects */}
            {weaponStatuses.map((status, idx) => (
              <TooltipProvider key={`status-${idx}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 bg-surface-700/40 rounded px-2 py-1.5">
                      <Image 
                        src={`/img/games/mhwilds/${status.type.toLowerCase() || 'status'}.webp`}
                        alt={status.type}
                        width={18}
                        height={18}
                      />
                      <span className={`font-medium ${getStatusColor(status.type)}`}>
                        {status.damage}
                      </span>
                      {status.hidden && <EyeOff className="h-3 w-3 text-surface-400" />}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <span>{status.hidden ? `${t("hidden")} ` : ""}{t(status.type)}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            
            {/* Elderseal */}
            {weapon?.elderseal && weapon.elderseal !== null && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 bg-surface-700/40 rounded px-2 py-1.5">
                      <Image 
                        src="/img/games/mhwilds/dragon.webp" 
                        alt="Elderseal"
                        width={18}
                        height={18}
                      />
                      <span className="font-medium text-accent-400">
                        {t(weapon.elderseal)}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <span>{t("elderseal")}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
        
        {/* Elemental Resistances - more compact */}
        <div>
          <div className="text-xs text-surface-400 mb-0.5">{t("build_planner.elemental_resistances")}</div>
          <ElementalResistances stats={stats} />
        </div>

        {/* Sharpness Bar - only show if weapon has sharpness */}
        {weapon?.sharpness && (
          <div>
            <div className="text-xs text-surface-400 mb-0.5">{t("build_planner.sharpness")}</div>
            <SharpnessBar sharpness={weapon.sharpness} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}