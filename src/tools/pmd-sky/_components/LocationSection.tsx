import { useTranslations } from "next-intl";
import { MapPinIcon, BuildingOffice2Icon } from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { SectionHeader } from "@/components/form";
import { FormField } from "@/components/form";
import { getFloors, getValidDungeons } from "../DungeonData";

interface LocationSectionProps {
  dungeon: number;
  floor: number;
  onDungeonChange: (value: string) => void;
  onFloorChange: (value: number) => void;
}

export function LocationSection({
  dungeon,
  floor,
  onDungeonChange,
  onFloorChange
}: LocationSectionProps) {
  const t = useTranslations("");
  const maxFloors = getFloors(dungeon);

  return (
    <div className="mb-8">
      <SectionHeader 
        icon={<MapPinIcon className="w-5 h-5" />} 
        title={t("LOCATION_SETTINGS")} 
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FormField 
          label={t("DUNGEON")} 
          icon={<BuildingOffice2Icon className="w-4 h-4 text-highlight-400" />}
          required
        >
          <Combobox 
            data={getValidDungeons(t)}
            value={dungeon.toString()}
            onChange={onDungeonChange}
          />
        </FormField>

        <FormField 
          label={t("FLOOR")} 
          icon={<BuildingOffice2Icon className="w-4 h-4 text-orange-400" />}
          required
        >
          <div className="relative">
            <Input
              type="number"
              min={1}
              max={maxFloors}
              className="bg-surface-700/50 border-surface-600/50 text-surface-50 hover:bg-surface-700 transition-colors pr-16"
              value={floor}
              onChange={(e) => onFloorChange(Number(e.target.value))}
            />
            <Badge 
              variant="secondary" 
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-surface-600/50 text-surface-300 text-xs"
            >
              Max: {maxFloors}
            </Badge>
          </div>
        </FormField>
      </div>
    </div>
  );
}