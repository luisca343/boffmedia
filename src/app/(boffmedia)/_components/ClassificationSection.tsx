import { Trophy, Users } from "lucide-react"

const tableData = [] as {
  position: number
  player: string
  points: number
  badges: number
}[]

export function ClassificationSection() {
  return (
    <section className="mb-16 md:mb-24">
      <h2 className="text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
        Tabla de Clasificación
      </h2>
      <div className="bg-surface-800/50 backdrop-blur-sm p-8 rounded-2xl border border-surface-700 shadow-lg overflow-x-auto">
        {tableData.length > 0 ? (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="py-3 px-4">Posición</th>
                <th className="py-3 px-4">Jugador</th>
                <th className="py-3 px-4">Puntos</th>
                <th className="py-3 px-4">Insignias</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((item, index) => (
                <tr key={index} className="border-b border-surface-700">
                  <td className="py-3 px-4 font-bold text-yellow-400">{item.position}</td>
                  <td className="py-3 px-4">{item.player}</td>
                  <td className="py-3 px-4">{item.points}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Trophy className="w-5 h-5 text-yellow-400 mr-2" />
                      {item.badges}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <NoDataMessage />
        )}
      </div>
    </section>
  )
}

function NoDataMessage() {
  return (
    <div className="text-center py-12">
      <Users className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
      <h3 className="text-2xl font-bold mb-2 text-yellow-400">No hay datos de clasificación</h3>
      <p className="text-surface-300 mb-4">
        Aún no tenemos datos de clasificación disponibles. ¡Sé el primero en participar y aparecer en la tabla!
      </p>
      <div className="flex justify-center items-center space-x-2">
        <Trophy className="w-6 h-6 text-yellow-400" />
        <span className="text-lg font-semibold text-yellow-400">¡Compite y gana!</span>
      </div>
    </div>
  )
}

