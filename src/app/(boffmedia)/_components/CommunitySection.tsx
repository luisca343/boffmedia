import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Users, Gamepad, Trophy } from "lucide-react"

const features = [
  {
    title: "Chat en Tiempo Real",
    description: "Comunícate con otros jugadores durante las partidas",
    icon: MessageSquare,
  },
  {
    title: "Equipos y Clanes",
    description: "Únete a un equipo o crea el tuyo propio",
    icon: Users,
  },
  {
    title: "Eventos Especiales",
    description: "Participa en eventos exclusivos de la comunidad",
    icon: Gamepad,
  },
  {
    title: "Sistema de Rangos",
    description: "Sube de nivel y desbloquea recompensas únicas",
    icon: Trophy,
  },
]

export function CommunitySection() {
  return (
    <section className="py-24 bg-surface-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-surface-50">Únete a la Comunidad</h2>
          <p className="text-xl text-surface-300 max-w-3xl mx-auto">
            Forma parte de una comunidad activa de jugadores, participa en eventos especiales y comparte tus
            experiencias
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} className="bg-surface-800 hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <feature.icon className="h-12 w-12 text-primary-500 mb-4" />
                <CardTitle className="text-xl text-surface-50">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-surface-300">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-center mt-12">
          <Button size="lg" className="text-lg bg-primary-500 hover:bg-primary-600 text-white">
            Unirse Ahora
          </Button>
        </div>
      </div>
    </section>
  )
}

