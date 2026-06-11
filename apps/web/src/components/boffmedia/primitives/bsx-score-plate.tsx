"use client"

interface TeamMember {
  hp: number
  fnt?: boolean
  name?: string
  /** Unrevealed slot (team size known, Pokémon not yet seen). */
  unknown?: boolean
}

interface BSXScorePlateProps {
  name: string
  rating: string
  av: string
  team: TeamMember[]
  right?: boolean
}

export function BSXScorePlate({ name, rating, team, right, av }: BSXScorePlateProps) {
  return (
    <div
      className="flex items-center gap-[.6rem] p-[var(--bsx-pad-md)] min-w-0 rounded-[var(--radius-lg)]"
      style={{
        background: "var(--card-bg)",
        border: "var(--card-border)",
        flexDirection: right ? "row-reverse" : undefined,
        textAlign: right ? "right" : undefined,
      } as React.CSSProperties}
    >
      <span
        className="w-[36px] h-[36px] rounded-[10px] shrink-0 grid place-items-center font-display font-extrabold text-t-xs text-white"
        style={{ background: "linear-gradient(135deg, var(--cyan-500), var(--cyan-600))" }}
      >
        {av}
      </span>
      <div className="flex flex-col min-w-0">
        <span className="font-display font-extrabold text-t-sm whitespace-nowrap overflow-hidden text-ellipsis">{name}</span>
        <span className="font-mono text-t-3xs tracking-[.08em] whitespace-nowrap" style={{ color: "var(--text-dim)" }}>{rating}</span>
      </div>
      <div className={`flex gap-[.3rem] ${right ? "" : "mx-auto mr-[.1rem]"}`} style={right ? { marginInline: ".1rem auto" } : undefined}>
        {team.map((m, i) => {
          const isKo = m.fnt
          const isLow = !isKo && !m.unknown && m.hp < 35
          return (
            <span
              key={i}
              className="w-[9px] h-[9px] rounded-[50%]"
              title={m.unknown ? "?" : m.name}
              style={
                m.unknown
                  ? { background: "transparent", boxShadow: "none", border: "1px dashed var(--border-strong)" }
                  : isKo
                  ? { background: "var(--surface-3)", boxShadow: "none", border: "1px solid var(--border-strong)" }
                  : isLow
                  ? { background: "var(--amber-400)", boxShadow: "0 0 6px -1px var(--amber-400)" }
                  : { background: "var(--emerald-400)", boxShadow: "0 0 6px -1px var(--emerald-400)" }
              }
            />
          )
        })}
      </div>
    </div>
  )
}
