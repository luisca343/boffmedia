import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ArmorPiece, Charm, EquipmentType, Weapon } from "../../../../../../../types/tools/mhwilds";
import { 
  getDefenseValue, 
  getEquipmentIcon, 
  getIconColor, 
  getRarityStyle,
  getWeaponTypeIcon,
  getArmorImagePath,
  getElementColor,
  getStatusColor,
  getAllWeaponElements,
  getRarityFilterStyle
} from "./equipment-utils";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface CurrentEquipmentProps {
  equipment: ArmorPiece | Weapon | Charm;
  slotType: EquipmentType;
  onRemove: () => void;
}

export const CurrentEquipment = ({ equipment, slotType, onRemove }: CurrentEquipmentProps) => {
  const t = useTranslations("mhwilds");
  const isWeapon = 'attack' in equipment || 'damage' in equipment;
  const isCharm = 'charm' in equipment;
  const weaponType = isWeapon ? (equipment as Weapon).kind || (equipment as Weapon).type : null;
  
  return (
    <div className="mb-4 p-3 bg-surface-700/30 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-surface-100 font-medium">
          {t(`build_planner.currently_equiped`)}
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRemove}
          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <X className="h-4 w-4 mr-1" /> {t("build_planner.remove")}
        </Button>
      </div>
      
      <div className="flex items-center w-full">
        {/* Equipment icon - use weapon type icons for weapons */}
        <div className="w-14 h-14 bg-surface-600 rounded flex items-center justify-center mr-3 relative">
          {isWeapon && weaponType ? (
            <div className="relative w-10 h-10">
              <Image 
                src={getWeaponTypeIcon(weaponType)} 
                alt={weaponType}
                width={40}
                height={40}
                className="object-contain" 
                style={{ 
                  filter: getRarityFilterStyle(equipment.rarity)
                }} 
              />
            </div>
          ) : (
            <div className="relative w-10 h-10">
              <Image 
                src={getArmorImagePath(slotType)} 
                alt={slotType}
                width={40}
                height={40}
                className="object-contain"
                style={{ 
                  filter: getRarityFilterStyle(equipment.rarity)
                }}
              />
            </div>
          )}
        </div>

        {/* Equipment details */}
        <div className="flex-1 min-w-0">
          {/* Equipment name and rarity */}
          <div className="flex justify-between items-center mb-1">
            <p className="font-medium text-surface-100 truncate pr-2">{equipment.name}</p>
            <div className="flex flex-shrink-0 items-center">
              <span className={`text-xs ${getRarityStyle(equipment.rarity)}`}>★{equipment.rarity}</span>
            </div>
          </div>
          
          {/* Equipment stats */}
          <div className="flex items-center text-sm">
            {isWeapon ? (
              <WeaponStats weapon={equipment as Weapon} />
            ) : isCharm ? (
              <CharmStats charm={equipment as Charm} />
            ) : (
              <ArmorStats armor={equipment as ArmorPiece} />
            )}
          </div>
          
          {/* Show decoration slots if available */}
          {equipment.slots && equipment.slots.length > 0 && (
            <div className="mt-1 text-xs text-surface-300">
              {t("build_planner.slots")}: {equipment.slots.map(size => `○${size}`).join(' ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Component for armor stats display
const ArmorStats = ({ armor }: { armor: ArmorPiece }) => {
  const t = useTranslations("mhwilds");
  const defenseValue = typeof armor.defense === 'number' 
    ? armor.defense 
    : armor.defense.base;
    
  return (
    <div className="flex flex-wrap gap-x-3 text-xs">
      <span className="text-blue-400">Def: {defenseValue}</span>
      
      {/* Show set name if available */}
      {armor.armorSet?.name && (
        <span className="text-purple-400 truncate max-w-[200px]">
          {t("build_planner.set")}: {armor.armorSet.name}
        </span>
      )}
      
      {/* Show skills if available */}
      {armor.skills && armor.skills.length > 0 && (
        <span className="text-green-400">
          {armor.skills.map((s, i) => (
            <span key={i}>
              {s.skill?.name || s.name} +{s.level}
              {i < armor.skills.length - 1 && ", "}
            </span>
          ))}
        </span>
      )}
    </div>
  );
};

// Component for weapon stats display
const WeaponStats = ({ weapon }: { weapon: Weapon }) => {
  const t = useTranslations("mhwilds");
  const { elements, statuses } = getAllWeaponElements(weapon);

  return (
    <div className="flex flex-wrap gap-x-3 text-xs">
      <span className="text-red-400">
        {t('attack')}: {weapon.attack || (weapon.damage?.display || weapon.damage?.raw)}
      </span>
      
      <span className={`${weapon.affinity >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {t("affinity")}: {weapon.affinity >= 0 ? '+' : ''}{weapon.affinity}%
      </span>
      
      {/* Show elements */}
      {elements.length > 0 && elements.map((element, idx) => (
        <span key={`element-${idx}`} className={`${getElementColor(element.type)}`}>
          {t(element.type)}: {element.damage}
          {element.hidden && <span className="text-xs ml-1 opacity-70">{t("build_planner.hidden")}</span>}
        </span>
      ))}
      
      {/* Show status effects */}
      {statuses.length > 0 && statuses.map((status, idx) => (
        <span key={`status-${idx}`} className={`${getStatusColor(status.type)}`}>
          {status.type}: {status.damage}
          {status.hidden && <span className="text-xs ml-1 opacity-70">{t("build_planner.hidden")}</span>}
        </span>
      ))}
    </div>
  );
};

// Component for charm stats display
const CharmStats = ({ charm }: { charm: Charm }) => {
  return (
    <div className="flex flex-wrap gap-x-3 text-xs">
      {charm.skills && charm.skills.length > 0 && (
        <span className="text-green-400">
          {charm.skills.map((s, i) => (
            <span key={i}>
              {s.skill?.name} +{s.level}
              {i < charm.skills.length - 1 && ", "}
            </span>
          ))}
        </span>
      )}
    </div>
  );
};