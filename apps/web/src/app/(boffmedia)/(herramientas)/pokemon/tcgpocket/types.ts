export interface Card {
    expansion: string
    number: number
    name: string
    count: number
  }
  
  export interface PackProbabilities {
    newCardProbabilities: number[]
    aggregateProbability: number
  }
  
  export interface RecentUpdate {
    id: number
    expansion: string
    cardNumber: number
    count: number
    updatedAt: string
    cardName: string
  }
  
  export interface PackData {
    name: string
    probabilities: PackProbabilities
  }
  
  export interface AllPackProbabilities {
    [packName: string]: PackProbabilities
  }