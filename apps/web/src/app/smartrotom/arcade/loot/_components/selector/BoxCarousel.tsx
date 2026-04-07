import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { BoxDisplay } from "./BoxDisplay";
import { BoxInfo } from "./BoxInfo";
import { ArcadeInventoryItem, LootboxBoxConfig } from "@boffmedia/shared";

interface BoxCarouselProps {
  lootBoxes: LootboxBoxConfig[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  onSelect: (box: LootboxBoxConfig) => void;
  selectedBox: LootboxBoxConfig;
  currentBoxTheme: {
    bgGradient: string;
    border: string;
    text: string;
    highlight: string;
    buttonGradient: string;
    buttonHover: string;
  };
  onShowOdds: () => void;
  ownedBoxes: Record<string, ArcadeInventoryItem>;
}

export function BoxCarousel({ 
  lootBoxes,
  currentIndex,
  setCurrentIndex,
  onSelect,
  selectedBox,
  currentBoxTheme,
  onShowOdds,
  ownedBoxes,

}: BoxCarouselProps) {
  const handlePrevious = () => {
    const newIndex = currentIndex === 0 ? lootBoxes.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    onSelect(lootBoxes[newIndex]);
  };

  const handleNext = () => {
    const newIndex = currentIndex === lootBoxes.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    onSelect(lootBoxes[newIndex]);
  };

  return (
    <div className="relative w-full max-w-xl mb-8 p-4 bg-surface-900/80 rounded-xl border-2 border-cyan-500/30 shadow-xl">
      {/* Probabilities button - Added at the top of the carousel */}
      <div className="absolute top-8 right-8 z-20">
        <button
          onClick={onShowOdds}
          className={`px-4 py-2 rounded-lg border ${currentBoxTheme.text} ${currentBoxTheme.border} transition-colors hover:bg-surface-800/50 text-sm`}
        >
          Ver Probabilidades
        </button>
      </div>
      
      <div className="absolute top-8 left-8 z-20">
        {selectedBox && (
          <BoxInfo
            selectedBox={selectedBox}
            ownedBoxes={ownedBoxes}
            currentBoxTheme={currentBoxTheme}
          />
        )}
      </div>

      <div className="flex justify-center items-center">
        <button 
          className="absolute left-0 z-10 bg-surface-800/80 hover:bg-surface-700/80 text-white rounded-full p-2 shadow-md border border-surface-700"
          onClick={handlePrevious}
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="w-full h-96 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className={`h-full flex flex-col items-center justify-center bg-gradient-to-br ${currentBoxTheme.bgGradient} rounded-lg border-2 ${currentBoxTheme.border} p-6`}
            >
              <BoxDisplay 
                lootBox={lootBoxes[currentIndex]} 
              />

              <h3 className={`text-xl font-bold ${currentBoxTheme.highlight} mt-4`}>
                {lootBoxes[currentIndex].name}
              </h3>
              <p className="text-surface-300 text-center max-w-md mt-2">
                {lootBoxes[currentIndex].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
        
        <button 
          className="absolute right-0 z-10 bg-surface-800/80 hover:bg-surface-700/80 text-white rounded-full p-2 shadow-md border border-surface-700"
          onClick={handleNext}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Indicators */}
      <div className="flex justify-center space-x-2 mt-4">
        {lootBoxes.map((box, index) => (
          <button
            key={box.id}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-yellow-400 scale-125' 
                : 'bg-surface-600 hover:bg-surface-500'
            }`}
            onClick={() => {
              setCurrentIndex(index);
              onSelect(box);
            }}
          />
        ))}
      </div>
    </div>
  );
}