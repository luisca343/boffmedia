export type Cell = {
    value: number
    revealed: boolean
    marks: number[]
  }
  
  export type RowColInfo = {
    coins: number
    voltorbs: number
  }
  
  export type LevelConfig = {
    x2s: number
    x3s: number
    voltorbs: number
    maxCoins: number
  }