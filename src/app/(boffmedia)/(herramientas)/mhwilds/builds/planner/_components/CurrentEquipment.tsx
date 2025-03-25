import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { ArmorPiece, Charm, EquipmentType, Weapon } from "../../../../../../../types/tools/mhwilds";
import { getDefenseValue, getEquipmentIcon, getIconColor, getRarityStyle } from "./equipment-utils";
import { useTranslations } from "next-intl";

interface CurrentEquipmentProps {
  equipment: ArmorPiece | Weapon | Charm;
  slotType: EquipmentType;
  onRemove: () => void;
}


export const CurrentEquipment = ({ equipment, slotType, onRemove }: CurrentEquipmentProps) => {
  const t = useTranslations("mhwilds");
  const EquipmentIcon = getEquipmentIcon(slotType);
  const iconColor = getIconColor(slotType);
  const isWeapon = 'attack' in equipment || 'damage' in equipment;
  const isCharm = 'charm' in equipment;
  
  return (
    <div className="mb-4 p-3 bg-surface-700/30 rounded-md">
      <div className="flex justify-between items-center">
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
      <div className="mt-2 flex items-center">
        <div className="w-12 h-12 bg-surface-700 rounded flex items-center justify-center mr-3">
          <EquipmentIcon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div>
          <div className="text-surface-100">{equipment.name}</div>
          <div className="text-xs text-surface-400">
            <Badge variant="outline" className={`mr-2 py-0 px-1 ${getRarityStyle(equipment.rarity)}`}>
              {t("rarity")} {equipment.rarity}
            </Badge>
            {isWeapon 
              ? `${t('attack')}: ${(equipment as Weapon).attack || (equipment as Weapon).damage?.display || 0}` 
              : isCharm
                ? `${(equipment as Charm).skills.map(s => `${s.skill.name} +${s.level}`).join(', ')}`
                : `${t("defense")}: ${getDefenseValue((equipment as ArmorPiece).defense)}`
            }
          </div>
        </div>
      </div>
    </div>
  );
};