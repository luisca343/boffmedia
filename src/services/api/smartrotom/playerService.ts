import { rotomPOST, ApiResponse } from "@/services/boffAPI"
import { SuccessResponse } from "@/types"

type MinecraftStats = {
    stats: {
      "minecraft:custom": {
        "minecraft:play_one_minute": number;
      };
    };
  };

  type PokemonTeam = {
    statusCode: number;
    message: string;
    data: Pokemon[];
  };
  
  type Pokemon = {
    dex: number;
    nature: string;
    species: string;
    form: string;
    palette: string;
    name: string;
    level: number;
    item: string;
    ability: string;
    moves: (string | null)[];
    ivs: number[];
    evs: number[];
    stats: number[];
  };

export const playerService = {
  getStats: (uuid: string) => rotomPOST<MinecraftStats>("/player/stats", { uuid }),
  getTeam: (uuid: string) => rotomPOST<PokemonTeam>("/player/team", { uuid }),
}

