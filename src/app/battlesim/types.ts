import { Battle } from "@pkmn/client";

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


export interface ReplayData {
  side1: string
  side2: string
  team1: string
  team2: string
  replay: string
  winner: number
  createdAt: string
}


// Extend the Battle type to include winner property
declare module "@pkmn/client" {
  interface Battle {
    winner?: string;
  }
}