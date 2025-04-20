"use client"
import { TooltipProvider } from "@/components/ui/tooltip"
import { PokemonProvider } from "@/providers/PokemonProvider"

export function SmartRotomProviders({ children }: { children: React.ReactNode }) {
    return <PokemonProvider><TooltipProvider>{children}</TooltipProvider></PokemonProvider>
}