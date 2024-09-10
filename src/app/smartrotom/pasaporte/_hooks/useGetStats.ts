import { rotomPOST } from "@/services/boffAPI";
import { useEffect, useState } from "react";

export function useGetStats(uuid: string) {
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        rotomPOST('/stats',{uuid}).then((res)=>{
            setStats(res)
          })
    }, [])

    return { stats, setStats }

}