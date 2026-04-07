export interface Game {
    id: number;
    title: string;
    description: string | null;
    icon: string;
  }
  
  export interface Event {
    id: number;
    title: string;
    game: number;
    description: string | null;
    startDate: string;
    endDate: string;
  }
  
  export interface EventParticipant {
    userId: string;
    eventId: number;
    comment: string | null;
  }
  
  export interface Achievement {
    id: number;
    eventId: number;
    title: string;
    description: string | null;
    icon: string;
    target: number;
    rarity: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    points: number;
  }
  
  export interface AchievementProgress {
    userId: string;
    achievementId: number;
    progress: number;
  }