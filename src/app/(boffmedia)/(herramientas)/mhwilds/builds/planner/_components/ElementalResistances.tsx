import { useTranslations } from "next-intl";
import { StatsData } from "../../../../../../../types/tools/mhwilds";
import Image from "next/image";

interface ElementalResistancesProps {
  stats: StatsData;
}

export function ElementalResistances({ stats }: ElementalResistancesProps) {
  const t = useTranslations("mhwilds");
  const resistances = [
    { name: t("fire"), value: stats.fireRes, color: "text-red-400", icon: "fire" },
    { name: t("water"), value: stats.waterRes, color: "text-blue-400", icon: "water" },
    { name: t("thunder"), value: stats.thunderRes, color: "text-yellow-400", icon: "thunder" },
    { name: t("ice"), value: stats.iceRes, color: "text-cyan-400", icon: "ice" },
    { name: t("dragon"), value: stats.dragonRes, color: "text-purple-400", icon: "dragon" }
  ];
  
  return (
    <div className="grid grid-cols-5 gap-1">
      {resistances.map(res => (
        <div key={res.name} className="flex flex-col items-center bg-surface-700/40 rounded-md p-1.5">
          <div className="w-6 h-6 flex justify-center items-center">
            <Image 
              src={`/img/games/mhwilds/${res.icon}.webp`}
              alt={res.name}
              width={18}
              height={18}
            />
          </div>
          <span className={`font-medium text-sm ${res.value >= 0 ? res.color : 'text-red-400'}`}>
            {res.value}
          </span>
        </div>
      ))}
    </div>
  );
}