"use client";

import { motion } from "framer-motion";
import { Gift, Key, ExternalLink, Plus, Terminal } from "lucide-react";
import { FloatingSection } from "../../_components/layout/FloatingSection";
import { PageHeader } from "@components/boffmedia/tools/PageHeader";
import { FeaturedTool } from "@components/boffmedia/tools/FeaturedTool";
import { ToolsGrid } from "@components/boffmedia/tools/ToolsGrid";
import { ExternalResources } from "@components/boffmedia/tools/ExternalResources";

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

const t = (key: string, params?: any): string => {
  if (key === "accessButton") return `Acceder a ${params?.tool ?? ""}`;
  if (key === "featuredTool") return "Herramienta destacada";
  if (key === "externalLinks.title") return "Recursos recomendados";
  return key;
};

export default function OtherTools() {
  const featuredTool = TOOLS.find((tool) => tool.featured)!;
  const otherTools = TOOLS.filter((tool) => !tool.featured);

  return (
    <FloatingSection>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title={{ prefix: "Otras", highlight: "Herramientas" }}
          subtitle="Recursos útiles para gamers y creadores de contenido"
          logoSrc="/img/games/other/icon.webp"
          logoAlt="Otras Herramientas"
          logoWidth={120}
          logoHeight={120}
          theme="accent"
        />

        <FeaturedTool tool={featuredTool} t={t} />

        {otherTools.length > 0 && <ToolsGrid tools={otherTools} t={t} />}

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

        <ExternalResources links={EXTERNAL_LINKS} t={t} />

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
