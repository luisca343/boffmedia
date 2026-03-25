import { ReactNode } from 'react';

type MarkerBadgeVariant = 'property' | 'business' | 'amenity';
type MarkerBadgeSize = 'small' | 'medium' | 'large';

interface MarkerBadgeProps {
  isSelected: boolean;
  children: ReactNode;
  variant?: MarkerBadgeVariant;
  size?: MarkerBadgeSize;
  // Color props for custom styling (optional, falls back to variant defaults)
  colorClaro?: string;
  colorMedio?: string;
  colorOscuro?: string;
}

export function MarkerBadge({ 
  isSelected, 
  children,
  variant = 'property',
  size = 'medium',
  colorClaro,
  colorMedio,
  colorOscuro
}: MarkerBadgeProps) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-10 h-10'
  };

  const iconSizes = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  // Variant-specific styling
  const getVariantStyles = () => {
    switch (variant) {
      case 'amenity':
        return {
          borderWidth: 'border-2',
          shadow: 'shadow-md',
          hoverScale: 'hover:scale-110',
          selectedScale: 'scale-125',
          backgroundColor: colorOscuro || '#6366f1', // Default indigo
          borderColor: 'white',
          iconColor: 'white',
          selectedOpacity: '',
          unselectedOpacity: 'opacity-80 group-hover:opacity-100',
          boxShadow: isSelected ? `0 0 12px ${(colorOscuro || '#6366f1')}80` : undefined,
        };
      
      case 'business':
      case 'property':
      default:
        return {
          borderWidth: 'border-3',
          shadow: 'shadow-lg',
          hoverScale: 'group-hover:scale-110',
          selectedScale: 'scale-125',
          backgroundColor: isSelected ? (colorClaro || '#3b82f6') : 'white',
          borderColor: isSelected ? (colorOscuro || '#1e40af') : (colorMedio || '#60a5fa'),
          iconColor: isSelected ? (colorOscuro || '#1e40af') : (colorMedio || '#60a5fa'),
          selectedOpacity: '',
          unselectedOpacity: '',
          boxShadow: undefined,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full ${variantStyles.borderWidth} flex items-center justify-center ${variantStyles.shadow} transition-all duration-200 cursor-pointer ${
        isSelected ? variantStyles.selectedScale : variantStyles.hoverScale
      } ${variantStyles.selectedOpacity} ${variantStyles.unselectedOpacity}`}
      style={{
        backgroundColor: variantStyles.backgroundColor,
        borderColor: variantStyles.borderColor,
        boxShadow: variantStyles.boxShadow,
      }}
    >
      <div 
        className={iconSizes[size]}
        style={{ color: variantStyles.iconColor }}
      >
        {children}
      </div>
    </div>
  );
}

export type { MarkerBadgeVariant, MarkerBadgeSize };
