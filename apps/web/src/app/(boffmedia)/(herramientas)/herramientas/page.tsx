"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Gamepad2, ChevronRight, Zap, Cpu, Terminal } from "lucide-react";
import Image from "next/image";

const GAME_TOOLS = [
  {
    id: "pokemon",
    title: "Pokémon",
    description: "Calculadoras, generadores y bases de datos",
    icon: "/img/games/pokemon/icon.webp",
    tools: [
      { name: "TCGPocket", count: 3 },
      { name: "Pokémon Mundo Misterioso", count: 1 },
      { name: "Pokedex", count: 1 },
    ],
    href: "/pokemon",
    tag: "ESTRATEGIA",
    topBar: "from-yellow-400 via-primary-500 to-red-500",
    border: "border-primary-500/30",
    hoverBorder: "hover:border-primary-500/70",
    bgHover: "from-yellow-400/10 via-primary-500/5 to-red-500/10",
    accent: "text-primary-400",
    dotBg: "bg-primary-400",
    countBorder: "border-primary-700/50",
    countText: "text-primary-400",
    scanLine: "rgba(251,146,60,0.7)",
    glowColor: "rgba(249,115,22,0.25)",
  },
  {
    id: "mhwilds",
    title: "Monster Hunter Wilds",
    description: "Planificadores y generadores de builds",
    icon: "/img/games/mhwilds/icon.webp",
    tools: [
      { name: "Builds", count: 1 },
    ],
    href: "/mhwilds",
    tag: "ACCIÓN RPG",
    topBar: "from-highlight-400 via-highlight-500 to-highlight-600",
    border: "border-highlight-500/30",
    hoverBorder: "hover:border-highlight-500/70",
    bgHover: "from-highlight-400/10 via-highlight-500/5 to-highlight-600/10",
    accent: "text-highlight-400",
    dotBg: "bg-highlight-400",
    countBorder: "border-highlight-700/50",
    countText: "text-highlight-400",
    scanLine: "rgba(163,230,53,0.7)",
    glowColor: "rgba(132,204,22,0.25)",
  },
  {
    id: "otros",
    title: "Otros",
    description: "Herramientas generales y recursos",
    icon: "/img/games/other/icon.webp",
    tools: [
      { name: "Sorteos", count: 1 },
      { name: "Claves de Steam", count: 1 },
    ],
    href: "/otros",
    tag: "UTILIDADES",
    topBar: "from-secondary-400 via-secondary-500 to-secondary-600",
    border: "border-secondary-500/30",
    hoverBorder: "hover:border-secondary-500/70",
    bgHover: "from-secondary-400/10 via-secondary-500/5 to-secondary-600/10",
    accent: "text-secondary-400",
    dotBg: "bg-secondary-400",
    countBorder: "border-secondary-700/50",
    countText: "text-secondary-400",
    scanLine: "rgba(34,211,238,0.7)",
    glowColor: "rgba(6,182,212,0.25)",
  },
];

function GameCard({ game, index }: { game: typeof GAME_TOOLS[number]; index: number }) {
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
      const elapsed = (ts - start) % duration;
      setScanY((elapsed / duration) * 100);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isHovered]);

  const totalCount = game.tools.reduce((a, t) => a + t.count, 0);

  return (
    <motion.div
      key={game.id}
      layout
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ delay: index * 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group cursor-pointer"
      onClick={() => router.push(game.href)}
    >
      <div
        className={`relative h-full border backdrop-blur-md rounded-lg overflow-hidden transition-all duration-500`}
        style={{
          background: isHovered
            ? "linear-gradient(145deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))"
            : "linear-gradient(145deg, rgba(30,41,59,0.85), rgba(15,23,42,0.90))",
          borderColor: isHovered ? game.scanLine.replace("0.7", "0.5") : "rgba(71,85,105,0.65)",
          boxShadow: isHovered
            ? `0 0 45px ${game.glowColor}, 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`
            : `0 6px 28px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px rgba(255,255,255,0.02)`,
        }}
      >
        {/* Top neon bar — thicker and always visible */}
        <div
          className={`h-[3px] bg-gradient-to-r ${game.topBar} transition-all duration-300`}
          style={{
            opacity: isHovered ? 1 : 0.8,
            boxShadow: isHovered ? `0 0 12px ${game.glowColor}` : "none",
          }}
        />

        {/* Ambient inner tint — always on */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${game.glowColor.replace("0.25", "0.18")} 0%, transparent 65%)`,
            opacity: isHovered ? 1 : 0.65,
          }}
        />

        {/* Animated scan line */}
        {isHovered && (
          <div
            className="absolute inset-x-0 h-px pointer-events-none z-20 transition-none"
            style={{
              top: `${scanY}%`,
              background: `linear-gradient(90deg, transparent, ${game.scanLine}, transparent)`,
            }}
          />
        )}

        {/* Background glow on hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${game.bgHover} transition-opacity duration-500 pointer-events-none`}
          style={{ opacity: isHovered ? 1 : 0 }}
        />

        {/* Corner brackets — always visible */}
        <div
          className="absolute top-3 left-3 w-4 h-4 border-t border-l transition-all duration-300 pointer-events-none"
          style={{ borderColor: isHovered ? game.scanLine : "rgba(100,116,139,0.55)" }}
        />
        <div
          className="absolute top-3 right-3 w-4 h-4 border-t border-r transition-all duration-300 pointer-events-none"
          style={{ borderColor: isHovered ? game.scanLine : "rgba(100,116,139,0.55)" }}
        />
        <div
          className="absolute bottom-3 left-3 w-4 h-4 border-b border-l transition-all duration-300 pointer-events-none"
          style={{ borderColor: isHovered ? game.scanLine : "rgba(100,116,139,0.55)" }}
        />
        <div
          className="absolute bottom-3 right-3 w-4 h-4 border-b border-r transition-all duration-300 pointer-events-none"
          style={{ borderColor: isHovered ? game.scanLine : "rgba(100,116,139,0.55)" }}
        />

        {/* Content */}
        <div className="relative z-10 p-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            {/* Game icon */}
            <div
              className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border ${game.border} bg-surface-950/60 flex items-center justify-center transition-transform duration-300`}
              style={{ transform: isHovered ? "scale(1.08)" : "scale(1)" }}
            >
              {game.icon ? (
                <Image src={game.icon} alt={game.title} width={48} height={48} className="object-contain" />
              ) : (
                <Gamepad2 className="w-8 h-8 text-surface-500" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span className={`text-xs font-mono tracking-[0.3em] ${game.accent} opacity-60 uppercase`}>
                // {game.tag}
              </span>
              <h3
                className={`text-xl font-black text-surface-50 leading-tight mt-0.5 transition-colors duration-300 ${isHovered ? game.accent : ""}`}
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                {game.title}
              </h3>
              <p className="text-xs text-surface-500 mt-1">{game.description}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-surface-700/50 to-transparent mb-4" />

          {/* Tool list */}
          <div className="space-y-2 flex-1 mb-5">
            {game.tools.map((tool) => (
              <div key={tool.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${game.dotBg} opacity-70 flex-shrink-0`} />
                  <span className="text-sm text-surface-300">{tool.name}</span>
                </div>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded border ${game.countBorder} bg-surface-950/50 ${game.countText}`}
                >
                  {String(tool.count).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-surface-800/50">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-surface-600" />
              <span className="text-xs font-mono text-surface-600 tracking-widest">
                {String(totalCount).padStart(2, "0")} TOOLS
              </span>
            </div>
            <motion.span
              className={`flex items-center gap-1 text-xs font-mono font-bold tracking-widest ${game.accent} uppercase`}
              style={{ fontFamily: "Orbitron, sans-serif" }}
              animate={{ x: isHovered ? 3 : 0 }}
              transition={{ duration: 0.2 }}
            >
              ACCEDER
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.span>
          </div>
        </div>

        {/* Bottom glow line */}
        <div
          className={`h-px bg-gradient-to-r ${game.topBar} transition-opacity duration-500`}
          style={{ opacity: isHovered ? 0.5 : 0.2 }}
        />
      </div>
    </motion.div>
  );
}

export default function ToolsLandingPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredTools = GAME_TOOLS.filter(
    (game) =>
      game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.tools.some((tool) =>
        tool.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const totalTools = GAME_TOOLS.reduce(
    (acc, game) => acc + game.tools.reduce((a, t) => a + t.count, 0),
    0
  );
  const totalCategories = GAME_TOOLS.reduce((acc, g) => acc + g.tools.length, 0);

  return (
    <div className="relative min-h-screen bg-surface-950">
      {/* ── Video + overlays ───────────────────────────────── */}
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
          </video>

          {/* Dark gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-surface-950/60 via-surface-950/75 to-surface-950/90" />

          {/* Scanlines */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)",
            }}
          />
        </div>
      )}

      {/* ── Content ───────────────────────────────────────── */}
      <div className="relative z-10">
        {/* Hero */}
        <div className="container mx-auto px-4 pt-6 pb-12">

          {/* Main title */}
          <motion.div
            className="text-center mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <p
              className="text-sm tracking-[0.6em] text-surface-400 uppercase mb-4"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Herramientas para
            </p>
            <h1
              className="text-6xl sm:text-8xl font-black leading-none tracking-tight"
              style={{
                fontFamily: "Orbitron, sans-serif",
                background: "linear-gradient(135deg, #fde68a 0%, #fb923c 40%, #f97316 70%, #ea580c 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 40px rgba(249,115,22,0.35))",
              }}
            >
              VIDEOJUEGOS
            </h1>
          </motion.div>

          {/* Accent divider */}
          <motion.div
            className="flex items-center justify-center gap-4 mb-8"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.45 }}
          >
            <div className="h-px flex-1 max-w-36 bg-gradient-to-r from-transparent to-primary-500/40" />
            <Zap className="w-4 h-4 text-primary-400" style={{ filter: "drop-shadow(0 0 8px rgba(249,115,22,0.6))" }} />
            <div className="h-px flex-1 max-w-36 bg-gradient-to-l from-transparent to-primary-500/40" />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            className="text-center text-surface-400 max-w-xl mx-auto text-sm leading-relaxed mb-12 tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.6 }}
          >
            Recursos útiles para mejorar tu experiencia de juego.
            Todo lo que necesitas, creado por y para la comunidad gaming.
          </motion.p>

          {/* Stats */}
          <motion.div
            className="flex justify-center gap-10 sm:gap-16 mb-12"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
          >
            {[
              { label: "Juegos", value: GAME_TOOLS.length },
              { label: "Herramientas", value: totalTools },
              { label: "Categorías", value: totalCategories },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.08 }}
              >
                <div
                  className="text-3xl font-black text-primary-400 leading-none"
                  style={{
                    fontFamily: "Orbitron, sans-serif",
                    textShadow: "0 0 20px rgba(249,115,22,0.4)",
                  }}
                >
                  {String(stat.value).padStart(2, "0")}
                </div>
                <div className="text-xs text-surface-500 tracking-widest uppercase mt-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Search */}
          <motion.div
            className="max-w-lg mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.5 }}
          >
            <div className="relative">
              {/* Glow behind input */}
              <div
                className="absolute -inset-0.5 rounded-lg transition-opacity duration-500 pointer-events-none"
                style={{
                  background: "linear-gradient(90deg, rgba(249,115,22,0.3), rgba(251,146,60,0.15), rgba(249,115,22,0.3))",
                  filter: "blur(6px)",
                  opacity: searchFocused ? 1 : 0,
                }}
              />
              <div
                className="relative flex items-center bg-surface-900/80 border rounded-lg transition-all duration-300 backdrop-blur-sm overflow-hidden"
                style={{
                  borderColor: searchFocused
                    ? "rgba(249,115,22,0.55)"
                    : "rgba(51,65,85,0.7)",
                }}
              >
                {/* Left accent bar */}
                <div
                  className="absolute left-0 inset-y-0 w-0.5 transition-opacity duration-300"
                  style={{
                    background: "linear-gradient(to bottom, transparent, rgba(249,115,22,0.8), transparent)",
                    opacity: searchFocused ? 1 : 0,
                  }}
                />
                <Search
                  className="absolute left-4 h-4 w-4 transition-colors duration-300"
                  style={{ color: searchFocused ? "rgb(251,146,60)" : "rgb(100,116,139)" }}
                />
                <input
                  type="text"
                  placeholder="BUSCAR HERRAMIENTAS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="w-full bg-transparent pl-12 pr-4 py-3.5 text-surface-200 placeholder:text-surface-600 focus:outline-none"
                  style={{
                    fontFamily: "Orbitron, sans-serif",
                    fontSize: "0.65rem",
                    letterSpacing: "0.25em",
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Cards grid */}
        <div className="container mx-auto px-4 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            <AnimatePresence mode="popLayout">
              {filteredTools.map((game, index) => (
                <GameCard key={game.id} game={game} index={index} />
              ))}
            </AnimatePresence>
          </div>

          {/* Empty state */}
          {filteredTools.length === 0 && (
            <motion.div
              className="text-center py-24"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-14 h-14 rounded-lg bg-surface-900/60 border border-surface-700/40 flex items-center justify-center mx-auto mb-5">
                <Terminal className="w-6 h-6 text-surface-600" />
              </div>
              <p
                className="text-surface-500 text-xs tracking-[0.4em] uppercase"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                // Sin resultados
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
