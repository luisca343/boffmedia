import { useState } from "react";
import { GenderName, StatusName, TypeName } from "@smogon/calc/dist/data/interface";

export interface PokemonState {
  pokemonId: string;
  moveIds: string[];
  nature: string;
  evs: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  ivs: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  boosts: { atk: number; def: number; spa: number; spd: number; spe: number };
  level: number;
  teraType: TypeName;
  isTerastallized: boolean;
  forme: string;
  gender: GenderName;
  ability: string;
  item: string;
  status: StatusName;
  currentHp: number;
  currentHpPercent: number;
}

interface UsePokemonStateProps {
  initialState?: Partial<PokemonState>;
  role: "attacker" | "defender";
}

export function usePokemonState({ initialState, role }: UsePokemonStateProps) {
  const defaultState: PokemonState = {
    pokemonId: "",
    moveIds: ["", "", "", ""],
    nature: role === "attacker" ? "Modest" : "Bold",
    evs: role === "attacker" 
      ? { hp: 252, atk: 0, def: 0, spa: 252, spd: 0, spe: 4 }
      : { hp: 252, atk: 0, def: 252, spa: 0, spd: 4, spe: 0 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    level: 100,
    teraType: "Water" as TypeName,
    isTerastallized: false,
    forme: "",
    gender: "Male" as GenderName,
    ability: "",
    item: role === "attacker" ? "Heavy-Duty Boots" : "",
    status: "Healthy" as StatusName,
    currentHp: 383,
    currentHpPercent: 100
  };

  const [state, setState] = useState<PokemonState>({
    ...defaultState,
    ...initialState
  });

  const updateState = (newState: Partial<PokemonState>) => {
    setState(prevState => ({
      ...prevState,
      ...newState,
      evs: { ...prevState.evs, ...(newState.evs || {}) },
      ivs: { ...prevState.ivs, ...(newState.ivs || {}) },
      boosts: { ...prevState.boosts, ...(newState.boosts || {}) }
    }));
  };

  const updateMoveId = (index: number, moveId: string) => {
    const newMoveIds = [...state.moveIds];
    newMoveIds[index] = moveId;
    updateState({ moveIds: newMoveIds });
  };

  const calculateMaxHp = (baseHp: number): number => {
    return Math.floor(((2 * baseHp + state.ivs.hp + Math.floor(state.evs.hp / 4)) * state.level) / 100) + state.level + 10;
  };

  const updateHp = (hp: number, maxHp: number) => {
    const newPercentage = Math.min(Math.round((hp / maxHp) * 100), 100);
    updateState({
      currentHp: hp,
      currentHpPercent: newPercentage
    });
  };

  const updateHpPercent = (percent: number, maxHp: number) => {
    const newHp = Math.round((percent / 100) * maxHp);
    updateState({
      currentHp: newHp,
      currentHpPercent: percent
    });
  };

  const updateStatValue = (stat: string, value: number, isEV: boolean) => {
    if (stat === 'hp' || stat === 'atk' || stat === 'def' || stat === 'spa' || stat === 'spd' || stat === 'spe') {
      const statKey = stat as keyof typeof state.evs;
      updateState({
        [isEV ? 'evs' : 'ivs']: {
          ...state[isEV ? 'evs' : 'ivs'],
          [statKey]: value
        }
      });
    }
  };

  const updateBoost = (stat: string, value: number) => {
    if (stat === 'atk' || stat === 'def' || stat === 'spa' || stat === 'spd' || stat === 'spe') {
      const statKey = stat as keyof typeof state.boosts;
      updateState({
        boosts: {
          ...state.boosts,
          [statKey]: value
        }
      });
    }
  };

  return {
    state,
    updateState,
    updateMoveId,
    calculateMaxHp,
    updateHp,
    updateHpPercent,
    updateStatValue,
    updateBoost,
  };
}