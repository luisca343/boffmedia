interface OrnamentalDotsProps {
  colorClaro: string;
  colorMedio: string;
  colorOscuro: string;
  size?: 'small' | 'medium' | 'large';
  orientation?: 'horizontal' | 'vertical';
}

export function OrnamentalDots({ 
  colorClaro, 
  colorMedio, 
  colorOscuro, 
  size = 'medium',
  orientation = 'horizontal'
}: OrnamentalDotsProps) {
  const sizeClasses = {
    small: { large: 'w-1.5 h-1.5', medium: 'w-1 h-1', small: 'w-0.5 h-0.5' },
    medium: { large: 'w-2 h-2', medium: 'w-1.5 h-1.5', small: 'w-1 h-1' },
    large: { large: 'w-2.5 h-2.5', medium: 'w-2 h-2', small: 'w-1.5 h-1.5' }
  };

  const containerClass = orientation === 'horizontal' ? 'flex space-x-2' : 'flex flex-col space-y-2';

  return (
    <div className={`${containerClass} items-center justify-center`}>
      <div 
        className={`${sizeClasses[size].small} rounded-full`}
        style={{ backgroundColor: colorClaro }} 
      />
      <div 
        className={`${sizeClasses[size].medium} rounded-full`}
        style={{ backgroundColor: colorMedio }} 
      />
      <div 
        className={`${sizeClasses[size].large} rounded-full`}
        style={{ backgroundColor: colorClaro }} 
      />
      <div 
        className={`${sizeClasses[size].medium} rounded-full`}
        style={{ backgroundColor: colorMedio }} 
      />
      <div 
        className={`${sizeClasses[size].small} rounded-full`}
        style={{ backgroundColor: colorClaro }} 
      />
    </div>
  );
}
