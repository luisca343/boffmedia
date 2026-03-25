import { useState, useEffect, useCallback, useReducer } from 'react'
import { TamagotchiState, TamagotchiAction } from '../types'
import { INITIAL_TAMAGOTCHI_STATE } from '../constants'

function tamagotchiReducer(state: TamagotchiState, action: TamagotchiAction): TamagotchiState {
  switch (action.type) {
    case 'FEED':
      return {
        ...state,
        hunger: Math.max(state.hunger - (action.subAction === 'MEAL' ? 25 : 10), 0),
      }
    case 'LIGHT':
      return { ...state, isLightOn: action.subAction === 'ON' }
    case 'PLAY':
      return { ...state, happiness: Math.min(state.happiness + 10, 100) }
    case 'MEDICINE':
      if (state.isSick) {
        const newHealth = Math.min(state.health + 20, 100)
        return { ...state, health: newHealth, isSick: newHealth < 100 }
      }
      return state
    case 'CLEAN':
      return { ...state, needsCleaning: false, happiness: Math.min(state.happiness + 5, 100) }
    case 'HEALTH_METER':
      return state
    case 'DISCIPLINE':
      return { ...state, discipline: Math.min(state.discipline + 10, 100) }
    case 'ATTENTION':
      return state
    case 'SLEEP':
      return { ...state, isSleeping: true, isLightOn: false }
    case 'WAKE':
      return { ...state, isSleeping: false, isLightOn: true }
    default:
      return state
  }
}

export function useTamagotchi() {
  const [state, dispatch] = useReducer(tamagotchiReducer, INITIAL_TAMAGOTCHI_STATE)
  const [isOn, setIsOn] = useState(false)
  const [isReset, setIsReset] = useState(false)
  const [isHatched, setIsHatched] = useState(false)
  const [needsAttention, setNeedsAttention] = useState(false)
  const [feedingState, setFeedingState] = useState({
    isFeeding: false,
    foodType: null as 'MEAL' | 'SNACK' | null,
    animationProgress: 0,
  })

  useEffect(() => {
    if (isReset && !isHatched) {
      setTimeout(() => {
        setIsHatched(true)
        setNeedsAttention(true)
      }, 5000)
    }
  }, [isReset, isHatched])

  useEffect(() => {
    if (isOn && isReset && isHatched) {
      const timer = setInterval(() => {
        dispatch({ type: 'FEED', subAction: 'SNACK' }) // Simulating hunger increase
        if (Math.random() < 0.1) {
          dispatch({ type: 'CLEAN' }) // 10% chance to need cleaning
        }
        if (Math.random() < 0.05) {
          dispatch({ type: 'MEDICINE' }) // 5% chance to get sick
        }
      }, 10000) // Every 10 seconds

      return () => clearInterval(timer)
    }
  }, [isOn, isReset, isHatched])

  useEffect(() => {
    if (feedingState.isFeeding) {
      const animationTimer = setInterval(() => {
        setFeedingState(prev => ({
          ...prev,
          animationProgress: Math.min(prev.animationProgress + 0.05, 1),
        }))
      }, 50)

      setTimeout(() => {
        setFeedingState({
          isFeeding: false,
          foodType: null,
          animationProgress: 0,
        })
        clearInterval(animationTimer)
      }, 1000)

      return () => clearInterval(animationTimer)
    }
  }, [feedingState.isFeeding])

  // Automatic sleep and wake cycle
  useEffect(() => {
    if (isOn && isReset && isHatched) {
      const sleepTimer = setInterval(() => {
        const currentHour = new Date().getHours()
        if (currentHour >= 22 || currentHour < 6) {
          dispatch({ type: 'SLEEP' })
        } else {
          dispatch({ type: 'WAKE' })
        }
      }, 60000) // Check every minute

      return () => clearInterval(sleepTimer)
    }
  }, [isOn, isReset, isHatched])

  const turnOn = useCallback(() => setIsOn(true), [])
  const reset = useCallback(() => setIsReset(true), [])
  const performAction = useCallback((action: TamagotchiAction) => {
    dispatch(action)
    if (action.type === 'FEED') {
      setFeedingState({
        isFeeding: true,
        foodType: action.subAction as 'MEAL' | 'SNACK',
        animationProgress: 0,
      })
    }
    setNeedsAttention(false)
  }, [])

  return {
    state,
    isOn,
    isReset,
    isHatched,
    needsAttention,
    feedingState,
    turnOn,
    reset,
    performAction,
  }
}