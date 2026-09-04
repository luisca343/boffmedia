"use client"
import { GlobalErrorThrower } from "@/components/smartrotom/GlobalErrorThrower"
import { RotomErrorBoundary } from "@/components/smartrotom/RotomErrorBoundary"
import { PokemonProvider } from "@/providers/PokemonProvider"
import { SpriteManifestProvider } from "@/providers/SpriteManifestProvider"
import { RotomConnectionBanner } from "@/components/smartrotom/ui/RotomConnectionBanner"

export function SmartRotomProviders({ children }: { children: React.ReactNode }) {
    return (
    <PokemonProvider>
        <SpriteManifestProvider>
            <ErrorProviders>
                <RotomConnectionBanner />
                {children}
            </ErrorProviders>
        </SpriteManifestProvider>
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