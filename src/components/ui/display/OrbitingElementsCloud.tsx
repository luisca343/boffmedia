"use client"
import React from "react";

interface OrbitingElement {
  icon: React.ReactNode;
  name: string;
  color: string;
}

interface OrbitingElementsCloudProps {
  centralIcon: React.ReactNode;
  centralBg: string;
  orbitingElements: OrbitingElement[];
  orbitingShape?: "circle"; // for future extension
  ringConfigs: Array<{
    size: string;
    border: string;
    duration: string;
    direction?: "normal" | "reverse";
    colorClass?: string;
  }>;
  particleCount?: number;
  particleColorClass?: string;
  particleSize?: string;
  particleDuration?: string;
  particleDelayStep?: number;
  className?: string;
  radius?: number;
}

export const OrbitingElementsCloud: React.FC<OrbitingElementsCloudProps> = ({
  centralIcon,
  centralBg,
  orbitingElements,
  ringConfigs,
  particleCount = 15,
  particleColorClass = "bg-cyan-400/40",
  particleSize = "w-1.5 h-1.5",
  particleDuration = "5s",
  particleDelayStep = 0.4,
  className = "",
  radius = 180,
}) => {
  return (
    <div className={`relative h-[500px] flex items-center justify-center ${className}`}>
      {/* Central Hub */}
      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 ${centralBg} rounded-full flex items-center justify-center shadow-2xl z-20`}>
        {centralIcon}
      </div>
      {/* Animated rings */}
      {ringConfigs.map((ring, i) => (
        <div
          key={i}
          className={`absolute top-1/2 left-1/2 ${ring.size} ${ring.border} rounded-full animate-spin pointer-events-none ${ring.colorClass || ""}`}
          style={{
            animationDuration: ring.duration,
            animationDirection: ring.direction || "normal",
            transform: "translate(-50%, -50%)",
          }}
        ></div>
      ))}
      {/* Orbiting elements */}
      {orbitingElements.map((element, index) => {
        const angleDeg = index * (360 / orbitingElements.length);
        const angle = (angleDeg * Math.PI) / 180; // radians
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        // Normalize position strings to avoid floating-point formatting differences
        const leftStr = `calc(50% ${x >= 0 ? '+' : '-'} ${Math.abs(Math.round(x))}px)`;
        const topStr = `calc(50% ${y >= 0 ? '+' : '-'} ${Math.abs(Math.round(y))}px)`;

        // Use CSS variables for animation timing to ensure consistent serialization
        const animDelay = `${index * 0.5}s`;
        const animDuration = '4s';

        return (
          <div
            key={element.name}
            className="absolute w-20 h-20 transform -translate-x-1/2 -translate-y-1/2 orbiting-item hover:scale-125 transition-all duration-300 cursor-pointer group z-20 animate-float"
            style={{
              left: leftStr,
              top: topStr,
              ['--anim-delay' as any]: animDelay,
              ['--anim-duration' as any]: animDuration,
            }}
          >
            <div className={`w-full h-full bg-gradient-to-br ${element.color} rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:rotate-12`}>
              {element.icon}
            </div>
            {/* Connecting line */}
            <div
              className="absolute w-0.5 bg-gradient-to-r from-cyan-400/20 to-transparent origin-left opacity-40 group-hover:opacity-80 transition-opacity duration-300"
              style={{
                height: `${radius}px`,
                transform: `rotate(${Math.round((angle + Math.PI) * 180 / Math.PI)}deg)`,
                left: '50%',
                top: '50%',
              }}
            ></div>
            {/* Tooltip */}
            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-30">
              <span className="text-sm text-cyan-400 font-medium bg-surface-900/90 px-3 py-2 rounded-lg shadow-lg border border-cyan-500/20">
                {element.name}
              </span>
            </div>
          </div>
        );
      })}
      {/* Floating particles */}
      {[...Array(particleCount)].map((_, i) => (
        <div
          key={i}
          className={`absolute ${particleSize} ${particleColorClass} rounded-full animate-ping`}
          style={{
            top: `${10 + i * 6}%`,
            left: `${5 + i * 6}%`,
            ['--anim-delay' as any]: `${i * particleDelayStep}s`,
            ['--anim-duration' as any]: particleDuration,
          }}
        ></div>
      ))}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        .animate-float {
          animation-name: float;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          /* default duration and delay can be overridden via CSS vars */
          animation-duration: var(--anim-duration, 4s);
          animation-delay: var(--anim-delay, 0s);
        }
        .orbiting-item {
          animation-duration: var(--anim-duration, 4s);
          animation-delay: var(--anim-delay, 0s);
        }
      `}</style>
    </div>
  );
};
