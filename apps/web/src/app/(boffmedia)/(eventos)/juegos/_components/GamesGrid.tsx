import { Game } from "@boffmedia/shared";
import { GameCard } from "./GameCard";

export function GamesGrid({ games }: { games: Game[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {games.map((game: Game, index: number) => (
        <div 
          key={game.id}
          style={{ 
            animationDelay: `${index * 0.1}s`,
            animation: 'fadeInUp 0.6s ease-out forwards'
          }}
          className="opacity-0"
        >
          <GameCard game={game} layout="grid" />
        </div>
      ))}
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
