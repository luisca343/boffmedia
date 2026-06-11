'use client';

import { useState, useCallback, useEffect } from 'react';

/**
 * Wraps the native Fullscreen API into a simple toggle + reactive state.
 * Falls back to a CSS-only "fullscreen" class on the target element
 * when the API is unavailable (e.g. iframes without permission).
 */
export function useFullscreen<T extends HTMLElement = HTMLDivElement>() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ref, setRef] = useState<T | null>(null);

  const callbackRef = useCallback((node: T | null) => {
    setRef(node);
  }, []);

  useEffect(() => {
    if (!ref) return;

    const onChange = () => {
      setIsFullscreen(document.fullscreenElement === ref);
    };

    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [ref]);

  const enter = useCallback(() => {
    if (!ref) return;
    if (ref.requestFullscreen) {
      ref.requestFullscreen().catch(() => {
        // Fallback: toggle CSS class
        ref.classList.add('bsx-fullscreen-fallback');
        setIsFullscreen(true);
      });
    } else {
      ref.classList.add('bsx-fullscreen-fallback');
      setIsFullscreen(true);
    }
  }, [ref]);

  const exit = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    if (ref) {
      ref.classList.remove('bsx-fullscreen-fallback');
    }
    setIsFullscreen(false);
  }, [ref]);

  const toggle = useCallback(() => {
    if (isFullscreen) exit();
    else enter();
  }, [isFullscreen, enter, exit]);

  return { ref: callbackRef, isFullscreen, enter, exit, toggle } as const;
}
