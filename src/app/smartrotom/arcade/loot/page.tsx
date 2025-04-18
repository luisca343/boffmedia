"use client";

import { useState, useEffect } from "react";
import { Package, ArrowLeft } from "lucide-react";
import { InternalLink } from "@/components/nav/Link";
import StarsBackground from "../_components/StarsBackground";
import LootBoxGame from "./_components/LootBoxGame";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LootBoxPage() {
  return (
    <div className="min-h-full w-full bg-gradient-to-b from-indigo-950 via-purple-950 to-violet-950 flex flex-col items-center p-4 relative overflow-auto font-mono">
      <StarsBackground />
      
      {/* Toast container for notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      
      {/* Retro Arcade Cabinet Frame */}
      <div className="absolute inset-x-0 top-0 h-20 bg-indigo-950 border-b-4 border-cyan-400 shadow-lg shadow-cyan-500/20 z-10">
        <div className="h-full flex items-center justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 animate-text-shine px-4 text-center">
            Poké Cajas & Colección
          </h1>
        </div>
        
        {/* Decorative cabinet screws */}
        <div className="absolute left-4 top-4 h-3 w-3 rounded-full bg-gray-400 shadow-inner"></div>
        <div className="absolute right-4 top-4 h-3 w-3 rounded-full bg-gray-400 shadow-inner"></div>
      </div>
      
      {/* Back button */}
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center z-10 pt-24 pb-4 px-4">
        <div className="w-full flex justify-start mb-4">
          <InternalLink
            href="/arcade"
            className="inline-flex items-center gap-2 bg-blue-900/60 hover:bg-blue-800/80 text-cyan-300 px-4 py-2 rounded-lg border border-blue-700/50 transition-colors shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a Arcade</span>
          </InternalLink>
        </div>
        
        {/* Main content */}
        <div className="w-full bg-gray-900/70 rounded-xl border-2 border-indigo-500/30 shadow-xl overflow-hidden p-6 mb-8">
          <LootBoxGame />
        </div>
        
        {/* Retro cabinet footer */}
        <div className="w-full bg-gray-900/70 rounded-lg border border-gray-700 p-4 text-center">
          <p className="text-cyan-400 font-bold mb-1">
            Poké Cajas v1.0 • SmartRotom Experience
          </p>
          <p className="text-gray-400 text-sm">
            ¡Colecciona objetos raros y completa tu colección!
          </p>
          
          {/* Pixel art decoration */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="h-4 w-4 bg-blue-500"></div>
            <div className="h-4 w-4 bg-red-500"></div>
            <div className="h-4 w-4 bg-yellow-500"></div>
            <div className="h-4 w-4 bg-green-500"></div>
            <div className="h-4 w-4 bg-purple-500"></div>
          </div>
        </div>
      </div>
      
      {/* Add custom styles for animations */}
      <style jsx global>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scanline {
          animation: scanline 2s linear infinite;
        }
        .text-shadow-lg {
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
        }
        @keyframes text-shine {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .animate-text-shine {
          background-size: 200% auto;
          animation: text-shine 4s linear infinite;
        }
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shine {
          animation: shine 1.5s infinite;
        }
        @keyframes float-particle {
          0% { transform: translateY(0) translateX(0); opacity: 0.2; }
          50% { transform: translateY(-10px) translateX(5px); opacity: 0.8; }
          100% { transform: translateY(0) translateX(0); opacity: 0.2; }
        }
        .animate-float-particle {
          animation: float-particle 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}