import { create } from "zustand";
import { BoffSession } from "@/components/smartrotom/AppWrapper";
import { rotomGET } from "@/services/boffAPI";
import { getValidAccountId } from "../bankUtils";

interface Account {
  id: number;
}

interface StarBankState {
  accounts: Account[];
  activeAccount: Account | null;
  setAccounts: (accounts: Account[]) => void;
  setActiveAccount: (id: number | null) => void;
  fetchAccounts: (session: BoffSession) => void;
}

export const useStarBankStore = create<StarBankState>((set, get) => ({
  accounts: [],
  activeAccount: null,
  setAccounts: (accounts) => set({ accounts }),
  setActiveAccount: (id) => {
    const account = get().accounts.find(account => account.id === id) || null;
    set({ activeAccount: account });
  },
  fetchAccounts: async (session) => {
    if (session?.user) {
      const res = await rotomGET(
        "/starbank/accounts/" + session.user.smartRotomUser.uuid
      );
      const validAccountId = getValidAccountId(res);
      const activeAccount = res.find((account: { id: number; }) => account.id === validAccountId) || null;
      set({ accounts: res, activeAccount });
    }
  },
}));