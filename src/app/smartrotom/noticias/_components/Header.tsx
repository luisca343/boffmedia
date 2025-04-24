import Image from "next/image";

export default function FurretHeader() {
  return (
    <header className="bg-gradient-to-r from-pink-600 to-pink-400 text-white p-6 text-center relative overflow-hidden">
      {/* Improved halftone dot pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 20 20%22%3E%3Ccircle cx=%222%22 cy=%222%22 r=%222%22 fill=%22%23fff%22 fill-opacity=%220.5%22%2F%3E%3C%2Fsvg%3E')] opacity-60"></div>
      
      {/* Comic style burst shape behind title */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[150%]">
        <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
          <path d="M400,20 L430,100 L520,70 L480,150 L570,180 L480,210 L520,290 L430,260 L400,340 L370,260 L280,290 L320,210 L230,180 L320,150 L280,70 L370,100 Z" 
                fill="#FFF700" stroke="#000" strokeWidth="3" opacity="0.2" />
        </svg>
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-4">
        {/* Add Furret mascot image */}
        <div className="relative w-24 h-24 md:w-32 md:h-32 shrink-0">
          <Image
            src="/smartrotom/img/apps/noticias/furret2.png" 
            alt="Furret mascot"
            layout="fill"
            className="object-contain"
          />
        </div>
        
        <div>
          <h1 className="text-6xl md:text-8xl font-bold mb-2 text-yellow-300 pop-shadow animate-pulse">
            Noticiero Furret Today
          </h1>
          <div className="relative">
            <p className="text-xl md:text-2xl italic text-white pop-shadow">
              ¡Las Noticias Pokémon Más POP-ulares!
            </p>
            <div className="absolute -right-8 -top-8">
              <span className="inline-block bg-yellow-300 text-pink-600 font-bold text-xl px-4 py-1 rounded-full border-4 border-black transform rotate-12 pop-shadow">
                ¡EXCLUSIVAS!
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Comic style action lines */}
      <div className="absolute bottom-0 right-0">
        <svg width="150" height="150" viewBox="0 0 150 150">
          <line x1="0" y1="150" x2="50" y2="100" stroke="#FFF" strokeWidth="3" />
          <line x1="20" y1="150" x2="70" y2="100" stroke="#FFF" strokeWidth="3" />
          <line x1="40" y1="150" x2="90" y2="100" stroke="#FFF" strokeWidth="3" />
          <line x1="60" y1="150" x2="110" y2="100" stroke="#FFF" strokeWidth="3" />
        </svg>
      </div>
    </header>
  );
}