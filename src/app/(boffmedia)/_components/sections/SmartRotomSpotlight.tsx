import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

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
      <div className="flex justify-center items-center order-2 md:order-1">
        <div className="w-full max-w-2xl space-y-8">
          {/* Logo Section - Centered and Prominent */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 rounded-2xl blur-2xl"></div>
              <Image
                src="/img/smartrotom.png"
                alt="SmartRotom"
                width={120}
                height={120}
                className="relative rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-6">
            <h3 id="smartrotom-hero-title" className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
              {t("featuredGames.games.smartrotom.title")}
            </h3>
            <p className="text-xl text-surface-300 leading-relaxed text-center">
              {t("featuredGames.games.smartrotom.description")}
            </p>
            
            {/* Features List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4">
              <div className="flex items-center gap-3 text-surface-300">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span>Disponible en Minecraft como en la web</span>
              </div>
              <div className="flex items-center gap-3 text-surface-300">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span>Aplicaciones útiles para tu aventura</span>
              </div>
              <div className="flex items-center gap-3 text-surface-300">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span>Interfaz intuitiva y fácil de usar</span>
              </div>
              <div className="flex items-center gap-3 text-surface-300">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span>Actualizaciones constantes</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 flex-1" asChild>
              <Link href="/smartrotom" className="flex items-center justify-center gap-3">
                {t("featuredGames.viewMore")}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 px-6 py-3">
              Próximamente
            </Button>
          </div>
        </div>
      </div>

      {/* Right Column: Video Demo */}
      <div className="flex justify-center items-center relative order-1 md:order-2">
        <div className="relative group flex items-center justify-center w-full transform perspective-1000">
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none opacity-60 group-hover:opacity-80 transition-opacity duration-300 blur-2xl"
            style={{
              zIndex: 0,
              background: "radial-gradient(circle at 45% 40%, rgba(251,146,60,0.35) 40%, transparent 70%)",
              boxShadow: "0 0 80px 40px rgba(251,146,60,0.18)",
              transform: "perspective(1200px) rotateY(-8deg) rotateX(3deg) rotateZ(2deg)",
            }}
          ></div>
          
          <video
            autoPlay
            loop
            muted
            playsInline
            className="relative z-10 rounded-2xl shadow-2xl border border-orange-500/20 group-hover:border-orange-400/40 transition-all duration-700 group-hover:scale-105 hover:shadow-orange-500/40"
            style={{ 
              maxWidth: "90%", 
              height: "auto",
              filter: "brightness(1.05) contrast(1.1) saturate(1.1)",
              transformStyle: "preserve-3d",
              transform: "perspective(1200px) rotateY(-8deg) rotateX(3deg) rotateZ(2deg)"
            }}
          >
            <source src="/img/smartrotom_demo.webm" type="video/webm" />
            <source src="/img/smartrotom_demo.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Subtle reflection effect - adjusted for rotation */}
          <div className="absolute bottom-0 left-1/2 w-3/4 h-8 bg-gradient-to-b from-orange-500/10 to-transparent rounded-b-2xl blur-lg opacity-30"
              style={{
                transform: "translateX(-50%) translateY(100%) perspective(1200px) rotateY(-8deg) rotateX(-3deg) rotateZ(2deg)"
              }}
          ></div>
        </div>
      </div>
    </section>
  );
}