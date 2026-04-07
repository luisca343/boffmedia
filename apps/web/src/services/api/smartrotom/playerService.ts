import { rotomPOST, ApiResponse } from "@/services/boffAPI"

export type MinecraftStats = {
  stats: {
    "minecraft:custom": {
      "minecraft:play_one_minute": number;
      "minecraft:deaths": number;
      "minecraft:damage_dealt": number;
      "minecraft:walk_one_cm": number;
      "minecraft:sprint_one_cm": number;
      "minecraft:horse_one_cm": number;
      "minecraft:boat_one_cm": number;
      "minecraft:swim_one_cm": number;
      "minecraft:mob_kills": number;
      "minecraft:jump": number;
      "minecraft:leave_game": number;
      "minecraft:time_since_death": number;
      "minecraft:sneak_time": number;
      "minecraft:fly_one_cm": number;
      "minecraft:walk_under_water_one_cm": number;
      "minecraft:walk_on_water_one_cm": number;
      "minecraft:fall_one_cm": number;
      "minecraft:crouch_one_cm": number;
      "minecraft:time_since_rest": number;
      "minecraft:damage_taken": number;
      "minecraft:damage_dealt_absorbed": number;
      "minecraft:interact_with_crafting_table": number;
      "minecraft:open_chest": number;
      [key: string]: number; // For any other custom stats
    };
    "minecraft:killed": {
      "customnpcs:customnpc": number;
      "pixelmon:npc_trainer": number;
      "pixelmon:npc_shopkeeper": number;
      [key: string]: number; // For any other entities killed
    };
    "minecraft:mined"?: {
      [key: string]: number;
    };
    "minecraft:used"?: {
      [key: string]: number;
    };
    "minecraft:picked_up"?: {
      [key: string]: number;
    };
    "minecraft:dropped"?: {
      [key: string]: number;
    };
    "minecraft:crafted"?: {
      [key: string]: number;
    };
  }
};


  export type Pokemon = {
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

export class PlayerService {
  /**
   * Get player statistics
   */
  static getStats(uuid: string) {
    return rotomPOST<MinecraftStats>("/player/stats", { uuid });
  }

  /**
   * Get player's Pokemon team
   */
  static getTeam(uuid: string) {
    return rotomPOST<Pokemon[]>("/player/team", { uuid });
  }
}

