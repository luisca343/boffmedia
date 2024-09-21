import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSessionStore } from "@/stores/useSessionStore";
import { BoffSession } from "@/components/smartrotom/AppWrapper";

export const useBoffSession = () => {
    const { data: session, status } = useSession() as any;
    const setSession = useSessionStore((state) => state.setSession);
    const setSessionStatus = useSessionStore((state) => state.setStatus);

    useEffect(() => {
        if (session) {
            setSession(session as BoffSession);
        }
    }, [session, setSession]);

    useEffect(() => {
        setSessionStatus(status);
    }, [status, setSessionStatus]);

    return { session, status } as { session: BoffSession, status: string };
};