import type { CalcSlice } from './slices/calcSlice'
import type { MatrixSlice } from './slices/matrixSlice'
import type { SavedSlice } from './slices/savedSlice'

export type CalculatorState = CalcSlice & MatrixSlice & SavedSlice
