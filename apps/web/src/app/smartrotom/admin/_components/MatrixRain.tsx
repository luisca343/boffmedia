import { useEffect, useRef } from 'react';

export default function MatrixRain() {
  const matrixRainRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const matrixRain = matrixRainRef.current;
    if (!matrixRain) return;
    
    // Clear any existing columns
    matrixRain.innerHTML = '';
    
    // Binary characters + some special characters for hacker effect
    const chars = "1010101010101010101010101010101010101010101010101010101010101010101010101010101010101010102";
    
    // Create more columns for better coverage
    const columnCount = window.innerWidth < 768 ? 15 : 30;
    
    for (let i = 0; i < columnCount; i++) {
      const column = document.createElement('div');
      column.className = 'matrix-column';
      
      // Random horizontal position
      const left = Math.floor(Math.random() * 100);
      column.style.left = left + '%';
      
      // Random speed (2-7 seconds) - slightly faster
      const duration = 2 + Math.random() * 5;
      column.style.animationDuration = duration + 's';
      
      // Random delay
      const delay = Math.random() * 5;
      column.style.animationDelay = '-' + delay + 's';
      
      // Random font size variation for depth
      const size = 10 + Math.random() * 4;
      column.style.fontSize = `${size}px`;
      
      // Generate random character strings
      let str = '';
      const length = 50 + Math.floor(Math.random() * 50);
      for (let j = 0; j < length; j++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      column.innerHTML = str;
      
      // Add column to the rain
      matrixRain.appendChild(column);
    }
    
    // Clean up function
    return () => {
      if (matrixRain) {
        matrixRain.innerHTML = '';
      }
    };
  }, []);
  
  return <div className="matrix-rain" ref={matrixRainRef}></div>;
}