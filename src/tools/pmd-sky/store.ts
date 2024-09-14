import { create } from "zustand";

export interface SkyFormData {
  questType: string;
  dungeon: string;
  floor: string;
  clientPokemon: string;
  targetPokemon: string;
  targetItem: string;
  rewardType: string;
  rewardItem: string;
  europeanVersion: boolean;
  generatedQuest: string;
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
    questType: "0",
    dungeon: "",
    floor: "",
    clientPokemon: "",
    targetPokemon: "",
    targetItem: "",
    rewardType: "",
    rewardItem: "",
    europeanVersion: false,
    generatedQuest: "",
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