type MarkerLabelVariant = 'property' | 'business' | 'amenity';

interface MarkerLabelProps {
  isSelected: boolean;
  isVisible: boolean;
  text: string;
  variant?: MarkerLabelVariant;
  // Color props for custom styling (optional, falls back to variant defaults)
  colorClaro?: string;
  colorMedio?: string;
  colorOscuro?: string;
}

export function MarkerLabel({ 
  isSelected, 
  isVisible, 
  text,
  variant = 'property',
  colorClaro,
  colorMedio,
  colorOscuro
}: MarkerLabelProps) {
  // Variant-specific styling
  const getVariantStyles = () => {
    switch (variant) {
      case 'amenity':
        return {
          backgroundColor: colorOscuro || '#6366f1', // Default indigo for amenities
          textColor: 'white',
        };
      
      case 'business':
      case 'property':
      default:
        return {
          backgroundColor: isSelected ? (colorClaro || '#3b82f6') : (colorMedio || '#60a5fa'),
          textColor: 'white',
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div 
      className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-opacity duration-200 pointer-events-none z-30 ${
        isVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}
      style={{
        backgroundColor: variantStyles.backgroundColor,
        color: variantStyles.textColor,
      }}
    >
      {text}
    </div>
  );
}

export type { MarkerLabelVariant };
