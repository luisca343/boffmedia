import { Trophy, Users } from "lucide-react";

const tableData = [] as {
  position: number;
  player: string;
  points: number;
  badges: number;
}[];

/*
const tableData = [
    {
      position: 1,
      player: "Herobrine",
      points: 420000,
      badges: 69,
    },
    {
      position: 2,
      player: "Lausci",
      points: 14500,
      badges: 7,
    },
    {
      position: 3,
      player: "Manolo el Furro",
      points: 14000,
      badges: 7,
    },
    {
      position: 4,
      player: "El Martillo que perforará los cielos",
      points: 13500,
      badges: 5,
    },
    {
      position: 5,
      player: "Eskarmina",
      points: 13000,
      badges: 6,
    },
    {
      position: 6,
      player: "Walfie",
      points: 13500,
      badges: 6,
    },
    { position: 7, player: "Yho", points: 12000, badges: 5 },
    { position: 999, player: "Cuason", points: 0, badges: 0 },
  ] as {
    position: number;
    player: string;
    points: number;
    badges: number;
  }[];*/

export function ClassificationTable() {
  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg overflow-x-auto">
      {tableData.length > 0 ? (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="py-3 px-4">Posición</th>
              <th className="py-3 px-4">Jugador</th>
              <th className="py-3 px-4">Puntos</th>
              <th className="py-3 px-4">Insignias</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((item, index) => (
              <tr key={index} className="border-b border-gray-700">
                <td className="py-3 px-4 font-bold text-yellow-400">
                  {item.position}
                </td>
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
  );
}

function NoDataMessage() {
  return (
    <div className="text-center py-12">
      <Users className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
      <h3 className="text-2xl font-bold mb-2 text-yellow-400">No hay datos de clasificación</h3>
      <p className="text-gray-300 mb-4">
        Aún no tenemos datos de clasificación disponibles. ¡Sé el primero en participar y aparecer en la tabla!
      </p>
      <div className="flex justify-center items-center space-x-2">
        <Trophy className="w-6 h-6 text-yellow-400" />
        <span className="text-lg font-semibold text-yellow-400">¡Compite y gana!</span>
      </div>
    </div>
  );
}