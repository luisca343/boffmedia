"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MENU_ITEMS } from "./constants";
import { useTamagotchi } from "./_hooks/useTamagotchi";
import { TamagotchiScreen } from "./_components/TamagotchiScreen";
import { TamagotchiButtons } from "./_components/TamagotchiButtons";

export default function PokemonTamagotchi() {
  const {
    state,
    isOn,
    isReset,
    isHatched,
    needsAttention,
    feedingState,
    turnOn,
    reset,
    performAction,
  } = useTamagotchi()

  const [pokemonNumber, setPokemonNumber] = useState(6)  // Starting with Charizard
  const [spritePosition, setSpritePosition] = useState(0)
  const [tabRemoved, setTabRemoved] = useState(false)

  // Menu states
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0)
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null)
  const [subMenuIndex, setSubMenuIndex] = useState(0)

  const removeTab = useCallback(() => {
    setTabRemoved(true)
    turnOn()
  }, [turnOn])

  const handleButtonPress = useCallback((button: 'A' | 'B' | 'C') => {
    if (!isOn) return
    if (!isReset) {
      reset()
      return
    }

    if (activeSubMenu) {
      handleSubMenuAction(button)
    } else {
      if (button === 'A') {
        setSelectedMenuIndex((prevIndex) => (prevIndex + 1) % MENU_ITEMS.length)
      } else if (button === 'B') {
        const selectedItem = MENU_ITEMS[selectedMenuIndex]
        if (selectedItem.action === 'HEALTH_METER') {
          setActiveSubMenu(selectedItem.action)
          performAction({ type: 'HEALTH_METER' })
        } else if (selectedItem.subMenu) {
          setActiveSubMenu(selectedItem.action)
          setSubMenuIndex(0)
        } else {
          performAction({ type: selectedItem.action as any })
        }
      }
    }
  }, [isOn, isReset, activeSubMenu, selectedMenuIndex, performAction, reset])

  const handleSubMenuAction = useCallback((button: 'A' | 'B' | 'C') => {
    const currentMenuItem = MENU_ITEMS[selectedMenuIndex]
    if (!currentMenuItem.subMenu && currentMenuItem.action !== 'HEALTH_METER') return

    if (currentMenuItem.action === 'HEALTH_METER') {
      if (button === 'C') {
        setActiveSubMenu(null)
      }
    } else {
      if (button === 'A') {
        setSubMenuIndex((prevIndex) => (prevIndex + 1) % currentMenuItem.subMenu!.length)
      } else if (button === 'B') {
        setSubMenuIndex((currentSubMenuIndex) => {
          const subAction = currentMenuItem.subMenu![currentSubMenuIndex]
          performAction({ type: currentMenuItem.action as any, subAction: subAction as any })
          setActiveSubMenu(null)
          return 0 // Reset subMenuIndex after action
        })
      } else if (button === 'C') {
        setActiveSubMenu(null)
        setSubMenuIndex(0) // Reset subMenuIndex when closing submenu
      }
    }
  }, [selectedMenuIndex, performAction])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-200 to-purple-200">
      <div className="relative w-[26rem] h-[32rem] flex flex-col items-center justify-center">
        {!tabRemoved && (
          <div 
            className="absolute right-0 top-1/2 w-24 h-16 bg-yellow-300 transform translate-x-1/2 -translate-y-1/2 cursor-pointer z-0 flex items-center justify-center text-sm font-bold text-text-tertiary shadow-lg rounded-r-lg"
            onClick={removeTab}
          >
            Quitar Pestaña
          </div>
        )}
        <div className="relative w-full h-full bg-gradient-to-b from-pink-300 to-pink-400 rounded-[50%] shadow-[0_10px_50px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center p-4 z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-200/50 to-pink-300/50 rounded-[50%]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.2)_0%,_rgba(255,255,255,0)_70%)] rounded-[50%]"></div>
          <div className="absolute inset-0 border-4 border-pink-200/50 rounded-[50%]"></div>
          
          {/* Tamagotchi Text */}
          <div className="absolute top-10 left-0 right-0 text-center z-20">
            <h1 className="text-3xl font-bold text-yellow-400 tracking-wider" style={{fontFamily: "'Comic Sans MS', cursive, sans-serif", textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
              TAMAGOTCHI
            </h1>
          </div>

          <TamagotchiScreen
            state={state}
            isOn={isOn}
            isReset={isReset}
            isHatched={isHatched}
            needsAttention={needsAttention}
            selectedMenuIndex={selectedMenuIndex}
            activeSubMenu={activeSubMenu}
            subMenuIndex={subMenuIndex}
            spritePosition={spritePosition}
            pokemonNumber={pokemonNumber}
            feedingState={feedingState}
          />

          <TamagotchiButtons onButtonPress={handleButtonPress} />
        </div>
      </div>
    </div>
  )
}