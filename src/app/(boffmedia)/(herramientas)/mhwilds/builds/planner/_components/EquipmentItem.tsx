import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArmorPiece, Charm, EquipmentType, Weapon } from "../../../../../../../types/tools/mhwilds";
import Image from "next/image";
import { 
  getElementColor, 
  getEquipmentIcon, 
  getIconColor, 
  getRarityStyle,
  getWeaponElementInfo,
  getAllWeaponElements,
  getWeaponTypeIcon,
  getStatusColor,
  getArmorImagePath,
  getRarityFilterStyle
} from "./equipment-utils";
import { useTranslations } from "next-intl";

interface EquipmentItemProps {
  item: ArmorPiece | Weapon | Charm;
  slotType: EquipmentType;
  index: number;
  onSelect: (item: ArmorPiece | Weapon | Charm) => void;
}

export const EquipmentItem = ({ item, slotType, index, onSelect }: EquipmentItemProps) => {
  const t = useTranslations("mhwilds");
  const isWeapon = 'attack' in item || 'damage' in item;
  const EquipmentIcon = getEquipmentIcon(slotType);
  const iconColor = getIconColor(slotType);
  
  // Get weapon type for weapons
  const weaponType = isWeapon ? (item as Weapon).kind || (item as Weapon).type : null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Button
        variant="ghost"
        className="w-full justify-start bg-surface-700/50 hover:bg-surface-700 p-3 h-auto"
        onClick={() => onSelect(item)}
      >
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
                    filter: getRarityFilterStyle(item.rarity)
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
                    filter: getRarityFilterStyle(item.rarity)
                  }}
                />
              </div>
            )}
          </div>

          {/* Equipment details */}
          <div className="flex-1 min-w-0">
            {/* Equipment name and rarity */}
            <div className="flex justify-between items-center mb-1">
              <p className="font-medium text-surface-100 truncate pr-2">{item.name}</p>
              <div className="flex flex-shrink-0 items-center">
                <span className={`text-xs ${getRarityStyle(item.rarity)}`}>★{item.rarity}</span>
              </div>
            </div>
            
            {/* Equipment stats */}
            <div className="flex items-center text-sm">
              {isWeapon ? (
                <WeaponStats weapon={item as Weapon} />
              ) : (
                <ArmorStats armor={item as ArmorPiece} />
              )}
            </div>
          </div>
        </div>
      </Button>
    </motion.div>
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
      
      {/* Show decoration slots */}
      {armor.slots && armor.slots.length > 0 && (
        <span className="text-surface-300">
          {t("build_planner.slots")}: {armor.slots.map(size => `○${size}`).join(' ')}
        </span>
      )}
      
      {/* Show set name if available */}
      {armor.armorSet?.name && (
        <span className="text-purple-400 truncate max-w-[200px]">
          {t("build_planner.set")}: {armor.armorSet.name}
        </span>
      )}
    </div>
  );
};

// Enhanced component for weapon stats with better element display
const WeaponStats = ({ weapon }: { weapon: Weapon }) => {
  const t = useTranslations("mhwilds");
  const { elements, statuses } = getAllWeaponElements(weapon);

  return (
    <div className="flex flex-wrap gap-x-3 text-xs">
      <span className="text-red-400">Atk: {weapon.attack || (weapon.damage?.display || weapon.damage?.raw)}</span>
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
          {status.hidden && <span className="text-xs ml-1 opacity-70">{t("build-planner.hidden")}</span>}
        </span>
      ))}
      
      {/* Show decoration slots */}
      {weapon.slots && weapon.slots.length > 0 && (
        <span className="text-surface-300">
          {t("build_planner.slots")}: {weapon.slots.map(size => `○${size}`).join(' ')}
        </span>
      )}
    </div>
  );
};