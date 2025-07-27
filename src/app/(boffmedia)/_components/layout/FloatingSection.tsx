import { FloatingBackground } from "./FloatingBackground";

interface FloatingSectionProps {
  children: React.ReactNode;
  variant?: 'default' | 'warm' | 'cool';
  showParticles?: boolean;
  showBlobs?: boolean;
  className?: string;
  mainPage?: boolean;

  style?: React.CSSProperties;
}

export function FloatingSection({ 
  children, 
  variant = 'default',
  showParticles = true,
  showBlobs = true,
  className = "",
  mainPage = false,
  style = {}
}: FloatingSectionProps) {
  return (
    <section className={`${className} ${!mainPage && 'relative'}`} style={style}>
      <FloatingBackground 
        variant={variant}
        showParticles={showParticles}
        showBlobs={showBlobs}
      />
      <div className={`z-10 ${!mainPage && 'relative'}`}>
        {children}
      </div>
    </section>
  );
}