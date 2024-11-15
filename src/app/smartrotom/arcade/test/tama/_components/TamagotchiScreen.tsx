import React from 'react'
import { PmdSprite } from '../../_components/PmdSprite'
import { TamagotchiState } from '../types'
import { MENU_ITEMS } from '../constants'

type TamagotchiScreenProps = {
  state: TamagotchiState
  isOn: boolean
  isReset: boolean
  isHatched: boolean
  needsAttention: boolean
  selectedMenuIndex: number
  activeSubMenu: string | null
  subMenuIndex: number
  spritePosition: number
  pokemonNumber: number
  feedingState: {
    isFeeding: boolean
    foodType: 'MEAL' | 'SNACK' | null
    animationProgress: number
  }
}

export function TamagotchiScreen({
  state,
  isOn,
  isReset,
  isHatched,
  needsAttention,
  selectedMenuIndex,
  activeSubMenu,
  subMenuIndex,
  spritePosition,
  pokemonNumber,
  feedingState,
}: TamagotchiScreenProps) {
  const renderHealthMeter = () => {
    return (
      <div className="text-center">
        <p>Age: {state.age} days</p>
        <p>Weight: {state.weight} kg</p>
        <p>Discipline: {state.discipline}%</p>
        <p>Hunger: {state.hunger}%</p>
        <p>Happiness: {state.happiness}%</p>
        <p>Health: {state.health}%</p>
      </div>
    )
  }

  return (
    <div className={`w-64 h-64 rounded-lg overflow-hidden mb-8 relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] border-2 border-surface-600 z-20 transition-colors duration-300 ${state.isLightOn ? 'bg-green-200' : 'bg-surface-800'}`}>
      <div className="absolute inset-0 bg-[linear-gradient(45deg,_rgba(0,0,0,0.1)_25%,_transparent_25%,_transparent_50%,_rgba(0,0,0,0.1)_50%,_rgba(0,0,0,0.1)_75%,_transparent_75%,_transparent)] bg-[length:4px_4px]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.2)_0%,_rgba(255,255,255,0)_70%)]"></div>
      {isOn && isReset ? (
        <>
          {isHatched ? (
            <>
              {/* Top Menu Items */}
              <div className={`absolute top-0 left-0 right-0 flex justify-around py-2 z-30 border-b border-green-400/50 ${state.isLightOn ? 'bg-green-300/80' : 'bg-surface-700/80'}`}>
                {MENU_ITEMS.slice(0, 4).map((item, index) => (
                  <div
                    key={index}
                    className={`p-1 rounded-full ${selectedMenuIndex === index ? (state.isLightOn ? 'bg-green-500' : 'bg-surface-500') : ''}`}
                  >
                    {React.createElement(item.icon, {
                      size: 20,
                      className: `${state.isLightOn ? 'text-green-800' : 'text-surface-300'} ${selectedMenuIndex === index ? 'text-white' : ''}`,
                    })}
                  </div>
                ))}
              </div>

              {activeSubMenu === 'HEALTH_METER' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`text-sm ${state.isLightOn ? 'text-green-800' : 'text-surface-300'}`}>
                    {renderHealthMeter()}
                  </div>
                </div>
              ) : (
                <>
                  {/* Pokemon Sprite */}
                  <div 
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex justify-center items-end h-[calc(100%-64px)] transition-all duration-50"
                    style={{ transform: `translateX(calc(-50% + ${spritePosition}px))` }}
                  >
                    <PmdSprite num={pokemonNumber} />
                  </div>
                  
                  {/* Feeding Animation */}
                  {feedingState.isFeeding && (
                    <div 
                      className="absolute z-50 transition-all duration-500 ease-in-out"
                      style={{
                        left: `${feedingState.animationProgress * 100}%`,
                        bottom: '50%',
                        transform: 'translateY(50%)',
                        opacity: 1 - feedingState.animationProgress,
                      }}
                    >
                      {feedingState.foodType === 'MEAL' ? (
                        <div className="w-8 h-8 bg-yellow-400 rounded-full border-2 border-yellow-600"></div>
                      ) : (
                        <div className="w-6 h-6 bg-pink-400 rounded-sm border-2 border-pink-600"></div>
                      )}
                    </div>
                  )}
                </>
              )}
              
              {/* Bottom Menu Items */}
              <div className={`absolute bottom-0 left-0 right-0 flex justify-around py-2 z-30 border-t border-green-400/50 ${state.isLightOn ? 'bg-green-300/80' : 'bg-surface-700/80'}`}>
                {MENU_ITEMS.slice(4).map((item, index) => (
                  <div
                    key={index + 4}
                    className={`p-1 rounded-full ${selectedMenuIndex === index + 4 ? (state.isLightOn ? 'bg-green-500' : 'bg-surface-500') : ''}`}
                  >
                    {React.createElement(item.icon, {
                      size: 20,
                      className: `${state.isLightOn ? 'text-green-800' : 'text-surface-300'} ${selectedMenuIndex === index + 4 ? 'text-white' : ''}`,
                    })}
                  </div>
                ))}
              </div>

              {/* Integrated Sub Menu */}
              {activeSubMenu && activeSubMenu !== 'HEALTH_METER' && (
                <div className="absolute inset-x-0 top-12 flex justify-center items-start z-40">
                  <div className={`px-4 py-2 rounded-b-lg shadow-md border-x border-b ${state.isLightOn ? 'bg-green-300/90 border-green-400' : 'bg-surface-700/90 border-surface-600'}`}>
                    <div className="flex space-x-4">
                      {MENU_ITEMS[selectedMenuIndex].subMenu?.map((item, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded ${subMenuIndex === index 
                            ? (state.isLightOn ? 'bg-green-500 text-white' : 'bg-surface-500 text-white') 
                            : (state.isLightOn ? 'bg-green-200 text-green-800' : 'bg-surface-600 text-surface-200')}`}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {needsAttention && (
                <div className="absolute inset-0 flex items-center justify-center z-40">
                  <div className={`text-2xl font-bold ${state.isLightOn ? 'text-red-500' : 'text-red-300'} animate-pulse`}>
                    ¡Atención!
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className={`text-2xl font-bold animate-pulse ${state.isLightOn ? 'text-green-800' : 'text-surface-300'}`}>Incubando...</div>
            </div>
          )}
        </>
      ) : isOn && !isReset ? (
        <div className="flex items-center justify-center h-full">
          <div className={`text-2xl font-bold ${state.isLightOn ? 'text-green-800' : 'text-surface-300'}`}>Presiona cualquier botón para iniciar</div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className={`text-2xl font-bold ${state.isLightOn ? 'text-green-800' : 'text-surface-300'}`}>Quita la pestaña para comenzar</div>
        </div>
      )}
    </div>
  )
}