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
          bgGradient: 'from-blue-900/70 to-indigo-900/70',
          border: 'border-blue-500/50',
          text: 'text-blue-300',
          highlight: 'text-blue-200',
          buttonGradient: 'from-blue-600 to-indigo-600',
          buttonHover: 'hover:from-blue-500 hover:to-indigo-500'
        };
      case 'green':
        return {
          bgGradient: 'from-green-900/70 to-emerald-900/70',
          border: 'border-green-500/50',
          text: 'text-green-300',
          highlight: 'text-green-200',
          buttonGradient: 'from-green-600 to-emerald-600',
          buttonHover: 'hover:from-green-500 hover:to-emerald-500'
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
          bgGradient: 'from-purple-900/70 to-violet-900/70',
          border: 'border-purple-500/50',
          text: 'text-purple-300',
          highlight: 'text-purple-200',
          buttonGradient: 'from-purple-600 to-violet-600',
          buttonHover: 'hover:from-purple-500 hover:to-violet-500'
        };
    }
  }