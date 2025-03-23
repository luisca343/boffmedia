import { motion } from "framer-motion";
import { 
  Plus,
  Info,
  EyeOff,
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
} from "./types";
import { FC, ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { getElementColor, getDefenseValue } from "./utils";
import { getAllWeaponElements } from "./equipment-utils";

interface SlotConfig {
  key: EquipmentType;
  name: string;
  icon: LucideIcon | any; // Using any to accommodate both Lucide and react-icons
  component: EquipmentComponent | null;
  iconColor: string;
}

interface ComponentSlotProps {
  slot: SlotConfig;
  onSlotClick: (slot: EquipmentType) => void;
  onDecorationClick: (equipmentType: EquipmentType, slotIndex: number) => void;
  renderDecorationSlots: (equipmentType: EquipmentType, slots?: number[]) => ReactNode;
}

// Helper function to determine if a component is a weapon
const isWeapon = (component: EquipmentComponent | null): component is Weapon => {
  return component !== null && 'damage' in component;
};

// Helper function to determine if a component is armor
const isArmor = (component: EquipmentComponent | null): component is ArmorPiece => {
  return component !== null && 'resistances' in component;
};

// Extracted component for weapon details
const WeaponDetails: FC<{ weapon: Weapon }> = ({ weapon }) => {
    const elements = getAllWeaponElements(weapon);
    const totalElementalDamage = elements.reduce((total, el) => total + el.damage, 0);
  
    return (
      <div className="flex gap-4">
        <span className="text-red-400">Ataque: {weapon.attack || weapon.damage?.display || 0}</span>
        <span className={weapon.affinity && weapon.affinity >= 0 ? "text-green-400" : "text-red-400"}>
          Afinidad: {weapon.affinity && weapon.affinity > 0 ? '+' : ''}{weapon.affinity || 0}%
        </span>
        
        {/* Enhanced element display */}
        {elements.length > 0 && (
          <>
            {elements.map((element, idx) => (
              <TooltipProvider key={idx}>
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
            
            {/* If multiple elements, show total */}
            {elements.length > 1 && (
              <span className="text-purple-300">Total: {totalElementalDamage}</span>
            )}
          </>
        )}
      </div>
    );
  };
// Extracted component for armor details
const ArmorDetails: FC<{ armor: ArmorPiece }> = ({ armor }) => (
  <div className="flex gap-3">
    <span className="text-blue-400">Def: {getDefenseValue(armor.defense)}</span>
    {armor.rarity !== undefined && (
      <span className="text-amber-400">R{armor.rarity}</span>
    )}
    {armor.armorSet && (
      <span className="text-primary-400">
        Set: {armor.armorSet.name}
      </span>
    )}
  </div>
);

// Extracted component for skills
const SkillsList: FC<{ skills: SkillRank[] }> = ({ skills }) => (
    <div className="mt-2 text-xs flex flex-wrap items-center gap-x-2">
      <span className="text-surface-400 mr-1">Habilidades:</span>
      {skills.map((skillRank, idx) => {
        const skillName = skillRank.skill?.name || skillRank.name || "Unknown Skill";
        return (
          <span 
            key={`${skillRank.id || `skill-${idx}`}`} 
            className="text-green-400"
          >
            {skillName} Nv.{skillRank.level}
            {idx < skills.length - 1 && <span className="text-surface-500 ml-1">/</span>}
          </span>
        );
      })}
    </div>
  );

// Main ComponentSlot
export const ComponentSlot: FC<ComponentSlotProps> = ({ 
  slot, 
  onSlotClick, 
  onDecorationClick, 
  renderDecorationSlots 
}) => {
  return (
    <motion.div 
      className="bg-surface-700/30 rounded-lg p-3 hover:bg-surface-700/50 cursor-pointer"
      onClick={() => onSlotClick(slot.key)}
      whileHover={{ x: 5 }}
      role="button"
      aria-label={`Select ${slot.name} equipment`}
    >
      <div className="flex items-center">
        <div className={`w-16 h-16 bg-surface-700 rounded-lg flex items-center justify-center mr-4 ${slot.component ? 'bg-surface-600/50' : 'bg-surface-700'}`}>
          <div className="flex flex-col items-center justify-center">
            <slot.icon className={`h-8 w-8 ${slot.component ? slot.iconColor : 'text-surface-500'}`} />
            {!slot.component && <Plus className="h-4 w-4 text-surface-400 mt-1" />}
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center">
            <span className="font-medium text-surface-100">
              {slot.component ? slot.component.name : `Sin ${slot.name}`}
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
                    <p>{slot.component.description || `Descripción de ${slot.component.name}`}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          {slot.component && (
            <div className="text-xs text-surface-300 mt-1 flex items-center justify-between">
              <div>
                {/* Render different details based on equipment type */}
                {isWeapon(slot.component) ? 
                  <WeaponDetails weapon={slot.component} /> : 
                  isArmor(slot.component) ? 
                  <ArmorDetails armor={slot.component} /> : null
                }
              </div>
              
              {slot.component.slots && slot.component.slots.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-surface-400 mr-1">Decoraciones:</span>
                  {renderDecorationSlots(slot.key, slot.component.slots)}
                </div>
              )}
            </div>
          )}
          
          {slot.component?.skills && slot.component.skills.length > 0 && (
            <SkillsList skills={slot.component.skills} />
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Also export the types for use elsewhere
export type { ComponentSlotProps, SlotConfig };