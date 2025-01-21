import { rotomGET } from "@/services/boffAPI";
import { BattleConfig } from "./_types/Battle";

export async function getBattleConfig(npcConfigName: string): Promise<BattleConfig> {
    return (await (rotomGET('/battleconfig/' + npcConfigName))).data as BattleConfig;
}