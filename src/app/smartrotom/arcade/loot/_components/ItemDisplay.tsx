import { ReactNode } from "react";
import { ItemImage } from "@/lib/ItemImage";
import { Check } from "lucide-react";

interface ItemDisplayProps {
  type: string;
  itemId: string;
  count?: number;
  size?: number;
  rarity?: string;
  name?: string;
  showCountBadge?: boolean;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
  selectable?: boolean;
  selected?: boolean;
  isChest?: boolean;
}

export const ItemDisplay = ({ 
  type, 
  itemId, 
  count = 0, 
  size = 64, 
  rarity,
  name,
  showCountBadge = true,
  className = "",
  children,
  onClick,
  selectable = false,
  selected = false,
  isChest = false
}: ItemDisplayProps) => {
  
  return (
    <div 
      className={`relative flex flex-col items-center ${selectable && !isChest ? 'cursor-pointer' : ''} ${isChest ? 'cursor-not-allowed opacity-80' : ''} ${className}`}
      onClick={selectable && !isChest ? onClick : undefined}
    >
      <div className="relative flex justify-center items-center">
        <ItemImage
          type={type}
          itemId={itemId}
          amount={0} 
          size={size}
        />
        
        {count > 1 && showCountBadge && (
          <span className="absolute bottom-0 right-0 bg-gray-900/80 text-white text-xs px-1.5 py-0.5 rounded-md border border-gray-700">
            x{count}
          </span>
        )}
        
        {rarity === 'legendary' && (
          <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 to-transparent rounded-md animate-pulse pointer-events-none" />
        )}

        {selectable && selected && (
          <div className="absolute inset-0 bg-cyan-500/30 rounded-md flex items-center justify-center">
            <div className="bg-cyan-500 rounded-full p-1">
              <Check size={16} className="text-black" />
            </div>
          </div>
        )}

        {selectable && isChest && (
          <div className="absolute inset-0 bg-gray-800/60 rounded-md flex items-center justify-center">
            <span className="text-xs text-white bg-black/70 px-2 py-1 rounded">No seleccionable</span>
          </div>
        )}
      </div>
      
      {name && (
        <p className="text-sm text-center mt-1 truncate w-full">{name}</p>
      )}
      
      {children}
    </div>
  );
};