import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Sword,
  Gem,
  Shirt,
  ArrowBigRight,
  CircleDot,
  Footprints,
} from "lucide-react";
import { 
  BuildData, 
  EquipmentType, 
  Decoration, 
} from "./types";
import { GiDwarfHelmet } from "react-icons/gi";
import { useMemo } from "react";
import { getSlotColorClass } from "./utils";
import { ComponentSlot } from "./ComponentSlot";
import Image from "next/image";
import { getWeaponTypeIcon } from "./equipment-utils";

interface BuildDisplayProps {
  currentBuild: BuildData;
  onSlotClick: (slot: EquipmentType) => void;
  onDecorationClick: (equipmentType: EquipmentType, slotIndex: number) => void;
}

export function BuildDisplay({ 
  currentBuild, 
  onSlotClick, 
  onDecorationClick 
}: BuildDisplayProps) {
  // Equipment slots configuration with unique icons for each slot
  const equipmentSlots = useMemo(() => {
    // Get weapon icon component if weapon is present
    const WeaponIconComponent = currentBuild.weapon ? 
      (props: any) => (
        <div className="relative w-6 h-6">
          <Image 
            src={getWeaponTypeIcon(currentBuild.weapon?.kind || currentBuild.weapon?.type || 'great-sword')} 
            alt={currentBuild.weapon?.kind || 'weapon'}
            width={24}
            height={24}
            className="object-contain"
            {...props}
          />
        </div>
      ) : 
      Sword;
    
    return [
      { 
        key: 'weapon' as EquipmentType, 
        name: 'Arma', 
        icon: WeaponIconComponent, 
        component: currentBuild.weapon, 
        iconColor: "text-red-400",
        hasCustomIcon: !!currentBuild.weapon
      },
      { key: 'head' as EquipmentType, name: 'Casco', icon: GiDwarfHelmet, component: currentBuild.head, iconColor: "text-blue-400" },
      { key: 'chest' as EquipmentType, name: 'Pecho', icon: Shirt, component: currentBuild.chest, iconColor: "text-green-400" },
      { key: 'arms' as EquipmentType, name: 'Brazos', icon: ArrowBigRight, component: currentBuild.arms, iconColor: "text-yellow-400" },
      { key: 'waist' as EquipmentType, name: 'Cintura', icon: CircleDot, component: currentBuild.waist, iconColor: "text-purple-400" },
      { key: 'legs' as EquipmentType, name: 'Piernas', icon: Footprints, component: currentBuild.legs, iconColor: "text-cyan-400" },
    ];
  }, [currentBuild]);

  // Check if a decoration is assigned to a slot - memoized for performance
  const getDecorationForSlot = useMemo(() => (equipmentType: EquipmentType, slotIndex: number): Decoration | null => {
    if (!currentBuild.decorations) return null;
    
    return currentBuild.decorations.find(
      deco => deco.equipmentType === equipmentType && deco.slotIndex === slotIndex
    )?.decoration || null;
  }, [currentBuild.decorations]);

  // Render decoration slots for a piece of equipment
  const renderDecorationSlots = (equipmentType: EquipmentType, slots?: number[]) => {
    if (!slots || slots.length === 0) return null;
    
    return (
      <div className="flex gap-1 mt-1">
        {slots.map((size, idx) => {
          const decoration = getDecorationForSlot(equipmentType, idx);
          const slotSize = size || 1; // Default to 1 if size is undefined
          
          return (
            <motion.div 
              key={idx} 
              className={`w-5 h-5 rounded-full flex items-center justify-center cursor-pointer border-2 ${
                decoration 
                  ? `${getSlotColorClass(decoration.slot)} border-white/30` 
                  : `${getSlotColorClass(slotSize)} border-transparent`
              } hover:border-white/70 transition-all`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onDecorationClick(equipmentType, idx);
              }}
              role="button"
              aria-label={decoration 
                ? `Decoration slot size ${decoration.slot}: ${decoration.name}` 
                : `Empty decoration slot size ${slotSize}`
              }
            >
              <span className="text-[10px] text-surface-900 font-medium">
                {decoration ? decoration.slot : slotSize}
              </span>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="bg-surface-800 border-surface-700 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-xl">
          Equipo Actual
          <span className="text-sm font-normal text-surface-400 ml-2">
            (Haz click para cambiar)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {equipmentSlots.map(slot => (
            <ComponentSlot
              key={slot.key}
              slot={slot}
              onSlotClick={onSlotClick}
              onDecorationClick={onDecorationClick}
              renderDecorationSlots={renderDecorationSlots}
              hasCustomIcon={slot.hasCustomIcon}
            />
          ))}
          
          {/* Summary of active decorations */}
          <div className="mt-6 bg-surface-700/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-medium text-surface-100 flex items-center">
                <Gem className="mr-2 h-4 w-4 text-surface-300" />
                Decoraciones Activas
              </h3>
              <span className="text-xs text-surface-400">
                {currentBuild.decorations?.length || 0} decoraciones equipadas
              </span>
            </div>
            
            {currentBuild.decorations && currentBuild.decorations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentBuild.decorations.map((decorationSlot, index) => (
                  <div 
                    key={`${decorationSlot.equipmentType}-${decorationSlot.slotIndex}-${index}`} 
                    className="bg-surface-707/30 rounded p-2 flex items-center justify-between"
                    role="listitem"
                    aria-label={`${decorationSlot.decoration.name} decoration`}
                  >
                    <div className="flex items-center">
                      <div 
                        className={`w-4 h-4 rounded-full mr-2 ${getSlotColorClass(decorationSlot.decoration.slot)}`}
                        aria-hidden="true"
                      >
                      </div>
                      <span className="text-xs text-surface-200">{decorationSlot.decoration.name}</span>
                    </div>
                    <div className="text-xs text-green-400">
                      {decorationSlot.decoration.skills.map(skill => (
                        <span key={skill.id || `skill-${skill.skill.name}`}>
                          {skill.skill.name} +{skill.level}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-3 text-surface-400 text-sm">
                <p>No hay decoraciones equipadas</p>
                <p className="mt-1 text-xs">
                  Haz click en una ranura de decoración para asignar una joya
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}