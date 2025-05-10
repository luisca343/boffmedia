"use client"
import { TooltipProvider } from "@/components/ui/tooltip"
import { PokemonProvider } from "@/providers/PokemonProvider"
import { SpriteManifestProvider } from "@/providers/SpriteManifestProvider"

export function SmartRotomProviders({ children }: { children: React.ReactNode }) {
    return (
    <PokemonProvider>
        <TooltipProvider>
            <SpriteManifestProvider>
                {children}
            </SpriteManifestProvider>
        </TooltipProvider>
    </PokemonProvider>
)
}