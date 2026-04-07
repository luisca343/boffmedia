interface BoundaryOverlayProps {
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
  heightPercent: number;
  color: string;
  className?: string;
}

export function BoundaryOverlay({ 
  leftPercent, 
  topPercent, 
  widthPercent, 
  heightPercent, 
  color,
  className = "z-10"
}: BoundaryOverlayProps) {
  return (
    <div 
      className={`absolute border-4 border-dashed pointer-events-none ${className}`}
      style={{
        borderColor: color,
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        width: `${widthPercent}%`,
        height: `${heightPercent}%`,
      }}
    />
  );
}
