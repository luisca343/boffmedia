export interface AnimationData {
    Name: string;
    Index: number;
    FrameWidth: number;
    FrameHeight: number;
    Durations: number[];
    ShadowSize: number;
    Anims: Anims;
  }
  
  export interface Duration {
    Duration: number[];
  }
  
  export interface Anim {
    Name: string;
    Index: number;
    FrameWidth?: number;
    FrameHeight?: number;
    RushFrame?: number;
    HitFrame?: number;
    ReturnFrame?: number;
    CopyOf?: string;
    Durations?: Duration;
  }
  
  export interface Anims {
    Anim: Anim[];
  }
  
  export interface AnimData {
    ShadowSize: number;
    Anims: Anims;
  }
  
  export interface Xml {
    "@_version": string;
  }
  
  export interface RootObject {
    "?xml": Xml;
    AnimData: AnimData;
  }
  
  export interface PmdSpriteProps {
    num: number;
  }
  
  export enum Direction {
    Down = 0,
    DownRight = 1,
    Right = 2,
    UpRight = 3,
    Up = 4,
    UpLeft = 5,
    Left = 6,
    DownLeft = 7,
  }
  
  export interface PmdSpriteRef {
    getDirection: () => number;
    getCurrentAnimation: () => string;
    setDirection: (direction: Direction) => void;
    setCurrentAnimation: (animation: string) => void;
    setAnimSpeed: (speed: number) => void;
    handleJump: (time: number) => void;
    rotateLeft: () => void;
    rotateRight: () => void;
  }