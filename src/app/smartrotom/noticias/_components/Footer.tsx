import { InternalLink } from "@/components/nav/Link";

export default function FurretFooter() {
  return (
    <footer className="bg-gradient-to-r from-pink-600 to-pink-400 text-white w-full relative border-t-8 border-black overflow-hidden"
      style={{margin:"0"}}
    >
      {/* Comic style halftone pattern background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 20 20%22%3E%3Ccircle cx=%222%22 cy=%222%22 r=%222%22 fill=%22%23fff%22 fill-opacity=%220.15%22%2F%3E%3C%2Fsvg%3E')] opacity-50"></div>
      
      <div className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Copyright */}
          <div className="text-center md:text-left">
            <p className="font-bold text-2xl pop-shadow">
              &copy; 2024 Furret Today
            </p>
            <p className="mt-2 font-comic">
              ¡Gracias por leernos, sin ti no podríamos CA-MI-NAR!
            </p>
          </div>
          
          {/* Column 2: Quick Links */}
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4 pop-shadow text-yellow-300">Enlaces Rápidos</h3>
            <ul className="space-y-2 font-comic">
              <li>
                <InternalLink href="noticias" className="hover:text-yellow-300 transition-colors">
                  Inicio
                </InternalLink>
              </li>
              <li>
                <InternalLink href="noticias/editar" className="hover:text-yellow-300 transition-colors">
                  Editar Noticias
                </InternalLink>
              </li>
              <li>
                <InternalLink href="" className="hover:text-yellow-300 transition-colors">
                  Volver a SmartRotom
                </InternalLink>
              </li>
            </ul>
          </div>
          
          {/* Column 3: Fun Quote */}
          <div className="text-center md:text-right">
            <div className="inline-block bg-yellow-300 border-4 border-black p-3 transform rotate-3 shadow-xl">
              <p className="text-pink-500 font-bold text-xl">
                "¡Las mejores noticias dibujadas a POP-el y tinta!"
              </p>
            </div>
          </div>
        </div>
        
        {/* Comic style zigzag border */}
        <div className="mt-6 pt-6 border-t-4 border-dashed border-yellow-300">
          <p className="text-center text-sm font-comic">
            Diseño inspirado en Pop Art y Comics | Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}