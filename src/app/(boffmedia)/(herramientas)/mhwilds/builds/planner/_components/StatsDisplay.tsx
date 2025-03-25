import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SharpnessBar } from "./SharpnessBar";
import { ElementalResistances } from "./ElementalResistances";
import { Droplet, Zap, Snowflake, Skull, Flame, EyeOff, Shield, Swords, Target, Pill } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Weapon, ElementData, WeaponSpecial, BuildData, StatsData } from "../../../../../../../types/tools/mhwilds";
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
  
  // Element type icons mapping
  const elementIcons = {
    fire: "fire",
    water: "water",
    thunder: "thunder",
    ice: "ice",
    dragon: "dragon",
  };
  
  // Status type icons mapping
  const statusIcons = {
    poison: "poison",
    sleep: "sleep",
    paralysis: "paralysis",
    blast: "blast",
    stun: "stun",
  };

  // Get the weapon from different possible locations
  const weapon = stats.weapon;

  // Get weapon attack value
  const attackValue = getWeaponAttack(weapon);
  
  // Effect to update elements and statuses when weapon changes
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
  
  return (
    <Card className="bg-surface-800 border-surface-700">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-base">{t("stats")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        {/* Stats displayed vertically */}
        <div className="grid grid-cols-1 gap-2">
          <TooltipProvider>
            {/* Defense */}
            <div className="flex items-center gap-2 bg-surface-700/40 rounded-md p-2">
              <div className="w-8 h-8 flex justify-center items-center">
                <Image 
                  src="/img/games/mhwilds/defense.webp" 
                  alt="Defense"
                  width={24}
                  height={24}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-surface-300">{t("defense")}</span>
                <span className="font-medium text-blue-400">{stats.defense || 0}</span>
              </div>
            </div>
            
            {/* Attack */}
            <div className="flex items-center gap-2 bg-surface-700/40 rounded-md p-2">
              <div className="w-8 h-8 flex justify-center items-center">
                <Image 
                  src="/img/games/mhwilds/attack.webp" 
                  alt="Attack"
                  width={24}
                  height={24}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-surface-300">{t("attack")}</span>
                <span className="font-medium text-red-400">{attackValue || stats.attack || 0}</span>
              </div>
            </div>
            
            {/* Affinity */}
            <div className="flex items-center gap-2 bg-surface-700/40 rounded-md p-2">
              <div className="w-8 h-8 flex justify-center items-center">
                <Image 
                  src="/img/games/mhwilds/affinity.webp" 
                  alt="Affinity"
                  width={24}
                  height={24}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-surface-300">{t("affinity")}</span>
                <span className={`font-medium ${stats.affinity >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.affinity >= 0 ? '+' : ''}{stats.affinity || 0}%
                </span>
              </div>
            </div>
            
            {/* Elements - only show if present */}
            {weaponElements.length > 0 && weaponElements.map((element, idx) => (
              <div 
                key={`element-${idx}`} 
                className="flex items-center gap-2 bg-surface-700/40 rounded-md p-2"
              >
                <div className="w-8 h-8 flex justify-center items-center">
                  <Image 
                    src={`/img/games/mhwilds/${elementIcons[element.type.toLowerCase() as keyof typeof elementIcons] || 'element'}.webp`}
                    alt={element.type}
                    width={24}
                    height={24}
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <span className="text-xs text-surface-300">{t(element.type)}</span>
                    {element.hidden && <EyeOff className="h-3 w-3 ml-1 text-surface-400" />}
                  </div>
                  <span className={`font-medium ${getElementColor(element.type)}`}>{element.damage}</span>
                </div>
              </div>
            ))}
            
            {/* Status Effects - only show if present */}
            {weaponStatuses.length > 0 && weaponStatuses.map((status, idx) => (
              <div 
                key={`status-${idx}`} 
                className="flex items-center gap-2 bg-surface-700/40 rounded-md p-2"
              >
                <div className="w-8 h-8 flex justify-center items-center">
                  <Image 
                    src={`/img/games/mhwilds/${statusIcons[status.type.toLowerCase() as keyof typeof statusIcons] || 'status'}.webp`}
                    alt={status.type}
                    width={24}
                    height={24}
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <span className="text-xs text-surface-300">{t(status.type)}</span>
                    {status.hidden && <EyeOff className="h-3 w-3 ml-1 text-surface-400" />}
                  </div>
                  <span className={`font-medium ${getStatusColor(status.type)}`}>{status.damage}</span>
                </div>
              </div>
            ))}

            {/* Additional weapon details */}
            {weapon?.elderseal && weapon.elderseal !== null && (
              <div className="flex items-center gap-2 bg-surface-700/40 rounded-md p-2">
                <div className="w-8 h-8 flex justify-center items-center">
                  <Image 
                    src="/img/games/mhwilds/dragon.webp" 
                    alt="Elderseal"
                    width={24}
                    height={24}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-surface-300">{t("elderseal")}</span>
                  <span className="font-medium text-purple-400">{ t(weapon.elderseal) }</span>
                </div>
              </div>
            )}
          </TooltipProvider>
        </div>
        
        {/* Elemental Resistances */}
        <div>
          <div className="text-xs text-surface-400 mb-1">{t("build_planner.elemental_resistances")}</div>
          <ElementalResistances stats={stats} />
        </div>

        {/* Sharpness Bar - only show if weapon has sharpness */}
        {weapon?.sharpness && (
          <div>
            <div className="text-xs text-surface-400 mb-1">{t("build_planner.sharpness")}</div>
            <SharpnessBar sharpness={weapon.sharpness} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}