"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, Terminal } from "lucide-react";
import { GameCard, type GameData } from "@/components/boffmedia/ui/games/game-card";
import { Kicker } from "@/components/boffmedia/primitives/kicker";
import { Icon } from "@/components/boffmedia/primitives/icon";
import { getGameEntry } from "@/data/games";
import { hubConfig } from "@/data/hub";
import { useTranslations } from "next-intl";

type SortMode = "popular" | "az" | "tools";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "popular", label: "Popularidad" },
  { value: "az", label: "Alfabético" },
  { value: "tools", label: "Nº herramientas" },
];

const SLUGS = ["pokemon", "mhwilds", "otros"] as const;

export default function ToolsLandingPage() {
  const router = useRouter();
  const t = useTranslations();
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("popular");
  const [sortOpen, setSortOpen] = useState(false);

  const GAMES: GameData[] = SLUGS.map((slug) => {
    const entry = getGameEntry(slug);
    const hub = hubConfig[slug];
    if (!entry || !hub) return null;
    return {
      slug,
      name: t(entry.nameKey),
      short: hub.short,
      tagline: hub.tagline,
      hue: hub.hue,
      logoLabel: hub.logoLabel,
      icon: entry.logo || entry.icon || undefined,
      categories: entry.categories.map((cat) => ({
        name: t(cat.nameKey),
        tools: cat.tools
          .filter((tool) => tool.showInSidebar !== false)
          .slice(0, 3)
          .map((tool) => ({
            name: t(tool.nameKey),
            href: tool.href,
            icon: tool.sidebarIcon,
            sidebarIcon: tool.sidebarIcon,
          })),
      })),
      tools: [],
      featured: hub.featured,
    };
  }).filter(Boolean) as GameData[];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const go = (path: string) => router.push(path);

  let filteredTools = GAMES.filter(
    (game) =>
      game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.tagline.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.categories.some((cat) =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ) ||
      game.categories.some((cat) =>
        cat.tools.some((t) =>
          t.name.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      ),
  );

  if (sortMode === "az") {
    filteredTools = [...filteredTools].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortMode === "tools") {
    filteredTools = [...filteredTools].sort(
      (a, b) =>
        (b.tools.length + b.categories.reduce((x, c) => x + c.tools.length, 0)) -
        (a.tools.length + a.categories.reduce((x, c) => x + c.tools.length, 0)),
    );
  }

  const totalTools = GAMES.reduce(
    (acc, g) => acc + g.tools.length + g.categories.reduce((x, c) => x + c.tools.length, 0),
    0,
  );

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortMode)?.label || "Ordenar";

  return (
    <main className="relative bg-base pt-16 relative h-screen">
      {/* ── hub-video background ─────────────────────────────── */}
      {isMounted && (
        <div className="hub-video absolute inset-0 z-0 overflow-hidden">
          <div className="hub-video__media absolute inset-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute w-full h-full object-cover"
            >
              <source src="/uploads/looptest.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-base/60 via-base/75 to-base/90" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)",
            }}
          />
        </div>
      )}

      {/* ── hub-content ─────────────────────────────────────── */}
      <div className="hub-content relative z-10">
        {/* Hero */}
        <section className="hub-hero container mx-auto px-4 pb-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-[760px] mx-auto"
          >
            <Kicker>Herramientas · Comunidad</Kicker>
            <h1 className="hub-title text-5xl sm:text-6xl font-black leading-tight mt-4 mb-4">
              Herramientas para{" "}
              <span className="text-primary-hover" style={{ textShadow: "0 0 30px rgba(249,115,22,0.35)" }}>
                videojuegos
              </span>
            </h1>
            <p className="hub-lead text-ink-muted max-w-[56ch] mx-auto text-lg leading-relaxed mb-8">
              Recursos para mejorar tu juego: calculadoras, planificadores y bases de datos.
              Creadas por y para la comunidad gaming.
            </p>

            {/* hub-tools: search + sort */}
            <div className="hub-tools flex gap-3 max-w-[600px] mx-auto mb-6 items-stretch justify-center">
              <div className="hub-search flex-1">
                <div className="relative">
                  <div
                    className="absolute -inset-0.5 rounded-lg transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: "linear-gradient(90deg, rgba(249,115,22,0.3), rgba(251,146,60,0.15), rgba(249,115,22,0.3))",
                      filter: "blur(6px)",
                      opacity: searchFocused ? 1 : 0,
                    }}
                  />
                  <div
                    className="relative flex items-center bg-layer-1/80 border rounded-lg transition-all duration-300 backdrop-blur-sm overflow-hidden"
                    style={{
                      borderColor: searchFocused
                        ? "rgba(249,115,22,0.55)"
                        : "rgba(51,65,85,0.7)",
                    }}
                  >
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
                      placeholder="Buscar herramientas, juegos…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      className="w-full bg-transparent pl-12 pr-4 py-3.5 text-ink placeholder:text-ink-muted focus:outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Sort dropdown */}
              <div className="dd relative">
                <div className="fixed inset-0 z-40" style={{ display: sortOpen ? "block" : "none" }} onClick={() => setSortOpen(false)} />
                <button
                  className="dd__trigger inline-flex items-center gap-2 px-4 py-3.5 rounded-lg border transition-all duration-300 text-sm"
                  style={{
                    background: "rgba(15,23,42,0.8)",
                    borderColor: "rgba(51,65,85,0.7)",
                    color: sortOpen ? "rgb(251,146,60)" : "rgb(148,163,184)",
                    minWidth: "160px",
                    height: "46px",
                  }}
                  onClick={() => setSortOpen(!sortOpen)}
                >
                  <Icon name="filter" size={16} />
                  <span className="flex-1 text-left">{currentSortLabel}</span>
                  <ChevronDown
                    className="w-4 h-4 transition-transform duration-300"
                    style={{ transform: sortOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>
                {sortOpen && (
                  <div
                    className="dd__menu absolute right-0 top-full mt-2 z-50 min-w-[200px] rounded-lg border py-1 backdrop-blur-md shadow-xl"
                    style={{
                      background: "rgba(15,23,42,0.95)",
                      borderColor: "rgba(71,85,105,0.7)",
                    }}
                  >
                    <div className="dd__header px-4 py-2 text-xs tracking-widest text-ink-muted uppercase font-mono">
                      Ordenar por
                    </div>
                    {SORT_OPTIONS.map((opt) => {
                      const active = sortMode === opt.value;
                      return (
                        <button
                          key={opt.value}
                          className="dd__item flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm transition-colors"
                          style={{
                            color: active ? "rgb(251,146,60)" : "rgb(148,163,184)",
                            background: active ? "rgba(249,115,22,0.08)" : "transparent",
                          }}
                          onMouseEnter={(e) => {
                            if (!active) e.currentTarget.style.background = "rgba(30,41,59,0.5)";
                          }}
                          onMouseLeave={(e) => {
                            if (!active) e.currentTarget.style.background = "transparent";
                          }}
                          onClick={() => {
                            setSortMode(opt.value);
                            setSortOpen(false);
                          }}
                        >
                          <span className="flex-1">{opt.label}</span>
                          {active && <Icon name="check" size={15} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* hub-meta stats */}
            <div className="hub-meta flex gap-6 justify-center flex-wrap">
              <span className="inline-flex items-center gap-2 font-mono text-xs tracking-wider text-ink-muted">
                <Icon name="gamepad" size={15} className="text-primary-hover" />
                {GAMES.length} juegos
              </span>
              <span className="inline-flex items-center gap-2 font-mono text-xs tracking-wider text-ink-muted">
                <Icon name="wrench" size={15} className="text-primary-hover" />
                {totalTools} herramientas
              </span>
              <span className="inline-flex items-center gap-2 font-mono text-xs tracking-wider text-ink-muted">
                <Icon name="bolt" size={15} className="text-primary-hover" />
                Siempre actualizado
              </span>
            </div>
          </motion.div>
        </section>

        {/* Grid */}
        <section className="hub-grid-wrap container mx-auto px-4 pb-24">
          {filteredTools.length ? (
            <div className="hub-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <AnimatePresence mode="popLayout">
                {filteredTools.map((game, index) => (
                  <motion.div
                    key={game.slug}
                    layout
                    initial={{ opacity: 0, y: 40, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ delay: index * 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <GameCard game={game} go={go} delay={index * 80} className="in" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              className="text-center py-24"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-14 h-14 rounded-lg bg-layer-1/60 border border-edge/40 flex items-center justify-center mx-auto mb-5">
                <Terminal className="w-6 h-6 text-ink-dim" />
              </div>
              <p className="text-ink-muted text-xs tracking-[0.4em] uppercase font-mono">
                // Sin resultados
              </p>
            </motion.div>
          )}
        </section>
      </div>
    </main>
  );
}
