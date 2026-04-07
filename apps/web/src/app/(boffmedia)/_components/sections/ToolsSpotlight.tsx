import { GameSpotlightCard } from "./GameSpotlightCard";
import { Button } from "@/components/ui/primitives/button";
import { ArrowRight, Wrench, Calculator, Cog, BarChart3, Server, Filter, Zap } from "lucide-react";
import { OrbitingElementsCloud } from "@/components/ui/display/OrbitingElementsCloud";
import { InternalLink } from "@/components/ui/navigation/Link";

interface ToolsSpotlightProps {
  t: (key: string) => string;
}

export function ToolsSpotlight({ t }: ToolsSpotlightProps) {
  const toolCategories = [
    { icon: <Calculator className="w-10 h-10 text-white" />, name: "Calculadoras", color: "from-emerald-500 to-highlight-600" },
    { icon: <Cog className="w-10 h-10 text-white" />, name: "Generadores", color: "from-highlight-500 to-teal-600" },
    { icon: <BarChart3 className="w-10 h-10 text-white" />, name: "Análisis", color: "from-teal-500 to-emerald-600" },
    { icon: <Server className="w-10 h-10 text-white" />, name: "Utilidades", color: "from-emerald-600 to-highlight-700" },
    { icon: <Filter className="w-10 h-10 text-white" />, name: "Filtros", color: "from-highlight-600 to-teal-700" },
    { icon: <Zap className="w-10 h-10 text-white" />, name: "Automatización", color: "from-teal-600 to-emerald-700" },
  ];

  return (
    <section
      className="mb-24 relative min-h-[600px] overflow-hidden"
      aria-labelledby="tools-hero-title"
    >

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 h-full items-center px-6 py-16">
        <div className="order-2 lg:order-1 flex items-center justify-center relative h-[34rem]">
          <OrbitingElementsCloud
            centralIcon={<Wrench className="w-14 h-14 text-white animate-pulse" />}
            centralBg="bg-gradient-to-br from-emerald-500 to-highlight-600"
            orbitingElements={toolCategories}
            ringConfigs={[
              { size: "w-[22rem] h-[22rem]", border: "border border-emerald-500/20", duration: "20s" },
              { size: "w-[28rem] h-[28rem]", border: "border border-highlight-500/10", duration: "30s", direction: "reverse" },
            ]}
            particleCount={8}
            particleColorClass="bg-emerald-400/30"
            particleSize="w-1 h-1"
            particleDuration="4s"
            particleDelayStep={0.5}
            radius={180}
          />
        </div>

        <div className="order-1 lg:order-2 flex justify-center items-center">
          <GameSpotlightCard
            iconSrc="/img/tools.png"
            iconAlt="Herramientas"
            title={t("featuredGames.games.tools.title")}
            titleGradientClass="bg-gradient-to-r from-highlight-400 to-highlight-300"
            iconBgClass="from-highlight-500 to-highlight-700"
            underlineClass="from-highlight-400 to-highlight-300"
            headerClass="flex-row-reverse text-right"
          >
            <p className="text-lg text-surface-300 leading-relaxed mb-8 text-left">
              {t("featuredGames.games.tools.description")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4 mb-8 mx-auto" style={{maxWidth: 700}}>
              {[
                "Calculadoras especializadas para Minecraft",
                "Generadores automáticos de contenido",
                "Herramientas de análisis avanzado",
                "Utilidades para administradores"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 text-surface-300">
                  <div className="w-2 h-2 bg-highlight-400 rounded-full flex-shrink-0"></div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="highlight"
                size="lg"
                className="flex-1 group"
                asChild
              >
                <InternalLink href="/herramientas" className="flex items-center justify-center gap-2">
                  {t("featuredGames.viewMore")}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </InternalLink>
              </Button>
            </div>
          </GameSpotlightCard>
        </div>
      </div>
    </section>
  );
}