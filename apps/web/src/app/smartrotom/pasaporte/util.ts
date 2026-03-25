import { ActivePokemon } from "@/types/Pokemon";

interface AchievementData {
    replay: string
    team: ActivePokemon[]
}

export function parseAchievementData(data: string): AchievementData {
    try {
        const parsed = JSON.parse(data)
        return parsed as AchievementData;
    } catch (e) {
        console.error('Error parsing achievement data', e);
        return {} as AchievementData;
    }
}