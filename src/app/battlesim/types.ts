import { PokemonIdent } from "@pkmn/protocol";

/**
 * Position data for scene elements
 */
export interface ScenePos {
  x?: number;
  y?: number;
  z?: number;
  scale?: number;
  xscale?: number;
  yscale?: number;
  opacity?: number;
  time?: number;
  display?: string;
}

/**
 * Animation data object
 */
export interface AnimationData {
  animType: string;
  transition: ScenePos;
  type?: string;
  callback?: () => void;
}

/**
 * Starting position for animations
 */
export interface StartingPosition {
  top: number;
  left: number;
}

/**
 * Props for animations
 */
export interface AnimationProps {
  startingPosition: StartingPosition;
  [key: string]: any;
}