import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { FloatingBackground } from "../layout/FloatingBackground"
import { FloatingSection } from "../layout/FloatingSection"

export async function FeaturedGames() {
  const t = await getTranslations("boffmedia");

  const games = [
    {
      title: t("featuredGames.games.wingull.title"),
      description: t("featuredGames.games.wingull.description"),
      image: "/img/win-80.png",
      status: t("featuredGames.status.comingSoon"),
      link: "/wingull",
    },
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
  ]

  return (
    <FloatingSection mainPage={true} className="relative pt-16 pb-32 bg-gradient-to-br from-surface-900 via-surface-950 to-surface-900 overflow-hidden">
      <div className="relative container mx-auto px-4 z-10 mb-8">
        <div className="text-center mb-16">
          <div className="inline-block">
            <h2 className="text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-orange-400 to-amber-400">
              {t("featuredGames.title")}
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-primary-500 to-orange-500 mx-auto rounded-full"></div>
          </div>
          <p className="text-xl text-surface-300 mt-6 max-w-2xl mx-auto">{t("featuredGames.subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.map((game, index) => (
            <Card key={game.title} className="group relative bg-gradient-to-br from-surface-800 to-surface-900 border-surface-700 hover:border-primary-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary-500/20">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-orange-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <CardHeader className="relative z-10">
                <div className="absolute top-4 right-4">
                  <Badge variant={game.status === t("featuredGames.status.new") ? "default" : "secondary"} 
                         className={game.status === t("featuredGames.status.new") ? "bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white border-0" : ""}>
                    {game.status}
                  </Badge>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-orange-500/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <Image
                    src={game.image || "/placeholder.svg"}
                    alt={game.title}
                    width={80}
                    height={80}
                    className="relative rounded-lg mb-4 group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <CardTitle className="text-2xl group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary-400 group-hover:to-orange-400 transition-all duration-300">
                  {game.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-surface-300 mb-6 group-hover:text-surface-200 transition-colors duration-300">
                  {game.description}
                </CardDescription>
                <Button className="w-full bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                  <Link href={game.link}>
                    {t("featuredGames.viewMore")}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
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
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V120H0Z" className="fill-surface-800"></path>
        </svg>
      </div>
    </FloatingSection>
  )
}