import { GameSpotlightCard } from "./GameSpotlightCard";
import { Button } from "@/components/ui/primitives/button";
import { ArrowRight } from "lucide-react";
import { SmartRotomVideo } from "./SmartRotomVideo";
import { InternalLink } from "@/components/ui/navigation/Link";

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
          titleGradientClass="bg-gradient-to-r from-primary-hover to-primary-hover"
          iconBgClass="from-primary to-primary-active"
          underlineClass="from-primary-hover to-primary-hover"
        >
          <p className="text-xl text-ink leading-relaxed mb-8 text-left">
            {t("featuredGames.games.smartrotom.description")}
          </p>
          {/* Features List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4 mb-8 mx-auto" style={{maxWidth: 700}}>
            <div className="flex items-center gap-3 text-ink">
              <div className="w-2 h-2 bg-primary-hover rounded-full"></div>
              <span>Disponible en Minecraft como en la web</span>
            </div>
            <div className="flex items-center gap-3 text-ink">
              <div className="w-2 h-2 bg-primary-hover rounded-full"></div>
              <span>Aplicaciones útiles para tu aventura</span>
            </div>
            <div className="flex items-center gap-3 text-ink">
              <div className="w-2 h-2 bg-primary-hover rounded-full"></div>
              <span>Interfaz intuitiva y fácil de usar</span>
            </div>
            <div className="flex items-center gap-3 text-ink">
              <div className="w-2 h-2 bg-primary-hover rounded-full"></div>
              <span>Actualizaciones constantes</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="default"
              size="lg"
              className="flex-1 group"
              asChild
              aria-label={t("featuredGames.viewMore") + " SmartRotom"}
            >
              <InternalLink href="/blog/posts/smartrotom" className="flex items-center justify-center gap-2">
                {t("featuredGames.viewMore")}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </InternalLink>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              aria-label="Abrir SmartRotom"
            >
              <InternalLink href="/smartrotom">Abrir SmartRotom</InternalLink>
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