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
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-layer-2 to-layer-1 z-0 shadow-xl"></div>
      
      {/* Main cabinet body */}
      <div className="relative z-10 bg-layer-1 border-t-8 border-edge-strong rounded-3xl overflow-hidden">
        {/* Decorative arcade machine lights */}
        <div className="absolute top-0 left-0 right-0 flex justify-between px-3 -mt-[6px] pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className={`h-3 w-3 rounded-full transition-colors duration-100 ${
                lightsOn ? getRandomColor(i, color) : 'bg-layer-3'
              } shadow-lg`}
            ></div>
          ))}
        </div>
        
        {/* Game display screen */}
        <div className={`relative h-36 overflow-hidden ${getScreenBg(color)} border-b-4 border-edge-strong`}>
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
            <div className={`absolute top-3 right-3 ${badge.type === 'new' ? 'bg-emerald-500' : badge.type === 'hot' ? 'bg-orange-500' : 'bg-secondary'} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg ${isHovered ? 'animate-pulse' : ''}`}>
              {badge.text}
            </div>
          )}
          
          {/* Screen reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
        
        {/* Control panel */}
        <div className="relative p-4 pt-5 bg-gradient-to-b from-layer-2 to-layer-1">
          {/* Decorative joystick */}
          <div className="absolute -top-3 left-4 w-6 h-6 bg-black rounded-full border-2 border-edge shadow-inner"></div>
          
          {/* Decorative buttons */}
          <div className="absolute -top-3 right-4 flex space-x-2">
            <div className={`w-4 h-4 rounded-full ${getButtonColor('red', color)}`}></div>
            <div className={`w-4 h-4 rounded-full ${getButtonColor('blue', color)}`}></div>
            <div className={`w-4 h-4 rounded-full ${getButtonColor('green', color)}`}></div>
          </div>
          
          {/* Game title with neon effect */}
          <h3 className={`text-xl font-bold ${getTitleColor(color)} mb-2 ${isHovered ? 'drop-shadow-[0_0_10px_currentColor]' : ''}`}>
            {title}
          </h3>
          
          {/* Game description */}
          <p className="text-white/70 text-sm mb-3 line-clamp-2">
            {description}
          </p>
          
          {/* "Insert coin" message */}
          <div className="mt-auto text-center">
            <span className={`inline-block ${isHovered ? 'animate-blink text-yellow-300' : 'text-ink-muted'} text-xs tracking-widest uppercase`}>
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
    'bg-secondary-hover', 
    'bg-warning-hover',
    'bg-red-400',
    'bg-secondary-hover'
  ];
  
  // Ensure one light always matches the main color
  if (index === 2) {
    switch (mainColor) {
      case 'yellow': return 'bg-yellow-400';
      case 'orange': return 'bg-orange-400';
      case 'pink': return 'bg-pink-400';
      case 'blue': return 'bg-secondary-hover';
      case 'purple': return 'bg-secondary-hover';
      case 'green': return 'bg-warning-hover';
      default: return 'bg-yellow-400';
    }
  }
  
  return colors[index % colors.length];
}

function getButtonColor(type: string, mainColor: string): string {
  if (type === 'red') return 'bg-red-500';
  if (type === 'green') return 'bg-warning';

  // Make the blue button match the main color
  switch (mainColor) {
    case 'yellow': return 'bg-yellow-500';
    case 'orange': return 'bg-orange-500';
    case 'pink': return 'bg-pink-500';
    case 'blue': return 'bg-secondary';
    case 'purple': return 'bg-secondary';
    case 'green': return 'bg-emerald-500';
    default: return 'bg-secondary';
  }
}

// Full literal classes so the Tailwind JIT emits them (interpolated
// `bg-${color}-900/40` fragments are never seen by the compiler).
function getScreenBg(color: string): string {
  switch (color) {
    case 'yellow': return 'bg-yellow-900/40';
    case 'orange': return 'bg-orange-900/40';
    case 'pink': return 'bg-pink-900/40';
    case 'blue': return 'bg-blue-900/40';
    case 'purple': return 'bg-purple-900/40';
    case 'green': return 'bg-green-900/40';
    default: return 'bg-blue-900/40';
  }
}

function getTitleColor(color: string): string {
  switch (color) {
    case 'yellow': return 'text-yellow-300';
    case 'orange': return 'text-orange-300';
    case 'pink': return 'text-pink-300';
    case 'blue': return 'text-blue-300';
    case 'purple': return 'text-purple-300';
    case 'green': return 'text-green-300';
    default: return 'text-blue-300';
  }
}