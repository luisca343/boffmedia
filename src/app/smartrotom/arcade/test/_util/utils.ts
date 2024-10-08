import { AnimationData, AnimData } from "../types";
import { FRAME_DURATION_MULTIPLIER } from "./constants";

export function calculateNextFrame(
  currentFrame: number,
  durations: number[],
  speed: number
): number {
  const frameDuration =
    (durations[currentFrame] / speed) * FRAME_DURATION_MULTIPLIER;
  return (currentFrame + 1) % durations.length;
}

export function getMiddleFrame(durations: number[]): number {
  return Math.floor(durations.length / 2) - 1;
}

export function calculateTotalAnimationTime(durations: number[]): number {
  return (
    durations.reduce((acc, val) => acc + val, 0) / FRAME_DURATION_MULTIPLIER
  );
}

export async function loadAnimData(
  animData: AnimData,
  name: string
): Promise<AnimationData> {
  const anims = Array.isArray(animData.Anims.Anim)
    ? animData.Anims.Anim
    : [animData.Anims.Anim];

  const anim:
    | {
        Name: string;
        Index: number;
        FrameWidth?: number;
        FrameHeight?: number;
        Durations?: { Duration: number | number[] };
      }
    | undefined = anims.find((a: { Name: string }) => a.Name === name);

  if (!anim) {
    throw new Error(`Animation "${name}" not found 1`);
  }

  return {
    Name: anim.Name,
    Index: anim.Index,
    FrameWidth: anim.FrameWidth || 0,
    FrameHeight: anim.FrameHeight || 0,
    Durations: Array.isArray(anim.Durations?.Duration)
      ? anim.Durations.Duration
      : [anim.Durations?.Duration || 0],
    ShadowSize: animData.ShadowSize,
    Anims: animData.Anims,
  } as AnimationData;
}
