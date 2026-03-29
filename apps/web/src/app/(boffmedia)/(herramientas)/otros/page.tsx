"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/primitives/card";
import { Button } from "@/components/ui/primitives/button";
import { Badge } from "@/components/ui/primitives/badge";
import { Gift, Ticket, Key, ChevronRight, ArrowRight, ExternalLink, Star, Plus } from "lucide-react";
import { FloatingSection } from "../../_components/layout/FloatingSection";

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

  const externalLinks = [
    { href: "https://steamcommunity.com/", title: "Comunidad de Steam", description: "Foros, guías y más de la comunidad Steam" },
    { href: "https://www.humblebundle.com/", title: "Humble Bundle", description: "Juegos con descuento y paquetes benéficos" },
    { href: "https://boffmedia.com/guias", title: "Guías de BoffMedia", description: "Guías y tutoriales para tus juegos favoritos" },
  ];

  return (
    <FloatingSection>
      <div className="max-w-6xl mx-auto">
        {/* Gaming-style header */}
        <div className="relative rounded-2xl overflow-hidden border border-surface-600/70 shadow-2xl mb-10">
          <div className="absolute inset-0 bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900" />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary-600/[0.07] via-transparent to-accent-600/[0.04]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary-400/70 to-transparent" />
          <div className="relative p-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-surface-50 mb-2">
                Otras{" "}
                <span className="bg-gradient-to-r from-secondary-300 via-secondary-400 to-accent-400 bg-clip-text text-transparent">
                  Herramientas
                </span>
              </h1>
              <p className="text-lg text-surface-300">
                Recursos útiles para gamers y creadores de contenido
              </p>
            </div>
            {isMounted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden md:block flex-shrink-0"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary-400/20 to-accent-400/15 rounded-2xl blur-2xl scale-110" />
                  <Image
                    src="/img/games/other/icon.webp"
                    alt="Otras Herramientas"
                    width={90}
                    height={100}
                    className="object-contain relative z-10 drop-shadow-2xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
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
            className="mb-10"
          >
            <Card className="bg-gradient-to-br from-surface-800/90 to-surface-900/90 border-surface-700/50 overflow-hidden backdrop-blur-sm shadow-xl">
              <div className={`h-1.5 bg-gradient-to-r ${featuredTool.color}`} />
              <div className="md:flex">
                <div className="md:w-2/3 p-6 lg:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-surface-700/50 border border-surface-600/30">
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
                      <h2 className="text-2xl font-bold text-surface-50">{featuredTool.title}</h2>
                      <p className="text-primary-300 text-sm font-medium">Herramienta destacada</p>
                    </div>
                  </div>

                  <p className="text-surface-200 mb-6 leading-relaxed">
                    Crea y gestiona sorteos para tu comunidad o eventos. Una forma fácil y transparente de realizar
                    selecciones aleatorias, establecer reglas de participación y mostrar resultados en tiempo real.
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {featuredTool.features.map(feature => (
                      <Badge key={feature} variant="secondary" className="text-sm py-1 px-3">
                        {feature}
                      </Badge>
                    ))}
                  </div>

                  <Button onClick={() => router.push(featuredTool.href)}>
                    Acceder a Sorteos <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="md:w-1/3 bg-gradient-to-br from-surface-800 to-surface-900 flex items-center justify-center relative overflow-hidden min-h-[200px]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Gift className="h-24 w-24 text-accent-400/20" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-accent-500/10 to-transparent" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        {/* All Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (index * 0.1) }}
            >
              <Card
                className="border-surface-700/50 cursor-pointer h-full flex flex-col overflow-hidden"
                onClick={() => router.push(tool.href)}
              >
                <div className={`h-1.5 bg-gradient-to-r ${tool.color}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-surface-700/50 border border-surface-600/30">
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
                    {tool.features.map(feature => (
                      <Badge key={feature} variant="outline" className="text-[11px]">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="border-t border-surface-700/50 pt-3">
                  <Button variant="ghost" size="sm" className="text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 p-0 ml-auto">
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
            <Card className="border-surface-700/40 border-dashed h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-800/60 border border-surface-700/50 flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-surface-400" />
              </div>
              <h3 className="text-xl font-medium text-surface-200 mb-2">¿Tienes una idea?</h3>
              <p className="text-surface-400 mb-6">
                Sugiere nuevas herramientas que te gustaría ver en nuestra plataforma
              </p>
              <Button
                variant="outline"
                onClick={() => window.open('https://forms.office.com/r/mP1YQkTgp9', '_blank')}
              >
                Enviar sugerencia <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Card>
          </motion.div>
        </div>

        {/* External resources */}
        <div className="mt-16 relative bg-surface-900/70 backdrop-blur-sm rounded-2xl overflow-hidden border border-surface-700/50 shadow-xl">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-secondary-500/60 to-transparent" />
          <div className="p-6 lg:p-8">
            <h3 className="text-[11px] font-bold tracking-[0.18em] uppercase text-surface-300 mb-6 flex items-center gap-3">
              <Star className="h-4 w-4 text-amber-400" />
              Recursos recomendados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {externalLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-surface-800/60 hover:bg-surface-700/50 p-5 rounded-xl transition-all duration-300 flex flex-col justify-between border border-surface-700/40 hover:border-primary-500/25 group"
                >
                  <div>
                    <span className="text-surface-100 font-medium text-base">{link.title}</span>
                    <p className="text-surface-400 text-sm mt-1">{link.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary-400 mt-3 group-hover:translate-x-1 transition-transform duration-300 self-end" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Coming soon */}
        <div className="mt-10 text-center p-8 border border-dashed border-surface-700/60 rounded-2xl bg-surface-900/30">
          <div className="w-16 h-16 rounded-full bg-surface-800/60 border border-surface-700/50 flex items-center justify-center mx-auto mb-4">
            <Plus className="h-7 w-7 text-secondary-400 opacity-75" />
          </div>
          <h3 className="text-2xl font-bold text-surface-100 mb-2">Próximamente más herramientas</h3>
          <p className="text-surface-400 max-w-lg mx-auto">
            Estamos desarrollando nuevas herramientas para la comunidad gamer, incluyendo generadores de torneos,
            comparadores de precios y más recursos útiles.
          </p>
        </div>
      </div>
    </FloatingSection>
  );
}
