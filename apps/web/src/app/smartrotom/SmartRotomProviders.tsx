"use client"
import { GlobalErrorThrower } from "@/components/smartrotom/GlobalErrorThrower"
import { RotomErrorBoundary } from "@/components/smartrotom/RotomErrorBoundary"
import { TooltipProvider } from "@/components/ui/primitives/tooltip"
import { PokemonProvider } from "@/providers/PokemonProvider"
import { SpriteManifestProvider } from "@/providers/SpriteManifestProvider"

export function SmartRotomProviders({ children }: { children: React.ReactNode }) {
    return (
    <PokemonProvider>
        <TooltipProvider>
                <SpriteManifestProvider>
                    <ErrorProviders>
                        {children}
                    </ErrorProviders>
                </SpriteManifestProvider>
        </TooltipProvider>
    </PokemonProvider>
)
}

export function ErrorProviders({ children }: { children: React.ReactNode }) {
    return (
        <RotomErrorBoundary>
            <GlobalErrorThrower>
                {children}
            </GlobalErrorThrower>
        </RotomErrorBoundary>
    )
}