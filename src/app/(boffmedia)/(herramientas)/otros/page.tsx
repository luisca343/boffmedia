"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Ticket, Key, ChevronRight, ArrowRight, ExternalLink, Star, Plus } from "lucide-react";

export default function OtherTools() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const tools = [
    {
      title: "Sorteos",
      description: "Crea y gestiona sorteos para eventos y comunidades",
      icon: "/img/games/other/raffle.webp",
      iconFallback: <Ticket className="h-8 w-8 text-accent-400" />,
      href: "/sorteo",
      color: "from-accent-400 to-indigo-600",
      features: ["Sorteos aleatorios", "Tickets personalizados", "Resultados en tiempo real"],
      featured: true
    },
    {
      title: "Claves de Steam",
      description: "Gestiona y comparte claves de juegos de Steam",
      icon: "/img/games/other/key.webp",
      iconFallback: <Key className="h-8 w-8 text-secondary-400" />,
      href: "/otros/keys",
      color: "from-secondary-400 to-cyan-600",
      features: ["Biblioteca de claves", "Validador", "Historial de canjes"],
      featured: false
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header section */}
      <div className="mb-10">
        <div className="flex items-center justify-center md:justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-surface-50 mb-2">
              Otras <span className="text-secondary-400">Herramientas</span>
            </h1>
            <p className="text-xl text-surface-300">
              Recursos útiles para gamers y creadores de contenido
            </p>
          </div>
          {isMounted && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="hidden md:block"
            >
              <Image
                src="/img/games/other/icon.webp"
                alt="Otras Herramientas"
                width={90}
                height={100}
                className="object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = document.createElement('div');
                    fallback.className = 'w-[90px] h-[100px] bg-surface-700/40 rounded-lg flex items-center justify-center';
                    fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-secondary-400"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M12 11v6"/><path d="M9 11h6"/></svg>';
                    parent.appendChild(fallback);
                  }
                }}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Featured Tool */}
      {tools.filter(tool => tool.featured).map((featuredTool) => (
        <motion.div 
          key={featuredTool.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <Card className="bg-surface-800/90 border-surface-700 overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${featuredTool.color}`}></div>
            <div className="md:flex">
              <div className="md:w-2/3 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-surface-700/50">
                    {featuredTool.icon ? (
                      <Image 
                        src={featuredTool.icon} 
                        alt={featuredTool.title} 
                        width={48} 
                        height={48} 
                        className="object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && featuredTool.iconFallback) {
                            parent.innerHTML = '<div class="flex items-center justify-center w-full h-full">' + 
                              (typeof featuredTool.iconFallback === 'object' ? '' : featuredTool.iconFallback) + 
                              '</div>';
                          }
                        }}
                      />
                    ) : (
                      featuredTool.iconFallback
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-surface-50">
                      {featuredTool.title}
                    </h2>
                    <p className="text-primary-300 text-sm">Herramienta destacada</p>
                  </div>
                </div>
                
                <p className="text-surface-200 mb-6">
                  Crea y gestiona sorteos para tu comunidad o eventos. Una forma fácil y transparente de realizar 
                  selecciones aleatorias, establecer reglas de participación y mostrar resultados en tiempo real.
                </p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {featuredTool.features.map(feature => (
                    <span key={feature} className="bg-surface-700/50 text-accent-300 text-sm py-1 px-3 rounded-full">
                      {feature}
                    </span>
                  ))}
                </div>
                
                <Button 
                  onClick={() => router.push(featuredTool.href)}
                  className={`bg-gradient-to-r ${featuredTool.color} hover:opacity-90 text-white font-medium px-6`}
                >
                  Acceder a Sorteos <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="md:w-1/3 bg-gradient-to-br from-surface-800 to-surface-900 p-0 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Gift className="h-24 w-24 text-accent-400/30" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-tr from-accent-500/10 to-transparent"></div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}

      {/* All Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool, index) => (
          <motion.div
            key={tool.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (index * 0.1) }}
          >
            <Card 
              className="bg-surface-800 border-surface-700 hover:bg-surface-700/90 transition-all cursor-pointer h-full flex flex-col overflow-hidden"
              onClick={() => router.push(tool.href)}
            >
              <div className={`h-1 bg-gradient-to-r ${tool.color}`}></div>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-surface-700/50">
                    {tool.icon ? (
                      <Image 
                        src={tool.icon} 
                        alt={tool.title} 
                        width={40} 
                        height={40} 
                        className="object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && tool.iconFallback) {
                            parent.innerHTML = '<div class="flex items-center justify-center w-full h-full">' + 
                              (typeof tool.iconFallback === 'object' ? '' : tool.iconFallback) + 
                              '</div>';
                          }
                        }}
                      />
                    ) : (
                      tool.iconFallback
                    )}
                  </div>
                  <CardTitle className="text-xl text-surface-50">{tool.title}</CardTitle>
                </div>
                <CardDescription className="text-surface-300 mt-2">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-grow">
                <div className="flex flex-wrap gap-2 mt-2">
                  {tool.features.map(feature => (
                    <span key={feature} className="bg-surface-700/30 text-surface-300 text-xs py-1 px-2 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </CardContent>
              
              <CardFooter className="border-t border-surface-700 pt-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`text-${tool.color.split('-')[1]}-400 hover:text-${tool.color.split('-')[1]}-300 p-0 ml-auto`}
                >
                  Explorar <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
        
        {/* Suggestion card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-surface-800/50 border-surface-700 border-dashed h-full flex flex-col items-center justify-center p-8 text-center hover:bg-surface-800/70 transition-all">
            <Plus className="h-12 w-12 text-surface-500 mb-4" />
            <h3 className="text-xl font-medium text-surface-200 mb-2">¿Tienes una idea?</h3>
            <p className="text-surface-400 mb-6">
              Sugiere nuevas herramientas que te gustaría ver en nuestra plataforma
            </p>
            <Button 
              variant="outline" 
              className="border-surface-600 text-surface-200"
              onClick={() => window.open('https://forms.office.com/r/mP1YQkTgp9', '_blank')}
            >
              Enviar sugerencia <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </Card>
        </motion.div>
      </div>
      
      {/* Additional resources */}
      <div className="mt-16 bg-surface-800/50 rounded-lg p-6 backdrop-blur-sm">
        <h3 className="text-xl font-medium text-surface-100 mb-4 flex items-center">
          <Star className="mr-2 h-5 w-5 text-amber-400" />
          Recursos recomendados
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a 
            href="https://steamcommunity.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-surface-700/30 hover:bg-surface-700/50 p-4 rounded-md transition-colors flex items-center justify-between"
          >
            <span className="text-surface-100">Comunidad de Steam</span>
            <ArrowRight className="h-4 w-4 text-secondary-400" />
          </a>
          <a 
            href="https://www.humblebundle.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-surface-700/30 hover:bg-surface-700/50 p-4 rounded-md transition-colors flex items-center justify-between"
          >
            <span className="text-surface-100">Humble Bundle</span>
            <ArrowRight className="h-4 w-4 text-secondary-400" />
          </a>
          <a 
            href="https://boffmedia.com/guias" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-surface-700/30 hover:bg-surface-700/50 p-4 rounded-md transition-colors flex items-center justify-between"
          >
            <span className="text-surface-100">Guías de BoffMedia</span>
            <ArrowRight className="h-4 w-4 text-secondary-400" />
          </a>
        </div>
      </div>
      
      {/* Coming soon section */}
      <div className="mt-10 text-center p-8 border border-dashed border-surface-700 rounded-lg bg-surface-800/30">
        <div className="bg-surface-700/20 w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4">
          <Plus className="h-8 w-8 text-secondary-400 opacity-75" />
        </div>
        <h3 className="text-2xl font-bold text-surface-100 mb-2">Próximamente más herramientas</h3>
        <p className="text-surface-300 max-w-lg mx-auto">
          Estamos desarrollando nuevas herramientas para la comunidad gamer, incluyendo generadores de torneos,
          comparadores de precios y más recursos útiles.
        </p>
      </div>
    </div>
  );
}