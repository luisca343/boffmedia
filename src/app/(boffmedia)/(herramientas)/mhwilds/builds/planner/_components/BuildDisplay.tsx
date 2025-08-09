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
  Medal,
} from "lucide-react";
import { 
  BuildData, 
  EquipmentType, 
  Decoration, 
} from "../../../../../../../types/tools/mhwilds";
import { GiDwarfHelmet, GiSwapBag } from "react-icons/gi";
import { useMemo } from "react";
import { getSlotColorClass } from "./utils";
import { ComponentSlot } from "./ComponentSlot";
import Image from "next/image";
import { getArmorImagePath, getWeaponTypeIcon } from "./equipment-utils";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface BuildDisplayProps {
  currentBuild: BuildData;
  onSlotClick: (slot: EquipmentType) => void;
  onDecorationClick: (equipmentType: EquipmentType, slotIndex: number) => void;
  onSwapWeapons?: () => void; // Add this prop
}


export function BuildDisplay({ 
  currentBuild, 
  onSlotClick, 
  onDecorationClick,
  onSwapWeapons 
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

      const SecondaryWeaponIconComponent = currentBuild.secondaryWeapon ? 
      (props: any) => (
        <div className="relative w-6 h-6">
          <Image 
            src={getWeaponTypeIcon(currentBuild.secondaryWeapon?.kind || currentBuild.secondaryWeapon?.type || 'great-sword')} 
            alt={currentBuild.secondaryWeapon?.kind || 'secondary weapon'}
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

      const CharmIconComponent = Medal;
    
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
        key: 'secondaryWeapon' as EquipmentType, // Add the secondary weapon
        name: t("secondary_weapon", {defaultValue: "Arma secundaria"}), // Add a translation with fallback
        icon: SecondaryWeaponIconComponent, 
        component: currentBuild.secondaryWeapon, 
        iconColor: "text-orange-400",
        hasCustomIcon: !!currentBuild.secondaryWeapon 
      },
      { 
        key: 'head' as EquipmentType, 
        name: t("head"),
        icon: HelmetIconComponent, 
        component: currentBuild.head, 
        iconColor: "text-secondary-400",
        hasCustomIcon: !!currentBuild.head 
      },
      { 
        key: 'chest' as EquipmentType, 
        name: t("chest"),
        icon: ChestIconComponent, 
        component: currentBuild.chest, 
        iconColor: "text-highlight-400",
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
        iconColor: "text-accent-400",
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
      {
        key: 'charm' as EquipmentType,
        name: t("charm"),
        icon: CharmIconComponent,
        component: currentBuild.charm,
        iconColor: "text-amber-400",
        hasCustomIcon: !!currentBuild.charm
      }
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
      <div className="w-full flex flex-col gap-1 mt-1">
        {slots.map((size, idx) => {
          const decoration = getDecorationForSlot(equipmentType, idx);
          const slotSize = size || 1; // Default to 1 if size is undefined
          
          return (
            <motion.div 
              key={idx} 
              className="w-full h-5 rounded flex items-center justify-start gap-2 cursor-pointer border border-surface-600/70 hover:border-surface-500/70 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
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
            <span className={`flex h-full items-center justify-center bg-surface-900/50 px-2 text-xs font-medium `}>
              {decoration ? decoration.slot : slotSize}
            </span>
            <span className="mr-2 text-xs truncate text-surface-300">
              {decoration ? decoration.name : t("empty_slot", { defaultValue: "Vacío" })}
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-xl">
            {t("build_planner.current_build")}
          </CardTitle>
          
          {/* Move swap weapons button to header if at least one weapon is equipped */}
          {(currentBuild.weapon || currentBuild.secondaryWeapon) && (
            <Button 
              variant="ghost" 
              size="sm"
              className="text-xs flex items-center gap-1 text-surface-400 hover:text-primary-400"
              onClick={onSwapWeapons}
              title={t("build_planner.swap_weapons", {defaultValue: "Intercambiar armas"})}
            >
              <GiSwapBag className="h-4 w-4" />
              {t("build_planner.swap_weapons", {defaultValue: "Intercambiar"})}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <ComponentSlot
            key={equipmentSlots[0].key}
            slot={equipmentSlots[0]}
            onSlotClick={onSlotClick}
            onDecorationClick={onDecorationClick}
            renderDecorationSlots={renderDecorationSlots}
            hasCustomIcon={equipmentSlots[0].hasCustomIcon}
            rarity={currentBuild[equipmentSlots[0].key]?.rarity}
          />
          
          <ComponentSlot
            key={equipmentSlots[1].key}
            slot={equipmentSlots[1]}
            onSlotClick={onSlotClick}
            onDecorationClick={onDecorationClick}
            renderDecorationSlots={renderDecorationSlots}
            hasCustomIcon={equipmentSlots[1].hasCustomIcon}
            rarity={currentBuild[equipmentSlots[1].key]?.rarity}
          />
          
          {equipmentSlots.slice(2).map(slot => (
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
          {/* 
          <div className="mt-6 bg-surface-700/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-medium text-surface-100 flex items-center">
                <Gem className="mr-2 h-4 w-4 text-surface-300" />
                {t("build_planner.active_decorations")}
              </h3>
              <span className="text-xs text-surface-400">
                {t("build_planner.decorations_equipped", { 
                  count: currentBuild.decorations?.filter(d => d.equipmentType !== 'secondaryWeapon').length || 0 
                })}
              </span>
            </div>
            
            {currentBuild.decorations && currentBuild.decorations.filter(d => d.equipmentType !== 'secondaryWeapon').length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentBuild.decorations
                  .filter(decorationSlot => decorationSlot.equipmentType !== 'secondaryWeapon')
                  .map((decorationSlot, index) => (
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
                      <div className="text-xs text-highlight-400">
                        {decorationSlot.decoration.skills.map(skill => (
                          <span key={skill.id || `skill-${skill.skill.name}`}>
                            {skill.skill.name} +{skill.level}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                }
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
          </div>*/}
        </div>
      </CardContent>
    </Card>
  );
}