import { Filter, Search } from "lucide-react";
import { getRarityConfig } from "../../_utils/rarityConfig";
import { useTranslations } from "next-intl";
import { getItemRarity } from "@/lib/intlUtils";
import { ArcadeInventoryItem } from "@boffmedia/shared";

interface CollectionFiltersProps {
  selectedRarity: ArcadeInventoryItem.rarity | "all";
  onRarityChange: (rarity: ArcadeInventoryItem.rarity | "all") => void;
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CollectionFilters({ 
  selectedRarity, 
  onRarityChange, 
  searchTerm, 
  onSearchChange 
}: CollectionFiltersProps) {
  const t = useTranslations("");
  
  return (
    <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
      <div className="flex items-center space-x-2 bg-layer-2 rounded-lg p-2 border border-edge">
        <Search className="text-ink-muted" size={20} />
        <input
          type="text"
          placeholder="Buscar objeto..."
          value={searchTerm}
          onChange={onSearchChange}
          className="bg-transparent border-none text-white focus:outline-none w-full placeholder:text-ink-muted"
        />
      </div>
      
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <Filter size={16} className="text-ink-muted mr-1" />
        {["all", "common", "uncommon", "rare", "epic", "legendary"].map((rarity) => {
          const isActive = selectedRarity === rarity;
          let styles;
          
          if (rarity === "all") {
            styles = isActive 
              ? "bg-white text-black" 
              : "bg-layer-2 text-ink hover:bg-layer-3";
          } else {
            const config = getRarityConfig(rarity as ArcadeInventoryItem.rarity);
            styles = isActive 
              ? `${config.bgColor} ${config.textColor}` 
              : "bg-layer-2 text-ink hover:bg-layer-3";
          }
          
          return (
            <button
              key={rarity}
              onClick={() => onRarityChange(rarity as ArcadeInventoryItem.rarity | "all")}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap border ${isActive ? 'border-cyan-500/50' : 'border-edge'} ${styles}`}
            >
              {getItemRarity(t, rarity as ArcadeInventoryItem.rarity)}
            </button>
          );
        })}
      </div>
    </div>
  );
}