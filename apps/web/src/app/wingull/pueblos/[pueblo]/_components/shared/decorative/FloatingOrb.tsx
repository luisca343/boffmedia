interface FloatingOrbProps {
  color: string;
  size: 'small' | 'medium' | 'large';
  position: string;
  opacity?: number;
  animationDelay?: string;
}

export function FloatingOrb({ 
  color, 
  size, 
  position, 
  opacity = 6, 
  animationDelay = '0s' 
}: FloatingOrbProps) {
  const sizeClasses = {
    small: 'w-64 h-64',
    medium: 'w-72 h-72', 
    large: 'w-80 h-80'
  };

  return (
    <div 
      className={`absolute ${sizeClasses[size]} rounded-full animate-pulse opacity-${opacity}`}
      style={{ 
        backgroundColor: color, 
        animationDelay,
        ...getPositionStyles(position)
      }} 
    />
  );
}

function getPositionStyles(position: string) {
  const positions: { [key: string]: React.CSSProperties } = {
    'top-left': { top: '25%', left: '-8rem' },
    'bottom-right': { bottom: '25%', right: '-8rem' },
    'center': { top: '50%', left: '25%' },
  };
  
  return positions[position] || {};
}
