import { create } from "zustand";

export type AppError = Error | null;

export const useGlobalErrorStore = create<{
  error: AppError;
  setError: (error: AppError) => void;
  clearError: () => void;
}>((set) => ({
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

// Helper for direct import
export const throwRotomError = (error: AppError) =>
  useGlobalErrorStore.getState().setError(error);

export const clearRotomError = () =>
  useGlobalErrorStore.getState().clearError();