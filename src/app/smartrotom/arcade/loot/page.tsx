"use client";

import StarsBackground from "../_components/StarsBackground";
import LootBoxGame from "./_components/_main/LootBoxGame";
import { ToastContainer } from "react-toastify";
import ArcadeTopBar from "../_components/ArcadeTopBar";
import ArcadeFooter from "../_components/ArcadeFooter";
import "react-toastify/dist/ReactToastify.css";

export default function LootBoxPage() {
  return (
    <div className="min-h-full w-full bg-gradient-to-b from-indigo-950 via-purple-950 to-violet-950 flex flex-col relative overflow-hidden font-mono">
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
      
      {/* Use common ArcadeTopBar component */}
      <ArcadeTopBar 
        title="Poké Cajas & Colección" 
      />

      <main className="flex-grow p-6 overflow-auto container mx-auto max-w-7xl relative z-10">
        {/* Main content */}
        <div className="w-full bg-gray-900/70 rounded-xl border-2 border-indigo-500/30 shadow-xl overflow-hidden p-6 mb-8">
          <LootBoxGame />
        </div>
        
        {/* Use common ArcadeFooter component */}
        <ArcadeFooter 
          title="Poké Cajas v1.0" 
          description="¡Colecciona objetos raros y completa tu colección!" 
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