"use client";

import { InternalLink } from "@/components/ui/navigation/Link";
import { useState, useEffect } from "react";
import { LightbulbIcon } from "lucide-react";

interface ArcadeGameCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: "yellow" | "orange" | "pink" | "blue" | "purple" | "green";
  badge?: {
    text: string;
    type: "new" | "hot" | "featured";
  };
}

export default function ArcadeGameCard({ title, description, href, icon, color, badge }: ArcadeGameCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [lightsOn, setLightsOn] = useState(false);

  // Simulate arcade lights blinking effect
  useEffect(() => {
    if (isHovered) {
      const interval = setInterval(() => {
        setLightsOn(prev => !prev);
      }, 500);
      return () => clearInterval(interval);
    } else {
      setLightsOn(false);
    }
  }, [isHovered]);

  return (
    <InternalLink 
      href={href} 
      className="block relative w-full transition-transform duration-300 hover:scale-[1.02] group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cabinet frame and shadow */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-surface-800 to-surface-900 z-0 shadow-xl"></div>
      
      {/* Main cabinet body */}
      <div className="relative z-10 bg-surface-900 border-t-8 border-surface-800 rounded-3xl overflow-hidden">
        {/* Decorative arcade machine lights */}
        <div className="absolute top-0 left-0 right-0 flex justify-between px-3 -mt-[6px] pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className={`h-3 w-3 rounded-full transition-colors duration-100 ${
                lightsOn ? getRandomColor(i, color) : 'bg-surface-600'
              } shadow-lg`}
            ></div>
          ))}
        </div>
        
        {/* Game display screen */}
        <div className={`relative h-36 overflow-hidden bg-${color}-900/40 border-b-4 border-surface-800`}>
          {/* CRT screen effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>
          <div className="absolute inset-0 bg-[url('/images/scan-lines.png')] opacity-10"></div>
          
          {/* Game preview content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`transform transition-all duration-300 group-hover:scale-110 ${isHovered ? 'animate-float' : ''}`}>
              {icon}
            </div>
          </div>
          
          {/* Badge */}
          {badge && (
            <div className={`absolute top-3 right-3 ${badge.type === 'new' ? 'bg-emerald-500' : badge.type === 'hot' ? 'bg-orange-500' : 'bg-accent-500'} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg ${isHovered ? 'animate-pulse' : ''}`}>
              {badge.text}
            </div>
          )}
          
          {/* Screen reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
        
        {/* Control panel */}
        <div className="relative p-4 pt-5 bg-gradient-to-b from-surface-800 to-surface-900">
          {/* Decorative joystick */}
          <div className="absolute -top-3 left-4 w-6 h-6 bg-black rounded-full border-2 border-surface-700 shadow-inner"></div>
          
          {/* Decorative buttons */}
          <div className="absolute -top-3 right-4 flex space-x-2">
            <div className={`w-4 h-4 rounded-full ${getButtonColor('red', color)}`}></div>
            <div className={`w-4 h-4 rounded-full ${getButtonColor('blue', color)}`}></div>
            <div className={`w-4 h-4 rounded-full ${getButtonColor('green', color)}`}></div>
          </div>
          
          {/* Game title with neon effect */}
          <h3 className={`text-xl font-bold text-${color}-300 mb-2 ${isHovered ? 'neon-text-' + color : ''}`}>
            {title}
          </h3>
          
          {/* Game description */}
          <p className="text-white/70 text-sm mb-3 line-clamp-2">
            {description}
          </p>
          
          {/* "Insert coin" message */}
          <div className="mt-auto text-center">
            <span className={`inline-block ${isHovered ? 'animate-blink text-yellow-300' : 'text-surface-400'} text-xs tracking-widest uppercase`}>
              Insertar moneda para jugar
            </span>
          </div>
        </div>
      </div>
    </InternalLink>
  );
}

// Helper functions for dynamic styling
function getRandomColor(index: number, mainColor: string): string {
  const colors = [
    'bg-yellow-400',
    'bg-secondary-400', 
    'bg-highlight-400',
    'bg-red-400',
    'bg-accent-400'
  ];
  
  // Ensure one light always matches the main color
  if (index === 2) {
    switch (mainColor) {
      case 'yellow': return 'bg-yellow-400';
      case 'orange': return 'bg-orange-400';
      case 'pink': return 'bg-pink-400';
      case 'blue': return 'bg-secondary-400';
      case 'purple': return 'bg-accent-400';
      case 'green': return 'bg-highlight-400';
      default: return 'bg-yellow-400';
    }
  }
  
  return colors[index % colors.length];
}

function getButtonColor(type: string, mainColor: string): string {
  if (type === 'red') return 'bg-red-500';
  if (type === 'green') return 'bg-highlight-500';
  
  // Make the blue button match the main color
  switch (mainColor) {
    case 'yellow': return 'bg-yellow-500';
    case 'orange': return 'bg-orange-500';
    case 'pink': return 'bg-pink-500';
    case 'blue': return 'bg-secondary-500';
    case 'purple': return 'bg-accent-500';
    case 'green': return 'bg-emerald-500';
    default: return 'bg-secondary-500';
  }
}