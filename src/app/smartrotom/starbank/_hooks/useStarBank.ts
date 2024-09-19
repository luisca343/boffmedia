import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useStarBankStore } from "./useStarBankStore";
import { BoffSession } from "@/types";

export default function useStarBank() {
    const { data: session } = useSession() as { data: BoffSession | null };
    const { fetchAccounts } = useStarBankStore();

    useEffect(() => {
        if (session) {
            fetchAccounts(session);
        }
    }, [session, fetchAccounts]);

    return useStarBankStore();
}