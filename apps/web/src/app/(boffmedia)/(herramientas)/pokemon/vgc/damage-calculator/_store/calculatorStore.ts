'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { createCalcSlice } from './slices/calcSlice'
import { createMatrixSlice } from './slices/matrixSlice'
import { createSavedSlice } from './slices/savedSlice'
import type { CalculatorState } from './types'

export { defaultPokemon, DEFAULT_FIELD } from './slices/calcSlice'
export type { CalculatorState } from './types'

export const useCalculatorStore = create<CalculatorState>()(
  subscribeWithSelector((...args) => ({
    ...createCalcSlice(...args),
    ...createMatrixSlice(...args),
    ...createSavedSlice(...args),
  })),
)
