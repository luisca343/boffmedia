import { create } from "zustand";
import { getFloors } from "./DungeonData";
import { rotomGET } from "@/services/boffAPI";
import { pmdSkyPokemon } from "./PokemonData";
import { getForceClient, getForceTarget, givesItem } from "./QuestData";
import { boolean } from "zod";

export interface SkyFormData {
  questType: number;
  specialQuestType: number;
  clientIsTarget: boolean;
  specialFloor: number;
  useTargetItem: boolean;
  forceClient: number;
  forceTarget: number;

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

  clientSprite: string;
  targetSprite: string;
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
    specialQuestType: 0,
    clientIsTarget: false,
    specialFloor: 0,
    useTargetItem: false,
    forceClient: 0,
    forceTarget: 0,

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
    clientSprite: "/smartrotom/img/pmd/portrait/0201/0027/Normal.png",
    targetSprite: "/smartrotom/img/pmd/portrait/0201/0027/Normal.png"
  },
  targetAvailable: false,
  setFormData: async (data) => {
    // Print the data to the console
    console.log("Data to update:", data);

    if(data.questType !== undefined) {
      if(data.questType === 11){
        data.specialQuestType = 1;
        data.forceClient = getForceClient(data.questType, data.specialQuestType);
        data.forceTarget = getForceTarget(data.questType, data.specialQuestType);
        
      } else {
        data.specialQuestType = 0;
      }
    }

    if(data.rewardType !== undefined) {
      if(!givesItem(data.rewardType)) {
        data.rewardItem = 0;
      }
    }

    if(data.forceClient !== undefined && data.forceClient > 0) {
      data.clientPokemon = data.forceClient;
      const clientSprite = await rotomGET(`/pokemon/pmd/${pmdSkyPokemon[data.clientPokemon]}`);
      data.clientSprite = clientSprite.url;
    }

    if(data.forceTarget !== undefined && data.forceTarget > 0) {
      data.targetPokemon = data.forceTarget;
      const targetSprite = await rotomGET(`/pokemon/pmd/${pmdSkyPokemon[data.targetPokemon]}`);
      data.targetSprite = targetSprite.url;
    }

    if(data.dungeon !== undefined) {
      const newFloor = Math.min(get().formData.floor, getFloors(data.dungeon));
      data.floor = newFloor;
    }

    if(data.clientPokemon !== undefined) {
      const clientSprite = await rotomGET(`/pokemon/pmd/${pmdSkyPokemon[data.clientPokemon]}`);
      data.clientSprite = clientSprite.url;
    }
    
    if(data.targetPokemon !== undefined) {
      const targetSprite = await rotomGET(`/pokemon/pmd/${pmdSkyPokemon[data.targetPokemon]}`);
      data.targetSprite = targetSprite.url;
    }


    set((state) => {
      const newState = { ...state.formData, ...data };
      return { formData: newState };
    });
  },
  setTargetAvailable: (available) =>
    set(() => ({ targetAvailable: available })),
}));