import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Item, LootBox, Rarity } from "./types";
import Image from "next/image";
import { Sparkles, Check, Box } from "lucide-react";

interface LootBoxOpeningProps {
  lootBox: LootBox;
  wonItem: Item;
  onComplete: () => void;
}

const rarityConfig: Record<Rarity, { color: string, bgColor: string, borderColor: string, textColor: string, glow: string }> = {
  common: { 
    color: "gray-800", 
    bgColor: "bg-gray-800/90", 
    borderColor: "border-gray-400", 
    textColor: "text-gray-400",
    glow: ""
  },
  uncommon: { 
    color: "green-900", 
    bgColor: "bg-green-900/90", 
    borderColor: "border-green-400", 
    textColor: "text-green-400",
    glow: "shadow-md shadow-green-500/30"
  },
  rare: { 
    color: "blue-900", 
    bgColor: "bg-blue-900/90", 
    borderColor: "border-blue-400", 
    textColor: "text-blue-400",
    glow: "shadow-lg shadow-blue-500/40"
  },
  epic: { 
    color: "purple-900", 
    bgColor: "bg-purple-900/90", 
    borderColor: "border-purple-400", 
    textColor: "text-purple-400",
    glow: "shadow-xl shadow-purple-500/50"
  },
  legendary: { 
    color: "yellow-900", 
    bgColor: "bg-yellow-900/90", 
    borderColor: "border-yellow-400", 
    textColor: "text-yellow-400",
    glow: "shadow-2xl shadow-yellow-500/60"
  }
};

export default function LootBoxOpening({ lootBox, wonItem, onComplete }: LootBoxOpeningProps) {
  const [showBox, setShowBox] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);
  const [animationCompleted, setAnimationCompleted] = useState(false);
  const [spinItems, setSpinItems] = useState<Item[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinComplete, setSpinComplete] = useState(false);
  const spinnerRef = useRef<HTMLDivElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const targetPosition = useRef<number>(0);
  const animationStarted = useRef<boolean>(false);
  
  const ITEM_WIDTH = 180; // width of each item + margin
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  
  // Generate items immediately on mount
  useEffect(() => {
    // Generate a large array of items for a smooth animation
    const items: Item[] = [];
    const totalItems = 300;
    
    // Insert winning item at a strategic position
    const winningPosition = totalItems - 15;
    
    for (let i = 0; i < totalItems; i++) {
      if (i === winningPosition) {
        // Insert the winning item
        items.push(wonItem);
      } else {
        // Insert random items from the loot box
        const randomIndex = Math.floor(Math.random() * lootBox.items.length);
        items.push(lootBox.items[randomIndex]);
      }
    }
    
    setSpinItems(items);
    setWinningIndex(winningPosition);
    
    // Set up the animation sequence
    const boxTimer = setTimeout(() => {
      // Box animation is done - immediately show spinner
      setShowBox(false);
      setShowSpinner(true);
      
      // Start spinning immediately
      const spinTimer = setTimeout(() => {
        if (!animationStarted.current) {
          animationStarted.current = true;
          setIsSpinning(true);
          startScrollingAnimation(items, winningPosition);
        }
      }, 100);
      
      return () => clearTimeout(spinTimer);
    }, 1500); // Allow enough time for the box animation
    
    return () => {
      clearTimeout(boxTimer);
      cancelAnimationFrame(animationRef.current);
    };
  }, [lootBox, wonItem]);

  const startScrollingAnimation = (items: Item[], winningPosition: number) => {
    if (!spinnerRef.current) return;
    
    const containerWidth = spinnerRef.current.offsetWidth;
    
    // Calculate a random position within the winning item instead of exactly centering
    const randomOffset = Math.floor(Math.random() * (ITEM_WIDTH * 0.98)) - (ITEM_WIDTH * 0.49); // Random position within -49% to +49% of center
    targetPosition.current = (winningPosition * ITEM_WIDTH) - (containerWidth / 2) + (ITEM_WIDTH / 2) + randomOffset;
    
    // Constants for controlling animation - moved outside for better readability
    const TOTAL_DURATION = 6500;  
    const INITIAL_SPEED = 150;
    const FIRST_PHASE_DURATION = 0.3; 
    
    // Precompute constants to avoid recalculation in animation frame
    const TRANSITION_POINT = 0.95 * targetPosition.current;
    const START_FINAL_PHASE = TRANSITION_POINT;
    const FINAL_PHASE_REMAINING = targetPosition.current - START_FINAL_PHASE;
    
    let startTime = 0;
    let lastPosition = 0;
    
    const animate = (timestamp: number) => {
      if (startTime === 0) startTime = timestamp;
      
      const elapsedTime = timestamp - startTime;
      const progress = Math.min(elapsedTime / TOTAL_DURATION, 1);
      
      let newPosition;
      
      if (progress < FIRST_PHASE_DURATION) {
        // First phase: Fast start with gradual deceleration
        
        // Optimization: Cache division result
        const normalizedProgress = progress / FIRST_PHASE_DURATION;
        
        // Simplified calculation with fewer power operations
        const mappedProgress = Math.pow(normalizedProgress, 0.8) * 0.95;
        
        // Optimization: Combine calculations
        const speedFactor = INITIAL_SPEED * Math.pow(1 - normalizedProgress, 1.2);
        
        newPosition = mappedProgress * targetPosition.current + speedFactor;
        
        // Simple bound check
        if (newPosition > TRANSITION_POINT) {
          newPosition = TRANSITION_POINT;
        }
      } else {
        // Final phase: Precise landing with subtle oscillation
        
        // Normalize progress for this phase - optimized
        const finalProgress = (progress - FIRST_PHASE_DURATION) / (1 - FIRST_PHASE_DURATION);
        
        // Cubic ease out - simplified
        const baseApproach = START_FINAL_PHASE + 
          (FINAL_PHASE_REMAINING * (1 - Math.pow(1 - finalProgress, 3)));
        
        // Optimized oscillation logic
        let oscillation = 0;
        if (finalProgress > 0.1 && finalProgress < 0.9) {
          const oscProgress = (finalProgress - 0.1) / 0.8;
          // Reduced calculations in oscillation
          oscillation = Math.sin(oscProgress * 4 * Math.PI) * 4 * Math.pow(1 - oscProgress, 1.5);
        }
        
        newPosition = baseApproach + oscillation;
      }
      
      // Ensure we never go backward
      newPosition = Math.max(newPosition, lastPosition);
      
      // Avoid DOM updates if position hasn't changed significantly
      if (Math.abs(newPosition - lastPosition) > 0.1) {
        setScrollPosition(newPosition);
        lastPosition = newPosition;
      }
      
      // Continue or finish animation
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure exact final position and clean up
        setScrollPosition(targetPosition.current);
        setIsSpinning(false);
        setSpinComplete(true);
        
        // Use a single state update for animation completion
        setTimeout(() => {
          setAnimationCompleted(true);
        }, 800);
      }
    };
    
    // Cancel any existing animation before starting new one
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Start the animation
    animationRef.current = requestAnimationFrame(animate);
  };

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] py-8">
      {/* Box Animation */}
      {showBox && (
        <div className="relative">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ 
              scale: [0.9, 1.1, 0.95, 1.05, 1],
              opacity: 1,
              rotate: [0, -2, 2, -2, 0]
            }}
            transition={{ 
              duration: 1.2,
              ease: "easeOut"
            }}
            className="relative w-80 h-80 z-10"
          >
            <Image 
              src={lootBox.image || "/smartrotom/img/apps/arcade/lootbox/trainer-box.png"}
              alt={lootBox.name}
              fill
              className="object-contain"
              priority={true}
            />
            
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 blur-md"
              style={{ mixBlendMode: 'overlay' }}
            />
          </motion.div>
          
          {/* Arcade-style text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute -bottom-16 inset-x-0 text-center"
          >
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 animate-text-shine">
              Abriendo {lootBox.name}...
            </h3>
          </motion.div>
        </div>
      )}
      
      {/* Arcade-Style Spinner */}
      {showSpinner && (
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
                  const config = rarityConfig[item.rarity];
                  
                  // Only highlight the specific instance that matches both the ID AND the winning index
                  const isWinningItem = spinComplete && item.id === wonItem.id && index === winningIndex;
                  
                  return (
                    <div
                      key={`${item.id}-${index}`}
                      className={`flex-shrink-0 w-[170px] h-56 mx-[5px] p-4 rounded-lg flex flex-col items-center justify-center 
                        ${isWinningItem ? `scale-110 z-10 border-4 ${config.glow}` : 'border-2'} ${config.borderColor} ${config.bgColor}`}
                      style={{ 
                        flexShrink: 0,
                        flexGrow: 0,
                        flexBasis: '170px'
                      }}
                    >
                      <div className="relative w-32 h-32 mb-2">
                        <Image
                          src={item.image || "/smartrotom/img/apps/arcade/lootbox/items/pokeball.png"}
                          alt={item.name}
                          width={128}
                          height={128}
                          className="object-contain"
                          priority={index < 20} // Prioritize loading images that appear first
                        />
                        
                        {/* Special effects for rare items */}
                        {(item.rarity === 'epic' || item.rarity === 'legendary') && (
                          <motion.div
                            animate={{ 
                              rotate: [0, 360],
                              scale: [1, 1.2, 1]
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                          >
                            <Sparkles className={`w-full h-full ${config.textColor} opacity-30`} />
                          </motion.div>
                        )}
                      </div>
                      
                      <h3 className={`${config.textColor} font-bold text-center text-sm md:text-base`}>
                        {item.name}
                      </h3>
                      
                      <div className={`${config.textColor} text-xs uppercase tracking-wider mt-1`}>
                        {item.rarity}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Fade effects on the sides */}
              <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-gray-900 to-transparent z-20 pointer-events-none" />
              <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-gray-900 to-transparent z-20 pointer-events-none" />
              
              {/* Blur effect while spinning - stronger at high speeds */}
              {isSpinning && (
                <div 
                  className="absolute inset-0 z-10 pointer-events-none" 
                  style={{ 
                    backdropFilter: 'blur(1px)',
                    WebkitBackdropFilter: 'blur(1px)'
                  }}
                />
              )}
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
      )}
      
      {/* Result display - Arcade Cabinet Style */}
      {animationCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10 w-full max-w-md bg-gray-900/90 rounded-xl p-6 border-4 border-cyan-500/50 shadow-xl"
        >
          {/* Cabinet top */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 -mt-6 -mx-6 mb-6 py-2 px-4 border-b-2 border-gray-700 flex justify-center">
            <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 animate-text-shine px-4 text-center">
              ¡Objeto Obtenido!
            </div>
          </div>
          
          {/* Cabinet screws */}
          <div className="absolute left-4 top-4 h-2 w-2 rounded-full bg-gray-600 shadow-inner"></div>
          <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-gray-600 shadow-inner"></div>
          
          <div className={`flex flex-col items-center p-4 rounded-lg ${rarityConfig[wonItem.rarity].bgColor} border-2 ${rarityConfig[wonItem.rarity].borderColor} ${rarityConfig[wonItem.rarity].glow}`}>
            <h3 className={`text-xl font-bold ${rarityConfig[wonItem.rarity].textColor} mb-2 text-center`}>
              {wonItem.name}
            </h3>
            
            <div className="relative w-32 h-32 mb-4">
              <Image
                src={wonItem.image || "/smartrotom/img/apps/arcade/lootbox/items/pokeball.png"}
                alt={wonItem.name}
                width={128}
                height={128}
                className="object-contain"
              />
              
              {/* Special effects for legendary items */}
              {wonItem.rarity === 'legendary' && (
                <>
                  <motion.div 
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-yellow-500/20 border-dashed"
                  />
                  
                  <motion.div
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <Sparkles className="w-full h-full text-yellow-400 opacity-30" />
                  </motion.div>
                </>
              )}
            </div>
            
            <div className={`px-3 py-1 rounded-full ${rarityConfig[wonItem.rarity].textColor} bg-gray-950/60 mb-4 text-center font-bold uppercase tracking-wider text-sm`}>
              {wonItem.rarity}
            </div>
            
            <p className="text-gray-200 text-center mb-4 bg-black/40 p-3 rounded-lg border border-gray-800">
              {wonItem.description}
            </p>
          </div>
          
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 10, delay: 1 }}
            onClick={onComplete}
            className="w-full mt-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-md flex items-center justify-center space-x-2 font-bold shadow-lg border-2 border-green-500/50"
          >
            <Check className="w-5 h-5" />
            <span>¡Añadir a colección!</span>
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}