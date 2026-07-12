"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PokemonSprite } from "../../_components/PokemonSprite"

// Cinematic capture-reveal: silhouette scan → reveal → brief flash → entrada.
export default function Registro({ params }: { params: any }) {
  const router = useRouter()
  const [pokemonIndex, formIndex] = params.params as [number, string]
  const [phase, setPhase] = useState<"scan" | "reveal" | "flash">("scan")

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("reveal"), 1400)
    const t2 = setTimeout(() => setPhase("flash"), 1850)
    const t3 = setTimeout(() => router.push(`/smartrotom/pokedex/entrada/${pokemonIndex}/${formIndex}`), 2250)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  const label = phase === "scan" ? "Escaneando…" : phase === "reveal" ? "Identificando…" : "Registrando…"

  const corners = [
    "top-0 left-0 border-t-2 border-l-2",
    "top-0 right-0 border-t-2 border-r-2",
    "bottom-0 left-0 border-b-2 border-l-2",
    "bottom-0 right-0 border-b-2 border-r-2",
  ]

  return (
    <div
      className="w-full h-full grid place-items-center relative overflow-hidden"
      style={{ background: "radial-gradient(600px 400px at 50% 40%, rgba(249,115,22,.08), transparent 70%), #030609" }}
    >
      <style>{`@keyframes pkScan{0%{top:10%}50%{top:86%}100%{top:10%}}`}</style>

      {phase === "flash" && <div className="absolute inset-0 bg-white/80 pointer-events-none" />}

      <div className="flex flex-col items-center gap-6">
        <div className="relative w-[240px] h-[240px] grid place-items-center">
          {corners.map((c, i) => (
            <span key={i} className={`absolute w-7 h-7 border-pk-primary-400/70 ${c}`} />
          ))}
          <div
            className="absolute inset-3 opacity-20"
            style={{
              backgroundImage: "linear-gradient(rgba(249,115,22,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,.3) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          {phase === "scan" && (
            <div className="absolute left-3 right-3 h-[2px] bg-pk-primary-400 shadow-[0_0_10px_#fb923c]" style={{ animation: "pkScan 1.2s ease-in-out infinite" }} />
          )}
          <PokemonSprite id={pokemonIndex} form={formIndex} palette="none" width={180} height={180} pixelated forceBlack={phase === "scan"} />
        </div>
        <div className="flex items-center gap-2 font-pk-mono text-sm text-pk-primary-300 tracking-[0.1em] uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-pk-primary-400 animate-pulse" />
          {label}
        </div>
      </div>
    </div>
  )
}
