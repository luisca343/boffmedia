"use client";

import { motion } from "framer-motion";
import { Gift, Key, ExternalLink, Plus, Terminal, type LucideIcon } from "lucide-react";
import { FloatingSection } from "../../_components/layout/FloatingSection";
import { PageHeader } from "@/components/boffmedia/tools/PageHeader";
import { FeaturedTool } from "@/components/boffmedia/tools/FeaturedTool";
import { ToolsGrid } from "@/components/boffmedia/tools/ToolsGrid";
import { ExternalResources } from "@/components/boffmedia/tools/ExternalResources";
import { otrosToolsConfig } from "@/data/games/otros";

const ICON_MAP: Record<string, LucideIcon> = { Gift, Key };

const t = (key: string, params?: any): string => {
  if (key === "accessButton") return `Acceder a ${params?.tool ?? ""}`;
  if (key === "featuredTool") return "Herramienta destacada";
  if (key === "externalLinks.title") return "Recursos recomendados";
  return key;
};

const tools = otrosToolsConfig.tools.map((tool) => {
  const IconComponent = ICON_MAP[tool.fallbackIcon];
  return {
    ...tool,
    iconFallback: IconComponent
      ? <IconComponent className={`h-8 w-8 ${tool.fallbackIconColor ?? ""}`} />
      : null,
  };
});

export default function OtherTools() {
  const featuredTool = tools.find((tool) => tool.featured)!;
  const otherTools = tools.filter((tool) => !tool.featured);

  return (
    <FloatingSection>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title={otrosToolsConfig.header.title}
          subtitle={otrosToolsConfig.header.subtitle}
          logoSrc={otrosToolsConfig.logo}
          logoAlt={otrosToolsConfig.name}
          logoWidth={120}
          logoHeight={120}
          theme="accent"
        />

        <FeaturedTool tool={featuredTool} t={t} />

        {otherTools.length > 0 && <ToolsGrid tools={otherTools} t={t} />}

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

        <ExternalResources links={otrosToolsConfig.externalLinks} t={t} />

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
