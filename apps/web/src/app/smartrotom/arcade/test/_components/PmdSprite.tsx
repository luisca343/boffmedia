import React, { useImperativeHandle, forwardRef } from "react";
import { PmdSpriteProps, PmdSpriteRef, Direction } from '../types';
import { useAnimationLogic } from '../_hooks/useAnimationLogic';
import { SpriteRenderer } from "./SpriteRenderer";

export const PmdSprite = forwardRef<PmdSpriteRef, PmdSpriteProps>(
  ({ num }, ref) => {
    const {
      currentFrame,
      direction,
      currentAnimation,
      error,
      horizontalOffset,
      loadedAnimations,
      setDirection,
      setCurrentAnimation,
      handleJump,
      setAnimSpeed,
      rotateLeft,
      rotateRight,
    } = useAnimationLogic(num);

    useImperativeHandle(ref, () => ({
      getDirection: () => direction,
      getCurrentAnimation: () => currentAnimation,
      setDirection: (newDirection: Direction) => setDirection(newDirection),
      setCurrentAnimation,
      handleJump,
      setAnimSpeed,
      rotateLeft,
      rotateRight,
    }));

    if (error) {
      return <div className="text-red-500 font-bold">Error: {error}</div>;
    }

    if (!currentAnimation) {
      return <div className="text-secondary-500 font-bold">Loading...</div>;
    }

    const currentAnim = loadedAnimations.find(
      (a) => a.Name === currentAnimation
    );
    if (!currentAnim) {
      return (
        <div className="text-red-500 font-bold">Error: Animation not found</div>
      );
    }

    return (
      <div
        className="relative w-72 h-72 flex items-end justify-center"
        style={{ pointerEvents: "none" }}
      >
        <SpriteRenderer
          num={num}
          currentFrame={currentFrame}
          direction={direction}
          currentAnimation={currentAnimation}
          currentAnim={currentAnim}
          horizontalOffset={horizontalOffset}
        />
      </div>
    );
  }
);

PmdSprite.displayName = "PmdSprite";