import React from 'react';
import { Sparkles, Users, ChevronDown } from 'lucide-react';
import type { TownData } from '../types';
import Image from 'next/image';

interface HeroSectionProps {
  townName: string;
  townData: TownData;
  onScrollToContent: () => void;
}

export function HeroSection({ townName, townData, onScrollToContent }: HeroSectionProps) {
  const { colorClaro, colorMedio, colorOscuro, frasebonita, descripcion } = townData.textos;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900">
    <div className="absolute inset-0" style={{backgroundColor: `${colorClaro}30`}}/>
      {townData.fondo && (
        <div 
          className="absolute inset-0 opacity-40" 
          style={{ 
            backgroundImage: `url(${townData.fondo})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center', 
            backgroundAttachment: 'fixed' 
          }} 
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-slate-900/40" />
      <div 
        className="absolute inset-0 animate-pulse" 
        style={{ 
          background: `radial-gradient(ellipse at center, ${colorClaro}30 0%, transparent 50%), linear-gradient(135deg, ${colorMedio}20 0%, transparent 70%)` 
        }} 
      />
      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-1/4 -right-32 w-96 h-96 rounded-full opacity-20 animate-pulse" 
          style={{ backgroundColor: colorClaro }} 
        />
        <div 
          className="absolute bottom-1/4 -left-32 w-80 h-80 rounded-full opacity-15 animate-pulse" 
          style={{ backgroundColor: colorMedio, animationDelay: '1s' }} 
        />
        <div 
          className="absolute top-3/4 right-1/4 w-64 h-64 rounded-full opacity-10 animate-pulse" 
          style={{ backgroundColor: colorOscuro, animationDelay: '2s' }} 
        />
      </div>
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="text-center space-y-8 max-w-5xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-8xl font-black text-white capitalize tracking-tight">
              <span className="block">Pueblo</span>
              <span 
                className="block bg-gradient-to-r bg-clip-text text-transparent animate-pulse" 
                style={{ backgroundImage: `linear-gradient(135deg, white 0%, ${colorClaro} 50%, white 100%)` }}
              >
                {townName}
              </span>
            </h1>
            <p 
              className="text-2xl lg:text-4xl font-bold text-white drop-shadow-2xl animate-pulse" 
              style={{ 
                textShadow: `0 0 30px ${colorMedio}80, 0 0 60px ${colorOscuro}40`, 
                animationDelay: '0.8s' 
              }}
            >
              {frasebonita}
            </p>
          </div>
          <p 
            className="text-xl lg:text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed font-light backdrop-blur-sm bg-black/40 rounded-2xl p-8 border" 
            style={{ borderColor: `${colorMedio}30` }}
          >
            {descripcion}
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
            <button 
              className="text-lg px-8 py-4 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 text-white border-2 bg-transparent hover:bg-white/10" 
              style={{ borderColor: colorClaro, color: colorClaro }} 
              onClick={onScrollToContent}
            >
              <Sparkles className="w-6 h-6 mr-3 inline" />
              Explorar Pueblo
            </button>
            <button className="text-lg px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 border-2 transition-all duration-300 hover:scale-105">
              <Users className="w-6 h-6 mr-3 inline" />
              Ver Comunidad
            </button>
          </div>
          <div 
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer" 
            onClick={onScrollToContent}
          >
            <div 
              className="w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center border hover:bg-white/20 transition-colors" 
              style={{ 
                backgroundColor: colorClaro + '30', 
                borderColor: `${colorOscuro}50` 
              }}
            >
              <ChevronDown className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
      {/* SVG wave transition to AmenitiesSection */}
      <div className="absolute left-0 right-0 bottom-0 z-30 pointer-events-none" style={{height: '80px'}}>
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="100%" height="80">
          <path d="M0,40 C480,80 960,0 1440,40 L1440,80 L0,80 Z" fill={colorClaro} />
          <path d="M0,65 C480,75 960,45 1440,65 L1440,80 L0,80 Z" fill={colorMedio} opacity="0.7" />
        </svg>
      </div>
    </div>
  );
}
