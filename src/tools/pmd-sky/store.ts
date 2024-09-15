import { create } from "zustand";
import { getFloors } from "./DungeonData";

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
    if(data.dungeon !== undefined) {
      const newFloor = Math.min(get().formData.floor, getFloors(data.dungeon));
      data.floor = newFloor;
    }

    set((state) => {
      const newState = { ...state.formData, ...data };
      return { formData: newState };
    });
  },
  setTargetAvailable: (available) =>
    set(() => ({ targetAvailable: available })),
}));