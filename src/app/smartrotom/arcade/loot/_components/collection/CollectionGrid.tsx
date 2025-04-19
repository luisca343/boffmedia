import { Archive, Search } from "lucide-react";
import { Item, Rarity } from "../../types";
import { getRarityConfig } from "../../_utils/rarityConfig";
import { ItemDisplay } from "../ItemDisplay";
import { useTranslations } from "next-intl";
import { getItemName, getItemRarity } from "@/lib/intlUtils";

interface CollectionGridProps {
  items: Item[];
  totalItems: number;
  onItemClick: (item: Item) => void;
}

export function CollectionGrid({ items, totalItems, onItemClick }: CollectionGridProps) {
  const t = useTranslations("");
  
  // Get the type based on item source
  const getItemType = (item: Item) => {
    return item.source === "arcade" ? "arcade" : "mina";
  };
  
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-400 py-12">
        {totalItems === 0 ? (
          <div className="text-center">
            <Archive className="h-16 w-16 mx-auto text-gray-600 mb-3" />
            <p className="text-xl mb-2">Aún no has coleccionado ningún objeto</p>
            <p className="text-gray-500">
              Abre cajas para empezar a coleccionar objetos raros
            </p>
          </div>
        ) : (
          <div className="text-center">
            <Search className="h-16 w-16 mx-auto text-gray-600 mb-3" />
            <p className="text-xl mb-2">No hay objetos que coincidan con tu búsqueda</p>
            <p className="text-gray-500">
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
        const itemType = getItemType(item);
        
        return (
          <div
            key={item.id}
            onClick={() => onItemClick(item)}
            className={`${config.bgColor} border-2 ${config.borderColor} rounded-lg p-3 flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-200 ${config.glow}`}
          >
            <div className="w-full aspect-square mb-2 flex items-center justify-center">
              <ItemDisplay
                type={itemType}
                itemId={item.id}
                count={item.count}
                size={96}
                rarity={item.rarity}
              />
            </div>
            
            <h3 className={`${config.textColor} font-medium text-center text-sm truncate w-full`}>
              {getItemName(t, item.id)}
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