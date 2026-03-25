/**
 * Optimized animation configurations for better performance
 */

// Reduced animation variants that focus on essential feedback
export const OPTIMIZED_ANIMATIONS = {
  // Simple slot container without expensive effects
  slotContainer: {
    idle: { 
      scale: 1,
      transition: { duration: 0.1 }
    },
    hover: { 
      scale: 1.01,
      transition: { duration: 0.1, ease: "easeOut" }
    },
    selected: {
      scale: 1.01,
      transition: { duration: 0.1 }
    },
    dragOver: {
      scale: 1.02,
      transition: { duration: 0.1 }
    }
  },

  // Simplified entrance animations
  simpleEntrance: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.15 }
    }
  },

  // Fast grid animation without stagger
  fastGrid: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.2 }
    }
  },

  // Minimal modal animations
  modalSimple: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.15, ease: "easeOut" }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.1 }
    }
  }
} as const;

// Performance-optimized animation configs
export const PERFORMANCE_CONFIGS = {
  // Only animate HP bar fill, not width changes
  hpBarOptimized: {
    transition: { duration: 0.3, ease: "easeOut" }
  },

  // Reduced bounce animation - only on click, not hover
  pokemonBounceOnce: {
    y: [0, -3, 0] as number[],
    transition: {
      duration: 0.3,
      ease: "easeInOut",
      times: [0, 0.5, 1]
    }
  },

  // Simple shiny indicator without rotation
  shinySimple: {
    scale: [1, 1.1, 1] as number[],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  }
} as const;

// Conditional animation helpers
export const CONDITIONAL_ANIMATIONS = {
  // Only apply hover animations if not on mobile
  conditionalHover: (isDesktop: boolean, hoverVariant: any, idleVariant: any) => 
    isDesktop ? hoverVariant : idleVariant,

  // Reduce motion based on user preferences
  respectReducedMotion: (fullAnimation: any, reducedAnimation: any) => {
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      return prefersReducedMotion ? reducedAnimation : fullAnimation;
    }
    return fullAnimation;
  }
} as const;

// Layout animation configurations that don't cause reflows
export const LAYOUT_SAFE_ANIMATIONS = {
  // Use transform instead of changing width/height
  scaleOnly: {
    scale: 1.02,
    transition: { duration: 0.1 }
  },

  // Opacity and transform only
  fadeScale: {
    opacity: 0.8,
    scale: 0.98,
    transition: { duration: 0.1 }
  }
} as const;
