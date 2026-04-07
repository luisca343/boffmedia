import { useTranslations } from "next-intl";
import { MapPinIcon, BuildingOffice2Icon } from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/primitives/input";
import { Combobox } from "@/components/ui/primitives/combobox";
import { FormField } from "@/components/ui/form/FormField";
import { ToolSectionHeader } from "@/components/boffmedia/tools/ToolSectionHeader";
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
  onFloorChange,
}: LocationSectionProps) {
  const t = useTranslations("");
  const maxFloors = getFloors(dungeon);

  return (
    <div className="mb-8">
      <ToolSectionHeader
        icon={<MapPinIcon />}
        label={t("LOCATION_SETTINGS")}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FormField
          label={t("DUNGEON")}
          icon={<BuildingOffice2Icon className="w-4 h-4 text-highlight-400" />}
          required
          variant="gaming"
        >
          <Combobox
            data={getValidDungeons(t)}
            value={dungeon.toString()}
            onChange={onDungeonChange}
            variant="boff"
          />
        </FormField>

        <FormField
          label={t("FLOOR")}
          icon={<BuildingOffice2Icon className="w-4 h-4 text-orange-400" />}
          required
          variant="gaming"
        >
          <div className="relative">
            <Input
              type="number"
              min={1}
              max={maxFloors}
              variant="boff"
              className="pr-16"
              value={floor}
              onChange={(e) => onFloorChange(Number(e.target.value))}
            />
            <span
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded pointer-events-none"
              style={{
                fontFamily: "Orbitron, sans-serif",
                color: "rgba(34,211,238,0.6)",
                border: "1px solid rgba(34,211,238,0.2)",
                background: "rgba(6,182,212,0.06)",
              }}
            >
              /{maxFloors}
            </span>
          </div>
        </FormField>
      </div>
    </div>
  );
}
