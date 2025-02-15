import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Trophy, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const upcomingEvents = [
  {
    title: "Torneo Pixelmon",
    date: "15 Mar",
    time: "18:00",
    type: "Competitivo",
  },
  {
    title: "Minecraft Bingo",
    date: "22 Mar",
    time: "20:00",
    type: "Casual",
  },
]

export function EventsSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-surface-800 to-surface-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-surface-50">Próximos Eventos</h2>
          <p className="text-xl text-surface-300">Participa en nuestros eventos y compite con la comunidad</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="bg-surface-800">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-6 w-6 text-primary-500" />
                <span className="text-lg font-semibold text-primary-500">Eventos Activos</span>
              </div>
              <CardTitle className="text-2xl text-surface-50">Calendario de Eventos</CardTitle>
              <CardDescription className="text-surface-300">
                No te pierdas ningún evento de la comunidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.title}
                    className="flex items-center justify-between p-4 rounded-lg bg-surface-700 hover:bg-surface-600 transition-colors duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <Calendar className="h-8 w-8 text-primary-500" />
                      <div>
                        <h4 className="font-semibold text-lg text-surface-50">{event.title}</h4>
                        <p className="text-surface-300">
                          {event.date} - {event.time}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{event.type}</Badge>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-6 bg-primary-500 hover:bg-primary-600 text-white">
                Ver Todos los Eventos
              </Button>
            </CardContent>
          </Card>
          <Card className="bg-surface-800">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-6 w-6 text-primary-500" />
                <span className="text-lg font-semibold text-primary-500">Comunidad</span>
              </div>
              <CardTitle className="text-2xl text-surface-50">Ranking de Jugadores</CardTitle>
              <CardDescription className="text-surface-300">Los mejores jugadores de la temporada</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-surface-700">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-2xl text-primary-500">#1</span>
                    <div>
                      <h4 className="font-semibold text-lg text-surface-50">Herobrine</h4>
                      <p className="text-surface-300">420,000 puntos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-warning-500" />
                    <span className="text-lg font-semibold text-surface-50">69</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-6 border-primary-500 text-primary-500 hover:bg-primary-500/10"
              >
                Ver Clasificación Completa
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

