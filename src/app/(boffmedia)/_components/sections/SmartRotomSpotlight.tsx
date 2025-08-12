import { GameSpotlightCard } from "./GameSpotlightCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SmartRotomVideo } from "./SmartRotomVideo";
import { InternalLink } from "@/components/nav/Link";

interface SmartRotomSpotlightProps {
  t: (key: string) => string;
}

export function SmartRotomSpotlight({ t }: SmartRotomSpotlightProps) {
  return (
    <section
      className="mb-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
      aria-labelledby="smartrotom-hero-title"
    >
      {/* Left Column: SmartRotom Info Card */}
      <div className="flex justify-center items-center order-1 md:order-1">
        <GameSpotlightCard
          iconSrc="/img/smartrotom.png"
          iconAlt="SmartRotom"
          title={t("featuredGames.games.smartrotom.title")}
          titleGradientClass="bg-gradient-to-r from-primary-400 to-primary-300"
          iconBgClass="from-primary-500 to-primary-700"
          underlineClass="from-primary-400 to-primary-300"
        >
          <p className="text-xl text-surface-300 leading-relaxed mb-8 text-left">
            {t("featuredGames.games.smartrotom.description")}
          </p>
          {/* Features List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4 mb-8 mx-auto" style={{maxWidth: 700}}>
            <div className="flex items-center gap-3 text-surface-300">
              <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
              <span>Disponible en Minecraft como en la web</span>
            </div>
            <div className="flex items-center gap-3 text-surface-300">
              <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
              <span>Aplicaciones útiles para tu aventura</span>
            </div>
            <div className="flex items-center gap-3 text-surface-300">
              <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
              <span>Interfaz intuitiva y fácil de usar</span>
            </div>
            <div className="flex items-center gap-3 text-surface-300">
              <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
              <span>Actualizaciones constantes</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="default"
              className=" text-white px-8 py-3 flex-1 shadow-xl rounded-full font-semibold text-lg transition-all duration-200 transform hover:scale-105 focus:ring-4 focus:ring-primary-300 focus:ring-offset-2 focus:outline-none group"
              asChild
              aria-label={t("featuredGames.viewMore") + " SmartRotom"}
            >
              <InternalLink href="/blog/posts/smartrotom" className="flex items-center justify-center gap-3">
                <span className="relative z-10">
                  {t("featuredGames.viewMore")}
                </span>
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </InternalLink>
            </Button>
            <Button
              variant="outline"
              className="border-primary-500/30 text-primary-500 hover:bg-primary-500/10 px-6 py-3 font-semibold transition-all duration-200"
              asChild
              aria-label="Abrir SmartRotom"
            >
              <InternalLink href="/smartrotom" className="flex items-center gap-2">
                <span>Abrir SmartRotom</span>
              </InternalLink>
            </Button>
          </div>
        </GameSpotlightCard>
      </div>

      <div className="flex justify-center items-center relative order-2 md:order-2">
        <SmartRotomVideo />
      </div>
    </section>
  );
}