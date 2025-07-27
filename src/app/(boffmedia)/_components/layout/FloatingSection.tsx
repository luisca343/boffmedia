import { FloatingBackground } from "./FloatingBackground";

interface FloatingSectionProps {
  children: React.ReactNode;
  variant?: 'default' | 'warm' | 'cool' | 'neutral';
  showParticles?: boolean;
  showBlobs?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function FloatingSection({ 
  children, 
  variant = 'default',
  showParticles = true,
  showBlobs = true,
  className = "",
  style = {}
}: FloatingSectionProps) {
  return (
    <section 
      className={`relative overflow-hidden ${className}`} 
      style={style}
    >
      {variant !== 'neutral' && (
        <FloatingBackground 
          variant={variant}
          showParticles={showParticles}
          showBlobs={showBlobs}
        />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
}