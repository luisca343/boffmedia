import { useEffect } from "react";
import { useStarBankStore } from "../_stores/useStarBankStore";
import { useBoffSession } from "@/services/useBoffSession";

export default function useStarBank() {
    const { session } = useBoffSession();
    const { fetchAccounts } = useStarBankStore();

    useEffect(() => {
        if (session) {
            fetchAccounts(session);
        }
    }, [session, fetchAccounts]);

    return useStarBankStore();
}