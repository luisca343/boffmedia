import { useState, useEffect, useRef, useCallback } from 'react';
import { XMLParser } from "fast-xml-parser";
import { AnimationData, AnimData, RootObject, Direction } from '../types';
import { calculateNextFrame, loadAnimData } from '../_util/utils';
import { padWithZeroes } from '@/lib/utils';
import { GLIDE_INTERVAL, GLIDE_SPEED, MAX_GLIDE_OFFSET } from '../_util/constants';

export function useAnimationLogic(num: number) {
  const [animData, setAnimData] = useState<AnimData | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [direction, setDirection] = useState(0);
  const [currentAnimation, setCurrentAnimation] = useState<string>("Walk");
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [customDurations, setCustomDurations] = useState<number[] | null>(null);
  const [horizontalOffset, setHorizontalOffset] = useState(0);
  const [isGliding, setIsGliding] = useState(false);
  const [loadedAnimations, setLoadedAnimations] = useState<AnimationData[]>([]);
  const glideDirectionRef = useRef(1);

  const loadAnimDataFile = useCallback(async (url: string) => {
    const response = await fetch(url);
    const xmlData = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const data = parser.parse(xmlData) as RootObject;
    setAnimData(data.AnimData);

    loadAllAnimations(data.AnimData);
  }, []);

  useEffect(() => {
    loadAnimDataFile(
      `/smartrotom/img/pmd/sprite/${padWithZeroes(num, 4)}/AnimData.xml`
    );
  }, [num, loadAnimDataFile]);

  const handleAnimation = useCallback((
    loadedAnimations: AnimationData[],
    currentAnimation: string,
    setCurrentFrame: React.Dispatch<React.SetStateAction<number>>,
    setCurrentAnimation: React.Dispatch<React.SetStateAction<string>>,
    setError: React.Dispatch<React.SetStateAction<string | null>>,
    currentFrame: number
  ) => {
    if (!loadedAnimations) return;
    setError(null);

    const currentAnim = loadedAnimations.find(
      (a) => a.Name === currentAnimation
    );
    if (!currentAnim) {
      setError(`Animation "${currentAnimation}" not found 2`);
      return;
    }

    const durations = customDurations || currentAnim.Durations;

    const animationLoop = setInterval(() => {
      setCurrentFrame((prevFrame: number) => {
        const nextFrame = calculateNextFrame(prevFrame, durations, speed);
        if (currentAnimation === "Hop" && nextFrame === 0) {
          setCurrentAnimation("Walk");
          setSpeed(1);
          setCustomDurations(null);
          setHorizontalOffset(0);
          setIsGliding(false);
        }
        return nextFrame;
      });

      // Update gliding state
      if (currentAnimation === "Hop") {
        const middleFrame = Math.floor(durations.length / 2) - 1;
        setIsGliding(currentFrame === middleFrame);
      }
    }, (durations[currentFrame] / speed) * 25);

    return () => clearInterval(animationLoop);
  }, [customDurations, speed]);

  useEffect(
    () =>
      handleAnimation(
        loadedAnimations,
        currentAnimation,
        setCurrentFrame,
        setCurrentAnimation,
        setError,
        currentFrame
      ),
    [currentFrame, currentAnimation, loadedAnimations, handleAnimation]
  );

  useEffect(() => {
    if (isGliding) {
      const glideInterval = setInterval(() => {
        setHorizontalOffset((prevOffset) => {
          const newOffset = prevOffset + GLIDE_SPEED * glideDirectionRef.current;
          if (Math.abs(newOffset) >= MAX_GLIDE_OFFSET) {
            glideDirectionRef.current *= -1;
          }
          return Math.max(-MAX_GLIDE_OFFSET, Math.min(MAX_GLIDE_OFFSET, newOffset));
        });
      }, GLIDE_INTERVAL);

      return () => clearInterval(glideInterval);
    }
  }, [isGliding]);

  function handleJump(animationTime: number = 1) {
    if (currentAnimation !== "Hop") {
      const hopAnimation = loadedAnimations.find((a) => a.Name === "Hop");
      if (!hopAnimation) return;

      const totalAnimFrames = hopAnimation.Durations.reduce(
        (acc, val) => acc + val,
        0
      );
      const totalAnimSeconds = totalAnimFrames / 25;

      if (animationTime < totalAnimSeconds) {
        const speedMultiplier = totalAnimSeconds / animationTime;
        setSpeed(speedMultiplier);
        setCustomDurations(null);
      } else {
        const middleFrameIndex = Math.floor(
          hopAnimation.Durations.length / 2
        );
        const newDurations = [...hopAnimation.Durations];
        const extraTime = (animationTime - totalAnimSeconds) * 25;
        newDurations[middleFrameIndex] += extraTime;
        setCustomDurations(newDurations);
        setSpeed(1);
      }

      setCurrentAnimation("Hop");
      setCurrentFrame(0);
      setHorizontalOffset(0);
      setIsGliding(false);
      glideDirectionRef.current = Math.random() > 0.5 ? 1 : -1;
    }
  }

  async function loadAllAnimations(animData: AnimData) {
    const animations = [] as AnimationData[];
    const anims = Array.isArray(animData.Anims.Anim)
      ? animData.Anims.Anim
      : [animData.Anims.Anim];
    await Promise.all(
      anims.map(async (anim) => {
        try {
          const data = await loadAnimData(animData, anim.Name);
          console.log(`Loaded animation: ${data.Name}`);
          animations.push(data);
        } catch (err) {
          console.error(err);
        }
      })
    );

    setLoadedAnimations(animations);
  }

  function setAnimSpeed(speed: number) {
    setSpeed(speed);
  }

  return {
    currentFrame,
    direction,
    currentAnimation,
    error,
    speed,
    horizontalOffset,
    loadedAnimations,
    setDirection,
    setCurrentAnimation,
    handleJump,
    setAnimSpeed,
    rotateLeft: () => setDirection((direction + 1) % 8),
    rotateRight: () => setDirection((direction + 7) % 8),
  };
}