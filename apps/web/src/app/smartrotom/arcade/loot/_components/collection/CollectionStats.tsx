import { ArcadeInventoryItem } from "@/generated/api";


interface CollectionStatsProps {
  totalCount: number;
  filteredCount: number;
  displayedCount: number;
  selectedRarity: ArcadeInventoryItem.rarity | "all";
}

export function CollectionStats({ 
  totalCount, 
  filteredCount, 
  displayedCount, 
  selectedRarity 
}: CollectionStatsProps) {
  return (
    <div className="text-surface-300 mb-4 flex items-center justify-between">
      <span>
        Mostrando {displayedCount} de {filteredCount} objetos
        {selectedRarity !== "all" && ` (filtrado por ${
          selectedRarity === "common" ? "Comunes" :
          selectedRarity === "uncommon" ? "Poco comunes" :
          selectedRarity === "rare" ? "Raros" :
          selectedRarity === "epic" ? "Épicos" : "Legendarios"
        })`}
      </span>
      
      <span className="text-cyan-300 text-sm">
        {totalCount} objetos en total
      </span>
    </div>
  );
}