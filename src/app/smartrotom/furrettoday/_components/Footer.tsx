import { InternalLink } from "@/components/nav/Link";

export default function FurretFooter() {
  return (
    <footer className="bg-gradient-to-r from-pink-600 to-pink-400 text-white w-full relative border-t-3 border-black overflow-hidden"
      style={{margin:"0"}}
    >
      {/* Subtle halftone pattern background */}
      <div className="absolute inset-0 ben-day-dots"></div>
      
      <div className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Copyright */}
          <div className="text-center md:text-left">
            <p className="font-bold text-pop-xl pop-shadow">
              &copy; 2024 Furret Today
            </p>
            <p className="mt-2 font-comic text-pop-base">
              ¡Gracias por leernos, sin ti no podríamos CA-MI-NAR!
            </p>
          </div>
          
          {/* Column 2: Quick Links */}
          <div className="text-center">
            <h3 className="text-pop-xl font-bold mb-4 pop-shadow text-yellow-300">Enlaces Rápidos</h3>
            <ul className="space-y-2 font-comic">
              <li>
                <InternalLink 
                  href="furrettoday" 
                  className="hover:text-yellow-300 transition-colors text-pop-base pop-focus"
                >
                  Inicio
                </InternalLink>
              </li>
              <li>
                <InternalLink 
                  href="furrettoday/editar" 
                  className="hover:text-yellow-300 transition-colors text-pop-base pop-focus"
                >
                  Editar Noticias
                </InternalLink>
              </li>
              <li>
                <InternalLink 
                  href="" 
                  className="hover:text-yellow-300 transition-colors text-pop-base pop-focus"
                >
                  Volver a SmartRotom
                </InternalLink>
              </li>
            </ul>
          </div>
          
          {/* Column 3: Fun Quote */}
          <div className="text-center md:text-right">
            <div className="inline-block bg-yellow-300 border-3 border-black p-4 transform rotate-2 card-pop">
              <p className="text-pink-500 font-bold text-pop-base font-comic">
                &quot;¡Las mejores noticias dibujadas a POP-el y tinta!&quot;
              </p>
            </div>
          </div>
        </div>
        
        {/* Comic style zigzag border */}
        <div className="mt-8 pt-6 border-t-2 border-dashed border-yellow-300">
          <p className="text-center text-pop-sm font-comic">
            ¡Gracias por rodar con nosotros! Furret Today, tu portal de noticias.
          </p>
        </div>
      </div>
    </footer>
  );
}