"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Gift, Key, ChevronRight, ArrowRight, ExternalLink, Plus, Zap, Terminal } from "lucide-react";
import { FloatingSection } from "../../_components/layout/FloatingSection";
import { FeaturedCard } from "./_components/FeaturedCard";
import { ToolsGrid } from "@components/boffmedia/tools/ToolsGrid";

const TOOLS = [
  {
    title: "Sorteos",
    description: "Crea y gestiona sorteos para eventos y comunidades",
    icon: "/img/games/other/raffle.webp",
    iconFallback: <Gift className="h-8 w-8 text-accent-400" />,
    href: "/sorteo",
    color: "from-accent-400 to-indigo-600",
    features: ["Sorteos aleatorios", "Tickets personalizados", "Resultados en tiempo real"],
    featured: true,
  },
  {
    title: "Claves de Steam",
    description: "Gestiona y comparte claves de juegos de Steam",
    icon: "/img/games/other/key.webp",
    iconFallback: <Key className="h-8 w-8 text-secondary-400" />,
    href: "/otros/keys",
    color: "from-secondary-400 to-cyan-600",
    features: ["Biblioteca de claves", "Validador", "Historial de canjes"],
    featured: false,
  },
];

const EXTERNAL_LINKS = [
  { href: "https://steamcommunity.com/", title: "Comunidad de Steam", description: "Foros, guías y más de la comunidad Steam" },
  { href: "https://www.humblebundle.com/", title: "Humble Bundle", description: "Juegos con descuento y paquetes benéficos" },
  { href: "https://boffmedia.com/guias", title: "Guías de BoffMedia", description: "Guías y tutoriales para tus juegos favoritos" },
];

export default function OtherTools() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const featuredTool = TOOLS.find((t) => t.featured)!;
  const otherTools = TOOLS.filter((t) => !t.featured);

  return (
    <FloatingSection>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8">
            <div className="text-center lg:text-left flex-1">
              {/* Breadcrumb */}
              <div className="flex items-center justify-center lg:justify-start gap-1.5 mb-5">
                <span className="text-xs font-mono text-surface-500 tracking-widest uppercase">Herramientas</span>
                <ChevronRight className="w-3 h-3 text-surface-600" />
                <span className="text-xs font-mono text-primary-400 tracking-widest uppercase">Otros</span>
              </div>

              <h1 className="font-black tracking-tight leading-none mb-4" style={{ fontFamily: "Orbitron, sans-serif" }}>
                <span className="block text-lg sm:text-xl text-surface-400 font-medium tracking-[0.25em] mb-2">
                  Otras
                </span>
                <span
                  className="text-4xl sm:text-5xl lg:text-6xl"
                  style={{
                    background: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 40%, #7c3aed 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    filter: "drop-shadow(0 0 25px rgba(139,92,246,0.3))",
                  }}
                >
                  HERRAMIENTAS
                </span>
              </h1>

              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                <div className="h-px w-16 bg-gradient-to-r from-accent-500/60 to-transparent" />
                <Zap className="w-3 h-3 text-accent-400" style={{ filter: "drop-shadow(0 0 6px rgba(168,85,247,0.5))" }} />
              </div>

              <p className="text-surface-400 max-w-xl text-sm leading-relaxed tracking-wide">
                Recursos útiles para gamers y creadores de contenido
              </p>
            </div>

            {isMounted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="flex-shrink-0"
              >
                <div className="relative p-4">
                  <div
                    className="absolute inset-0 rounded-2xl"
                    style={{ background: "radial-gradient(ellipse at center, rgba(139,92,246,0.2) 0%, transparent 70%)", filter: "blur(16px)" }}
                  />
                  <Image
                    src="/img/games/other/icon.webp"
                    alt="Otras Herramientas"
                    width={120}
                    height={120}
                    className="object-contain relative z-10 drop-shadow-2xl"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Featured */}
        <FeaturedCard tool={featuredTool} />

        {/* Other tools */}
        <ToolsGrid tools={otherTools} />

        {/* Suggestion card */}
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div
              className="relative bg-surface-900/30 border border-dashed border-surface-700/40 rounded-lg flex flex-col items-center justify-center p-8 text-center"
              style={{ minHeight: "200px" }}
            >
              <div className="w-12 h-12 rounded-lg bg-surface-900/60 border border-surface-700/40 flex items-center justify-center mb-4">
                <Plus className="h-5 w-5 text-surface-500" />
              </div>
              <h3 className="text-base font-bold text-surface-300 mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
                ¿Tienes una idea?
              </h3>
              <p className="text-surface-500 text-xs mb-5 leading-relaxed max-w-xs">
                Sugiere nuevas herramientas que te gustaría ver en la plataforma
              </p>
              <button
                onClick={() => window.open("https://forms.office.com/r/mP1YQkTgp9", "_blank")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-700/50 bg-surface-900/50 text-surface-300 text-xs font-mono tracking-widest uppercase hover:border-primary-500/40 hover:text-primary-300 transition-all duration-300"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Enviar sugerencia <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* External Resources */}
        <motion.div
          className="mt-4 relative bg-surface-900/50 backdrop-blur-sm rounded-lg overflow-hidden border border-surface-700/40"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-500/50 to-transparent" />
          <div className="p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs font-mono text-primary-400/70 tracking-[0.35em] uppercase" style={{ fontFamily: "Orbitron, sans-serif" }}>
                // Recursos recomendados
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-surface-700/50 to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {EXTERNAL_LINKS.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.07 }}
                  whileHover={{ y: -3 }}
                  className="relative bg-surface-900/50 border border-surface-700/40 hover:border-primary-500/30 rounded-lg p-5 flex flex-col group transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-sm font-bold text-surface-100 group-hover:text-primary-300 transition-colors duration-300 leading-tight">
                      {link.title}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-surface-600 group-hover:text-primary-400 flex-shrink-0 mt-0.5 transition-colors duration-300" />
                  </div>
                  <p className="text-xs text-surface-500 leading-relaxed flex-1">{link.description}</p>
                  <motion.div className="flex justify-end mt-3" whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                    <ArrowRight className="h-3.5 w-3.5 text-surface-600 group-hover:text-primary-400 transition-colors duration-300" />
                  </motion.div>
                </motion.a>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Coming soon */}
        <motion.div
          className="mt-10 text-center p-8 border border-dashed border-surface-700/40 rounded-lg bg-surface-900/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="w-12 h-12 rounded-lg bg-surface-900/60 border border-surface-700/40 flex items-center justify-center mx-auto mb-4">
            <Terminal className="w-5 h-5 text-surface-600" />
          </div>
          <h3
            className="text-lg font-black text-surface-200 mb-2"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Próximamente
          </h3>
          <p className="text-surface-500 text-xs max-w-md mx-auto leading-relaxed">
            Estamos desarrollando nuevas herramientas: generadores de torneos, comparadores de precios y más recursos útiles para la comunidad.
          </p>
        </motion.div>

      </div>
    </FloatingSection>
  );
}
