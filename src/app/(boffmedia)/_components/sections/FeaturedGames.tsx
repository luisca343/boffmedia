import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { FloatingSection } from "../layout/FloatingSection";

export async function FeaturedGames() {
  const t = await getTranslations("boffmedia");

  const games = [
    {
      title: t("featuredGames.games.smartrotom.title"),
      description: t("featuredGames.games.smartrotom.description"),
      image: "/img/smartrotom.png",
      status: t("featuredGames.status.comingSoon"),
      link: "/smartrotom",
    },
    {
      title: t("featuredGames.games.tools.title"),
      description: t("featuredGames.games.tools.description"),
      image: "/img/tools.png",
      status: t("featuredGames.status.new"),
      link: "/herramientas",
    }
  ];

  return (
    <FloatingSection
      mainPage={true}
      className="min-h-[120vh] relative -mt-32 py-32 bg-gradient-to-br from-surface-800 via-surface-900 to-surface-800 overflow-hidden wave-top flex flex-col justify-center"
    >
      <div className="relative mx-auto px-4 z-10 flex flex-col justify-center h-full">

        <div className="text-center mb-20">
          <div className="inline-block">
            <h2 className="text-6xl font-extrabold my-8 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-400 to-amber-400 drop-shadow-lg">
              {t("featuredGames.title")}
            </h2>
            <div className="h-1 w-32 bg-gradient-to-r from-orange-500 to-amber-400 mx-auto rounded-full"></div>
          </div>
          <p className="text-2xl text-surface-300 mt-8 max-w-3xl mx-auto">{t("featuredGames.subtitle")}</p>
        </div>

        {/* Wingull Spotlight Section */}
        <section
          className="mb-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
          aria-labelledby="wingull-hero-title"
        >
          {/* Left Column: Large Wingull Image with Glow */}
          <div className="flex justify-center items-center relative">
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
          <div className="flex justify-center items-center">
            <div className="w-full max-w-2xl space-y-8">
              {/* Logo Section - Centered and Prominent */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-2xl"></div>
                  <Image
                    src="/img/wingull2-logo.png"
                    alt="Pixelmon Wingull 2"
                    width={400}
                    height={400}
                    className="relative rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-6">
                <p className="text-xl text-surface-300 leading-relaxed text-center">
                  {t("featuredGames.games.wingull.description")}
                </p>
                
                {/* Features List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4">
                  <div className="flex items-center gap-3 text-surface-300">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Nueva generación</span>
                  </div>
                  <div className="flex items-center gap-3 text-surface-300">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Pokémon exclusivos</span>
                  </div>
                  <div className="flex items-center gap-3 text-surface-300">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Mecánicas mejoradas</span>
                  </div>
                  <div className="flex items-center gap-3 text-surface-300">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Mundo renovado</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 flex-1" asChild>
                  <Link href="/wingull" className="flex items-center justify-center gap-3">
                    {t("featuredGames.viewMore")}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 px-6 py-3">
                  Notificarme
                </Button>
              </div>
            </div>
          </div>
        </section>
        {/* End Wingull Spotlight */}


        {/* Section Divider */}
        <div className="relative mb-24 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
          </div>
          <div className="relative bg-slate-900 px-8 py-4 rounded-full border border-purple-500/30">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping"></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping delay-150"></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-ping delay-300"></div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12"></div>

        <div className="grid md:grid-cols-2 gap-12">
          {games.map((game, index) => (
            <Card key={game.title} className="group relative bg-gradient-to-br from-surface-800 to-surface-900 border-surface-700 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20 min-h-[420px] flex flex-col justify-between">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10 pt-8 pb-4 flex flex-col items-center">
                <div className="absolute top-6 right-6">
                  <Badge
                    variant={game.status === t("featuredGames.status.new") ? "default" : "secondary"}
                    className={game.status === t("featuredGames.status.new")
                      ? "bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white border-0"
                      : ""}
                  >
                    {game.status}
                  </Badge>
                </div>
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-amber-400/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <Image
                    src={game.image || "/placeholder.svg"}
                    alt={game.title}
                    width={120}
                    height={120}
                    className="relative rounded-xl mb-2 group-hover:scale-110 transition-transform duration-300 shadow-lg"
                  />
                </div>
                <CardTitle className="text-3xl font-bold group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-orange-400 group-hover:to-amber-400 transition-all duration-300 text-center">
                  {game.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 flex flex-col flex-1 justify-between">
                <CardDescription className="text-lg text-surface-300 mb-8 group-hover:text-surface-200 transition-colors duration-300 text-center">
                  {game.description}
                </CardDescription>
                <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-lg py-4 rounded-xl flex items-center justify-center gap-2" asChild>
                  <Link href={game.link}>
                    {t("featuredGames.viewMore")}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom SVG Wave */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden">
        <svg className="relative block w-full h-20" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V120H0Z" className="fill-surface-800" opacity="0.5"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V120H0Z" className="fill-surface-900"></path>
        </svg>
      </div>
    </FloatingSection>
  );

}