import { create } from "zustand";

interface StarBankUiState {
  activeAccountId: number | null;
  setActiveAccountId: (id: number | null) => void;
}

// Purely UI state now — which account the trainer has selected. The account list and
// its balances live in TanStack Query (`_hooks/queries.ts`); this store never fetches.
export const useStarBankStore = create<StarBankUiState>((set) => ({
  activeAccountId: null,
  setActiveAccountId: (id) => set({ activeAccountId: id }),
}));
