import { motion } from "framer-motion";
import { Box } from "lucide-react";
import { LootBox } from "../../types";
import { ArcadeInventory } from "@/generated/api";

interface OpenBoxButtonProps {
  selectedBox: LootBox | null;
  ownedBoxes: Record<string, ArcadeInventory>;
  currentBoxTheme: {
    buttonGradient: string;
    buttonHover: string;
    border: string;
  };
  onOpenBox: () => void;
}

export function OpenBoxButton({ 
  selectedBox, 
  ownedBoxes, 
  currentBoxTheme,
  onOpenBox 
}: OpenBoxButtonProps) {
  if (!selectedBox) return null;
  
  // Check if current box is available in inventory
  const hasCurrentBox = ownedBoxes[selectedBox.id] && ownedBoxes[selectedBox.id].amount > 0;

  return (
    <div className="flex flex-col items-center">
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
    </div>
  );
}