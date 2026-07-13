import { useEffect } from "react";
import { useStarBankStore } from "../_stores/useStarBankStore";
import { useRotomUuid } from "@/components/smartrotom/behavior/useRotomUuid";
import { getValidAccountId } from "../bankUtils";
import { userMessageFrom } from "@/services/boffAPI";
import { useAccounts } from "./queries";

/**
 * The account list + the trainer's active selection — the same shape every page under
 * `/starbank` was already destructuring, now backed by the cached query instead of a
 * store-owned fetch. The active account is picked once per accounts load (from
 * localStorage via `getValidAccountId`, falling back to the first account) and then
 * left alone: a later refetch (e.g. after creating an account) must not silently swap
 * the account the trainer is looking at out from under them.
 */
export default function useStarBank() {
  const uuid = useRotomUuid();
  const { data: accounts, error, isLoading, refetch } = useAccounts(uuid);
  const { activeAccountId, setActiveAccountId } = useStarBankStore();

  useEffect(() => {
    if (!accounts || accounts.length === 0) return;
    const stillValid = accounts.some((a) => a.id === activeAccountId);
    if (activeAccountId != null && stillValid) return;
    setActiveAccountId(getValidAccountId(accounts));
  }, [accounts, activeAccountId, setActiveAccountId]);

  const activeAccount = accounts?.find((a) => a.id === activeAccountId) ?? null;

  return {
    accounts: accounts ?? [],
    activeAccount,
    setActiveAccount: setActiveAccountId,
    error: error ? userMessageFrom(error, "No se pudieron cargar las cuentas") : null,
    isLoading,
    refetch,
  };
}
