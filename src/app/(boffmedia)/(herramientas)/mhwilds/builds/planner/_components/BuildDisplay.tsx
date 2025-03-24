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
import { getArmorImagePath, getWeaponTypeIcon } from "./equipment-utils";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("mhwilds");
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
    
    // Create custom icon components for each armor piece
    const HelmetIconComponent = currentBuild.head ? 
      (props: any) => (
        <div className="relative w-6 h-6">
          <Image 
            src={getArmorImagePath('head')} 
            alt={t("head")}
            width={24}
            height={24}
            className="object-contain"
            {...props}
          />
        </div>
      ) : 
      GiDwarfHelmet;
    
    const ChestIconComponent = currentBuild.chest ? 
      (props: any) => (
        <div className="relative w-6 h-6">
          <Image 
            src={getArmorImagePath('chest')} 
            alt={t("chest")}
            width={24}
            height={24}
            className="object-contain"
            {...props}
          />
        </div>
      ) : 
      Shirt;
    
    const GauntletsIconComponent = currentBuild.arms ? 
      (props: any) => (
        <div className="relative w-6 h-6">
          <Image 
            src={getArmorImagePath('arms')} 
            alt={t("arms")}
            width={24}
            height={24}
            className="object-contain"
            {...props}
          />
        </div>
      ) : 
      ArrowBigRight;
    
    const WaistIconComponent = currentBuild.waist ? 
      (props: any) => (
        <div className="relative w-6 h-6">
          <Image 
            src={getArmorImagePath('waist')} 
            alt={t("waist")}
            width={24}
            height={24}
            className="object-contain"
            {...props}
          />
        </div>
      ) : 
      CircleDot;
    
    const GreavesIconComponent = currentBuild.legs ? 
      (props: any) => (
        <div className="relative w-6 h-6">
          <Image 
            src={getArmorImagePath('legs')} 
            alt={t("legs")}
            width={24}
            height={24}
            className="object-contain"
            {...props}
          />
        </div>
      ) : 
      Footprints;
    
    return [
      { 
        key: 'weapon' as EquipmentType, 
        name: t("weapon"),
        icon: WeaponIconComponent, 
        component: currentBuild.weapon, 
        iconColor: "text-red-400",
        hasCustomIcon: !!currentBuild.weapon 
      },
      { 
        key: 'head' as EquipmentType, 
        name: t("head"),
        icon: HelmetIconComponent, 
        component: currentBuild.head, 
        iconColor: "text-blue-400",
        hasCustomIcon: !!currentBuild.head 
      },
      { 
        key: 'chest' as EquipmentType, 
        name: t("chest"),
        icon: ChestIconComponent, 
        component: currentBuild.chest, 
        iconColor: "text-green-400",
        hasCustomIcon: !!currentBuild.chest 
      },
      { 
        key: 'arms' as EquipmentType, 
        name: t("arms"),
        icon: GauntletsIconComponent, 
        component: currentBuild.arms, 
        iconColor: "text-yellow-400",
        hasCustomIcon: !!currentBuild.arms 
      },
      { 
        key: 'waist' as EquipmentType, 
        name: t("waist"),
        icon: WaistIconComponent, 
        component: currentBuild.waist, 
        iconColor: "text-purple-400",
        hasCustomIcon: !!currentBuild.waist 
      },
      { 
        key: 'legs' as EquipmentType, 
        name: t("legs"),
        icon: GreavesIconComponent, 
        component: currentBuild.legs, 
        iconColor: "text-cyan-400",
        hasCustomIcon: !!currentBuild.legs 
      },
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
          {t("build_planner.current_build")}
          <span className="text-xs font-normal text-surface-400 ml-2">
            ({t("build_planner.click_to_change")})
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
              rarity={currentBuild[slot.key]?.rarity}
            />
          ))}
          
          {/* Summary of active decorations */}
          <div className="mt-6 bg-surface-700/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-medium text-surface-100 flex items-center">
                <Gem className="mr-2 h-4 w-4 text-surface-300" />
                {t("build_planner.active_decorations")}
              </h3>
              <span className="text-xs text-surface-400">
                {t("build_planner.decorations_equipped", { count: currentBuild.decorations?.length || 0 })}
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
                <p>
                  {t("build_planner.no_decorations")}
                </p>
                <p className="mt-1 text-xs">
                  {t("build_planner.add_decorations")}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}