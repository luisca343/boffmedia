interface ThemeColors {
    bgGradient: string;
    border: string;
    text: string;
    highlight: string;
    buttonGradient: string;
    buttonHover: string;
  }
  
  export function getThemeColors(theme: string): ThemeColors {
    switch (theme.toLowerCase()) {
      case 'blue':
        return {
          bgGradient: 'from-secondary-soft/70 to-indigo-900/70',
          border: 'border-secondary/50',
          text: 'text-secondary-hover',
          highlight: 'text-secondary-hover',
          buttonGradient: 'from-secondary-active to-indigo-600',
          buttonHover: 'hover:from-secondary hover:to-indigo-500'
        };
      case 'green':
        return {
          bgGradient: 'from-warning-soft/70 to-emerald-900/70',
          border: 'border-warning-border/50',
          text: 'text-warning-hover',
          highlight: 'text-warning-hover',
          buttonGradient: 'from-warning to-emerald-600',
          buttonHover: 'hover:from-warning hover:to-emerald-500'
        };
      case 'red':
        return {
          bgGradient: 'from-red-900/70 to-rose-900/70',
          border: 'border-red-500/50',
          text: 'text-red-300',
          highlight: 'text-red-200',
          buttonGradient: 'from-red-600 to-rose-600',
          buttonHover: 'hover:from-red-500 hover:to-rose-500'
        };
      default:
        return {
          bgGradient: 'from-secondary-soft/70 to-violet-900/70',
          border: 'border-secondary/50',
          text: 'text-secondary-hover',
          highlight: 'text-secondary-hover',
          buttonGradient: 'from-secondary-active to-violet-600',
          buttonHover: 'hover:from-secondary hover:to-violet-500'
        };
    }
  }