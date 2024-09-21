"use client"
import { rotomGET } from "@/services/boffAPI";
import { useEffect, useState } from "react";
import { MineHistoryRegistry } from "../_types/History";
import { BoffSession } from "@/types";
import { useBoffSession } from "@/services/useBoffSession";

export default function useMineHistory(){
    const { session } = useBoffSession();
    const [mineHistory, setMineHistory] = useState<MineHistoryRegistry[]>([]);

    useEffect(() => {
        rotomGET(`/mine/history/${session?.user.smartRotomUser.uuid}`).then(res => {
            setMineHistory(res);
        })
    }, [session]);

    return { mineHistory, setMineHistory };
}