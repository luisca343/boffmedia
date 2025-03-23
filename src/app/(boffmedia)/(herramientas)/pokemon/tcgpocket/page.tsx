"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
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
import { 
  Search, 
  Users, 
  CreditCard, 
  ChevronRight, 
  SwordIcon, 
  Sparkles,
  ArrowRight,
  Database,
  BookOpen,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TCGPocket() {
  const [username, setUsername] = useState("");
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleViewGallery = () => {
    if (username.trim()) {
      router.push(`/pokemon/tcgpocket/galeria/${username}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && username.trim()) {
      handleViewGallery();
    }
  };

  const menuItems = [
    {
      title: "Ver Galería",
      description: "Explora tu colección de cartas",
      icon: Users,
      href: "/pokemon/tcgpocket/galeria",
      color: "from-amber-400 to-yellow-500",
      bg: "bg-gradient-to-br from-amber-900/20 to-yellow-900/30"
    },
    {
      title: "Lista de Cartas",
      description: "Navega por todas las cartas disponibles",
      icon: CreditCard,
      href: "/pokemon/tcgpocket/cartas",
      color: "from-blue-400 to-cyan-500",
      bg: "bg-gradient-to-br from-blue-900/20 to-cyan-900/30"
    },
    {
      title: "Combates individuales",
      description: "Comprueba los equipos y recompensas",
      icon: SwordIcon,
      href: "/pokemon/tcgpocket/combates",
      color: "from-red-400 to-rose-500",
      bg: "bg-gradient-to-br from-red-900/20 to-rose-900/30"
    },
  ];

  // Featured card packs
  const featuredPacks = [
    { name: "Horizonte Estelar", image: "/img/tcgpocket/packs/stellar-horizon.webp", cards: 182 },
    { name: "Amanecer Dorado", image: "/img/tcgpocket/packs/golden-dawn.webp", cards: 165 },
    { name: "Aventuras Sinnoh", image: "/img/tcgpocket/packs/sinnoh-adventures.webp", cards: 128 }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header with Hero image */}
      <div className="relative rounded-xl overflow-hidden mb-6 h-48 sm:h-64">
        {isMounted && (
          <>
            <Image
              src="/img/tcgpocket/hero.webp"
              alt="Pokémon TCG Pocket"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-900/90 to-surface-900/50"></div>
            <div className="absolute inset-0 flex items-center p-6">
              <div>
                <div className="mb-2">
                  <Image
                    src="/img/games/tcgpocket-icon.webp"
                    alt="TCG Pocket Logo"
                    width={150}
                    height={100}
                    className="object-contain"
                  />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-surface-50 drop-shadow-lg">
                  Herramientas para <span className="text-yellow-400">TCG Pocket</span>
                </h1>
                <p className="text-surface-200 mt-2 max-w-md text-sm sm:text-base">
                  Explora tu colección, consulta todas las cartas y optimiza tus combates
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick search card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-surface-800 border-surface-700 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-400" /> 
              Consulta rápida
            </CardTitle>
            <CardDescription>
              Ingresa un nombre de usuario para ver su galería de cartas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-surface-700 border-surface-600 text-surface-50 focus-visible:ring-primary-500"
              />
              <Button 
                onClick={handleViewGallery} 
                disabled={!username.trim()}
                className="bg-primary-500 hover:bg-primary-600"
              >
                <Search className="mr-2 h-4 w-4" /> Buscar
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <div className="grid gap-6 md:grid-cols-3">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="h-full"
              >
                <Card
                  className={`border-surface-700 hover:border-surface-600 transition-all cursor-pointer h-full flex flex-col overflow-hidden ${item.bg}`}
                  onClick={() => router.push(item.href)}
                >
                  <CardHeader className="pb-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center mb-3 shadow-lg"
                         style={{ backgroundImage: `linear-gradient(to bottom right, var(--${item.color.split('-')[1]}-400), var(--${item.color.split('-')[3]}-500))` }}
                    >
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    {/* Additional content could go here */}
                  </CardContent>
                  <CardFooter className="pt-2 border-t border-surface-700/30">
                    <Button 
                      variant="ghost" 
                      className={`ml-auto p-0 text-${item.color.split('-')[3]}-400 hover:text-${item.color.split('-')[3]}-300`}>
                      Acceder <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
    </div>
  );
}