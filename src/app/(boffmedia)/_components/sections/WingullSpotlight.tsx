import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { HiBell } from "react-icons/hi2";

interface WingullSpotlightProps {
  t: (key: string) => string;
}

export function WingullSpotlight({ t }: WingullSpotlightProps) {
  return (
    <section
      className="mb-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
      aria-labelledby="wingull-hero-title"
    >
      {/* Left Column: Large Wingull Image with Glow */}
      <div className="flex justify-center items-center relative order-2 md:order-1">
        <div className="relative group flex items-center justify-center">
          {/* Glow effect behind the image */}
          <div
            className="absolute inset-0 rounded-5xl pointer-events-none opacity-60 group-hover:opacity-80 transition-opacity duration-300 blur-2xl"
            style={{
              zIndex: 0,
              background: "radial-gradient(circle at 55% 40%, rgba(59,130,246,0.35) 40%, transparent 70%)",
              boxShadow: "0 0 80px 40px rgba(59,130,246,0.18)",
            }}
          ></div>
          <Image
            src="/img/personajes.webp"
            alt="Pixelmon Wingull 2"
            width={900}
            height={900}
            priority
            className="relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-2"
            style={{ maxWidth: "90%", height: "auto" }}
          />
        </div>
      </div>

      {/* Right Column: Wingull Info Card */}
      <div className="flex justify-center items-center order-1 md:order-2">
        <div className="w-full max-w-2xl space-y-8">
          {/* Logo Section - Centered and Prominent */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-secondary-500/20 rounded-2xl blur-2xl"></div>
              <Image
                src="/img/wingull2-logo.png"
                alt="Pixelmon Wingull 2"
                width={450}
                height={450}
                className="relative rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-6">
            <p className="text-xl text-surface-300 leading-relaxed text-center">
              {t("featuredGames.games.wingull.description")}
            </p>
            
            {/* Features List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4 justify-center text-center mx-auto" style={{maxWidth: 700}}>
              <div className="flex items-center gap-3 text-surface-300 justify-center">
                <div className="w-2 h-2 bg-secondary-400 rounded-full"></div>
                <span>Nueva generación</span>
              </div>
              <div className="flex items-center gap-3 text-surface-300 justify-center">
                <div className="w-2 h-2 bg-secondary-400 rounded-full"></div>
                <span>Pokémon exclusivos</span>
              </div>
              <div className="flex items-center gap-3 text-surface-300 justify-center">
                <div className="w-2 h-2 bg-secondary-400 rounded-full"></div>
                <span>Mecánicas mejoradas</span>
              </div>
              <div className="flex items-center gap-3 text-surface-300 justify-center">
                <div className="w-2 h-2 bg-secondary-400 rounded-full"></div>
                <span>Mundo renovado</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              className="px-8 py-3 flex-1 shadow-xl rounded-full font-semibold text-lg transition-all duration-200 transform hover:scale-105 focus:ring-4 focus:ring-secondary-300 focus:ring-offset-2 focus:outline-none group"
              asChild
              aria-label={t("featuredGames.viewMore") + " Pixelmon Wingull 2"}
            >
              <Link href="/wingull" className="flex items-center justify-center gap-3">
                <span className="relative z-10">
                  {t("featuredGames.viewMore")}
                </span>
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="secondaryOutline">
              <HiBell className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}