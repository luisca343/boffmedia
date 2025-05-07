import { useState } from "react";

export interface FieldState {
  gameType: 'Singles' | 'Doubles';
  terrain: '' | 'Electric' | 'Grassy' | 'Misty' | 'Psychic';
  weather: '' | 'Sun' | 'Rain' | 'Sand' | 'Snow' | 'Harsh Sunshine' | 'Heavy Rain' | 'Strong Winds';
  isGravity: boolean;
  isSR: boolean; // Stealth Rock
  isSpikes: number; // 0, 1, 2, or 3 layers
  isToxicSpikes: number; // 0, 1, or 2 layers
  isReflect: boolean;
  isLightScreen: boolean;
  isAuroraVeil: boolean;
  isProtected: boolean;
  isForesight: boolean;
  isHelpingHand: boolean;
  isFriendGuard: boolean;
  isVineLash: boolean;
  isWildfire: boolean;
  isCannonade: boolean;
  isVolcalith: boolean;
  isTailwind: boolean;
}

interface UseFieldStateProps {
  initialState?: Partial<FieldState>;
}

export function useFieldState({ initialState }: UseFieldStateProps = {}) {
  const defaultState: FieldState = {
    gameType: 'Singles',
    terrain: '',
    weather: '',
    isGravity: false,
    isSR: false,
    isSpikes: 0,
    isToxicSpikes: 0,
    isReflect: false,
    isLightScreen: false,
    isAuroraVeil: false,
    isProtected: false,
    isForesight: false,
    isHelpingHand: false,
    isFriendGuard: false,
    isVineLash: false,
    isWildfire: false,
    isCannonade: false,
    isVolcalith: false,
    isTailwind: false
  };

  const [state, setState] = useState<FieldState>({
    ...defaultState,
    ...initialState
  });

  const updateState = (newState: Partial<FieldState>) => {
    setState(prevState => ({
      ...prevState,
      ...newState
    }));
  };

  return {
    state,
    updateState
  };
}