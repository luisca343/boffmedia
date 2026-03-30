
import { GridBackground } from "@/components/ui/display/GridBackground";
import { FloatingBackground } from "./FloatingBackground";

interface FloatingSectionProps {
  children: React.ReactNode;
  variant?: 'default' | 'warm' | 'cool' | 'neutral';
  showParticles?: boolean;
  showBlobs?: boolean;
  showBackground?: boolean;
  showGrid?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function FloatingSection({ 
  children, 
  variant = 'default',
  showParticles = true,
  showBlobs = false,
  showBackground = true,
  showGrid = false,
  className = "",
  style = {}
}: FloatingSectionProps) {
  return (
    <section 
      className={`relative overflow-hidden ${className}`} 
      style={style}
    >
      {(variant !== 'neutral' && showBackground) &&  (
        <FloatingBackground 
          variant={variant}
          showParticles={showParticles}
          showBlobs={showBlobs}
        />
      )}

      {showGrid && <GridBackground/>}


      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
}