"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Sword, Shield, Hammer, ChevronRight, ArrowRight, Stars, Axe } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MHWildsPage() {
  
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const mhTools = [
    {
      title: "Planificador de Builds",
      description: "Crea y optimiza tus builds de equipo y armaduras",
      icon: "/img/games/mhwilds/longsword.webp",
      iconFallback: <Shield className="h-8 w-8 text-green-400" />,
      href: "/mhwilds/builds",
      color: "from-green-400 to-emerald-600",
      tools: ["Creador de Sets", "Calculadora de Stats"],
      featured: true
    },
    {
      title: "Árboles de Armas",
      description: "Árboles de progresión y estadísticas de todas las armas",
      icon: "/img/games/mhwilds/chargeblade.webp",
      iconFallback: <Sword className="h-8 w-8 text-blue-400" />,
      href: "/mhwilds/armas",
      color: "from-blue-400 to-indigo-600",
      tools: ["Árboles de Armas", "Comparador"],
      featured: false
    },
    {
      title: "Bestiario",
      description: "Información detallada sobre debilidades y recompensas",
      icon: "/img/games/mhwilds/hammer.webp",
      iconFallback: <Axe className="h-8 w-8 text-red-500" />,
      href: "/mhwilds/monstruos",
      color: "from-red-500 to-rose-600",
      tools: ["Bestario", "Tablas de Materiales"],
      featured: false
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with MH Wilds branding */}
      <div className="mb-10">
        <div className="flex items-center justify-center md:justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-surface-50 mb-2">
              Herramientas de <span className="text-green-400">Monster Hunter Wilds</span>
            </h1>
            <p className="text-xl text-surface-300">
              Optimiza tu caza con nuestras herramientas especializadas
            </p>
          </div>
          {isMounted && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="hidden md:block"
            >
              <Image
                src="/img/games/mhwilds/icon.webp"
                alt="Monster Hunter Wilds"
                width={90}
                height={100}
                className="object-contain"
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Featured Tool */}
      {mhTools.filter(tool => tool.featured).map((featuredTool) => (
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
                  Crea builds óptimas para Monster Hunter Wilds, comparando diferentes combinaciones de armaduras, decoraciones y habilidades para maximizar tu eficiencia de caza.
                </p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {featuredTool.tools.map(tool => (
                    <span key={tool} className="bg-surface-700/50 text-green-300 text-sm py-1 px-3 rounded-full">
                      {tool}
                    </span>
                  ))}
                </div>
                
                <Button 
                  onClick={() => router.push(featuredTool.href)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black font-medium px-6"
                >
                  Acceder al Planificador <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="md:w-1/3 bg-gradient-to-br from-surface-800 to-surface-900 p-0 flex items-center justify-center relative overflow-hidden">
                <Image
                  src="/img/games/mhwilds-gemma.webp"
                  alt="Monster Hunter Wilds Armor"
                  fill
                  className="object-cover z-10"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-green-500/10 to-transparent z-20"></div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}

      {/* All Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mhTools.map((tool, index) => (
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
                  {tool.tools.map(toolName => (
                    <span key={toolName} className="bg-surface-700/30 text-surface-300 text-xs py-1 px-2 rounded">
                      {toolName}
                    </span>
                  ))}
                </div>
              </CardContent>
              
              <CardFooter className="border-t border-surface-700 pt-3">
                <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300 p-0 ml-auto">
                  Explorar <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Additional resources */}
      <div className="mt-16 bg-surface-800/50 rounded-lg p-6 backdrop-blur-sm">
        <h3 className="text-xl font-medium text-surface-100 mb-4 flex items-center">
          <Stars className="mr-2 h-5 w-5 text-green-400" />
          Enlaces externos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a 
            href="https://www.monsterhunter.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-surface-700/30 hover:bg-surface-700/50 p-4 rounded-md transition-colors flex items-center justify-between"
          >
            <span className="text-surface-100">Web Oficial Monster Hunter</span>
            <ArrowRight className="h-4 w-4 text-green-400" />
          </a>
          <a 
            href="https://www.reddit.com/r/MonsterHunter/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-surface-700/30 hover:bg-surface-700/50 p-4 rounded-md transition-colors flex items-center justify-between"
          >
            <span className="text-surface-100">Reddit de Monster Hunter</span>
            <ArrowRight className="h-4 w-4 text-green-400" />
          </a>
          <a 
            href="https://monsterhunter.fandom.com/wiki/Monster_Hunter_Wilds" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-surface-700/30 hover:bg-surface-700/50 p-4 rounded-md transition-colors flex items-center justify-between"
          >
            <span className="text-surface-100">Monster Hunter Wiki</span>
            <ArrowRight className="h-4 w-4 text-green-400" />
          </a>
        </div>
      </div>
      
      {/* Coming soon section */}
      <div className="mt-10 text-center p-8 border border-dashed border-surface-700 rounded-lg bg-surface-800/30">
        <Hammer className="h-12 w-12 mx-auto text-green-400 opacity-75 mb-4" />
        <h3 className="text-2xl font-bold text-surface-100 mb-2">Próximamente más herramientas</h3>
        <p className="text-surface-300 max-w-lg mx-auto">
          Estamos desarrollando nuevas funcionalidades para Monster Hunter Wilds, incluyendo un rastreador de misiones, 
          calculadora de daño y guías de localización de materiales.
        </p>
      </div>
    </div>
  );
}