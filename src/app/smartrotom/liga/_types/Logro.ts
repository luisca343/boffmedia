import { PokemonData } from "./Pokemon";


export interface LogroCombate {
    npc: string;
    victoria: boolean;
    logro: string;
    team1: PokemonData[];
    team2: PokemonData[];
    replay: string;
  }