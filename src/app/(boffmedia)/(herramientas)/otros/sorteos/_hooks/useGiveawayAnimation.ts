"use client"

import { useState, useEffect, useRef } from 'react';
import { useAudio } from "@/hooks/useAudio";

export function useGiveawayAnimation(participants: string[], winner: string | null) {
  const [showSpinner, setShowSpinner] = useState(true);
  const [animationCompleted, setAnimationCompleted] = useState(false);
  const [spinItems, setSpinItems] = useState<string[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinComplete, setSpinComplete] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  
  const tickSound = useAudio('/audio/spinner-tick.wav', 0.25);
  const winSound = useAudio('/audio/spinner-win.wav', 0.8);
  
  const spinnerRef = useRef<HTMLDivElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const targetPosition = useRef<number>(0);
  const animationStarted = useRef<boolean>(false);
  const lastTickedItem = useRef<number>(-1);
  const animationPhase = useRef<'fast' | 'slow'>('fast');
  const soundCounter = useRef<number>(0);
  
  const ITEM_WIDTH = 200;
  
  useEffect(() => {
    if (participants.length > 0) {
      const items: string[] = [];
      const totalItems = 300;
      
      const winningPosition = totalItems - 15;
      
      for (let i = 0; i < totalItems; i++) {
        if (i === winningPosition && winner) {
          items.push(winner);
        } else {
          const randomIndex = Math.floor(Math.random() * participants.length);
          items.push(participants[randomIndex]);
        }
      }
      
      setSpinItems(items);
      
      if (winner) {
        setWinnerIndex(winningPosition);
        
        const spinTimer = setTimeout(() => {
          if (!animationStarted.current && spinnerRef.current) {
            animationStarted.current = true;
            setIsSpinning(true);
            
            const containerWidth = spinnerRef.current.offsetWidth;
            const randomOffset = Math.floor(Math.random() * (ITEM_WIDTH * 0.5)) - (ITEM_WIDTH * 0.25);
            const finalPosition = winningPosition * ITEM_WIDTH - (containerWidth / 2) + (ITEM_WIDTH / 2) + randomOffset;
            
            startScrollingAnimation(finalPosition);
          }
        }, 500);
        
        return () => clearTimeout(spinTimer);
      }
    }
  }, [participants, winner]);
  
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
        soundCounter.current = (soundCounter.current + 1) % 5;
        if (soundCounter.current === 0) {
          tickSound.play();
        }
      } 
      else {
        tickSound.play();
      }
      
      lastTickedItem.current = centerItem;
    }
  };
  
  const startScrollingAnimation = (finalPosition: number) => {
    setIsSpinning(true);
    
    const TOTAL_DURATION = 6500;
    const INITIAL_SPEED = 150;
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
        const normalizedProgress = progress / FIRST_PHASE_DURATION;
        const mappedProgress = Math.pow(normalizedProgress, 0.8) * 0.95;
        const speedFactor = INITIAL_SPEED * Math.pow(1 - normalizedProgress, 1.2);
        
        newPosition = mappedProgress * finalPosition + speedFactor;
        if (newPosition > TRANSITION_POINT) {
          newPosition = TRANSITION_POINT;
        }
      } else {
        const finalProgress = (progress - FIRST_PHASE_DURATION) / (1 - FIRST_PHASE_DURATION);
        
        const baseApproach = START_FINAL_PHASE + 
          (FINAL_PHASE_REMAINING * (1 - Math.pow(1 - finalProgress, 3)));
        
        let oscillation = 0;
        if (finalProgress > 0.1 && finalProgress < 0.9) {
          const oscProgress = (finalProgress - 0.1) / 0.8;
          oscillation = Math.sin(oscProgress * 4 * Math.PI) * 4 * Math.pow(1 - oscProgress, 1.5);
        }
        
        newPosition = baseApproach + oscillation;
      }
      
      newPosition = Math.max(newPosition, lastPosition);
      
      if (Math.abs(newPosition - lastPosition) > 0.1) {
        setScrollPosition(newPosition);
        playTickForPosition(newPosition, progress);
        lastPosition = newPosition;
      }
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setScrollPosition(finalPosition);
        setIsSpinning(false);
        setSpinComplete(true);
        
        winSound.play();
        
        setTimeout(() => {
          setAnimationCompleted(true);
        }, 1500);
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
  
  return {
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
}