import { create } from "zustand";
import { getValidAccountId } from "../bankUtils";
import { Session } from "next-auth";
import { StarbankService } from "@/services/api/smartrotom/starbankService";
import { StarBankAccount } from "@/generated/api";


interface StarBankState {
  accounts: StarBankAccount[];
  activeAccount: StarBankAccount | null;
  setAccounts: (accounts: StarBankAccount[]) => void;
  setActiveAccount: (id: number | null) => void;
  fetchAccounts: (session: Session) => void;
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
      const accounts = (await StarbankService.getAccounts(session.user.smartRotomUser?.uuid!)).data!;
      const validAccountId = getValidAccountId(accounts);
      const activeAccount = accounts.find((account: { id: number; }) => account.id === validAccountId) || null;
      set({ accounts: accounts, activeAccount });
    }
  },
}));