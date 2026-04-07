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
          bgGradient: 'from-secondary-900/70 to-indigo-900/70',
          border: 'border-secondary-500/50',
          text: 'text-secondary-300',
          highlight: 'text-secondary-200',
          buttonGradient: 'from-secondary-600 to-indigo-600',
          buttonHover: 'hover:from-secondary-500 hover:to-indigo-500'
        };
      case 'green':
        return {
          bgGradient: 'from-highlight-900/70 to-emerald-900/70',
          border: 'border-highlight-500/50',
          text: 'text-highlight-300',
          highlight: 'text-highlight-200',
          buttonGradient: 'from-highlight-600 to-emerald-600',
          buttonHover: 'hover:from-highlight-500 hover:to-emerald-500'
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
          bgGradient: 'from-accent-900/70 to-violet-900/70',
          border: 'border-accent-500/50',
          text: 'text-accent-300',
          highlight: 'text-accent-200',
          buttonGradient: 'from-accent-600 to-violet-600',
          buttonHover: 'hover:from-accent-500 hover:to-violet-500'
        };
    }
  }