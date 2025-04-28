import { Gift, Award } from "lucide-react"

export default function GiveawayHeader() {
  return (
    <div className="text-center py-8">
      <div className="flex items-center justify-center gap-3 mb-6">
        <Gift className="h-10 w-10 text-primary-500" />
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-blue-400">
          Sorteo BoffMedia
        </h1>
        <Gift className="h-10 w-10 text-primary-500" />
      </div>
      <p className="text-xl text-surface-300 max-w-2xl mx-auto">
        Herramienta simple para realizar sorteos entre los miembros de la comunidad.
      </p>
      <div className="mt-6 flex items-center justify-center">
        <Award className="h-6 w-6 text-yellow-500 mr-2" />
        <span className="text-yellow-400 font-medium">
          ¡Buena suerte a todos los participantes!
        </span>
      </div>
    </div>
  )
}