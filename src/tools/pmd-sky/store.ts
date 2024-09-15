import { create } from "zustand";

export interface SkyFormData {
  questType: number;
  dungeon: number;
  floor: number;
  clientPokemon: number;
  targetPokemon: number;
  targetItem: number;
  rewardType: number;
  rewardItem: number;
  europeanVersion: boolean;
  generatedQuest: number;
  flavorText: string;
}

interface FormState {
  formData: SkyFormData;
  targetAvailable: boolean;
  setFormData: (data: Partial<SkyFormData>) => void;
  setTargetAvailable: (available: boolean) => void;
}

export const useFormStore = create<FormState>((set, get) => ({
  formData: {
    questType: 0,
    dungeon: 1,
    floor: 1,
    clientPokemon: 0,
    targetPokemon: 0,
    targetItem: 0,
    rewardType: 0,
    rewardItem: 0,
    europeanVersion: false,
    generatedQuest: 0,
    flavorText: "",
  },
  targetAvailable: false,
  setFormData: (data) => {
    // Print the data to the console
    console.log("Data to update:", data);

    set((state) => {
      const newState = { ...state.formData, ...data };
      console.log("Updated state:", newState);
      return { formData: newState };
    });
  },
  setTargetAvailable: (available) =>
    set(() => ({ targetAvailable: available })),
}));