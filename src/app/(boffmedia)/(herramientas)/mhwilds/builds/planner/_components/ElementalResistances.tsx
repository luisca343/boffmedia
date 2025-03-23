import { StatsData } from "./types";

interface ElementalResistancesProps {
  stats: StatsData;
}

export function ElementalResistances({ stats }: ElementalResistancesProps) {
  const resistances = [
    { name: "Fuego", value: stats.fireRes, color: "text-red-400" },
    { name: "Agua", value: stats.waterRes, color: "text-blue-400" },
    { name: "Trueno", value: stats.thunderRes, color: "text-yellow-400" },
    { name: "Hielo", value: stats.iceRes, color: "text-cyan-400" },
    { name: "Dragón", value: stats.dragonRes, color: "text-purple-400" }
  ];
  
  return (
    <div className="grid grid-cols-5 gap-2">
      {resistances.map(res => (
        <div key={res.name}>
          <div className={`text-xs text-center mb-1 ${res.color}`}>{res.name}</div>
          <div className={`text-center text-xs font-medium rounded py-1 ${res.value >= 0 ? 'bg-surface-700 text-surface-100' : 'bg-red-900/50 text-red-300'}`}>
            {res.value}
          </div>
        </div>
      ))}
    </div>
  );
}