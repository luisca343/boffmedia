import { GameSpotlightCard } from "./GameSpotlightCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wrench, Calculator, Cog, BarChart3, Server, Filter, Zap } from "lucide-react";
import { InternalLink } from "@/components/nav/Link";

interface ToolsSpotlightProps {
  t: (key: string) => string;
}

export function ToolsSpotlight({ t }: ToolsSpotlightProps) {
  const toolCategories = [
    { icon: Calculator, name: "Calculadoras", color: "from-emerald-500 to-green-600" },
    { icon: Cog, name: "Generadores", color: "from-green-500 to-teal-600" },
    { icon: BarChart3, name: "Análisis", color: "from-teal-500 to-emerald-600" },
    { icon: Server, name: "Utilidades", color: "from-emerald-600 to-green-700" },
    { icon: Filter, name: "Filtros", color: "from-green-600 to-teal-700" },
    { icon: Zap, name: "Automatización", color: "from-teal-600 to-emerald-700" },
  ];

  return (
    <section
      className="mb-24 relative min-h-[600px] overflow-hidden"
      aria-labelledby="tools-hero-title"
    >

      {/* Main content - two sections */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 h-full items-center px-6 py-16">
        {/* Left Section: Floating Tools Cloud */}
        <div className="order-2 lg:order-1 flex items-center justify-center relative h-[34rem]">
          <div className="relative w-full h-full">
            {/* Animated rings - must be behind the tools and not block pointer events */}
            <div className="absolute top-1/2 left-1/2 w-[22rem] h-[22rem] border border-emerald-500/20 rounded-full animate-spin pointer-events-none" style={{animationDuration: '20s', transform: 'translate(-50%, -50%)'}}></div>
            <div className="absolute top-1/2 left-1/2 w-[28rem] h-[28rem] border border-green-500/10 rounded-full animate-spin pointer-events-none" style={{animationDuration: '30s', animationDirection: 'reverse', transform: 'translate(-50%, -50%)'}}></div>

            {/* Central hub */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl z-10">
              <Wrench className="w-14 h-14 text-white animate-pulse" />
            </div>

            {/* Orbiting tools */}
            {toolCategories.map((tool, index) => {
              const angle = (index * 60) * (Math.PI / 180); // 60 degrees apart
              const radius = 180;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              return (
                <div
                  key={tool.name}
                  className="absolute w-20 h-20 transform -translate-x-1/2 -translate-y-1/2 animate-pulse hover:scale-125 transition-all duration-300 cursor-pointer group z-30"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    animationDelay: `${index * 0.3}s`,
                    animationDuration: '3s'
                  }}
                >
                  <div className={`w-full h-full bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300`}>
                    <tool.icon className="w-10 h-10 text-white" />
                  </div>
                  {/* Connecting line to center */}
                  <div 
                    className="absolute w-0.5 bg-gradient-to-r from-emerald-400/20 to-transparent origin-left opacity-50 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      height: `${radius}px`,
                      transform: `rotate(${angle + Math.PI}rad)`,
                      left: '50%',
                      top: '50%',
                    }}
                  ></div>
                  {/* Tool name tooltip - ensure above wrench */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-30">
                    <span className="text-xs text-emerald-400 font-medium bg-surface-900/80 px-2 py-1 rounded-full">
                      {tool.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Section: Main Info Card */}
        <div className="order-1 lg:order-2 flex justify-center items-center">
          <GameSpotlightCard
            iconSrc="/img/tools.png"
            iconAlt="Herramientas"
            title={t("featuredGames.games.tools.title")}
            titleGradientClass="bg-gradient-to-r from-highlight-400 to-highlight-300"
            iconBgClass="from-highlight-500 to-highlight-700"
            underlineClass="from-highlight-400 to-highlight-300"
          >
            <p className="text-lg text-surface-300 leading-relaxed mb-8 text-left">
              {t("featuredGames.games.tools.description")}
            </p>
            {/* Feature bullets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4 mb-8 mx-auto" style={{maxWidth: 700}}>
              {[
                "Calculadoras especializadas para Minecraft",
                "Generadores automáticos de contenido", 
                "Herramientas de análisis avanzado",
                "Utilidades para administradores"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 text-surface-300">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                className="bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white px-6 py-3 flex-1 shadow-xl rounded-full font-semibold transition-all duration-200 transform hover:scale-105 group"
                asChild
              >
                <InternalLink href="/herramientas" className="flex items-center justify-center gap-2">
                  <span>{t("featuredGames.viewMore")}</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </InternalLink>
              </Button>
              
              <Button
                variant="outline"
                className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 px-6 py-3"
                asChild
              >
              </Button>
            </div>
          </GameSpotlightCard>
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-emerald-400/30 rounded-full animate-ping"
            style={{
              top: `${20 + (i * 10)}%`,
              left: `${10 + (i * 12)}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: '4s'
            }}
          ></div>
        ))}
      </div>
    </section>
  );
}