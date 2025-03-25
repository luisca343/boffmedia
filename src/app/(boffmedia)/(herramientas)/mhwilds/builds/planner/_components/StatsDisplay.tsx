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
import { Weapon, ElementData, WeaponSpecial, BuildData, StatsData } from "./types";
import { getAllWeaponElements, getElementColor, getStatusColor } from "./equipment-utils";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

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
    fire: <Flame className="h-4 w-4 text-red-400" />,
    water: <Droplet className="h-4 w-4 text-blue-400" />,
    thunder: <Zap className="h-4 w-4 text-yellow-400" />,
    ice: <Snowflake className="h-4 w-4 text-cyan-400" />,
    dragon: <Skull className="h-4 w-4 text-purple-400" />,
  };
  
  // Status type icons mapping
  const statusIcons = {
    poison: <Pill className="h-4 w-4 text-purple-400" />,
    sleep: <Pill className="h-4 w-4 text-blue-300" />,
    paralysis: <Pill className="h-4 w-4 text-yellow-300" />,
    blast: <Pill className="h-4 w-4 text-orange-400" />,
    stun: <Pill className="h-4 w-4 text-amber-400" />,
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
        {/* Compact primary stats row */}
        <div className="flex items-center gap-2 flex-wrap">
          <TooltipProvider>
            {/* Defense */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center px-3 py-1.5 bg-surface-700/40 rounded-md">
                  <Shield className="h-3.5 w-3.5 text-blue-400 mr-1.5" />
                  <span className="font-medium">{stats.defense || 0}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{t("defense")}</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Attack */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center px-3 py-1.5 bg-surface-700/40 rounded-md">
                  <Swords className="h-3.5 w-3.5 text-red-400 mr-1.5" />
                  <span className="font-medium">{attackValue || stats.attack || 0}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{t("attack")}</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Affinity */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center px-3 py-1.5 bg-surface-700/40 rounded-md">
                  <Target className="h-3.5 w-3.5 text-green-400 mr-1.5" />
                  <span className={`font-medium ${stats.affinity >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.affinity >= 0 ? '+' : ''}{stats.affinity || 0}%
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{t("affinity")}</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Elements - only show if present */}
            {weaponElements.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center px-3 py-1.5 bg-surface-700/40 rounded-md">
                    <div className="flex items-center gap-1">
                      {weaponElements.map((element, idx) => (
                        <React.Fragment key={`${weapon?.id || 'no-weapon'}-element-${idx}`}>
                          {element.type && elementIcons[element.type.toLowerCase() as keyof typeof elementIcons]}
                          <span className={`text-sm font-medium ${getElementColor(element.type)}`}>
                            {element.damage}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p className="font-medium mb-1">{t("element")}</p>
                  <div className="space-y-1">
                    {weaponElements.map((element, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        {element.type && elementIcons[element.type.toLowerCase() as keyof typeof elementIcons]}
                        <span className={`${getElementColor(element.type)}`}>
                          {element.damage} {element.type.charAt(0).toUpperCase() + element.type.slice(1)}
                          {element.hidden && <span className="text-xs ml-1 opacity-70">({t("hidden")})</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
            
            {/* Status Effects - only show if present */}
            {weaponStatuses.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center px-3 py-1.5 bg-surface-700/40 rounded-md">
                    <div className="flex items-center gap-1">
                      {weaponStatuses.map((status, idx) => (
                        <React.Fragment key={`${weapon?.id || 'no-weapon'}-status-${idx}`}>
                          {status.type && statusIcons[status.type.toLowerCase() as keyof typeof statusIcons] || 
                            <Pill className="h-4 w-4 text-surface-300" />}
                          <span className={`text-sm font-medium ${getStatusColor(status.type)}`}>
                            {status.damage}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p className="font-medium mb-1">{t("status")}</p>
                  <div className="space-y-1">
                    {weaponStatuses.map((status, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        {status.type && statusIcons[status.type.toLowerCase() as keyof typeof statusIcons] || 
                            <Pill className="h-4 w-4 text-surface-300" />}
                        <span className={`${getStatusColor(status.type)}`}>
                          {status.damage} {status.type.charAt(0).toUpperCase() + status.type.slice(1)}
                          {status.hidden && <span className="text-xs ml-1 opacity-70">({t("hidden")})</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
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
        
        {/* Additional weapon details in compact row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Display other weapon details... */}
          {weapon?.elderseal && weapon.elderseal !== null && (
            <span className="text-xs text-purple-400 bg-purple-900/20 px-2 py-0.5 rounded">
              {t("elderseal")}: { t(weapon.elderseal) }
            </span>
          )}
          {/* 
          {weapon?.defenseBonus && weapon.defenseBonus > 0 && (
            <span className="text-xs text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded">
              Bonificación de Defensa: +{weapon.defenseBonus}
            </span>
          )}
          */}
        </div>
      </CardContent>
    </Card>
  );
}