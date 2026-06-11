import Link from 'next/link';

const cardLink = "flex flex-col items-center gap-2 p-6 rounded-lg transition-all hover:scale-[1.02]";

const links = [
  { href: "/battlesim/play", icon: "⚔️", title: "Play", desc: "Battle against an AI opponent" },
  { href: "/battlesim/pvp", icon: "🏆", title: "PvP", desc: "Battle other players on our server" },
  { href: "/battlesim/showdown", icon: "🌐", title: "Showdown Online", desc: "Play on the official Pokémon Showdown server" },
  { href: "/battlesim/replay", icon: "📺", title: "Replays", desc: "Watch saved battle replays" },
  { href: "/battlesim/calc", icon: "🔢", title: "Calculator", desc: "Damage calculator" },
];

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--text)' }}>Battle Simulator</h1>
        <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
          Watch replays, play against AI, or battle on Pokémon Showdown
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full max-w-5xl">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cardLink}
            style={{
              background: 'var(--card-bg)',
              border: 'var(--card-border)',
            }}
          >
            <span className="text-2xl">{link.icon}</span>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{link.title}</h2>
            <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
