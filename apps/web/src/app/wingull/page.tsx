import { MovingSection } from "./_components/MovingSection";
import { BackgroundDecorations } from "./_components/BackgroundDecorations";
import Image from "next/image";
import Footer from "./_components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives/card";
import { Badge } from "@/components/ui/primitives/badge";
import { Clock, Users, MapPin, Sparkles } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col text-white relative">
      <BackgroundDecorations includeGradient={false}/>
      
      {/* Hero Section */}
      <main className="flex-grow container mx-auto px-4 py-8 relative">
        <div className="text-center mb-16 relative text-shadow-border2">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-secondary-hover/20 rounded-lg blur-3xl"></div>
            <Image
              src="/img/win-full.png"
              alt="Logo de Pixelmon Wingull"
              width={350}
              height={175}
              className="relative mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-300"
            />
          </div>
          
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-yellow-300 drop-shadow-lg">
              Bienvenido a Pixelmon Wingull
            </h1>
            <p className="text-xl sm:text-2xl text-secondary-hover mb-8 leading-relaxed">
              ¡Explora la región de Teras y experimenta el choque de eras!
            </p>
            
            {/* Server Status Badge */}
            <div className="flex justify-center mb-8">
              <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500/50 text-yellow-300 px-4 py-2 text-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                Próximamente
              </Badge>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16 text-shadow-border1">
          <div className="group relative bg-secondary-soft/40 backdrop-blur-sm border border-secondary/30 hover:border-yellow-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-400/20 rounded-lg p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary-active/10 to-yellow-400/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-gradient-to-r from-secondary to-secondary-active">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <Badge variant="secondary" className="bg-secondary/20 text-secondary-hover border-secondary/30">
                  El Pasado
                </Badge>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-yellow-300 group-hover:text-yellow-200 transition-colors duration-300 mb-4">
                Fukitsu-Gansolia
              </h3>
              
              <p className="text-secondary-hover text-base sm:text-lg leading-relaxed group-hover:text-secondary-hover transition-colors duration-300 mb-6">
                Sumérgete en los antiguos misterios y legendarias tradiciones de
                Fukitsu-Gansolia. Desvela Pokémon ancestrales y enfrenta desafíos
                épicos forjados en la historia.
              </p>
            </div>
          </div>

          <div className="group relative bg-secondary-soft/40 border border-secondary/30 hover:border-cyan-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-400/20 rounded-lg p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 to-secondary-hover/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-gradient-to-r from-cyan-500 to-secondary">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                  El Futuro
                </Badge>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-yellow-300 group-hover:text-yellow-200 transition-colors duration-300 mb-4">
                Narukami-Akina
              </h3>
              
              <p className="text-secondary-hover text-base sm:text-lg leading-relaxed group-hover:text-secondary-hover transition-colors duration-300 mb-6">
                Abraza la tecnología de vanguardia y los paisajes futuristas de
                Narukami-Akina. Domina la ciencia avanzada en el arte del
                entrenamiento Pokémon y reta a la élite tecnológica en combates
                legendarios.
              </p>
            </div>
          </div>
        </div>

        {/* Server Info Section */}
        <div className="mb-16">
          <div className="relative bg-secondary-soft/60 backdrop-blur-sm border border-yellow-400/50 rounded-lg p-6 shadow-lg">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-yellow-300 mb-2">
                Información del Servidor
              </h2>
              <p className="text-secondary-hover">
                Todo lo que necesitas saber para comenzar tu aventura
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-yellow-300">18</div>
                <div className="text-secondary-hover text-sm font-medium">Pueblos</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-yellow-300">???</div>
                <div className="text-secondary-hover text-sm font-medium">Pokémon Únicos</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-yellow-300">???</div>
                <div className="text-secondary-hover text-sm font-medium">Misiones y Eventos</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-yellow-300">∞</div>
                <div className="text-secondary-hover text-sm font-medium">Aventuras</div>
              </div>
            </div>
          </div>
        </div>

        <MovingSection />
      </main>
      
      <Footer />
    </div>
  );
}