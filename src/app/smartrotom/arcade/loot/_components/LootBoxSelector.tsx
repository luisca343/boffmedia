import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LootBox } from "./types";
import { ChevronLeft, ChevronRight, Box, Sparkles } from "lucide-react";
import Image from "next/image";
import { InventoryItem } from "@/services/api/smartrotom/arcadeService";

interface LootBoxSelectorProps {
  lootBoxes: LootBox[];
  selectedBox: LootBox | null;
  onSelect: (box: LootBox) => void;
  onOpenBox: () => void;
  ownedBoxes: Record<string, InventoryItem>;
}

export default function LootBoxSelector({ 
  lootBoxes, 
  selectedBox, 
  onSelect, 
  onOpenBox,
  ownedBoxes
}: LootBoxSelectorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hovered, setHovered] = useState(false);

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? lootBoxes.length - 1 : prev - 1));
    onSelect(lootBoxes[currentIndex === 0 ? lootBoxes.length - 1 : currentIndex - 1]);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === lootBoxes.length - 1 ? 0 : prev + 1));
    onSelect(lootBoxes[currentIndex === lootBoxes.length - 1 ? 0 : currentIndex + 1]);
  };

  const handleSelect = (box: LootBox) => {
    onSelect(box);
  };

  // If no selection yet, select first box
  if (!selectedBox && lootBoxes.length > 0) {
    onSelect(lootBoxes[0]);
  }

  // Get theme-appropriate colors for the current box
  const getThemeColors = (theme: string) => {
    switch (theme.toLowerCase()) {
      case 'blue':
        return {
          bgGradient: 'from-blue-900/70 to-indigo-900/70',
          border: 'border-blue-500/50',
          text: 'text-blue-300',
          highlight: 'text-blue-200',
          buttonGradient: 'from-blue-600 to-indigo-600',
          buttonHover: 'hover:from-blue-500 hover:to-indigo-500'
        };
      case 'green':
        return {
          bgGradient: 'from-green-900/70 to-emerald-900/70',
          border: 'border-green-500/50',
          text: 'text-green-300',
          highlight: 'text-green-200',
          buttonGradient: 'from-green-600 to-emerald-600',
          buttonHover: 'hover:from-green-500 hover:to-emerald-500'
        };
      case 'red':
        return {
          bgGradient: 'from-red-900/70 to-rose-900/70',
          border: 'border-red-500/50',
          text: 'text-red-300',
          highlight: 'text-red-200',
          buttonGradient: 'from-red-600 to-rose-600',
          buttonHover: 'hover:from-red-500 hover:to-rose-500'
        };
      default:
        return {
          bgGradient: 'from-purple-900/70 to-violet-900/70',
          border: 'border-purple-500/50',
          text: 'text-purple-300',
          highlight: 'text-purple-200',
          buttonGradient: 'from-purple-600 to-violet-600',
          buttonHover: 'hover:from-purple-500 hover:to-violet-500'
        };
    }
  };

  const currentBoxTheme = selectedBox ? getThemeColors(selectedBox.theme) : getThemeColors('blue');
  
  // Check if current box is available in inventory
  const hasCurrentBox = selectedBox && ownedBoxes[selectedBox.id] && ownedBoxes[selectedBox.id].amount > 0;
  const ownedCount = selectedBox && ownedBoxes[selectedBox.id] ? ownedBoxes[selectedBox.id].amount : 0;

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 pb-2 mb-4">
        Selecciona una Caja
      </h2>
      
      {/* Carousel */}
      <div className="relative w-full max-w-xl mb-8 p-4 bg-gray-900/80 rounded-xl border-2 border-cyan-500/30 shadow-xl">
        <div className="flex justify-center items-center">
          <button 
            className="absolute left-0 z-10 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-full p-2 shadow-md border border-gray-700"
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
                <div 
                  className="relative w-64 h-64 cursor-pointer transform hover:scale-105 transition-transform duration-300"
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
                >
                  <Image 
                    src={lootBoxes[currentIndex].image} 
                    alt={lootBoxes[currentIndex].name}
                    fill
                    className="object-contain"
                  />

                  {/* Animation for hovered state */}
                  {hovered && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 pointer-events-none"
                    >
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-dashed"
                      />
                      
                      {/* Sparkle effects */}
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ 
                            x: Math.random() * 200 - 100, 
                            y: Math.random() * 200 - 100,
                            opacity: 0
                          }}
                          animate={{ 
                            x: Math.random() * 200 - 100, 
                            y: Math.random() * 200 - 100,
                            opacity: [0, 1, 0]
                          }}
                          transition={{
                            duration: 1.5 + Math.random(),
                            repeat: Infinity,
                            delay: i * 0.2
                          }}
                          className="absolute"
                        >
                          <Sparkles className={`h-6 w-6 ${currentBoxTheme.text}`} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
                
                <h3 className={`text-xl font-bold ${currentBoxTheme.highlight} mt-4`}>{lootBoxes[currentIndex].name}</h3>
                <p className="text-gray-300 text-center max-w-md mt-2">{lootBoxes[currentIndex].description}</p>
                
                {/* Show owned count */}
                <div className={`mt-3 px-4 py-2 bg-black/30 rounded-lg ${currentBoxTheme.text} flex items-center gap-2`}>
                  <Box size={16} />
                  <span>Disponibles: <strong>{ownedCount}</strong></span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          <button 
            className="absolute right-0 z-10 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-full p-2 shadow-md border border-gray-700"
            onClick={handleNext}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
      
      {/* Indicators */}
      <div className="flex space-x-2 mb-8">
        {lootBoxes.map((box, index) => (
          <button
            key={box.id}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-yellow-400 scale-125' 
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
            onClick={() => {
              setCurrentIndex(index);
              handleSelect(box);
            }}
          />
        ))}
      </div>
      
      {/* Open button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center space-x-2 px-8 py-4 rounded-lg text-white font-bold text-lg shadow-lg ${
          hasCurrentBox
            ? `bg-gradient-to-r ${currentBoxTheme.buttonGradient} ${currentBoxTheme.buttonHover} border-2 ${currentBoxTheme.border}` 
            : 'bg-gray-700 border-2 border-gray-600 cursor-not-allowed opacity-70'
        }`}
        onClick={onOpenBox}
        disabled={!hasCurrentBox}
      >
        <Box size={24} />
        <span>Abrir Caja</span>
      </motion.button>
      
      {/* Error message if box not available */}
      {selectedBox && !hasCurrentBox && (
        <p className="text-red-400 mt-4 bg-red-900/20 px-4 py-2 rounded-md border border-red-800/50">
          No tienes esta caja en tu inventario.
        </p>
      )}
    </div>
  );
}