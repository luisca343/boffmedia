import { motion } from "framer-motion";
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
import { Button } from "@/components/ui/primitives/button";
import { MHWildsPanel, MHWildsPanelHeader, MHWildsPanelTitle } from "./MHWildsPanel";

interface BuildDisplayProps {
  currentBuild: BuildData;
  onSlotClick: (slot: EquipmentType) => void;
  onDecorationClick: (equipmentType: EquipmentType, slotIndex: number) => void;
  onSwapWeapons?: () => void;
}

export function BuildDisplay({
  currentBuild,
  onSlotClick,
  onDecorationClick,
  onSwapWeapons
}: BuildDisplayProps) {
  const t = useTranslations("mhwilds");

  const equipmentSlots = useMemo(() => {
    const WeaponIconComponent = currentBuild.weapon
      ? (props: any) => (
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
        )
      : Sword;

    const SecondaryWeaponIconComponent = currentBuild.secondaryWeapon
      ? (props: any) => (
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
        )
      : Sword;

    const HelmetIconComponent = currentBuild.head
      ? (props: any) => (
          <div className="relative w-6 h-6">
            <Image src={getArmorImagePath('head')} alt={t("head")} width={24} height={24} className="object-contain" {...props} />
          </div>
        )
      : GiDwarfHelmet;

    const ChestIconComponent = currentBuild.chest
      ? (props: any) => (
          <div className="relative w-6 h-6">
            <Image src={getArmorImagePath('chest')} alt={t("chest")} width={24} height={24} className="object-contain" {...props} />
          </div>
        )
      : Shirt;

    const GauntletsIconComponent = currentBuild.arms
      ? (props: any) => (
          <div className="relative w-6 h-6">
            <Image src={getArmorImagePath('arms')} alt={t("arms")} width={24} height={24} className="object-contain" {...props} />
          </div>
        )
      : ArrowBigRight;

    const WaistIconComponent = currentBuild.waist
      ? (props: any) => (
          <div className="relative w-6 h-6">
            <Image src={getArmorImagePath('waist')} alt={t("waist")} width={24} height={24} className="object-contain" {...props} />
          </div>
        )
      : CircleDot;

    const CharmIconComponent = Medal;

    const GreavesIconComponent = currentBuild.legs
      ? (props: any) => (
          <div className="relative w-6 h-6">
            <Image src={getArmorImagePath('legs')} alt={t("legs")} width={24} height={24} className="object-contain" {...props} />
          </div>
        )
      : Footprints;

    return [
      { key: 'weapon' as EquipmentType, name: t("weapon"), icon: WeaponIconComponent, component: currentBuild.weapon, iconColor: "text-red-400", hasCustomIcon: !!currentBuild.weapon },
      { key: 'secondaryWeapon' as EquipmentType, name: t("secondary_weapon", { defaultValue: "Arma secundaria" }), icon: SecondaryWeaponIconComponent, component: currentBuild.secondaryWeapon, iconColor: "text-orange-400", hasCustomIcon: !!currentBuild.secondaryWeapon },
      { key: 'head' as EquipmentType, name: t("head"), icon: HelmetIconComponent, component: currentBuild.head, iconColor: "text-secondary-400", hasCustomIcon: !!currentBuild.head },
      { key: 'chest' as EquipmentType, name: t("chest"), icon: ChestIconComponent, component: currentBuild.chest, iconColor: "text-highlight-400", hasCustomIcon: !!currentBuild.chest },
      { key: 'arms' as EquipmentType, name: t("arms"), icon: GauntletsIconComponent, component: currentBuild.arms, iconColor: "text-yellow-400", hasCustomIcon: !!currentBuild.arms },
      { key: 'waist' as EquipmentType, name: t("waist"), icon: WaistIconComponent, component: currentBuild.waist, iconColor: "text-accent-400", hasCustomIcon: !!currentBuild.waist },
      { key: 'legs' as EquipmentType, name: t("legs"), icon: GreavesIconComponent, component: currentBuild.legs, iconColor: "text-cyan-400", hasCustomIcon: !!currentBuild.legs },
      { key: 'charm' as EquipmentType, name: t("charm"), icon: CharmIconComponent, component: currentBuild.charm, iconColor: "text-amber-400", hasCustomIcon: !!currentBuild.charm },
    ];
  }, [currentBuild]);

  const getDecorationForSlot = useMemo(() => (equipmentType: EquipmentType, slotIndex: number): Decoration | null => {
    if (!currentBuild.decorations) return null;
    return currentBuild.decorations.find(
      deco => deco.equipmentType === equipmentType && deco.slotIndex === slotIndex
    )?.decoration || null;
  }, [currentBuild.decorations]);

  const renderDecorationSlots = (equipmentType: EquipmentType, slots?: number[]) => {
    if (!slots || slots.length === 0) return null;
    return (
      <div className="w-full flex flex-col gap-1 mt-1">
        {slots.map((size, idx) => {
          const decoration = getDecorationForSlot(equipmentType, idx);
          const slotSize = size || 1;
          return (
            <motion.div
              key={idx}
              className="w-full h-5 rounded flex items-center justify-start gap-2 cursor-pointer"
              style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(71,85,105,0.35)" }}
              initial={false}
              whileHover={{ scale: 1.05, backgroundColor: "rgba(30,41,59,0.8)" }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                onDecorationClick(equipmentType, idx);
              }}
              role="button"
              aria-label={decoration
                ? `Decoration slot size ${decoration.slot}: ${decoration.name}`
                : `Empty decoration slot size ${slotSize}`}
            >
              <span className="flex h-full items-center justify-center px-2 text-xs font-medium text-surface-300"
                style={{ background: "rgba(15,23,42,0.6)", borderRight: "1px solid rgba(71,85,105,0.3)" }}>
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
    <MHWildsPanel className="mb-6">
      <MHWildsPanelHeader>
        <MHWildsPanelTitle>{t("build_planner.current_build")}</MHWildsPanelTitle>
        {(currentBuild.weapon || currentBuild.secondaryWeapon) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs flex items-center gap-1 text-surface-400 hover:text-primary-400"
            onClick={onSwapWeapons}
            title={t("build_planner.swap_weapons", { defaultValue: "Intercambiar armas" })}
          >
            <GiSwapBag className="h-4 w-4" />
            {t("build_planner.swap_weapons", { defaultValue: "Intercambiar" })}
          </Button>
        )}
      </MHWildsPanelHeader>

      <div className="p-3 space-y-2">
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
      </div>
    </MHWildsPanel>
  );
}
