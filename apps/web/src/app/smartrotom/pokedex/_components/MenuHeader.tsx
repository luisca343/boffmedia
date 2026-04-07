"use client"
import { useBoffSession } from "@/services/useBoffSession"
import { useGetPokedex } from "@/hooks/pokemon/useGetPokedex"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/primitives/tooltip"
import { InternalLink } from "@/components/ui/navigation/Link"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"

export default function MenuHeader() {
  const { session } = useBoffSession()
  const { pokedexData } = useGetPokedex(session.user.smartRotomUser?.uuid!)

  return (
    <div className="bg-surface-950 text-white shadow-md">
      <div className="max-w-7xl mx-auto">
        <div className="py-2 px-4 flex items-center justify-between">
          <div className="flex items-center">
            <InternalLink href="" className="mr-4 hover:text-primary-300 transition-colors">
              <ChevronLeftIcon className="h-6 w-6" />
            </InternalLink>
            <h1 className="text-2xl font-bold">Pokédex</h1>
          </div>
          <TooltipProvider>
            <div className="flex items-center space-x-6">
              <HeaderIcon icon="avistado" text="Vistos" number={pokedexData?.seenCount} />
              <HeaderIcon icon="capturado" text="Capturados" number={pokedexData?.caughtCount} />
              <HeaderIcon icon="shiny" text="Shiny" number={pokedexData?.shinyCount} />
              <HeaderIcon icon="desconocido" text="Desconocidos" number={pokedexData?.missingSeenPokemon} />
            </div>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}

function HeaderIcon({ icon, text, number }: { icon: string; text: string; number: number | undefined }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center cursor-help">
          <div className="bg-surface-800 p-1.5 rounded-full">
            <img height={24} width={24} src={`/smartrotom/img/apps/pokedex/${icon}.webp`} alt={text} />
          </div>
          <span className="ml-1.5 font-semibold">{number ?? '...'}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="bg-surface-700 border-surface-600">
        <p className="text-surface-100">{text}</p>
      </TooltipContent>
    </Tooltip>
  )
}