interface FloatingAccentProps {
  color: string;
  size: 'small' | 'medium' | 'large';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  opacity?: number;
}

export function FloatingAccent({ color, size, position, opacity = 60 }: FloatingAccentProps) {
  const sizeClasses = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-6 h-6'
  };

  const positionClasses = {
    'top-left': '-top-3 -left-3',
    'top-right': '-top-2 -right-4',
    'bottom-left': '-bottom-4 -left-2',
    'bottom-right': '-bottom-3 -right-3'
  };

  return (
    <div 
      className={`absolute ${sizeClasses[size]} ${positionClasses[position]} rounded-full opacity-${opacity}`}
      style={{ backgroundColor: color }}
    />
  );
}
