"use client";

import { InternalLink } from "@/components/nav/Link";

interface GameCardProps {
  nombre: string;
  color: string;
  href: string;
  descripcion: string;
  estado?: { tipo: string; icono: any };
  icon: React.ReactNode;
}

export default function GameCard({ 
  nombre, 
  color, 
  href, 
  descripcion, 
  estado, 
  icon 
}: GameCardProps) {
  return (
    <InternalLink
      href={href}
      className={`bg-${color}-900/70 hover:bg-${color}-800/90 border-2 border-${color}-600/50 rounded-md p-3 flex items-center gap-3 group transition-all duration-300 relative overflow-hidden`}
    >
      {/* CRT Scan line effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-20 animate-scanline pointer-events-none"></div>
      
      <div className={`h-12 w-12 bg-${color}-800/60 rounded-md flex items-center justify-center border border-${color}-500/50`}>
        {icon}
      </div>
      
      <div className="flex-grow">
        <span className={`font-bold text-${color}-300 uppercase tracking-wide text-lg block`}>
          {nombre}
        </span>
        <span className="text-gray-400 text-xs">
          {descripcion}
        </span>
      </div>
      
      {estado && (
        <div className={`absolute top-0 right-0 px-2 py-0.5 text-xs font-bold bg-${estado.tipo === 'new' ? 'emerald' : 'orange'}-600 text-white rounded-bl-md`}>
          {estado.tipo === 'new' ? 'NUEVO' : 'HOT'}
        </div>
      )}
    </InternalLink>
  );
}