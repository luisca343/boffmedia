import { ReactNode } from "react";
import { ItemImage } from "@/lib/ItemImage";

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
  onClick
}: ItemDisplayProps) => {
  return (
    <div 
      className={`relative flex flex-col items-center ${className}`}
      onClick={onClick}
    >
      <div className="relative flex justify-center items-center">
        <ItemImage
          type={type}
          itemId={itemId}
          amount={0} 
          size={size}
        />
        
        {/* Count badge, separate from the ItemImage component */}
        {count > 1 && showCountBadge && (
          <span className="absolute bottom-0 right-0 bg-gray-900/80 text-white text-xs px-1.5 py-0.5 rounded-md border border-gray-700">
            x{count}
          </span>
        )}
        
        {/* Special effects by rarity can be added here */}
        {rarity === 'legendary' && (
          <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 to-transparent rounded-md animate-pulse pointer-events-none" />
        )}
      </div>
      
      {/* Optional item name display */}
      {name && (
        <p className="text-sm text-center mt-1 truncate w-full">{name}</p>
      )}
      
      {/* Any additional content */}
      {children}
    </div>
  );
};