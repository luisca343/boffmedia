import { create } from "zustand";
import { getFloors } from "./DungeonData";
import { assetUrl } from "@boffmedia/tool-kit";
import { pmdPortraitPath } from "./portraits";
import { getForceClient, getForceTarget, givesItem } from "./QuestData";

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

/** The host turns the tool's root-relative asset path into something its
 *  document can load: same origin on the web, the app's own copy on desktop. */
function portrait(index: number): string {
  const path = pmdPortraitPath(index);
  return path ? assetUrl(path) : "";
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
    clientSprite: "",
    targetSprite: ""
  },
  targetAvailable: false,
  // Synchronous on purpose. This used to await one API call per sprite, which
  // meant a selection only applied once the network answered — and when the
  // call threw, the `set()` at the bottom was never reached and the player's
  // choice vanished with no error anywhere.
  setFormData: (data) => {
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
      data.clientSprite = portrait(data.clientPokemon);
    }

    if(data.forceTarget !== undefined && data.forceTarget > 0) {
      data.targetPokemon = data.forceTarget;
      data.targetSprite = portrait(data.targetPokemon);
    }

    if(data.dungeon !== undefined) {
      const newFloor = Math.min(get().formData.floor, getFloors(data.dungeon));
      data.floor = newFloor;
    }

    if(data.clientPokemon !== undefined) {
      data.clientSprite = portrait(data.clientPokemon);
    }
    
    if(data.targetPokemon !== undefined) {
      data.targetSprite = portrait(data.targetPokemon);
    }


    set((state) => {
      const newState = { ...state.formData, ...data };
      return { formData: newState };
    });
  },
  setTargetAvailable: (available) =>
    set(() => ({ targetAvailable: available })),
}));