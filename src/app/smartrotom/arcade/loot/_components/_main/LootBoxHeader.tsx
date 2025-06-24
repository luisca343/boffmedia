import { ArcadeInventoryItem } from "@/generated/api";
import { Box, Info, Loader2, Sparkles } from "lucide-react";

interface LootBoxHeaderProps {
  ownedBoxes: Record<string, ArcadeInventoryItem>;
  collectionCount: number;
  loadingInventory: boolean;
  onShowInfo: () => void;
  onShowCollection: () => void;
}

export function LootBoxHeader({
  ownedBoxes,
  collectionCount,
  loadingInventory,
  onShowInfo,
  onShowCollection
}: LootBoxHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6 p-4 bg-gradient-to-r from-indigo-900/70 to-blue-900/70 rounded-lg border-2 border-indigo-500/40 shadow-md">
      <button 
        onClick={onShowInfo}
        className="flex items-center space-x-2 bg-blue-900/60 hover:bg-blue-800/80 text-cyan-300 px-4 py-2 rounded-md transition border border-blue-700/50"
      >
        <Info size={20} />
        <span>Información</span>
      </button>
      
      <div className="flex items-center space-x-2 bg-gray-900/60 px-4 py-2 rounded-lg border border-gray-700/50">
        <Box className="text-indigo-400 w-6 h-6" />
        <span className="text-xl font-bold text-indigo-400">
          {Object.values(ownedBoxes).reduce((total, box) => total + box.amount, 0)} cajas
        </span>
      </div>
      
      <button 
        onClick={onShowCollection}
        disabled={loadingInventory}
        className={`flex items-center space-x-2 ${
          loadingInventory ? 'bg-gray-700/60 cursor-wait' : 'bg-purple-900/60 hover:bg-purple-800/80'
        } text-purple-300 px-4 py-2 rounded-md transition border border-purple-700/50`}
      >
        {loadingInventory ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Sparkles size={20} />
        )}
        <span>Colección ({collectionCount})</span>
      </button>
    </div>
  );
}