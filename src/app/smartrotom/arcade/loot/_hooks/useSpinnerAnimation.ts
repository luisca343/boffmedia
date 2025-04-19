import { useState, useEffect, useRef } from "react";
import { Item } from "../types";

interface UseSpinnerAnimationProps {
  lootBox: {
    items: Item[];
  };
  wonItem: Item;
}

interface SpinnerAnimationResult {
  showBox: boolean;
  showSpinner: boolean;
  animationCompleted: boolean;
  spinItems: Item[];
  scrollPosition: number;
  isSpinning: boolean;
  spinComplete: boolean;
  spinnerRef: React.RefObject<HTMLDivElement>;
  itemsContainerRef: React.RefObject<HTMLDivElement>;
  winningIndex: number | null;
  ITEM_WIDTH: number;
}

export function useSpinnerAnimation({ lootBox, wonItem }: UseSpinnerAnimationProps): SpinnerAnimationResult {
  const [showBox, setShowBox] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);
  const [animationCompleted, setAnimationCompleted] = useState(false);
  const [spinItems, setSpinItems] = useState<Item[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinComplete, setSpinComplete] = useState(false);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  
  const spinnerRef = useRef<HTMLDivElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const targetPosition = useRef<number>(0);
  const animationStarted = useRef<boolean>(false);
  
  const ITEM_WIDTH = 180; // width of each item + margin
  
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

  return {
    showBox,
    showSpinner,
    animationCompleted,
    spinItems,
    scrollPosition,
    isSpinning,
    spinComplete,
    spinnerRef,
    itemsContainerRef,
    winningIndex,
    ITEM_WIDTH
  };
}