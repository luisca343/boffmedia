import Image from "next/image";

export default function FurretHeader() {
  return (
    <header className="bg-gradient-to-r from-pink-600 to-pink-400 text-white py-8 px-6 text-center relative overflow-hidden">
      {/* Subtle halftone pattern for depth */}
      <div className="absolute inset-0 ben-day-dots"></div>
      
      {/* Comic style burst shape behind title - more subtle */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[110%] h-[130%] opacity-20">
        <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path d="M400,40 L420,120 L500,90 L470,170 L550,200 L470,230 L500,310 L420,280 L400,360 L380,280 L300,310 L330,230 L250,200 L330,170 L300,90 L380,120 Z" 
                fill="#FFF700" stroke="#000" strokeWidth="2" />
        </svg>
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-6">
        {/* Furret mascot image */}
        <div className="relative w-24 h-24 md:w-32 md:h-32 shrink-0">
          <Image
            src="/smartrotom/img/apps/furrettoday/furret2.png" 
            alt="Furret mascot - News app logo"
            layout="fill"
            className="object-contain"
          />
        </div>
        
        <div className="text-center md:text-left">
          <h1 className="text-pop-4xl md:text-pop-4xl font-bold mb-2 text-yellow-300 pop-shadow-strong">
            Noticiero Furret Today
          </h1>
          <div className="relative">
            <p className="text-pop-lg md:text-pop-xl italic text-white pop-shadow font-comic">
              ¡Las Noticias Pokémon Más POP-ulares!
            </p>
            <div className="absolute -right-4 -top-4 md:-right-8 md:-top-8">
              <span className="inline-block bg-yellow-300 text-pink-600 font-bold text-pop-base px-4 py-2 rounded-2xl border-3 border-black transform rotate-12 pop-shadow">
                ¡EXCLUSIVAS!
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Simplified action lines */}
      <div className="absolute bottom-2 right-2 opacity-40" aria-hidden="true">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <line x1="0" y1="100" x2="30" y2="70" stroke="#FFF" strokeWidth="2" />
          <line x1="15" y1="100" x2="45" y2="70" stroke="#FFF" strokeWidth="2" />
          <line x1="30" y1="100" x2="60" y2="70" stroke="#FFF" strokeWidth="2" />
        </svg>
      </div>
    </header>
  );
}