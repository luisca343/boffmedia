import { Archive, Search } from "lucide-react";
import { getRarityConfig } from "../../_utils/rarityConfig";
import { ItemDisplay } from "../ItemDisplay";
import { useTranslations } from "next-intl";
import { getItemName, getItemRarity } from "@/lib/intlUtils";
import { ArcadeInventoryItem } from "@/generated/api";

interface CollectionGridProps {
  items: ArcadeInventoryItem[];
  totalItems: number;
  onItemClick: (item: ArcadeInventoryItem) => void;
}

export function CollectionGrid({ items, totalItems, onItemClick }: CollectionGridProps) {
  const t = useTranslations("");

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-surface-400 py-12">
        {totalItems === 0 ? (
          <div className="text-center">
            <Archive className="h-16 w-16 mx-auto text-surface-600 mb-3" />
            <p className="text-xl mb-2">Aún no has coleccionado ningún objeto</p>
            <p className="text-surface-500">
              Abre cajas para empezar a coleccionar objetos raros
            </p>
          </div>
        ) : (
          <div className="text-center">
            <Search className="h-16 w-16 mx-auto text-surface-600 mb-3" />
            <p className="text-xl mb-2">No hay objetos que coincidan con tu búsqueda</p>
            <p className="text-surface-500">
              Intenta con otros términos o filtros
            </p>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
      {items.map(item => {
        const config = getRarityConfig(item.rarity);
        
        return (
          <div
            key={item.id}
            onClick={() => onItemClick(item)}
            className={`${config.bgColor} border-2 ${config.borderColor} rounded-lg p-3 flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-200 ${config.glow}`}
          >
            <div className="w-full aspect-square mb-2 flex items-center justify-center">
              <ItemDisplay
                type={item.sourceType!}
                itemId={item.itemId}
                count={item.amount}
                size={96}
                rarity={item.rarity}
              />
            </div>
            
            <h3 className={`${config.textColor} font-medium text-center text-sm truncate w-full`}>
              {getItemName(t, item.itemId, item.sourceType)}
            </h3>
            <p className={`${config.textColor} text-xs mt-1`}>
              {getItemRarity(t, item.rarity)}
            </p>
          </div>
        );
      })}
    </div>
  );
}