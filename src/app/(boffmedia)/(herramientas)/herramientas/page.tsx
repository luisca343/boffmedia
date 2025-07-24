"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Gamepad2, ChevronRight, SwordIcon, BarChart, Settings, Zap, Users, Trophy } from "lucide-react";
import Image from "next/image";

export default function ToolsLandingPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Handle mounting to avoid hydration issues with video
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const gameTools = [
    {
      title: "Pokémon",
      description: "Calculadoras, generadores y bases de datos",
      icon: "/img/games/pokemon/icon.webp",
      tools: [
        { name: "TCGPocket", count: 3 },
        { name: "Pokémon Mundo Misterioso", count: 1 },
        { name: "Pokedex", count: 1 },
      ],
      href: "/pokemon",
      color: "from-yellow-400 to-red-500",
      gradient: "bg-gradient-to-br from-yellow-400/20 to-red-500/20",
      borderGlow: "shadow-yellow-500/50",
    },
    {
      title: "Monster Hunter Wilds",
      description: "Planificadores y generadores de builds",
      icon: "/img/games/mhwilds/icon.webp",
      tools: [
        { name: "Builds", count: 1 },
      ],
      href: "/mhwilds",
      color: "from-green-400 to-green-600",
      gradient: "bg-gradient-to-br from-green-400/20 to-green-600/20",
      borderGlow: "shadow-green-500/50",
    },
    {
      title: "Otros",
      description: "Herramientas generales y recursos",
      icon: "/img/games/other/icon.webp",
      tools: [
        { name: "Sorteos", count: 1 },
        { name: "Claves de Steam", count: 1 },
      ],
      href: "/otros",
      color: "from-blue-400 to-blue-600",
      gradient: "bg-gradient-to-br from-blue-400/20 to-blue-600/20",
      borderGlow: "shadow-blue-500/50",
    }
  ];

  const filteredTools = gameTools.filter(game =>
    game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.tools.some(tool => tool.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="relative min-h-screen">
      {/* Background video with enhanced overlay */}
      {isMounted && (
        <div className="fixed inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute w-full h-full object-cover"
          >
            <source src="/uploads/looptest.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          {/* Enhanced overlay with gaming feel */}
          <div className="absolute inset-0 bg-gradient-to-b from-surface-900/80 via-surface-900/85 to-surface-900/90"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/20 to-transparent"></div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="container mx-auto px-4 pt-16 pb-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl sm:text-7xl font-bold mb-6 text-surface-50">
              Herramientas para{" "}
              <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-primary-500 bg-clip-text text-transparent">
                Videojuegos
              </span>
            </h1>
            
            <p className="text-xl text-surface-200 max-w-3xl mx-auto leading-relaxed mb-8">
              Recursos útiles para mejorar tu experiencia de juego. 
              Todo lo que necesitas para tus juegos favoritos, creado por y para la comunidad gaming.
            </p>

            {/* Search Bar */}
            <motion.div 
              className="max-w-md mx-auto mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-surface-400 h-5 w-5" />
                <Input
                  placeholder="Buscar herramientas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-surface-800/50 backdrop-blur-sm border-surface-600 text-surface-100 placeholder-surface-400 focus:border-primary-500 focus:ring-primary-500/50"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Tools Grid */}
        <div className="container mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {filteredTools.map((game, index) => (
              <motion.div
                key={game.title}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="group"
              >
                <Card
                  className={`
                    bg-surface-800/40 backdrop-blur-md border-surface-700/50 
                    hover:bg-surface-700/60 hover:border-surface-600/70
                    transition-all duration-300 cursor-pointer h-full overflow-hidden
                    hover:shadow-2xl ${game.borderGlow} hover:shadow-lg
                  `}
                  onClick={() => router.push(game.href)}
                >
                  {/* Gradient top border */}
                  <div className={`h-1 bg-gradient-to-r ${game.color}`}></div>
                  
                  {/* Subtle background gradient */}
                  <div className={`absolute inset-0 ${game.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  
                  <CardHeader className="relative flex flex-row items-start space-y-0 gap-4 pb-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden relative flex-shrink-0 flex items-center justify-center bg-surface-900/50 backdrop-blur-sm border border-surface-600/30">
                      {game.icon ? (
                        <Image 
                          src={game.icon} 
                          alt={game.title} 
                          width={56}
                          height={56}
                          className="object-contain transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-surface-700 flex items-center justify-center">
                          <Gamepad2 className="h-10 w-10 text-surface-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl text-surface-50 group-hover:text-primary-300 transition-colors duration-300">
                        {game.title}
                      </CardTitle>
                      <CardDescription className="text-surface-300 mt-1">
                        {game.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                                  
                  <CardContent className="relative">
                    <div className="space-y-3">
                      {game.tools.map(tool => (
                        <div key={tool.name} className="bg-surface-900/30 backdrop-blur-sm rounded-lg p-3 border border-surface-700/30">
                          <div className="flex justify-between items-center">
                            <span className="text-primary-300 font-medium">{tool.name}</span>
                            <span className="text-xs text-surface-400 bg-surface-700/50 px-2 py-1 rounded-full">
                              {tool.count} {tool.count === 1 ? 'herramienta' : 'herramientas'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="relative border-t border-surface-700/50 mt-4 pt-4 flex justify-between items-center">
                    <div className="text-xs text-surface-400">
                      <span className="flex items-center">
                        <BarChart className="h-3 w-3 mr-1" />
                        {game.tools.reduce((acc, tool) => acc + tool.count, 0)} herramientas
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary-400 hover:text-primary-300 hover:bg-primary-500/20 p-2 transition-all duration-300"
                    >
                      Explorar <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* No results message */}
          {filteredTools.length === 0 && (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Gamepad2 className="h-12 w-12 text-surface-500 mx-auto mb-4" />
              <p className="text-surface-400 text-lg">No se encontraron herramientas que coincidan con tu búsqueda.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}