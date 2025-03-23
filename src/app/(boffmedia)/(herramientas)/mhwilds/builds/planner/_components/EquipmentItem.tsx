import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArmorPiece, EquipmentType, Weapon } from "./types";
import Image from "next/image";
import { 
  getElementColor, 
  getEquipmentIcon, 
  getIconColor, 
  getRarityStyle,
  getWeaponElementInfo,
  getAllWeaponElements,
  getWeaponTypeIcon
} from "./equipment-utils";
import { EyeOff } from "lucide-react";

interface EquipmentItemProps {
  item: ArmorPiece | Weapon;
  slotType: EquipmentType;
  index: number;
  onSelect: (item: ArmorPiece | Weapon) => void;
}

export const EquipmentItem = ({ item, slotType, index, onSelect }: EquipmentItemProps) => {
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
                />
              </div>
            ) : (
              <EquipmentIcon className={`h-7 w-7 ${iconColor}`} />
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
  const defenseValue = typeof armor.defense === 'number' 
    ? armor.defense 
    : armor.defense.base;
    
  return (
    <div className="flex flex-wrap gap-x-3 text-xs">
      <span className="text-blue-400">Def: {defenseValue}</span>
      
      {/* Show decoration slots */}
      {armor.slots && armor.slots.length > 0 && (
        <span className="text-surface-300">
          Ranuras: {armor.slots.map(size => `○${size}`).join(' ')}
        </span>
      )}
      
      {/* Show set name if available */}
      {armor.armorSet?.name && (
        <span className="text-purple-400 truncate max-w-[200px]">
          Set: {armor.armorSet.name}
        </span>
      )}
    </div>
  );
};

// Enhanced component for weapon stats with better element display
const WeaponStats = ({ weapon }: { weapon: Weapon }) => {
  // Get all elements in the weapon
  const elements = getAllWeaponElements(weapon);
  
  return (
    <div className="flex flex-wrap gap-x-3 text-xs">
      <span className="text-red-400">
        Ataque: {weapon.attack || weapon.damage?.display || 0}
      </span>
      
      {weapon.affinity !== 0 && (
        <span className={weapon.affinity > 0 ? "text-green-400" : "text-red-400"}>
          Afinidad: {weapon.affinity > 0 ? "+" : ""}{weapon.affinity}%
        </span>
      )}
      
      {/* Display elements */}
      {elements.map((element, idx) => (
        <span 
          key={idx} 
          className={`${getElementColor(element.type)}`}
        >
          {element.type.charAt(0).toUpperCase() + element.type.slice(1)}: {element.damage}
          {element.hidden && <EyeOff className="inline h-3 w-3 ml-1 opacity-70" />}
        </span>
      ))}
      
      {/* Show decoration slots */}
      {weapon.slots && weapon.slots.length > 0 && (
        <span className="text-surface-300">
          Ranuras: {weapon.slots.map(size => `○${size}`).join(' ')}
        </span>
      )}
    </div>
  );
};