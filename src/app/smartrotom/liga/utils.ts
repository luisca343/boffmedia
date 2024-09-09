import { rotomGET } from "@/services/boffAPI";

export async function getBattleConfig(npcConfigName: string){
    const response = await rotomGET('/battleconfig/' + npcConfigName)
    return response
}