"use client"
import { useBoffSession } from "@/services/useBoffSession"
import { useGetPokedex } from "@/hooks/pokemon/useGetPokedex"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function MenuHeader() {
  const { session } = useBoffSession()
  const { pokedexData } = useGetPokedex(session.user.smartRotomUser?.uuid!)

  return (
    <TooltipProvider>
      <header className="flex bg-surface-950 items-center justify-center gap-16 text-white h-12 z-10 p-2 text-xl 2xl:text-lg">
        <HeaderIcon icon="avistado" text="Vistos" number={pokedexData?.seenCount} />
        <HeaderIcon icon="capturado" text="Capturados" number={pokedexData?.caughtCount} />
        <HeaderIcon icon="shiny" text="Shiny" number={pokedexData?.shinyCount} />
        <HeaderIcon icon="desconocido" text="Desconocidos" number={pokedexData?.missingSeenPokemon} />
      </header>
    </TooltipProvider>
  )
}

function HeaderIcon({ icon, text, number }: { icon: string; text: string; number: number | undefined }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex mr-4 items-center">
          <img height={32} width={32} src={`/smartrotom/img/apps/pokedex/${icon}.webp`} alt={text} />
          <span className="ml-1">{number}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  )
}

