import { rotomGET } from "@/services/boffAPI";
import { BattleConfig } from "./_types/Battle";

export async function getBattleConfig(npcConfigName: string): Promise<BattleConfig | null> {
    // HTTP failures resolve to `{ success: false }` with no `data` — casting that to
    // BattleConfig hands the caller an `undefined` that type-checks as a real config.
    const res = await rotomGET('/battleconfig/' + npcConfigName);
    if (!res.success || !res.data) return null;
    return res.data as BattleConfig;
}