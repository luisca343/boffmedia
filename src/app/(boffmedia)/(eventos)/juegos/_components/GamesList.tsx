import { GameCard } from "./GameCard";
import type { Game } from "@/generated/api";

export function GamesList({ games }: { games: Game[] }) {
  return (
    <div className="space-y-4">
      {games.map((game: Game) => (
        <GameCard key={game.id} game={game} layout="list" />
      ))}
    </div>
  );
}
