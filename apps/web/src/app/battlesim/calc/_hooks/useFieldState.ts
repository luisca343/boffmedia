import { Field, Side } from "@smogon/calc";
import { useState } from "react";

interface UseFieldStateProps {
  initialState?: Partial<Field>;
}

// Create a proper Side object with the clone method
const createDefaultSide = (): Side => {
  return new Side({
    spikes: 0,
    steelsurge: false,
    vinelash: false,
    wildfire: false,
    cannonade: false,
    volcalith: false,
    isSR: false,
    isReflect: false,
    isLightScreen: false,
    isProtected: false,
    isSeeded: false,
    isForesight: false,
    isTailwind: false,
    isHelpingHand: false,
    isFlowerGift: false,
    isFriendGuard: false,
    isAuroraVeil: false,
    isBattery: false,
    isPowerSpot: false,
    isSwitching: undefined
  });
};

export function useFieldState({ initialState }: UseFieldStateProps = {}) {
  // Create a proper Field object with proper constructor
  const createDefaultField = (): Field => {
    return new Field({
      gameType: 'Singles',
      weather: undefined,
      terrain: undefined,
      isMagicRoom: false,
      isWonderRoom: false,
      isGravity: false,
      isAuraBreak: false,
      isFairyAura: false,
      isDarkAura: false,
      isBeadsOfRuin: false,
      isSwordOfRuin: false,
      isTabletsOfRuin: false,
      isVesselOfRuin: false,
      attackerSide: createDefaultSide(),
      defenderSide: createDefaultSide(),
      ...initialState
    });
  };

  const [state, setState] = useState<Field>(createDefaultField());

  const updateState = (newState: Partial<Field>) => {
    setState(prevState => {
      // Create a new Field object with the updated properties
      return new Field({
        ...prevState,
        ...newState,
        // Handle side updates specially to ensure they're proper Side objects
        attackerSide: newState.attackerSide || prevState.attackerSide,
        defenderSide: newState.defenderSide || prevState.defenderSide
      });
    });
  };

  return {
    state,
    updateState
  };
}