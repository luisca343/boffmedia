import { LucideIcon } from 'lucide-react'

export interface TamagotchiState {
  hunger: number
  happiness: number
  health: number
  age: number
  weight: number
  discipline: number
  isSick: boolean
  isLightOn: boolean
  needsCleaning: boolean
  isSleeping: boolean
}

export type TamagotchiAction = 
  | { type: 'FEED'; subAction: 'MEAL' | 'SNACK' }
  | { type: 'LIGHT'; subAction: 'ON' | 'OFF' }
  | { type: 'PLAY' }
  | { type: 'MEDICINE' }
  | { type: 'CLEAN' }
  | { type: 'HEALTH' }
  | { type: 'DISCIPLINE' }
  | { type: 'ATTENTION' }
  | { type: 'SLEEP' }
  | { type: 'WAKE' }
  | { type: 'HEALTH_METER' }


export interface MenuItem {
  icon: LucideIcon
  action: string
  subMenu?: string[]
}