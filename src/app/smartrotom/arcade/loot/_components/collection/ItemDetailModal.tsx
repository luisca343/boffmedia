import { X } from "lucide-react";
import { getRarityConfig } from "../../_utils/rarityConfig";
import { ItemDisplay } from "../ItemDisplay";
import { useTranslations } from "next-intl";
import { getItemDescription, getItemName, getItemRarity } from "@/lib/intlUtils";
import { ArcadeInventoryItem } from "@/generated/api";

interface ItemDetailModalProps {
  item: ArcadeInventoryItem | null;
  onClose: () => void;
}

export function ItemDetailModal({ item, onClose }: ItemDetailModalProps) {
  const t = useTranslations("");
  
  if (!item) return null;
  
  // Get the type based on item source
  const getItemType = (item: ArcadeInventoryItem) => {
    return item.sourceType === "arcade" ? "arcade" : "mina";
  };

  const config = getRarityConfig(item.rarity);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className={`${config.bgColor} border-4 ${config.borderColor} rounded-lg p-6 max-w-md w-full ${config.glow}`}>
        <div className="flex justify-between items-start mb-4">
          <h3 className={`${config.textColor} text-2xl font-bold`}>
            {getItemName(t, item.itemId)}
          </h3>
          <button 
            onClick={onClose}
            className="bg-gray-800 hover:bg-gray-700 text-white p-1 rounded-full border border-gray-700"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-48 h-48 mb-4 flex items-center justify-center bg-black/30 rounded-lg border border-gray-700">
            <ItemDisplay
              type={getItemType(item)}
              itemId={item.itemId}
              count={item.amount}
              size={160}
              rarity={item.rarity}
            />
          </div>
          
          {item.amount && item.amount > 1 && (
            <div className="mb-2 px-3 py-1 bg-black/50 rounded-md border border-gray-700">
              <span className={`${config.textColor}`}>
                Cantidad: <strong>{item.amount}</strong>
              </span>
            </div>
          )}
          
          <span className={`${config.textColor} uppercase tracking-wider font-bold mb-3 px-3 py-1 rounded-full bg-black/30`}>
            {getItemRarity(t, item.rarity)}
          </span>
          
          <p className="text-gray-200 text-center bg-black/30 p-4 rounded-lg border border-gray-800">
            {getItemDescription(t, item.itemId) || `Un objeto ${item.rarity} de la colección.`}
          </p>
        </div>
        
        <button
          onClick={onClose}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg border border-gray-700 font-bold"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}