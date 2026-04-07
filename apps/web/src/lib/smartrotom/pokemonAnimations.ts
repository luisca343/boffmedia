/**
 * Animation variants and configurations for Pokemon PC components
 */

export const POKEMON_ANIMATIONS = {
  // Pokemon bounce animation for alive Pokemon
  pokemonBounce: {
    idle: { y: 0, scale: 1 },
    bounce: {
      y: [0, -4, 0],
      transition: {
        duration: 0.4,
        ease: "easeInOut",
        repeat: Infinity
      }
    },
    fainted: {
      scale: 0.9,
      opacity: 0.5,
      filter: "grayscale(1)"
    }
  },

  // Container animations for slots and cards
  slotContainer: {
    idle: { 
      scale: 1,
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
    },
    hover: { 
      scale: 1.02,
      boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
      transition: { duration: 0.2, ease: "easeOut" }
    },
    selected: {
      scale: 1.02,
      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.6), 0 8px 20px rgba(59, 130, 246, 0.2)",
      transition: { duration: 0.2 }
    },
    dragOver: {
      scale: 1.03,
      boxShadow: "0 0 0 2px rgba(34, 197, 94, 0.6), 0 8px 20px rgba(34, 197, 94, 0.2)",
      transition: { duration: 0.2 }
    }
  },

  // Page and section level animations
  pageEntrance: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  },

  sectionEntrance: {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  },

  // Grid and list animations
  gridContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02,
        delayChildren: 0
      }
    }
  },

  gridItem: {
    hidden: { opacity: 0, y: 10, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.2,
        ease: "easeOut"
      }
    }
  },

  // Modal and popup animations
  modalOverlay: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  },

  modalContent: {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 20,
      transition: { duration: 0.2 }
    }
  },

  // Tab animations
  tabVariants: {
    active: {
      scale: 1,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
      transition: { duration: 0.2 }
    },
    inactive: {
      scale: 0.98,
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.2 }
    }
  }
} as const;

/**
 * Separate animation configurations that can be used directly with animate prop
 */
export const POKEMON_ANIMATE_CONFIGS = {
  // Loading animations
  loadingSpinner: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  },

  loadingDots: (delay: number = 0) => ({
    scale: [1, 1.2, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      delay: delay,
      ease: "easeInOut"
    }
  }),

  // Shiny Pokemon effects
  shinyRotation: {
    rotate: [0, 360],
    transition: { duration: 3, repeat: Infinity, ease: "linear" }
  },

  // HP bar animation
  hpBarFill: (hpPercentage: number) => ({
    width: `${Math.max(0, Math.min(100, hpPercentage))}%`,
    transition: { duration: 0.8, ease: "easeOut" }
  }),

  // Pokemon bounce for hover states
  pokemonBounce: {
    y: [0, -4, 0],
    transition: {
      duration: 0.4,
      ease: "easeInOut",
      repeat: Infinity
    }
  },

  // Fainted state
  pokemonFainted: {
    scale: 0.9,
    opacity: 0.5,
    filter: "grayscale(1)"
  }
} as const;

/**
 * Common transition configurations
 */
export const TRANSITIONS = {
  default: { duration: 0.2, ease: "easeOut" },
  slow: { duration: 0.5, ease: "easeInOut" },
  fast: { duration: 0.1, ease: "easeOut" },
  spring: { type: "spring", stiffness: 300, damping: 30 },
  bouncy: { type: "spring", stiffness: 400, damping: 10 }
} as const;

/**
 * Stagger configurations for grid layouts
 */
export const STAGGER_CONFIGS = {
  grid: {
    staggerChildren: 0.02,
    delayChildren: 0
  },
  list: {
    staggerChildren: 0.1,
    delayChildren: 0.1
  },
  fast: {
    staggerChildren: 0.01,
    delayChildren: 0
  }
} as const;
