import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/primitives/tooltip";

interface SharpnessProps {
  sharpness: {
    red: number;
    orange: number;
    yellow: number;
    green: number;
    blue: number;
    white: number;
    purple: number;
  };
}

export function SharpnessBar({ sharpness }: SharpnessProps) {
  const t = useTranslations("mhwilds");
  
  // Define segments in order from lowest to highest
  const sharpnessOrder = ["red", "orange", "yellow", "green", "blue", "white", "purple"];
  
  // Calculate total sharpness
  const totalSharpness = Object.values(sharpness).reduce((acc, val) => acc + val, 0);
  
  // Calculate where the last 50 points start
  const lastFiftyStartPoint = Math.max(0, totalSharpness - 50);
  
  // Create segments with proper positioning and height information
  const segments = [];
  let cumulativeTotal = 0;
  
  // Process in order from lowest to highest sharpness
  for (const key of sharpnessOrder) {
    const value = sharpness[key as keyof typeof sharpness];
    if (value <= 0) continue;
    
    // Calculate where this segment starts and ends in the overall bar
    const segmentStart = cumulativeTotal;
    const segmentEnd = segmentStart + value;
    
    // Determine if any part of this segment is in the last 50 points
    let basePortion = 0;
    let extendedPortion = 0;
    
    if (segmentStart >= lastFiftyStartPoint) {
      // This segment is entirely in the extended portion
      extendedPortion = value;
    } else if (segmentEnd > lastFiftyStartPoint) {
      // This segment straddles the boundary
      basePortion = lastFiftyStartPoint - segmentStart;
      extendedPortion = value - basePortion;
    } else {
      // This segment is entirely in the base portion
      basePortion = value;
    }
    
    segments.push({
      key,
      color: key === "white" ? "bg-surface-100" : `bg-${key}-500`,
      label: t(key),
      value,
      basePortion,
      extendedPortion,
      percentOfTotal: (value / totalSharpness) * 100
    });
    
    cumulativeTotal += value;
  }
  
  return (
    <div className="flex h-3 rounded overflow-hidden">
      {segments.map(segment => (
        <div 
          key={segment.key}
          className="relative" 
          style={{ width: `${segment.percentOfTotal}%` }}
        >
          {/* Base portion (full height) */}
          {segment.basePortion > 0 && (
            <div 
              className={`${segment.color} absolute top-0 left-0 h-3`} 
              style={{ width: `${(segment.basePortion / segment.value) * 100}%` }}
            />
          )}
          
          {/* Extended portion (smaller height) */}
          {segment.extendedPortion > 0 && (
            <div 
              className={`${segment.color} absolute bottom-0 h-1.5`}
              style={{ 
                width: `${(segment.extendedPortion / segment.value) * 100}%`,
                left: segment.basePortion > 0 
                  ? `${(segment.basePortion / segment.value) * 100}%` 
                  : '0'
              }}
            />
          )}
          
          {/* Tooltip trigger covering the entire segment */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute inset-0 opacity-0" />
              </TooltipTrigger>
              <TooltipContent side="top">
                <div>
                  <p>{segment.label}: {segment.value}</p>
                  {segment.extendedPortion > 0 && (
                    <p className="text-xs opacity-80">
                      {t("extended", { count: segment.extendedPortion })}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ))}
    </div>
  );
}