import { FloatingBackground } from "./FloatingBackground";

interface FloatingSectionProps {
  children: React.ReactNode;
  variant?: 'default' | 'warm' | 'cool';
  showParticles?: boolean;
  showBlobs?: boolean;
  className?: string;
  mainPage?: boolean;
}

export function FloatingSection({ 
  children, 
  variant = 'default',
  showParticles = true,
  showBlobs = true,
  className = "",
  mainPage = false
}: FloatingSectionProps) {
  return (
    <section className={`${className} ${!mainPage && 'relative'}`}>
      {/* Main Content */}
      {/* Floating Background */}
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