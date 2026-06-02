import Link from 'next/link';

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-3">Battle Simulator</h1>
        <p className="text-muted-foreground text-lg">
          Watch replays, play against AI, or battle on Pokémon Showdown
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full max-w-5xl">
        <Link
          href="/battlesim/play"
          className="flex flex-col items-center gap-2 p-6 bg-card rounded-lg border hover:shadow-lg transition-all hover:scale-[1.02]"
        >
          <span className="text-2xl">⚔️</span>
          <h2 className="text-lg font-semibold">Play</h2>
          <p className="text-sm text-muted-foreground text-center">
            Battle against an AI opponent
          </p>
        </Link>

        <Link
          href="/battlesim/pvp"
          className="flex flex-col items-center gap-2 p-6 bg-card rounded-lg border hover:shadow-lg transition-all hover:scale-[1.02]"
        >
          <span className="text-2xl">🏆</span>
          <h2 className="text-lg font-semibold">PvP</h2>
          <p className="text-sm text-muted-foreground text-center">
            Battle other players on our server
          </p>
        </Link>

        <Link
          href="/battlesim/showdown"
          className="flex flex-col items-center gap-2 p-6 bg-card rounded-lg border hover:shadow-lg transition-all hover:scale-[1.02]"
        >
          <span className="text-2xl">🌐</span>
          <h2 className="text-lg font-semibold">Showdown Online</h2>
          <p className="text-sm text-muted-foreground text-center">
            Play on the official Pokémon Showdown server
          </p>
        </Link>

        <Link
          href="/battlesim/replay"
          className="flex flex-col items-center gap-2 p-6 bg-card rounded-lg border hover:shadow-lg transition-all hover:scale-[1.02]"
        >
          <span className="text-2xl">📺</span>
          <h2 className="text-lg font-semibold">Replays</h2>
          <p className="text-sm text-muted-foreground text-center">
            Watch saved battle replays
          </p>
        </Link>

        <Link
          href="/battlesim/calc"
          className="flex flex-col items-center gap-2 p-6 bg-card rounded-lg border hover:shadow-lg transition-all hover:scale-[1.02]"
        >
          <span className="text-2xl">🔢</span>
          <h2 className="text-lg font-semibold">Calculator</h2>
          <p className="text-sm text-muted-foreground text-center">
            Damage calculator
          </p>
        </Link>
      </div>
    </div>
  );
}
