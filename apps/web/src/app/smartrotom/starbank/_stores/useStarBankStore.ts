import { create } from "zustand";
import { getValidAccountId } from "../bankUtils";
import { Session } from "next-auth";
import { StarbankService } from "@/services/api/smartrotom/starbankService";
import { StarBankAccount } from "@boffmedia/shared";


interface StarBankState {
  accounts: StarBankAccount[];
  activeAccount: StarBankAccount | null;
  error: string | null;
  setAccounts: (accounts: StarBankAccount[]) => void;
  setActiveAccount: (id: number | null) => void;
  fetchAccounts: (session: Session) => Promise<void>;
}

// `useStarBank()` runs `fetchAccounts` in an effect and is mounted by the layout AND
// by every page under it, so each route issued two identical requests. Collapsing
// them onto one in-flight promise is what makes the second mount a no-op.
let inFlight: Promise<void> | null = null;

export const useStarBankStore = create<StarBankState>((set, get) => ({
  accounts: [],
  activeAccount: null,
  error: null,
  setAccounts: (accounts) => set({ accounts }),
  setActiveAccount: (id) => {
    const account = get().accounts.find(account => account.id === id) || null;
    set({ activeAccount: account });
  },
  fetchAccounts: async (session) => {
    const uuid = session?.user?.smartRotomUser?.uuid;
    if (!uuid) return;
    if (inFlight) return inFlight;

    inFlight = (async () => {
      try {
        // boffAPI resolves `{ success: false }` on an HTTP error rather than throwing,
        // so reading `.data!` optimistically left `accounts` undefined and the next
        // `.find()` threw as an unhandled rejection, with no error state anywhere.
        const res = await StarbankService.getUserAccounts(uuid);
        if (!res.success || !res.data) {
          set({ error: res.message || res.error || "No se pudieron cargar las cuentas" });
          return;
        }
        const accounts = res.data;
        const validAccountId = getValidAccountId(accounts);
        const activeAccount = accounts.find((account: { id: number; }) => account.id === validAccountId) || null;
        set({ accounts, activeAccount, error: null });
      } catch (err) {
        set({ error: err instanceof Error ? err.message : String(err) });
      } finally {
        inFlight = null;
      }
    })();

    return inFlight;
  },
}));