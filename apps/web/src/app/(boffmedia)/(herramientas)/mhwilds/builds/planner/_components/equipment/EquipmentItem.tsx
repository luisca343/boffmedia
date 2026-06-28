import { motion } from "framer-motion";
import { ArmorPiece, Charm, EquipmentType, Weapon } from "@/types/tools/mhwilds";
import Image from "next/image";
import {
  getElementColor,
  getEquipmentIcon,
  getIconColor,
  getRarityStyle,
  getAllWeaponElements,
  getWeaponTypeIcon,
  getStatusColor,
  getArmorImagePath,
  getRarityFilterStyle
} from "../equipment-utils";
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
  const weaponType = isWeapon ? (item as Weapon).kind || (item as Weapon).type : null;

  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
      <button
        type="button"
        className="w-full text-left rounded-lg p-3 transition-all duration-200"
        style={{ background: "rgba(30,41,59,0.4)" }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(30,41,59,0.7)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(30,41,59,0.4)")}
        onClick={() => onSelect(item)}
      >
        <div className="flex items-center w-full">
          {/* Icon */}
          <div
            className="w-14 h-14 rounded-lg flex items-center justify-center mr-3 flex-shrink-0"
            style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(71,85,105,0.3)" }}
          >
            {isWeapon && weaponType ? (
              <div className="relative w-10 h-10">
                <Image
                  src={getWeaponTypeIcon(weaponType)}
                  alt={weaponType}
                  width={40}
                  height={40}
                  className="object-contain"
                  style={{ filter: getRarityFilterStyle(item.rarity) }}
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
                  style={{ filter: getRarityFilterStyle(item.rarity) }}
                />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <p className="font-medium text-ink truncate pr-2">{item.name}</p>
              <span className={`text-xs flex-shrink-0 ${getRarityStyle(item.rarity)}`}>★{item.rarity}</span>
            </div>
            <div className="flex items-center text-sm">
              {isWeapon ? (
                <WeaponStats weapon={item as Weapon} />
              ) : (
                <ArmorStats armor={item as ArmorPiece} />
              )}
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ArmorStats = ({ armor }: { armor: ArmorPiece }) => {
  const t = useTranslations("mhwilds");
  const defenseValue = typeof armor.defense === 'number' ? armor.defense : armor.defense.base;
  return (
    <div className="flex flex-wrap gap-x-3 text-xs">
      <span className="text-secondary-hover">Def: {defenseValue}</span>
      {armor.slots && armor.slots.length > 0 && (
        <span className="text-ink">
          {t("build_planner.slots")}: {armor.slots.map(size => `○${size}`).join(' ')}
        </span>
      )}
      {armor.armorSet?.name && (
        <span className="text-secondary-hover truncate max-w-[200px]">
          {t("build_planner.set")}: {armor.armorSet.name}
        </span>
      )}
    </div>
  );
};

const WeaponStats = ({ weapon }: { weapon: Weapon }) => {
  const t = useTranslations("mhwilds");
  const { elements, statuses } = getAllWeaponElements(weapon);
  return (
    <div className="flex flex-wrap gap-x-3 text-xs">
      <span className="text-red-400">Atk: {weapon.attack || (weapon.damage?.display || weapon.damage?.raw)}</span>
      <span className={weapon.affinity >= 0 ? 'text-warning-hover' : 'text-red-400'}>
        {t("affinity")}: {weapon.affinity >= 0 ? '+' : ''}{weapon.affinity}%
      </span>
      {elements.map((element, idx) => (
        <span key={`element-${idx}`} className={getElementColor(element.type)}>
          {t(element.type)}: {element.damage}
          {element.hidden && <span className="text-xs ml-1 opacity-70">{t("build_planner.hidden")}</span>}
        </span>
      ))}
      {statuses.map((status, idx) => (
        <span key={`status-${idx}`} className={getStatusColor(status.type)}>
          {status.type}: {status.damage}
          {status.hidden && <span className="text-xs ml-1 opacity-70">{t("build-planner.hidden")}</span>}
        </span>
      ))}
      {weapon.slots && weapon.slots.length > 0 && (
        <span className="text-ink">
          {t("build_planner.slots")}: {weapon.slots.map(size => `○${size}`).join(' ')}
        </span>
      )}
    </div>
  );
};
