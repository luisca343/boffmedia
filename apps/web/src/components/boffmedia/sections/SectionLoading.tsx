import React from "react";

interface SectionLoadingProps {
  text?: string;
  subtext?: string;
  gradientFrom?: string;
  gradientTo?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SectionLoading({
  text = "Cargando...",
  subtext = "Por favor espera",
  gradientFrom = "from-accent-400",
  gradientTo = "to-secondary-400",
  size = "lg",
}: SectionLoadingProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const innerSizeClasses = {
    sm: 'w-8 h-8 top-1 left-1',
    md: 'w-12 h-12 top-2 left-2',
    lg: 'w-16 h-16 top-2 left-2'
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-900 to-surface-800">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex flex-col items-center justify-center py-32">
          {/* Animated loading spinner */}
          <div className="relative">
            <div className={`${sizeClasses[size]} border-4 border-accent-500/20 rounded-full`}></div>
            <div className={`absolute top-0 left-0 ${sizeClasses[size]} border-4 border-transparent border-t-accent-500 rounded-full animate-spin`}></div>
            <div
              className={`absolute ${innerSizeClasses[size]} border-4 border-transparent border-t-secondary-500 rounded-full animate-spin`}
              style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
            ></div>
          </div>
          <h2 className={`mt-8 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${gradientFrom} ${gradientTo}`}>
            {text}
          </h2>
          <p className="mt-2 text-surface-400">{subtext}</p>
          
          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-accent-400/30 rounded-full animate-ping"
                style={{
                  top: `${20 + (i * 15)}%`,
                  left: `${10 + (i * 15)}%`,
                  animationDelay: `${i * 0.8}s`,
                  animationDuration: '3s'
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
