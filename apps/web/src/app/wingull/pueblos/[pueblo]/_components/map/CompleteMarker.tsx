import { ComponentType } from 'react';
import { MarkerBadge, MarkerBadgeVariant, MarkerBadgeSize } from './MarkerBadge';
import { MarkerLabel, MarkerLabelVariant } from './MarkerLabel';

interface CompleteMarkerProps {
  isSelected: boolean;
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  variant?: MarkerBadgeVariant & MarkerLabelVariant;
  size?: MarkerBadgeSize;
  showLabel?: boolean;
  // Color props for custom styling (optional, falls back to variant defaults)
  colorClaro?: string;
  colorMedio?: string;
  colorOscuro?: string;
}

export function CompleteMarker({ 
  isSelected, 
  icon: Icon, 
  label,
  variant = 'property',
  size = 'medium',
  showLabel = true,
  colorClaro,
  colorMedio,
  colorOscuro
}: CompleteMarkerProps) {
  return (
    <div className="relative">
      <MarkerBadge
        isSelected={isSelected}
        variant={variant}
        size={size}
        colorClaro={colorClaro}
        colorMedio={colorMedio}
        colorOscuro={colorOscuro}
      >
        <Icon className="w-4 h-4" />
      </MarkerBadge>

      {showLabel && (
        <MarkerLabel
          isSelected={isSelected}
          isVisible={isSelected}
          variant={variant}
          text={label}
          colorClaro={colorClaro}
          colorMedio={colorMedio}
          colorOscuro={colorOscuro}
        />
      )}
    </div>
  );
}
