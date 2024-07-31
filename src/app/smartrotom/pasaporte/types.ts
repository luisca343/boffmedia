import { SmartRotomPost } from "@/types";
import { ActivePokemon } from "@/types/Pokemon";

interface AchievementData {
    replay: string
    team: ActivePokemon[]
}


export interface LogroCombate extends SmartRotomPost {
    npc: string;
    victoria: boolean;
    logro: string;
    equipo: ActivePokemon[];
    replay: string;
  }

  export interface SmartRotomAchievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    subcategory: string;
    target: number;
    progress: number;
    completed: boolean;
    completedAt: Date;
    uuid: string;
    data: string;
}

export function parseAchievementData(data: string): AchievementData {
    try {
        const parsed = JSON.parse(data)
        console.log(parsed)
        return parsed as AchievementData;
    } catch (e) {
        console.error('Error parsing achievement data', e);
        return {} as AchievementData;
    }
}