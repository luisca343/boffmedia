export interface CommonReward {
    id: string
    quantity: string
  }
  
  export interface Card {
    pack: string
    cardNumber: number
    quantity: number
  }
  
  export interface BattleTask {
    mission: string
    reward: {
      id: string
      quantity: number
    }
  }
  
  export interface Quest {
    name: string
    deckListing: Card[]
    battleTasks: BattleTask[]
  }
  
  export interface QuestData {
    commonRewards: CommonReward[]
    quests: Quest[]
  }
  