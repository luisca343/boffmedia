import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"
import Link from "next/link"

export async function FeaturedGames() {
  const t = await getTranslations("boffmedia");

  const games = [
    {
      title: t("featuredGames.games.wingull.title"),
      description: t("featuredGames.games.wingull.description"),
      image: "/img/win-80.png",
      status: t("featuredGames.status.popular"),
      link: "/wingull",
    },
    {
      title: t("featuredGames.games.smartrotom.title"),
      description: t("featuredGames.games.smartrotom.description"),
      image: "/img/smartrotom.png",
      status: t("featuredGames.status.new"),
      link: "/smartrotom",
    },
    {
      title: t("featuredGames.games.tools.title"),
      description: t("featuredGames.games.tools.description"),
      image: "/img/tools.png",
      status: t("featuredGames.status.new"),
      link: "/herramientas",
    }
    /*
    {
      title: t("featuredGames.games.zomboff.title"),
      description: t("featuredGames.games.zomboff.description"),
      image: "/img/zomboff.png",
      status: t("featuredGames.status.popular"),
      link: "/zomboff",
    },
    {
      title: t("featuredGames.games.bingo.title"),
      description: t("featuredGames.games.bingo.description"),
      image: "/img/bingo.png",
      status: t("featuredGames.status.comingSoon"),
      link: "/bingo",
    },*/
  ]

  return (
    <section className="py-24 bg-surface-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-surface-50">{t("featuredGames.title")}</h2>
          <p className="text-xl text-surface-300">{t("featuredGames.subtitle")}</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.map((game, index) => (
            <Card key={game.title} className="group hover:shadow-xl transition-shadow duration-300 bg-surface-800">
              <CardHeader className="relative">
                <div className="absolute top-4 right-4">
                  <Badge variant={game.status === t("featuredGames.status.new") ? "default" : "secondary"}>{game.status}</Badge>
                </div>
                <Image
                  src={game.image || "/placeholder.svg"}
                  alt={game.title}
                  width={80}
                  height={80}
                  className="rounded-lg mb-4"
                />
                <CardTitle className="text-2xl group-hover:text-primary-500 transition-colors duration-300">
                  {game.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-surface-300 mb-6">{game.description}</CardDescription>
                <Button className="w-full bg-primary-500 hover:bg-primary-600 text-white" asChild>
                  <Link href={game.link}>
                    {t("featuredGames.viewMore")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}