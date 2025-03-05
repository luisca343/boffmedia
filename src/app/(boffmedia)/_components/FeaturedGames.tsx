import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

const games = [
  {
    title: "Pixelmon Wingull 2",
    description: "La última aventura Pokémon en Minecraft. Explora, captura y combate.",
    image: "/img/win-80.png",
    status: "Popular",
    link: "/wingull",
  },
  {
    title: "SmartRotom",
    description: "Accede a tu smartphone del juego desde cualquier lugar. Mantente conectado al mundo Pixelmon.",
    image: "/img/smartrotom.png",
    status: "Nuevo",
    link: "/smartrotom",
  },
  {
    title: "Herramientas de Juego",
    description: "Mejora tu experiencia de juego con nuestra colección de herramientas útiles.",
    image: "/img/tools.png",
    status: "Nuevo",
    link: "/herramientas",
  }
  /*
  {
    title: "Project ZomBOFF",
    description: "Sobrevive al apocalipsis zombi con amigos en nuestros servidores personalizados.",
    image: "/img/zomboff.png",
    status: "Popular",
    link: "/zomboff",
  },
  {
    title: "Minecraft Bingo",
    description: "Pon a prueba tu conocimiento y velocidad en Minecraft en eventos competitivos.",
    image: "/img/bingo.png",
    status: "Próximamente",
    link: "/bingo",
  },*/
]

export function FeaturedGames() {
  return (
    <section className="py-24 bg-surface-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-surface-50">Destacados</h2>
          <p className="text-xl text-surface-300">Descubre las herramientas y juegos más populares de BoffMedia</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.map((game, index) => (
            <Card key={game.title} className="group hover:shadow-xl transition-shadow duration-300 bg-surface-800">
              <CardHeader className="relative">
                <div className="absolute top-4 right-4">
                  <Badge variant={game.status === "Nuevo" ? "default" : "secondary"}>{game.status}</Badge>
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
                  <a href={game.link}>
                    Ver más
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

