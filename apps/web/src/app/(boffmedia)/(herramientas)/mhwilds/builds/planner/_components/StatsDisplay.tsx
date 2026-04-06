import { SharpnessBar } from "./SharpnessBar";
import { ElementalResistances } from "./ElementalResistances";
import { EyeOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/primitives/tooltip";
import { Weapon, StatsData } from "../../../../../../../types/tools/mhwilds";
import { getAllWeaponElements, getElementColor, getStatusColor } from "./equipment-utils";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { MHWildsPanel, MHWildsPanelHeader, MHWildsPanelTitle, StatChip } from "./MHWildsPanel";

// Helper function to safely get attack value from weapon
const getWeaponAttack = (weapon: Weapon | null | undefined): number => {
  if (!weapon) return 0;
  if (typeof weapon.attack === 'number') return weapon.attack;
  if (weapon.damage && typeof weapon.damage.display === 'number') return weapon.damage.display;
  if (weapon.damage && typeof weapon.damage.raw === 'number') return weapon.damage.raw;
  return 0;
};

export function StatsDisplay({ stats }: { stats: StatsData }) {
  const t = useTranslations("mhwilds");
  const [weaponElements, setWeaponElements] = useState<{ type: string; damage: number; hidden?: boolean }[]>([]);
  const [weaponStatuses, setWeaponStatuses] = useState<{ type: string; damage: number; hidden?: boolean }[]>([]);

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
          <StatChip>
            <Image src={`/img/games/mhwilds/${icon}.webp`} alt={label} width={18} height={18} />
            <span className={`font-medium ${color}`}>{value}{extra}</span>
          </StatChip>
        </TooltipTrigger>
        <TooltipContent side="top">
          <span>{t(label)}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <MHWildsPanel>
      <MHWildsPanelHeader className="py-2">
        <MHWildsPanelTitle>{t("stats")}</MHWildsPanelTitle>
      </MHWildsPanelHeader>

      <div className="p-3 space-y-2">
        {/* Primary stats */}
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

        {/* Elements and status effects */}
        {(weaponElements.length > 0 || weaponStatuses.length > 0 || weapon?.elderseal) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {weaponElements.map((element, idx) => (
              <TooltipProvider key={`element-${idx}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <StatChip>
                      <Image
                        src={`/img/games/mhwilds/${element.type.toLowerCase() || 'element'}.webp`}
                        alt={element.type}
                        width={18}
                        height={18}
                      />
                      <span className={`font-medium ${getElementColor(element.type)}`}>{element.damage}</span>
                      {element.hidden && <EyeOff className="h-3 w-3 text-surface-400" />}
                    </StatChip>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <span>{element.hidden ? `${t("hidden")} ` : ""}{t(element.type)}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}

            {weaponStatuses.map((status, idx) => (
              <TooltipProvider key={`status-${idx}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <StatChip>
                      <Image
                        src={`/img/games/mhwilds/${status.type.toLowerCase() || 'status'}.webp`}
                        alt={status.type}
                        width={18}
                        height={18}
                      />
                      <span className={`font-medium ${getStatusColor(status.type)}`}>{status.damage}</span>
                      {status.hidden && <EyeOff className="h-3 w-3 text-surface-400" />}
                    </StatChip>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <span>{status.hidden ? `${t("hidden")} ` : ""}{t(status.type)}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}

            {weapon?.elderseal && weapon.elderseal !== null && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <StatChip>
                      <Image src="/img/games/mhwilds/dragon.webp" alt="Elderseal" width={18} height={18} />
                      <span className="font-medium text-accent-400">{t(weapon.elderseal)}</span>
                    </StatChip>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <span>{t("elderseal")}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}

        {/* Elemental Resistances */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-surface-500 mb-1">
            {t("build_planner.elemental_resistances")}
          </div>
          <ElementalResistances stats={stats} />
        </div>

        {/* Sharpness */}
        {weapon?.sharpness && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-surface-500 mb-1">
              {t("build_planner.sharpness")}
            </div>
            <SharpnessBar sharpness={weapon.sharpness} />
          </div>
        )}
      </div>
    </MHWildsPanel>
  );
}
