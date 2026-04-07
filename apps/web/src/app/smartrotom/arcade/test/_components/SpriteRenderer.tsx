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
  const directions = currentAnim.Name === "Sleep" ? 1 : 8;

  const frameWidth = currentAnim.FrameWidth * SPRITE_SCALE;
  const frameHeight = currentAnim.FrameHeight * SPRITE_SCALE;
  const backgroundImage = `url(/smartrotom/img/pmd/sprite/${padWithZeroes(num, 4)}/${currentAnimation}-Anim.png)`;
  const backgroundPosition = `-${currentFrame * frameWidth}px -${direction * frameHeight}px`;
  const backgroundSize = `${frameWidth * currentAnim.Durations.length}px ${frameHeight * directions}px`;

  return (
    <div
      style={{
        width: `${frameWidth}px`,
        height: `${frameHeight}px`,
        backgroundImage,
        backgroundPosition,
        backgroundSize,
        imageRendering: "pixelated",
        pointerEvents: "auto",
        transform: `translateX(${horizontalOffset}px)`,
        transition: "transform 0.05s ease-out",
      }}
    />
  );
};