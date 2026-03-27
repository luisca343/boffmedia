import { RankingEntry } from "@boffmedia/shared";
import MenuWrapper from "../_components/MenuWrapper";
import { MinaService } from "@/services/api/smartrotom/minaService";

export default async function Ranking() {
  const ranking = (await MinaService.getPlayerRanking()).data;

  if(!ranking) return <></>
  return (
    <MenuWrapper className="w-full h-screen overflow-hidden bg-surface-900 text-white pt-4  flex flex-col items-center">
      <div className="bg-black bg-opacity-70 p-6 rounded-lg w-3/4 max-w-3xl ">
        <h2 className="text-2xl font-bold mb-4">RANKING</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-600">
              <th className="py-2">Posición</th>
              <th className="py-2">Jugador</th>
              <th className="py-2">Puntos</th>
            </tr>
          </thead>
          <tbody>
            
            {ranking.map((user: RankingEntry, i: number) => (
              <tr key={i} className="border-b border-surface-600">
                <td className="py-2 text-center">{i + 1}</td>
                <td className="py-2 text-center">{user.username}</td>
                <td className="py-2 text-center">{user.totalValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MenuWrapper>
  );
}
