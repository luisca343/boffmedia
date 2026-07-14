"use client"

import { useState, useEffect, useRef } from 'react';
import { useAudio } from "@/hooks/useAudio";

interface BaseSpinnerConfig<T> {
  items: T[];
  winner: T | null;
  itemWidth?: number;
  soundFrequency?: number;
  completionDelay?: number;
  hasBoxAnimation?: boolean;
  boxAnimationDuration?: number;
  spinStartDelay?: number;
  randomOffsetVariance?: number;
}

interface BaseSpinnerResult<T> {
  showBox?: boolean;
  showSpinner: boolean;
  animationCompleted: boolean;
  spinItems: T[];
  scrollPosition: number;
  isSpinning: boolean;
  spinComplete: boolean;
  winnerIndex: number | null;
  spinnerRef: React.RefObject<HTMLDivElement | null>;
  itemsContainerRef: React.RefObject<HTMLDivElement | null>;
  ITEM_WIDTH: number;
}

export function useBaseSpinnerAnimation<T>({
  items,
  winner,
  itemWidth = 200,
  soundFrequency = 5,
  completionDelay = 1500,
  hasBoxAnimation = false,
  boxAnimationDuration = 1500,
  spinStartDelay = 500,
  randomOffsetVariance = 0.5
}: BaseSpinnerConfig<T>): BaseSpinnerResult<T> {
  const [showBox, setShowBox] = useState(hasBoxAnimation);
  const [showSpinner, setShowSpinner] = useState(!hasBoxAnimation);
  const [animationCompleted, setAnimationCompleted] = useState(false);
  const [spinItems, setSpinItems] = useState<T[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinComplete, setSpinComplete] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  
  const tickSound = useAudio('/assets/audio/spinner-tick.wav', 0.25);
  const winSound = useAudio('/assets/audio/spinner-win.wav', 0.8);
  
  const spinnerRef = useRef<HTMLDivElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const targetPosition = useRef<number>(0);
  const animationStarted = useRef<boolean>(false);
  const lastTickedItem = useRef<number>(-1);
  const animationPhase = useRef<'fast' | 'slow'>('fast');
  const soundCounter = useRef<number>(0);
  
  const ITEM_WIDTH = itemWidth;
  
  useEffect(() => {
    if (items.length > 0) {
      const generatedItems: T[] = [];
      const totalItems = 300;
      
      const winningPosition = totalItems - 15;
      
      for (let i = 0; i < totalItems; i++) {
        if (i === winningPosition && winner) {
          generatedItems.push(winner);
        } else {
          const randomIndex = Math.floor(Math.random() * items.length);
          generatedItems.push(items[randomIndex]);
        }
      }
      
      setSpinItems(generatedItems);
      
      if (winner) {
        setWinnerIndex(winningPosition);
        
        const startAnimation = () => {
          if (!animationStarted.current && spinnerRef.current) {
            animationStarted.current = true;
            setIsSpinning(true);
            
            const containerWidth = spinnerRef.current.offsetWidth;
            const randomOffset = Math.floor(Math.random() * (ITEM_WIDTH * randomOffsetVariance)) - (ITEM_WIDTH * randomOffsetVariance / 2);
            const finalPosition = winningPosition * ITEM_WIDTH - (containerWidth / 2) + (ITEM_WIDTH / 2) + randomOffset;
            
            startScrollingAnimation(finalPosition);
          }
        };
        
        if (hasBoxAnimation) {
          const boxTimer = setTimeout(() => {
            setShowBox(false);
            setShowSpinner(true);
            
            const spinTimer = setTimeout(startAnimation, 100);
            return () => clearTimeout(spinTimer);
          }, boxAnimationDuration);
          
          return () => clearTimeout(boxTimer);
        } else {
          const spinTimer = setTimeout(startAnimation, spinStartDelay);
          return () => clearTimeout(spinTimer);
        }
      }
    }
  }, [items, winner, hasBoxAnimation, boxAnimationDuration, spinStartDelay, ITEM_WIDTH, randomOffsetVariance]);
  
  const playTickForPosition = (position: number, progress: number) => {
    if (!spinnerRef.current) return;
    
    const containerWidth = spinnerRef.current.offsetWidth;
    const centerItem = Math.floor(position / ITEM_WIDTH) + Math.floor(containerWidth / (2 * ITEM_WIDTH));
    
    if (progress < 0.3) {
      animationPhase.current = 'fast';
    } else {
      animationPhase.current = 'slow';
    }
    
    if (centerItem !== lastTickedItem.current) {
      if (animationPhase.current === 'fast') {
        soundCounter.current = (soundCounter.current + 1) % soundFrequency;
        if (soundCounter.current === 0) {
          tickSound.play();
        }
      } else {
        tickSound.play();
      }
      
      lastTickedItem.current = centerItem;
    }
  };
  
const startScrollingAnimation = (finalPosition: number) => {
  setIsSpinning(true);
  
  const TOTAL_DURATION = 8000;
  const FIRST_PHASE_DURATION = 0.3;
  
  targetPosition.current = finalPosition;
  
  const TRANSITION_POINT = 0.95 * finalPosition;
  const START_FINAL_PHASE = TRANSITION_POINT;
  const FINAL_PHASE_REMAINING = finalPosition - START_FINAL_PHASE;
  
  let startTime = 0;
  let lastPosition = 0;
  
  const animate = (timestamp: number) => {
    if (startTime === 0) startTime = timestamp;
    
    const elapsedTime = timestamp - startTime;
    const progress = Math.min(elapsedTime / TOTAL_DURATION, 1);
    
    let newPosition;
    
    if (progress < FIRST_PHASE_DURATION) {
      // First phase: Fast start with gradual deceleration
      const normalizedProgress = progress / FIRST_PHASE_DURATION;
      
      // Use easing function that smoothly accelerates then decelerates
      const easedProgress = 1 - Math.pow(1 - normalizedProgress, 2);
      
      // Calculate position as percentage of transition point
      newPosition = easedProgress * TRANSITION_POINT;
      
    } else {
      // Final phase: Precise landing with subtle oscillation
      const finalProgress = (progress - FIRST_PHASE_DURATION) / (1 - FIRST_PHASE_DURATION);
      
      // Cubic ease out for smooth approach
      const baseApproach = START_FINAL_PHASE + 
        (FINAL_PHASE_REMAINING * (1 - Math.pow(1 - finalProgress, 3)));
      
      // Add subtle oscillation for realistic effect
      let oscillation = 0;
      if (finalProgress > 0.1 && finalProgress < 0.9) {
        const oscProgress = (finalProgress - 0.1) / 0.8;
        oscillation = Math.sin(oscProgress * 4 * Math.PI) * 4 * Math.pow(1 - oscProgress, 1.5);
      }
      
      newPosition = baseApproach + oscillation;
    }
    
    // Ensure we never go backward (this is crucial for preventing the jump)
    newPosition = Math.max(newPosition, lastPosition);
    
    // Only update if position changed significantly
    if (Math.abs(newPosition - lastPosition) > 0.1) {
      setScrollPosition(newPosition);
      playTickForPosition(newPosition, progress);
      lastPosition = newPosition;
    }

    if (itemsContainerRef.current) {
      const blurPx = progress < FIRST_PHASE_DURATION
        ? Math.round((1 - progress / FIRST_PHASE_DURATION) * 3)
        : 0;
      itemsContainerRef.current.style.filter = blurPx > 0 ? `blur(${blurPx}px)` : '';
    }

    // Continue or finish animation
    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setScrollPosition(finalPosition);
      if (itemsContainerRef.current) itemsContainerRef.current.style.filter = '';
      setIsSpinning(false);
      setSpinComplete(true);

      winSound.play();
      
      setTimeout(() => {
        setAnimationCompleted(true);
      }, completionDelay);
    }
  };
  
  if (animationRef.current) {
    cancelAnimationFrame(animationRef.current);
  }
  
  animationRef.current = requestAnimationFrame(animate);
};

  
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []);
  
  const result: BaseSpinnerResult<T> = {
    showSpinner,
    animationCompleted,
    spinItems,
    scrollPosition,
    isSpinning,
    spinComplete,
    winnerIndex,
    spinnerRef,
    itemsContainerRef,
    ITEM_WIDTH
  };

  if (hasBoxAnimation) {
    result.showBox = showBox;
  }
  
  return result;
}