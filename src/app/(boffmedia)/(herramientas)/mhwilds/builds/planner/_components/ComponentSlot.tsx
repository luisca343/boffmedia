import { motion } from "framer-motion";
import { 
  Plus,
  Info,
  EyeOff,
  Pill,
  Medal
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  EquipmentType, 
  EquipmentComponent,
  ArmorPiece,
  Weapon,
  SkillRank,
  Charm,
  CharmSkill
} from "../../../../../../../types/tools/mhwilds";
import { FC, ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { getElementColor, getDefenseValue, getStatusColor, getWeaponTypeIcon, getArmorImagePath, getRarityFilterStyle } from "./equipment-utils";
import { getAllWeaponElements } from "./equipment-utils";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface SlotConfig {
  key: EquipmentType;
  name: string;
  icon: LucideIcon | any; // Using any to accommodate both Lucide and react-icons
  component: EquipmentComponent | null;
  iconColor: string;
  hasCustomIcon?: boolean;
}

interface ComponentSlotProps {
  slot: SlotConfig;
  onSlotClick: (slot: EquipmentType) => void;
  onDecorationClick: (equipmentType: EquipmentType, slotIndex: number) => void;
  renderDecorationSlots: (equipmentType: EquipmentType, slots?: number[]) => ReactNode;
  hasCustomIcon?: boolean;
  rarity?: number;
}

// Helper function to determine if a component is a weapon
const isWeapon = (component: EquipmentComponent | null): component is Weapon => {
  return component !== null && ('damage' in component || 'attack' in component);
};

// Helper function to determine if a component is armor
const isArmor = (component: EquipmentComponent | null): component is ArmorPiece => {
  return component !== null && 'resistances' in component;
};

// Helper function to determine if a component is a charm
const isCharm = (component: EquipmentComponent | null): component is Charm => {
  return component !== null && 'charm' in component;
};

// Extracted component for weapon details
const WeaponDetails: FC<{ weapon: Weapon }> = ({ weapon }) => {
    const t = useTranslations("mhwilds");
    const { elements, statuses } = getAllWeaponElements(weapon);
    const totalElementalDamage = elements.reduce((total, el) => total + el.damage, 0);
  
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span className="text-red-400">{t("attack")}: {weapon.attack || weapon.damage?.display || 0}</span>
        <span className={weapon.affinity && weapon.affinity >= 0 ? "text-green-400" : "text-red-400"}>
          {t("affinity")}: {weapon.affinity && weapon.affinity > 0 ? '+' : ''}{weapon.affinity || 0}%
        </span>
        
        {/* Elements display */}
        {elements.length > 0 && (
          <>
            {elements.map((element, idx) => (
              <TooltipProvider key={`element-${idx}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`flex items-center ${getElementColor(element.type)}`}>
                      {element.type.charAt(0).toUpperCase() + element.type.slice(1)}: {element.damage}
                      {element.hidden && <EyeOff className="h-3 w-3 ml-1" />}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {element.hidden 
                        ? "Elemento oculto: Requiere habilidad Elemento Libre" 
                        : "Daño elemental"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </>
        )}

        {/* Status effects display */}
        {statuses.length > 0 && (
          <>
            {statuses.map((status, idx) => (
              <TooltipProvider key={`status-${idx}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`flex items-center ${getStatusColor(status.type)}`}>
                      <Pill className="h-3 w-3 mr-1" />
                      {status.type.charAt(0).toUpperCase() + status.type.slice(1)}: {status.damage}
                      {status.hidden && <EyeOff className="h-3 w-3 ml-1" />}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {status.hidden 
                        ? "Estado oculto: Requiere habilidad Elemento Libre" 
                        : "Daño de estado"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </>
        )}
        
        {/* If multiple elements, show total */}
        {elements.length > 1 && (
          <span className="text-purple-300">
            {t("total_element")}: {totalElementalDamage}
          </span>
        )}
      </div>
    );
};

// Extracted component for armor details
const ArmorDetails: FC<{ armor: ArmorPiece }> = ({ armor }) => {
  const t = useTranslations("mhwilds");
  return <div className="flex gap-3">
    <span className="text-blue-400">{t("def")}: {getDefenseValue(armor.defense)}</span>
    {armor.rarity !== undefined && (
      <span className="text-amber-400">{t("rarity")} {armor.rarity}</span>
    )}
    {armor.armorSet && (
      <span className="text-primary-400">
        {t("build_planner.set")}: {armor.armorSet.name}
      </span>
    )}
  </div>
}

// Extracted component for charm details
const CharmDetails: FC<{ charm: Charm }> = ({ charm }) => {
  const t = useTranslations("mhwilds");
  return <div className="flex gap-3">
    <span className="text-amber-400">{t("rarity")} {charm.rarity}</span>
    <div className="flex gap-2">
      {charm.skills.map((skill, idx) => (
        <span key={idx} className="text-green-400">
          {skill.skill.name} +{skill.level}
        </span>
      ))}
    </div>
  </div>
}

// Extracted component for skills
const SkillsList: FC<{ skills: SkillRank[] | CharmSkill[] }> = ({ skills }) => {
  const t = useTranslations("mhwilds");

    return <div className="mt-2 text-xs flex flex-wrap items-center gap-x-2">
      <span className="text-surface-400 mr-1">{t("skills")}:</span>
      {skills.map((skillRank, idx) => {
        const skillName = skillRank.skill?.name || skillRank.name || "Unknown Skill";
        return (
          <span 
            key={`${skillRank.id || `skill-${idx}`}`} 
            className="text-green-400"
          >
            {skillName} {t("lv")}{skillRank.level}
            {idx < skills.length - 1 && <span className="text-surface-500 ml-1">/</span>}
          </span>
        );
      })}
    </div>
}

// Main ComponentSlot
export const ComponentSlot: FC<ComponentSlotProps> = ({ 
  slot, 
  onSlotClick, 
  onDecorationClick, 
  renderDecorationSlots,
  hasCustomIcon = false,
  rarity = 0,
}) => {
  const t = useTranslations("mhwilds");
  return (
    <motion.div 
      className="bg-surface-700/30 rounded-lg p-2 hover:bg-surface-700/50 cursor-pointer"
      onClick={() => onSlotClick(slot.key)}
      whileHover={{ x: 5 }}
      role="button"
      aria-label={`Select ${slot.name} equipment`}
    >
      <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-center">
        {/* Column 1: Icon */}
        <div className={`w-16 h-16 bg-surface-700 rounded-lg flex items-center justify-center ${slot.component ? 'bg-surface-600/50' : 'bg-surface-700'}`}>
          <div className="flex flex-col items-center justify-center">
            {/* For weapons */}
            {slot.key === 'weapon' || slot.key === 'secondaryWeapon' ? (
              <div className="relative w-10 h-10">
                <Image 
                  src={slot.component && isWeapon(slot.component) 
                    ? getWeaponTypeIcon(slot.component.kind || slot.component.type || 'great-sword')
                    : getWeaponTypeIcon('great-sword')} 
                  alt={slot.component && isWeapon(slot.component) ? slot.component.kind || 'weapon' : 'weapon'}
                  width={40}
                  height={40}
                  className={`object-contain ${!slot.component ? 'opacity-30' : ''}`}
                  style={{ 
                    filter: getRarityFilterStyle(rarity)
                  }} 
                />
                {!slot.component && <Plus className="h-4 w-4 text-surface-400 absolute bottom-0 right-0" />}
              </div>
            ) : slot.key === 'charm' ? (
              // For charms
              <div className="relative w-10 h-10 flex items-center justify-center">
                <Medal className={`h-8 w-8 ${!slot.component ? 'text-surface-500' : 'text-amber-400'}`} />
                {!slot.component && <Plus className="h-4 w-4 text-surface-400 absolute bottom-0 right-0" />}
              </div>
            ) : (
              /* For armor pieces */
              <div className="relative w-10 h-10">
                <Image 
                  src={getArmorImagePath(slot.key)} 
                  alt={slot.key}
                  width={40}
                  height={40}
                  className={`object-contain ${!slot.component ? 'opacity-30' : ''}`}
                  style={{ 
                    filter: getRarityFilterStyle(rarity)
                  }} 
                />
                {!slot.component && <Plus className="h-4 w-4 text-surface-400 absolute bottom-0 right-0" />}
              </div>
            )}
          </div>
        </div>
        
        {/* Column 2: Equipment details */}
        <div className="flex-1">
          <div className="flex items-center">
            <span className="font-medium text-surface-100">
              {slot.component 
                ? slot.component.name 
                : t("build_planner.no_equipment", { name: slot.name })}
            </span>
            
            {slot.component && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="ml-2">
                      <Info className="h-3.5 w-3.5 text-surface-400" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>{slot.component.description || (t('build_planner.no_description'))}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          {slot.component && (
            <div className="text-xs text-surface-300 mt-1">
              {/* Render different details based on equipment type */}
              {isWeapon(slot.component) ? 
                <WeaponDetails weapon={slot.component} /> : 
                isArmor(slot.component) ? 
                <ArmorDetails armor={slot.component} /> :
                isCharm(slot.component) ?
                <CharmDetails charm={slot.component} /> : null
              }
            </div>
          )}
          
          {slot.component?.skills && slot.component.skills.length > 0 && (
            <SkillsList skills={slot.component.skills} />
          )}
        </div>
        
        {/* Column 3: Decoration slots */}
        {slot.component && slot.component.slots && slot.component.slots.length > 0 && (
          <div className="flex flex-col justify-center items-end w-44">
            {renderDecorationSlots(slot.key, slot.component.slots)}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export type { ComponentSlotProps, SlotConfig };