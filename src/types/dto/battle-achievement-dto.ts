import { Pokemon } from "../Pokemon";

export type BattleAchievementDto = {
    victoria: boolean;
    logro: string;
    name1: string;
    name2: string;
    team1: Pokemon[];
    team2: Pokemon[];
    replay: string;
  }