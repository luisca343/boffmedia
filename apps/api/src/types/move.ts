export interface Effect {
  drainPercent?: number;
  modifiers: any[];
  persists: boolean;
  effectTypeID: string;
}

export interface AnimationEffect {
  id: string;
  inverted: boolean;
  scale: number;
  texture: string;
  speed: number;
}

export interface Animation {
  id: string;
  effects: { [key: string]: AnimationEffect };
}

export interface TargetingInfo {
  hitsAll: boolean;
  hitsOppositeFoe: boolean;
  hitsAdjacentFoe: boolean;
  hitsExtendedFoe: boolean;
  hitsSelf: boolean;
  hitsAdjacentAlly: boolean;
  hitsExtendedAlly: boolean;
}

export interface Z {
  crystal: string;
  attackName: string;
  basePower: number;
  effects: any[];
  allowedPokemon: any[];
}

export interface Attack {
  attackIndex: number;
  attackName: string;
  attackType: string;
  attackCategory: string;
  basePower: number;
  ppBase: number;
  ppMax: number;
  accuracy: number;
  makesContact: boolean;
  effects: Effect[];
  animations: Animation[];
  targetingInfo: TargetingInfo;
  z: Z[];
}
