import { DungeonRankingEntry } from '@boffmedia/shared';
import MenuWrapper from '../_components/MenuWrapper';
import { MazmorraService } from '@/services/api/smartrotom/mazmorraService';

/** Fastest completed run, or a dash for a player who has never finished one. */
function formatTiempo(ms: number | null): string {
  if (!ms) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default async function RankingMazmorra() {
  const res = await MazmorraService.getRanking(25);
  const ranking = res.success ? res.data : undefined;

  if (!ranking) return <></>;

  return (
    <MenuWrapper className="w-full h-screen overflow-hidden bg-layer-1 text-white pt-4 flex flex-col items-center">
      <div className="bg-black bg-opacity-70 p-6 rounded-lg w-3/4 max-w-3xl">
        <h2 className="text-2xl font-bold mb-4">MAZMORRAS</h2>
        {ranking.length === 0 ? (
          <p className="text-center py-6 opacity-70">
            Nadie ha entrado todavía.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-edge">
                <th className="py-2">Posición</th>
                <th className="py-2">Jugador</th>
                <th className="py-2">Pisos</th>
                <th className="py-2">Completadas</th>
                <th className="py-2">Mejor tiempo</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((jugador: DungeonRankingEntry) => (
                <tr key={jugador.uuid} className="border-b border-edge">
                  <td className="py-2 text-center">{jugador.rank}</td>
                  <td className="py-2 text-center">{jugador.nombre}</td>
                  <td className="py-2 text-center">{jugador.mejorPisos}</td>
                  <td className="py-2 text-center">
                    {jugador.completadas}/{jugador.partidas}
                  </td>
                  <td className="py-2 text-center">
                    {formatTiempo(jugador.mejorTiempoMs ?? null)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </MenuWrapper>
  );
}
