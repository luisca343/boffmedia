"use client";

import { RainbowText } from "../_components/RainbowText";
import StarsBackground from "../_components/StarsBackground";
import VoltorbFlipGame from "./_components/VoltorbFlipGame";
import ArcadeFooter from "../_components/ArcadeFooter";
import ArcadeTopBar from "../_components/ArcadeTopBar";
import VoltorbImage from "./_components/VoltorbIcon";
import { ChevronLeft, Joystick, Info, RefreshCw } from "lucide-react";
import { InternalLink } from "@/components/ui/navigation/Link";
import { Button } from "@/components/ui/primitives/button";
import { useState } from "react";

export default function VoltorbFlip() {
  return (
    <div className="min-h-full w-full bg-gradient-to-b from-indigo-950 via-accent-950 to-violet-950 text-white font-mono flex flex-col relative overflow-hidden">
      <StarsBackground />

      <ArcadeTopBar 
        title="Gira Voltorb" 
      />

      <main className="flex-grow p-6 overflow-auto container mx-auto max-w-4xl relative z-10">
        <VoltorbFlipGame/>
        {/* Retro cabinet footer */}
        <ArcadeFooter 
          title="Gira Voltorb" 
          description="¡Consigue los multiplicadores más altos sin encontrar los Voltorbs!" 
        />
      </main>
      
      {/* Add custom styles for animations */}
      <style jsx global>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scanline {
          animation: scanline 2s linear infinite;
        }
        @keyframes text-shine {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .animate-text-shine {
          background-size: 200% auto;
          animation: text-shine 4s linear infinite;
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        .neon-text-yellow {
          text-shadow: 0 0 5px rgba(253, 224, 71, 0.8),
                       0 0 10px rgba(253, 224, 71, 0.5);
        }
      `}</style>
    </div>
  );
}