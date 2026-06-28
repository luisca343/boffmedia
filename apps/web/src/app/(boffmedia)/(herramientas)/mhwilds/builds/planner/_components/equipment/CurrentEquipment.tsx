import { Button } from "@/components/ui/primitives/button";
import { X } from "lucide-react";
import { ArmorPiece, Charm, EquipmentType, Weapon } from "@/types/tools/mhwilds";
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
} from "../equipment-utils";
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
    <div
      className="mb-4 p-3 rounded-lg"
      style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(71,85,105,0.3)" }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-ink-muted">
          {t("build_planner.currently_equiped")}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-7 px-2"
        >
          <X className="h-3.5 w-3.5 mr-1" /> {t("build_planner.remove")}
        </Button>
      </div>

      <div className="flex items-center w-full">
        <div
          className="w-14 h-14 rounded-lg flex items-center justify-center mr-3 flex-shrink-0"
          style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(71,85,105,0.3)" }}
        >
          {isWeapon && weaponType ? (
            <div className="relative w-10 h-10">
              <Image
                src={getWeaponTypeIcon(weaponType)}
                alt={weaponType}
                width={40}
                height={40}
                className="object-contain"
                style={{ filter: getRarityFilterStyle(equipment.rarity) }}
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
                style={{ filter: getRarityFilterStyle(equipment.rarity) }}
              />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <p className="font-medium text-ink truncate pr-2">{equipment.name}</p>
            <span className={`text-xs flex-shrink-0 ${getRarityStyle(equipment.rarity)}`}>
              ★{equipment.rarity}
            </span>
          </div>
          <div className="flex items-center text-sm">
            {isWeapon ? (
              <WeaponStats weapon={equipment as Weapon} />
            ) : isCharm ? (
              <CharmStats charm={equipment as Charm} />
            ) : (
              <ArmorStats armor={equipment as ArmorPiece} />
            )}
          </div>
          {equipment.slots && equipment.slots.length > 0 && (
            <div className="mt-1 text-xs text-ink-muted">
              {t("build_planner.slots")}: {equipment.slots.map(size => `○${size}`).join(' ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ArmorStats = ({ armor }: { armor: ArmorPiece }) => {
  const t = useTranslations("mhwilds");
  const defenseValue = typeof armor.defense === 'number' ? armor.defense : armor.defense.base;
  return (
    <div className="flex flex-wrap gap-x-3 text-xs">
      <span className="text-secondary-hover">Def: {defenseValue}</span>
      {armor.armorSet?.name && (
        <span className="text-secondary-hover truncate max-w-[200px]">
          {t("build_planner.set")}: {armor.armorSet.name}
        </span>
      )}
      {armor.skills && armor.skills.length > 0 && (
        <span className="text-warning-hover">
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

const WeaponStats = ({ weapon }: { weapon: Weapon }) => {
  const t = useTranslations("mhwilds");
  const { elements, statuses } = getAllWeaponElements(weapon);
  return (
    <div className="flex flex-wrap gap-x-3 text-xs">
      <span className="text-red-400">
        {t('attack')}: {weapon.attack || (weapon.damage?.display || weapon.damage?.raw)}
      </span>
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
          {status.hidden && <span className="text-xs ml-1 opacity-70">{t("build_planner.hidden")}</span>}
        </span>
      ))}
    </div>
  );
};

const CharmStats = ({ charm }: { charm: Charm }) => (
  <div className="flex flex-wrap gap-x-3 text-xs">
    {charm.skills && charm.skills.length > 0 && (
      <span className="text-warning-hover">
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
