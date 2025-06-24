import { SpinnerItem } from "./SpinnerItem";
import { LootboxBoxConfig, LootboxItemConfig } from "@/generated/api";

interface SpinnerProps {
  lootBox: LootboxBoxConfig;
  spinItems: LootboxItemConfig[];
  scrollPosition: number;
  spinComplete: boolean;
  isSpinning: boolean;
  winningIndex: number | null;
  wonItem: LootboxItemConfig;
  spinnerRef: React.RefObject<HTMLDivElement>;
  itemsContainerRef: React.RefObject<HTMLDivElement>;
  ITEM_WIDTH: number;
}

export function Spinner({ 
  lootBox,
  spinItems,
  scrollPosition,
  spinComplete,
  isSpinning,
  winningIndex, 
  wonItem,
  spinnerRef,
  itemsContainerRef,
  ITEM_WIDTH
}: SpinnerProps) {
  console.log("spinItems:", spinItems);
  console.log("wonItem:", wonItem);
  return (
    <div className="relative w-full">
      {/* Arcade cabinet frame for spinner */}
      <div className="bg-gray-900/80 border-4 border-gray-700 rounded-xl overflow-hidden p-4 shadow-2xl">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 py-2 px-4 mb-4 border-2 border-gray-600 rounded-t-lg">
          <h3 className="text-md font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 text-center">
            {lootBox.name}
          </h3>
        </div>
      
        {/* Scanline effect over entire spinner */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-20 animate-scanline pointer-events-none z-30"></div>
        
        {/* Items container */}
        <div 
          ref={spinnerRef}
          className="relative h-64 overflow-hidden bg-gray-900 border-4 border-cyan-500/50 rounded-lg"
        >
          {/* Center marker */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-full z-30 flex flex-col items-center justify-between pointer-events-none">
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-cyan-500" />
            <div className="h-full w-0.5 bg-cyan-500"></div>
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-cyan-500" />
          </div>
          
          {/* CRT screen effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 z-10 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[url('/images/scan-lines.png')] opacity-10 z-10 pointer-events-none"></div>
          
          <div 
            ref={itemsContainerRef}
            className="h-full flex items-center absolute"
            style={{
              transform: `translateX(-${scrollPosition}px)`,
              transition: spinComplete ? 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
              width: `${spinItems.length * ITEM_WIDTH}px`
            }}
          >
            {spinItems.map((item, index) => {
              // Only highlight the specific instance that matches both the ID AND the winning index
              const isWinningItem = spinComplete && item.id === wonItem.id && index === winningIndex;
              
              return (
                <SpinnerItem
                  key={`${item.id}-${index}`}
                  item={item}
                  index={index}
                  isWinningItem={isWinningItem}
                  winningIndex={winningIndex}
                />
              );
            })}
          </div>
          
          {/* Fade effects on the sides */}
          <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-gray-900 to-transparent z-20 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-gray-900 to-transparent z-20 pointer-events-none" />
        </div>
        
        {/* Status text at bottom */}
        <div className="mt-4 text-center text-xs text-gray-400 tracking-widest uppercase">
          {isSpinning ? (
            <span className="animate-pulse text-cyan-300">ABRIENDO CAJA...</span>
          ) : spinComplete ? (
            <span className="text-green-400">¡PREMIO OBTENIDO!</span>
          ) : (
            <span>INSERT COIN</span>
          )}
        </div>
      </div>
    </div>
  );
}