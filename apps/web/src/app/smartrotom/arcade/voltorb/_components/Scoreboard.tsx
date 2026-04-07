import { Coins, ArrowUp } from "lucide-react";

interface ScoreboardProps {
  roundScore: number;
  totalCoins: number;
  level: number;
}

export default function Scoreboard({
  roundScore,
  totalCoins,
  level,
}: ScoreboardProps) {
  return (
    <div className="flex flex-col space-y-3">
      <div className="flex justify-between items-center bg-indigo-900/40 p-2 rounded-md border border-indigo-700/50">
        <span className="text-cyan-300 font-medium">Nivel:</span>
        <div className="flex items-center">
          <ArrowUp className={`h-4 w-4 ${level > 5 ? "text-orange-400" : "text-emerald-400"} mr-1`} />
          <span className={`font-mono font-bold ${level > 5 ? "text-orange-300" : "text-emerald-300"}`}>{level}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center bg-indigo-900/40 p-2 rounded-md border border-indigo-700/50">
        <span className="text-cyan-300 font-medium">Ronda:</span>
        <div className="flex items-center">
          <Coins className="h-4 w-4 text-yellow-500 mr-1" />
          <span className="text-yellow-300 font-mono font-bold">{roundScore}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center bg-indigo-900/40 p-2 rounded-md border border-indigo-700/50">
        <span className="text-cyan-300 font-medium">Total:</span>
        <div className="flex items-center">
          <Coins className="h-4 w-4 text-yellow-500 mr-1" />
          <span className="text-yellow-300 font-mono font-bold">{totalCoins}</span>
        </div>
      </div>
    </div>
  );
}