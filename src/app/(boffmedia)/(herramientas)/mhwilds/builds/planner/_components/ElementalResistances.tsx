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
    <div className="flex gap-2">
      {resistances.map(res => (
        <div key={res.name} className="flex items-center gap-1.5 bg-surface-700/40 rounded px-2 py-1">
          <Image 
            src={`/img/games/mhwilds/${res.icon}.webp`}
            alt={res.name}
            width={18}
            height={18}
          />
          <span className={`font-medium ${res.value >= 0 ? res.color : 'text-red-400'}`}>
            {res.value >= 0 ? `+${res.value}` : res.value}
          </span>
        </div>
      ))}
    </div>
  );
}