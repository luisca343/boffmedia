"use client"

import { ReactNode, useEffect } from "react"
import { useSpriteManifestStore } from "@/stores/spriteManifestStore"
import { Loading } from "@/components/smartrotom/Loading"

interface SpriteManifestProviderProps {
  children: ReactNode
  loadingFallback?: ReactNode
}

export function SpriteManifestProvider({ 
  children, 
  loadingFallback = <div className="h-screen w-screen flex items-center justify-center"><Loading /></div> 
}: SpriteManifestProviderProps) {
  const { manifest, fetchManifest, isLoading, error } = useSpriteManifestStore()
  
  useEffect(() => {
    // Load manifest on mount if not already loaded
    if (!manifest && !isLoading) {
      fetchManifest()
    }
  }, [manifest, fetchManifest, isLoading])
  
  // Show loading state while manifest is loading
  if (isLoading && !manifest) {
    return loadingFallback
  }
  
  // Show error if manifest failed to load
  if (error && !manifest) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center text-red-500">
        <p>Error loading sprite manifest:</p>
        <p>{error}</p>
        <button 
          onClick={() => fetchManifest()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return children
}