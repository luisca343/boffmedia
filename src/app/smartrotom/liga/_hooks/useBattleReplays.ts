import { BoffSession } from "@/components/smartrotom/AppWrapper";
import { getSmartRotomUser } from "@/lib/utils";
import { rotomGET } from "@/services/boffAPI";
import { useEffect, useState } from "react";
import { BattleReplay } from "../_types/Battle";

function useBattleReplays(session: BoffSession) {
    const [replays, setReplays] = useState<BattleReplay[]>([]);

    useEffect(() => {
        rotomGET(`/repeticiones/${getSmartRotomUser(session).uuid}`).then((res) => {
            setReplays(res);
        });
    }, [session]);

    return { replays, setReplays };
}

export default useBattleReplays;