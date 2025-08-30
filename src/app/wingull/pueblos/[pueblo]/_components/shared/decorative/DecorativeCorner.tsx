interface DecorativeCornerProps {
  color: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'small' | 'medium';
  opacity?: number;
}

export function DecorativeCorner({ 
  color, 
  position, 
  size = 'medium',
  opacity = 70 
}: DecorativeCornerProps) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6'
  };

  const positionClasses = {
    'top-left': 'top-4 left-4 border-l-2 border-t-2 rounded-tl-xl',
    'top-right': 'top-4 right-4 border-r-2 border-t-2 rounded-tr-xl',
    'bottom-left': 'bottom-4 left-4 border-l-2 border-b-2 rounded-bl-xl',
    'bottom-right': 'bottom-4 right-4 border-r-2 border-b-2 rounded-br-xl'
  };

  return (
    <div 
      className={`absolute ${sizeClasses[size]} ${positionClasses[position]} opacity-${opacity} z-20`}
      style={{ borderColor: color }} 
    />
  );
}
