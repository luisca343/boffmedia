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
import { Search, Gamepad2, ChevronRight, SwordIcon, BarChart, Settings } from "lucide-react";
import Image from "next/image";

export default function ToolsLandingPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  // Handle mounting to avoid hydration issues with video
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const gameTools = [
    {
      title: "Pokemon",
      description: "Calculadoras, generadores y bases de datos",
      icon: "/img/games/pokemon-icon.webp",
      tools: [
        { name: "TCGPocket", count: 3 },
        { name: "Sky Generator", count: 1 },
        { name: "Pokedex", count: 1 },
      ],
      href: "/pokemon",
      color: "from-yellow-400 to-red-500",
    },
  ];

  return (
    <div className="relative min-h-full">
      {/* Background video with overlay */}
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
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-surface-900/75"></div>
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-surface-50">
            Herramientas de <span className="text-primary-400">Gaming</span>
          </h1>
          <p className="text-xl text-surface-200 max-w-2xl mx-auto">
            Maximiza tu experiencia de juego con nuestras herramientas profesionales. 
            Desde builds hasta calculadoras especializadas para tus juegos favoritos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {gameTools.map((game, index) => (
            <motion.div
              key={game.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className="bg-surface-800/90 backdrop-blur-sm border-surface-700 hover:bg-surface-700/90 transition-all cursor-pointer h-full overflow-hidden"
                onClick={() => router.push(game.href)}
              >
                <div className={`h-2 bg-gradient-to-r ${game.color}`}></div>
                <CardHeader className="flex flex-row items-start space-y-0 gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden relative flex-shrink-0">
                    {game.icon ? (
                      <Image 
                        src={game.icon} 
                        alt={game.title} 
                        width={64} 
                        height={64} 
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-700 flex items-center justify-center">
                        <Gamepad2 className="h-8 w-8 text-surface-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl text-surface-50">{game.title}</CardTitle>
                    <CardDescription className="text-surface-300">{game.description}</CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 text-sm mt-2">
                    {game.tools.map(tool => (
                      <div key={tool.name} className="bg-surface-700/50 rounded p-2 text-center">
                        <span className="block text-primary-300 font-medium">{tool.name}</span>
                        <span className="text-xs text-surface-300">{tool.count} {tool.count === 1 ? 'herramienta' : 'herramientas'}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                
                <CardFooter className="border-t border-surface-700 mt-2 pt-4 flex justify-between">
                  <div className="text-xs text-surface-400">
                    <span className="flex items-center">
                      <BarChart className="h-3 w-3 mr-1" />
                      {game.tools.reduce((acc, tool) => acc + tool.count, 0)} herramientas
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary-400 hover:text-primary-300 p-0">
                    Explorar <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-6 text-surface-100">¿No encuentras lo que buscas?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            <Button className="bg-primary-500 hover:bg-primary-600 text-white">
              <Settings className="mr-2 h-4 w-4" /> Solicitar nueva herramienta
            </Button>
            <Button variant="outline" className="border-primary-500 text-primary-500 hover:bg-primary-500/10">
              Ver todos los juegos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}