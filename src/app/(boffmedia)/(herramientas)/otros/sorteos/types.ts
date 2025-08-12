export type Participant = {
    name: string;
    selected?: boolean;
  }
  
  export type GiveawayState = {
    isSpinning: boolean;
    showWinner: boolean;
    participants: Participant[];
    winner: string | null;
    previousWinners: string[];
  }