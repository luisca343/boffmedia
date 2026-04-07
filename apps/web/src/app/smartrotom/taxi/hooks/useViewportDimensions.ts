import { useState, useEffect, RefObject } from 'react';
import { ViewportDimensions } from '../types/map.types';

export const useViewportDimensions = (containerRef: RefObject<HTMLElement | null>): ViewportDimensions => {
  const [dimensions, setDimensions] = useState<ViewportDimensions>({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    // Initial measurement
    updateDimensions();

    // Update on window resize
    window.addEventListener('resize', updateDimensions);
    
    // Use ResizeObserver if available for more precise updates
    let resizeObserver: ResizeObserver | undefined;
    if (window.ResizeObserver && containerRef.current) {
      resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [containerRef]);

  return dimensions;
};
