/**
 * Performance optimization strategies for Pokemon PC interface
 */

import { memo, useState, useRef, useCallback, useEffect } from 'react'

// Utility to conditionally apply motion wrapper
export const ConditionalMotion = memo(({ 
  shouldAnimate, 
  children, 
  motionProps = {} 
}: { 
  shouldAnimate: boolean
  children: React.ReactNode
  motionProps?: any 
}) => {
  if (!shouldAnimate) {
    return <div>{children}</div>
  }
  
  const { motion } = require('framer-motion')
  return <motion.div {...motionProps}>{children}</motion.div>
})
ConditionalMotion.displayName = 'ConditionalMotion'

// Hook to determine if animations should be enabled
export function usePerformanceSettings() {
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false

  // Check device capabilities (could be expanded)
  const isLowEndDevice = typeof window !== 'undefined' 
    ? window.navigator.hardwareConcurrency <= 4 
    : false

  return {
    enableAnimations: !prefersReducedMotion && !isLowEndDevice,
    enableComplexAnimations: !prefersReducedMotion && !isLowEndDevice,
    enableStaggerAnimations: !prefersReducedMotion && !isLowEndDevice
  }
}

// Virtual scrolling helper for large grids
export function useVirtualizedGrid(
  items: any[], 
  containerHeight: number, 
  itemHeight: number,
  scrollTop: number
) {
  const itemsPerRow = 6 // For Pokemon box grid
  const rowHeight = itemHeight
  const totalRows = Math.ceil(items.length / itemsPerRow)
  
  const startRow = Math.floor(scrollTop / rowHeight)
  const endRow = Math.min(
    startRow + Math.ceil(containerHeight / rowHeight) + 1,
    totalRows
  )
  
  const startIndex = startRow * itemsPerRow
  const endIndex = Math.min(endRow * itemsPerRow, items.length)
  
  const visibleItems = items.slice(startIndex, endIndex)
  
  return {
    visibleItems,
    startIndex,
    totalHeight: totalRows * rowHeight,
    offsetY: startRow * rowHeight
  }
}

// Debounced hover state to reduce animation triggers
export function useDebouncedHover(delay: number = 100) {
  const [isHovered, setIsHovered] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  const setHover = useCallback((hovered: boolean) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsHovered(hovered)
    }, delay)
  }, [delay])
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  return [isHovered, setHover] as const
}

// Memoized grid component to prevent unnecessary re-renders
export const MemoizedPokemonGrid = memo(function MemoizedPokemonGrid({
  pokemon,
  selectedPokemon,
  onPokemonClick,
  onPokemonMove,
  currentBox,
  battleTeams,
  onAddToBattleTeam,
  SlotComponent
}: {
  pokemon: any[]
  selectedPokemon: any
  onPokemonClick: (pokemon: any) => void
  onPokemonMove: any
  currentBox: number
  battleTeams?: any[]
  onAddToBattleTeam?: any
  SlotComponent: React.ComponentType<any>
}) {
  return (
    <div className="grid grid-cols-6 gap-2 p-4">
      {Array.from({ length: 30 }, (_, index) => {
        const pokemonData = pokemon[index]
        return (
          <SlotComponent
            key={index}
            pokemon={pokemonData}
            index={index}
            isSelected={selectedPokemon === pokemonData}
            onClick={() => onPokemonClick(pokemonData)}
            onPokemonMove={onPokemonMove}
            currentBox={currentBox}
            battleTeams={battleTeams}
            onAddToBattleTeam={onAddToBattleTeam}
          />
        )
      })}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.pokemon === nextProps.pokemon &&
    prevProps.selectedPokemon === nextProps.selectedPokemon &&
    prevProps.currentBox === nextProps.currentBox &&
    prevProps.battleTeams === nextProps.battleTeams
  )
})

// Performance monitoring helper
export function usePerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    let frameCount = 0
    let lastTime = performance.now()
    
    function measureFPS() {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        
        if (fps < 30) {
          console.warn(`Low FPS detected: ${fps}fps`)
        }
        
        frameCount = 0
        lastTime = currentTime
      }
      
      requestAnimationFrame(measureFPS)
    }
    
    const rafId = requestAnimationFrame(measureFPS)
    
    return () => cancelAnimationFrame(rafId)
  }, [])
}
