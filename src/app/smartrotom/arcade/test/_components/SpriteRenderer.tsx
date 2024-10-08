import React from 'react';
import { AnimationData } from '../types';
import { padWithZeroes } from '@/lib/utils';
import { SPRITE_SCALE } from '../_util/constants';

interface SpriteRendererProps {
  num: number;
  currentFrame: number;
  direction: number;
  currentAnimation: string;
  currentAnim: AnimationData;
  horizontalOffset: number;
}

export const SpriteRenderer: React.FC<SpriteRendererProps> = ({
  num,
  currentFrame,
  direction,
  currentAnimation,
  currentAnim,
  horizontalOffset,
}) => {
  return (
    <div
      style={{
        width: `${currentAnim.FrameWidth * SPRITE_SCALE}px`,
        height: `${currentAnim.FrameHeight * SPRITE_SCALE}px`,
        backgroundImage:
          currentAnimation === "Hop"
            ? `url(/smartrotom/img/pmd/sprite/${padWithZeroes(num, 4)}/Hop-Anim.png)`
            : `url(/smartrotom/img/pmd/sprite/${padWithZeroes(num, 4)}/Walk-Anim.png)`,
        backgroundPosition: `-${
          currentFrame * currentAnim.FrameWidth * SPRITE_SCALE
        }px -${direction * currentAnim.FrameHeight * SPRITE_SCALE}px`,
        backgroundSize: `${
          currentAnim.FrameWidth * currentAnim.Durations.length * SPRITE_SCALE
        }px ${currentAnim.FrameHeight * 8 * SPRITE_SCALE}px`,
        imageRendering: "pixelated",
        pointerEvents: "auto",
        transform: `translateX(${horizontalOffset}px)`,
        transition: "transform 0.05s ease-out",
      }}
    />
  );
};