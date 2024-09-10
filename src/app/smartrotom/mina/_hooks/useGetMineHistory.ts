"use client"
import { rotomGET } from "@/services/boffAPI";
import { useEffect, useState } from "react";
import { MineHistoryRegistry } from "../_types/History";
import { useSession } from "next-auth/react";
import { BoffSession } from "@/types";

export default function useMineHistory(){
    const {data: session} = useSession() as {data: BoffSession | null}
    const [mineHistory, setMineHistory] = useState<MineHistoryRegistry[]>([]);

    useEffect(() => {
        rotomGET(`/mine/history/${session?.user.smartRotomUser.uuid}`).then(res => {
            setMineHistory(res);
        })
    }, [session]);

    return { mineHistory, setMineHistory };
}