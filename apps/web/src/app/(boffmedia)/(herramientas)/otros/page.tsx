"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Gift, Key, ChevronRight, ArrowRight, ExternalLink, Plus, Zap, Cpu, Terminal, Sparkles } from "lucide-react";
import { FloatingSection } from "../../_components/layout/FloatingSection";

function getNeonStyle(colorClass: string) {
  if (colorClass.includes("accent"))
    return { glow: "rgba(168,85,247,0.3)", scan: "rgba(192,132,252,0.7)", border: "rgba(168,85,247,0.4)" };
  if (colorClass.includes("secondary"))
    return { glow: "rgba(6,182,212,0.3)", scan: "rgba(34,211,238,0.7)", border: "rgba(6,182,212,0.4)" };
  if (colorClass.includes("highlight"))
    return { glow: "rgba(132,204,22,0.3)", scan: "rgba(163,230,53,0.7)", border: "rgba(132,204,22,0.4)" };
  return { glow: "rgba(249,115,22,0.3)", scan: "rgba(251,146,60,0.7)", border: "rgba(249,115,22,0.4)" };
}

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

function FeaturedCard({ tool }: { tool: typeof TOOLS[number] }) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [scanY, setScanY] = useState(0);

  useEffect(() => {
    if (!isHovered) return;
    let raf: number;
    let start: number | null = null;
    const duration = 1600;
    const animate = (ts: number) => {
      if (!start) start = ts;
      setScanY(((ts - start) % duration) / duration * 100);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isHovered]);

  const neon = getNeonStyle(tool.color);

  return (
    <motion.div
      className="mb-10 cursor-pointer"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      onClick={() => router.push(tool.href)}
    >
      {/* Section label */}
      <div className="flex items-center gap-3 mb-3">
        <div className="h-px flex-1 max-w-12 bg-gradient-to-r from-transparent to-primary-500/40" />
        <span className="text-xs font-mono text-primary-400/70 tracking-[0.4em] uppercase" style={{ fontFamily: "Orbitron, sans-serif" }}>
          // Herramienta destacada
        </span>
        <div className="h-px flex-1 max-w-12 bg-gradient-to-l from-transparent to-primary-500/40" />
      </div>

      <div
        className="relative bg-surface-900/70 border backdrop-blur-md rounded-lg overflow-hidden transition-all duration-500"
        style={{
          borderColor: isHovered ? neon.border : "rgba(51,65,85,0.6)",
          boxShadow: isHovered ? `0 0 50px ${neon.glow}, 0 20px 60px rgba(0,0,0,0.4)` : "0 4px 30px rgba(0,0,0,0.3)",
        }}
      >
        <div className={`h-0.5 bg-gradient-to-r ${tool.color} transition-opacity duration-300`} style={{ opacity: isHovered ? 1 : 0.7 }} />

        {isHovered && (
          <div className="absolute inset-x-0 h-px pointer-events-none z-20" style={{ top: `${scanY}%`, background: `linear-gradient(90deg, transparent, ${neon.scan}, transparent)` }} />
        )}

        {(["absolute top-3 left-3 w-5 h-5 border-t border-l", "absolute top-3 right-3 w-5 h-5 border-t border-r", "absolute bottom-3 left-3 w-5 h-5 border-b border-l", "absolute bottom-3 right-3 w-5 h-5 border-b border-r"] as const).map((cls, i) => (
          <div key={i} className={`${cls} transition-all duration-300 pointer-events-none`} style={{ borderColor: isHovered ? neon.scan : "rgba(100,116,139,0.35)" }} />
        ))}

        <div className="lg:flex">
          <div className="lg:w-2/3 p-7 lg:p-10 relative z-10">
            <div className="flex items-start gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface-950/60 border flex items-center justify-center transition-transform duration-300"
                style={{ borderColor: isHovered ? neon.border : "rgba(51,65,85,0.5)", transform: isHovered ? "scale(1.08)" : "scale(1)" }}
              >
                {tool.icon ? (
                  <Image src={tool.icon} alt={tool.title} width={48} height={48} className="object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : tool.iconFallback}
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-black leading-tight transition-colors duration-300" style={{ fontFamily: "Orbitron, sans-serif", color: isHovered ? "rgb(253,186,116)" : "rgb(248,250,252)" }}>
                  {tool.title}
                </h2>
                <p className="text-xs font-mono text-primary-400/60 tracking-widest uppercase mt-1">// Herramienta destacada</p>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-surface-700/50 to-transparent mb-6" />

            <p className="text-surface-300 text-sm leading-relaxed mb-7">{tool.description}</p>

            <div className="flex flex-wrap gap-2 mb-8">
              {tool.features.map((f) => (
                <span key={f} className="text-xs font-mono px-3 py-1 rounded border border-surface-700/50 bg-surface-950/50 text-surface-300 tracking-wide">{f}</span>
              ))}
            </div>

            <motion.button
              className="flex items-center gap-3 px-6 py-3 rounded-lg border font-mono text-sm font-bold tracking-widest uppercase transition-all duration-300"
              style={{ fontFamily: "Orbitron, sans-serif", borderColor: isHovered ? neon.border : "rgba(249,115,22,0.3)", color: "rgb(251,146,60)", background: isHovered ? "rgba(249,115,22,0.1)" : "rgba(249,115,22,0.05)", boxShadow: isHovered ? `0 0 20px ${neon.glow}` : "none" }}
              animate={{ x: isHovered ? 3 : 0 }}
              transition={{ duration: 0.2 }}
            >
              Acceder <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Decorative right panel (no hero image) */}
          <div className="lg:w-1/3 relative overflow-hidden min-h-[220px] flex items-center justify-center bg-surface-950/30">
            <div className="absolute inset-0 flex items-center justify-center">
              <Gift className="h-32 w-32" style={{ color: neon.scan, opacity: 0.08 }} />
            </div>
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${neon.glow}, transparent)` }} />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-900/80 via-surface-900/30 to-transparent hidden lg:block" />
          </div>
        </div>

        <div className={`h-px bg-gradient-to-r ${tool.color} transition-opacity duration-500`} style={{ opacity: isHovered ? 0.3 : 0 }} />
      </div>
    </motion.div>
  );
}

function ToolCard({ tool, index }: { tool: typeof TOOLS[number]; index: number }) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [scanY, setScanY] = useState(0);

  useEffect(() => {
    if (!isHovered) return;
    let raf: number;
    let start: number | null = null;
    const duration = 1400;
    const animate = (ts: number) => {
      if (!start) start = ts;
      setScanY(((ts - start) % duration) / duration * 100);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isHovered]);

  const neon = getNeonStyle(tool.color);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -6 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="cursor-pointer"
      onClick={() => router.push(tool.href)}
    >
      <div
        className="relative h-full bg-surface-900/60 border backdrop-blur-md rounded-lg overflow-hidden transition-all duration-500 flex flex-col"
        style={{
          borderColor: isHovered ? neon.border : "rgba(51,65,85,0.55)",
          boxShadow: isHovered ? `0 0 40px ${neon.glow}, 0 20px 50px rgba(0,0,0,0.4)` : "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <div className={`h-0.5 bg-gradient-to-r ${tool.color} flex-shrink-0 transition-opacity duration-300`} style={{ opacity: isHovered ? 1 : 0.6 }} />

        {isHovered && (
          <div className="absolute inset-x-0 h-px pointer-events-none z-20" style={{ top: `${scanY}%`, background: `linear-gradient(90deg, transparent, ${neon.scan}, transparent)` }} />
        )}

        {(["absolute top-3 left-3 w-4 h-4 border-t border-l", "absolute top-3 right-3 w-4 h-4 border-t border-r", "absolute bottom-3 left-3 w-4 h-4 border-b border-l", "absolute bottom-3 right-3 w-4 h-4 border-b border-r"] as const).map((cls, i) => (
          <div key={i} className={`${cls} transition-all duration-300 pointer-events-none`} style={{ borderColor: isHovered ? neon.scan : "rgba(100,116,139,0.35)" }} />
        ))}

        <div className="relative z-10 p-6 flex flex-col flex-1">
          <div className="flex items-start gap-4 mb-5">
            <div
              className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-surface-950/60 border flex items-center justify-center transition-transform duration-300"
              style={{ borderColor: isHovered ? neon.border : "rgba(51,65,85,0.5)", transform: isHovered ? "scale(1.08)" : "scale(1)" }}
            >
              {tool.icon ? (
                <Image src={tool.icon} alt={tool.title} width={40} height={40} className="object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : tool.iconFallback}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black leading-tight transition-colors duration-300 truncate" style={{ fontFamily: "Orbitron, sans-serif", color: isHovered ? "rgb(253,186,116)" : "rgb(248,250,252)" }}>
                {tool.title}
              </h3>
              <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{tool.description}</p>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-surface-700/50 to-transparent mb-4" />

          <div className="space-y-1.5 flex-1 mb-5">
            {tool.features.map((f) => (
              <div key={f} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: neon.scan }} />
                <span className="text-xs text-surface-400">{f}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-surface-800/50">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-surface-600" />
              <span className="text-xs font-mono text-surface-600 tracking-widest">{String(tool.features.length).padStart(2, "0")} TOOLS</span>
            </div>
            <motion.span
              className="flex items-center gap-1 text-xs font-mono font-bold tracking-widest uppercase"
              style={{ fontFamily: "Orbitron, sans-serif", color: neon.scan }}
              animate={{ x: isHovered ? 3 : 0 }}
              transition={{ duration: 0.2 }}
            >
              ACCEDER <ChevronRight className="w-3.5 h-3.5" />
            </motion.span>
          </div>
        </div>

        <div className={`h-px bg-gradient-to-r ${tool.color} flex-shrink-0 transition-opacity duration-500`} style={{ opacity: isHovered ? 0.3 : 0 }} />
      </div>
    </motion.div>
  );
}

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

        {/* Other tools + suggestion */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-mono text-surface-500 tracking-[0.35em] uppercase" style={{ fontFamily: "Orbitron, sans-serif" }}>
              // Más herramientas
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-surface-700/50 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {otherTools.map((tool, i) => (
              <ToolCard key={tool.title} tool={tool} index={i} />
            ))}

            {/* Suggestion card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div
                className="relative h-full bg-surface-900/30 border border-dashed border-surface-700/40 rounded-lg flex flex-col items-center justify-center p-8 text-center"
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
