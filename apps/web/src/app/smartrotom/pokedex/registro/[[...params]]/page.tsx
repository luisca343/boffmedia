"use client"
import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { PokemonSprite } from "../../_components/PokemonSprite"
import { usePokemonStore } from "@/stores/pokemonStore"

// Cinematic capture-reveal: silhouette scan → reveal → brief flash → entrada.
export default function Registro({ params }: { params: Promise<{ params?: string[] }> }) {
  const t = useTranslations("pokedex")
  const router = useRouter()
  // Params arrive as a promise; reading `.params` straight off it yields undefined.
  const { params: route } = use(params)
  const [pokemonIndex, formIndex] = route ?? []
  const [phase, setPhase] = useState<"scan" | "reveal" | "flash">("scan")
  const invalidatePokedex = usePokemonStore((state) => state.invalidatePokedex)

  useEffect(() => {
    // The catch-all also matches a bare `/registro`, with nothing to reveal.
    if (!pokemonIndex) {
      router.replace("/smartrotom/pokedex")
      return
    }

    const t1 = setTimeout(() => setPhase("reveal"), 1400)
    const t2 = setTimeout(() => setPhase("flash"), 1850)
    const t3 = setTimeout(() => {
      // `openDex` routes here once the mod has registered the encounter, and this is a
      // client-side push — without this the dex would never re-read.
      invalidatePokedex()
      router.push(`/smartrotom/pokedex/entrada/${pokemonIndex}/${formIndex ?? "base"}`)
    }, 2250)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [pokemonIndex, formIndex])

  const label = phase === "scan" ? t("registro_scanning") : phase === "reveal" ? t("registro_identifying") : t("registro_registering")

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
        <div className="relative w-[15rem] h-[15rem] grid place-items-center">
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
          <PokemonSprite id={Number(pokemonIndex)} form={formIndex ?? "base"} palette="none" width={180} height={180} pixelated forceBlack={phase === "scan"} />
        </div>
        <div className="flex items-center gap-2 font-pk-mono text-sm text-pk-primary-300 tracking-[0.1em] uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-pk-primary-400 animate-pulse" />
          {label}
        </div>
      </div>
    </div>
  )
}
