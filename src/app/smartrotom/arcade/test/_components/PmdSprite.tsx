"use client";

import React, { useState, useEffect } from "react";
import { XMLParser } from "fast-xml-parser";
import { padWithZeroes } from "@/lib/utils";
import { RotateCcw, RotateCw } from "lucide-react";

interface AnimData {
  Name: string;
  Index: number;
  FrameWidth: number;
  FrameHeight: number;
  Durations: number[];
}

async function loadAnimData(animData: any, name: string): Promise<AnimData> {
  const anims = Array.isArray(animData.AnimData.Anims.Anim)
    ? animData.AnimData.Anims.Anim
    : [animData.AnimData.Anims.Anim];

  const anim = anims.find((a: any) => a.Name === name);

  if (!anim) {
    throw new Error(`Animation "${name}" not found`);
  }

  return {
    Name: anim.Name,
    Index: anim.Index,
    FrameWidth: anim.FrameWidth,
    FrameHeight: anim.FrameHeight,
    Durations: Array.isArray(anim.Durations.Duration)
      ? anim.Durations.Duration
      : [anim.Durations.Duration],
  };
}

export function PmdSprite({ num }: { num: number }) {
  const [animData, setAnimData] = useState<AnimData | null>(null);
  const [walkData, setWalkData] = useState<AnimData | null>(null);
  const [hopData, setHopData] = useState<AnimData | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [direction, setDirection] = useState(0);
  const [currentAnimation, setCurrentAnimation] = useState<"Walk" | "Hop">(
    "Walk"
  );
  const [error, setError] = useState<string | null>(null);

  async function loadAnimDataFile(url: string) {
    const response = await fetch(url);
    const xmlData = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    setAnimData(parser.parse(xmlData));
  }

  useEffect(() => {
    loadAnimDataFile(
      `/smartrotom/img/pmd/sprite/${padWithZeroes(num, 4)}/AnimData.xml`
    );
  }, [num]);

  useEffect(() => {
    if (!animData) return;
    Promise.all([loadAnimData(animData, "Walk"), loadAnimData(animData, "Hop")])
      .then(([walkAnim, hopAnim]) => {
        setWalkData(walkAnim);
        setHopData(hopAnim);
      })
      .catch((err) => setError(err.message));
  }, [animData]);

  useEffect(() => {
    if (!walkData || !hopData) return;

    const currentAnim = currentAnimation === "Hop" ? hopData : walkData;

    const animationLoop = setInterval(() => {
      setCurrentFrame((prevFrame) => {
        const nextFrame = (prevFrame + 1) % currentAnim.Durations.length;
        if (currentAnimation === "Hop" && nextFrame === 0) {
          setCurrentAnimation("Walk");
        }
        return nextFrame;
      });
    }, currentAnim.Durations[currentFrame] * 25); // Multiply by 25 to convert from game frames to milliseconds

    return () => clearInterval(animationLoop);
  }, [walkData, hopData, currentFrame, currentAnimation]);

  const handleJump = () => {
    if (currentAnimation !== "Hop") {
      setCurrentAnimation("Hop");
      setCurrentFrame(0);
    }
  };

  const rotateLeft = () => {
    setDirection((prev) => (prev + 1) % 8);
  };

  const rotateRight = () => {
    setDirection((prev) => (prev - 1 + 8) % 8);
  };

  if (error) {
    return <div className="text-red-500 font-bold">Error: {error}</div>;
  }

  if (!walkData || !hopData) {
    return <div className="text-blue-500 font-bold">Loading...</div>;
  }

  const currentAnim = currentAnimation === "Hop" ? hopData : walkData;
  const scale = 3; // Scale factor for the sprite

  return (
    <>
      <div className="relative">
        {/* Shadow */}
        {/*
        <div
          className="absolute"
          style={{
            width: `${currentAnim.FrameWidth * scale}px`,
            height: `${currentAnim.FrameHeight * scale}px`,
            backgroundImage:
              currentAnimation === "Hop"
                ? `url(/smartrotom/img/pmd/sprite/${padWithZeroes(
                    num,
                    4
                  )}/Hop-Shadow.png)`
                : `url(/smartrotom/img/pmd/sprite/${padWithZeroes(
                    num,
                    4
                  )}/Walk-Anim.png)`,
            backgroundPosition: `-${
              currentFrame * currentAnim.FrameWidth * scale
            }px -${direction * currentAnim.FrameHeight * scale}px`,
            backgroundSize: `${
              currentAnim.FrameWidth * currentAnim.Durations.length * scale
            }px ${currentAnim.FrameHeight * 8 * scale}px`,
            imageRendering: "pixelated",
            opacity: currentAnimation === "Hop" ? 0.5 : 1,
          }}
        /> 
        */}
        {/* Sprite */}
        <div
          style={{
            width: `${currentAnim.FrameWidth * scale}px`,
            height: `${currentAnim.FrameHeight * scale}px`,
            backgroundImage:
              currentAnimation === "Hop"
                ? `url(/smartrotom/img/pmd/sprite/${padWithZeroes(
                    num,
                    4
                  )}/Hop-Anim.png)`
                : `url(/smartrotom/img/pmd/sprite/${padWithZeroes(
                    num,
                    4
                  )}/Walk-Anim.png)`,
            backgroundPosition: `-${
              currentFrame * currentAnim.FrameWidth * scale
            }px -${direction * currentAnim.FrameHeight * scale}px`,
            backgroundSize: `${
              currentAnim.FrameWidth * currentAnim.Durations.length * scale
            }px ${currentAnim.FrameHeight * 8 * scale}px`,
            imageRendering: "pixelated",
          }}
        />
      </div>
      <div className="mt-4 flex space-x-2">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded flex items-center justify-center"
          onClick={rotateLeft}
        >
          <RotateCcw />
        </button>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded flex items-center justify-center"
          onClick={handleJump}
          disabled={currentAnimation === "Hop"}
        >
          Saltar
        </button>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded flex items-center justify-center"
          onClick={rotateRight}
        >
          <RotateCw />
        </button>
      </div>
      <div className="mt-4 text-gray-700">
        <p>Animation: {currentAnimation}</p>
        <p>
          Frame: {currentFrame + 1} / {currentAnim.Durations.length}
        </p>
        <p>Direction: {direction}</p>
      </div>
    </>
  );
}
