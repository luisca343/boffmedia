"use client"
import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { PokemonSprite } from "../../_components/PokemonSprite"
import { useTranslations } from "next-intl"
import { HubSidebar } from "../../_components/HubSidebar"
import { usePokemonStore } from "@/stores/pokemonStore"
import { getPokemonNameAndForm } from "../../dexUtils"

export default function Registro({ params }: { params: Promise<{ params?: string[] }> }) {
  const t = useTranslations("pokedex")
  const router = useRouter()
  const { params: routeParams } = use(params)
  let [pokemonIndex, formIndex] = routeParams as unknown as [number, string]
  const [phase, setPhase] = useState<"scanning" | "flash" | "reveal">("scanning")
  const getPokemonByDex = usePokemonStore((state) => state.getPokemonByDex)
  const pokemonByDex = usePokemonStore((state) => state.pokemonByDex)
  const [pokemonName, setPokemonName] = useState<string | null>(null)

  useEffect(() => {
    if (pokemonIndex) {
      const cached = pokemonByDex[Number(pokemonIndex)]
      if (cached) {
        setPokemonName(getPokemonNameAndForm(cached.name, String(formIndex || "base"), t))
      } else {
        getPokemonByDex(Number(pokemonIndex)).then((p) => {
          if (p) setPokemonName(getPokemonNameAndForm(p.name, String(formIndex || "base"), t))
        })
      }
    }
  }, [pokemonIndex])

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("flash"), 1200)
    const t2 = setTimeout(() => setPhase("reveal"), 1600)
    const t3 = setTimeout(() => {
      router.push(`/smartrotom/pokedex/entrada/${pokemonIndex}/${formIndex}`)
    }, 3000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div className="flex h-full bg-surface-950">
      <HubSidebar />
      <main className="flex-1 min-w-0 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_35%,rgba(249,115,22,0.16),transparent_70%),radial-gradient(120%_120%_at_50%_100%,rgba(34,211,238,0.06),transparent_70%),#04060b]" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "repeating-linear-gradient(0deg, transparent 0 39px, rgba(249,115,22,0.05) 39px 40px), repeating-linear-gradient(90deg, transparent 0 39px, rgba(249,115,22,0.05) 39px 40px)",
            maskImage: "radial-gradient(60% 60% at 50% 50%, black, transparent 70%)",
          }}
        />

        {/* Rotom indicator */}
        <div className="absolute top-5 left-6 flex items-center gap-2.5 bg-black/40 px-3 py-2 rounded-full border border-primary-400/25 font-jetbrains text-[11px] tracking-widest uppercase text-primary-300">
          <span className="w-[7px] h-[7px] rounded-full bg-primary-400 shadow-[0_0_8px_var(--primary-400)] animate-rotomPulse" />
          SmartRotom activo
        </div>

        {/* Scan frame */}
        <div className="relative w-[280px] h-[280px]">
          {["tl", "tr", "bl", "br"].map((pos) => (
            <div
              key={pos}
              className="absolute w-6 h-6 border-2 border-primary-400"
              style={{
                filter: "drop-shadow(0 0 6px var(--primary-500))",
                ...(pos === "tl" ? { top: 0, left: 0, borderRight: "none", borderBottom: "none" } : {}),
                ...(pos === "tr" ? { top: 0, right: 0, borderLeft: "none", borderBottom: "none" } : {}),
                ...(pos === "bl" ? { bottom: 0, left: 0, borderRight: "none", borderTop: "none" } : {}),
                ...(pos === "br" ? { bottom: 0, right: 0, borderLeft: "none", borderTop: "none" } : {}),
              }}
            />
          ))}

          {/* Sprite */}
          <div className="absolute inset-0 grid place-items-center">
            <PokemonSprite
              id={pokemonIndex}
              form={formIndex || "base"}
              palette="none"
              width={200}
              height={200}
              pixelated={true}
              hide={phase !== "reveal"}
              forceBlack={phase !== "reveal"}
              className={phase === "reveal" ? "drop-shadow-[0_16px_28px_rgba(0,0,0,0.5)]" : ""}
            />
          </div>

          {/* Scan line */}
          {phase === "scanning" && (
            <div
              className="absolute left-[8%] right-[8%] h-[2px] bg-gradient-to-r from-transparent via-primary-300 to-transparent animate-scanLine pointer-events-none"
              style={{ filter: "drop-shadow(0 0 6px var(--primary-400))" }}
            />
          )}

          {/* Flash */}
          {phase === "flash" && (
            <div className="absolute inset-0 bg-[radial-gradient(40%_40%_at_50%_50%,rgba(255,255,255,0.9),transparent_70%)] animate-fade-in" />
          )}
        </div>

        {/* Banner */}
        <div className={`mt-8 flex flex-col items-center gap-3 transition-opacity duration-300 ${phase === "reveal" ? "opacity-100" : "opacity-0"}`}>
          <div className="font-jetbrains text-[11px] tracking-[0.2em] uppercase text-primary-300 flex items-center gap-2">
            <span className="w-6 h-px bg-primary-400" />
            {t("registro_title")}
            <span className="w-6 h-px bg-primary-400" />
          </div>
          <div className="font-orbitron font-extrabold text-[34px] tracking-tight text-surface-50 flex items-baseline gap-3">
            <span className="font-jetbrains text-base text-surface-500 font-medium">#{String(pokemonIndex).padStart(3, "0")}</span>
            {pokemonName && <span>{pokemonName}</span>}
          </div>
        </div>

        {/* Progress steps */}
        <div className="absolute top-[76px] left-6 right-6 flex gap-1">
          {["scanning", "flash", "reveal"].map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-[3px] rounded-[2px] relative overflow-hidden ${
                phase === s ? "after:absolute after:inset-0 after:bg-primary-400 after:shadow-[0_0_6px_var(--primary-400)]" :
                i < ["scanning", "flash", "reveal"].indexOf(phase) ? "after:absolute after:inset-0 after:bg-primary-500/60" : "bg-white/[0.06]"
              }`}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
