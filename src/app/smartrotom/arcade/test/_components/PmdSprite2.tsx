
import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useRef,
} from "react";
import { XMLParser } from "fast-xml-parser";
import { padWithZeroes } from "@/lib/utils";

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
    throw new Error(`Animation "${name}" not found 1`);
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

interface PmdSpriteProps {
  num: number;
  animations: string[];
}

export interface PmdSpriteRef {
  getDirection: () => number;
  getCurrentAnimation: () => "Walk" | "Hop";
  setDirection: (direction: number) => void;
  setCurrentAnimation: (animation: "Walk" | "Hop") => void;
  setAnimSpeed: (speed: number) => void;
  handleJump: () => void;
}

export const PmdSprite = forwardRef<PmdSpriteRef, PmdSpriteProps>(
  ({ num, animations }, ref) => {
    const [animData, setAnimData] = useState<AnimData | null>(null);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [direction, setDirection] = useState(0);
    const [currentAnimation, setCurrentAnimation] = useState<"Walk" | "Hop">(
      "Walk"
    );
    const [error, setError] = useState<string | null>(null);
    const [speed, setSpeed] = useState(1);

    const [loadedAnimations, setLoadedAnimations] = useState<AnimData[]>([]);
    const childDivRef = useRef<HTMLDivElement>(null);

    async function loadAnimDataFile(url: string) {
      const response = await fetch(url);
      const xmlData = await response.text();
      const parser = new XMLParser({ ignoreAttributes: false });
      const data = parser.parse(xmlData);
      setAnimData(data);

      loadAnimations(data, animations);
    }

    useEffect(() => {
      loadAnimDataFile(
        `/smartrotom/img/pmd/sprite/${padWithZeroes(num, 4)}/AnimData.xml`
      );
    }, [num]);

    const handleAnimation = (
      loadedAnimations: any[],
      currentAnimation: string,
      setCurrentFrame: {
        (value: React.SetStateAction<number>): void;
        (arg0: (prevFrame: number) => number): void;
      },
      setCurrentAnimation: React.Dispatch<React.SetStateAction<"Walk" | "Hop">>,
      setError: {
        (value: React.SetStateAction<string | null>): void;
        (arg0: string): void;
      },
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

      const animationLoop = setInterval(() => {
        const prevSpeed = speed;
        if (currentAnimation === "Hop" && prevSpeed !== 1) {
          setAnimSpeed(0.75);
        }

        setCurrentFrame((prevFrame: number) => {
          const nextFrame = (prevFrame + 1) % currentAnim.Durations.length;
          if (currentAnimation === "Hop" && nextFrame === 0) {
            setCurrentAnimation("Walk");
            setAnimSpeed(prevSpeed);
          }
          return nextFrame;
        });
      }, (currentAnim.Durations[currentFrame] / speed) * 25); // Multiply by 25 to convert from game frames to milliseconds

      return () => clearInterval(animationLoop);
    };

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
      [currentFrame, currentAnimation, loadedAnimations]
    );

    const handleJump = () => {
      if (currentAnimation !== "Hop") {
        setCurrentAnimation("Hop");
        setCurrentFrame(0);
      }
    };

    async function loadAnimations(animData: AnimData, anims: string[]) {
      console.log("=== loadAnimations 2 ===", anims);
      console.log(animData);
      const animations = [] as AnimData[];
      await anims.forEach(async (anim) => {
        try {
          const data = await loadAnimData(animData, anim);
          animations.push(data);
        } catch (err) {
          console.error(err);
        }
      });

      setLoadedAnimations(animations);
    }

    function setAnimSpeed(speed: number) {
      setSpeed(speed);
    }

    useImperativeHandle(ref, () => ({
      getDirection: () => direction,
      getCurrentAnimation: () => currentAnimation,
      setDirection: (newDirection: number) => setDirection(newDirection % 8),
      setCurrentAnimation: (newAnimation: "Walk" | "Hop") =>
        setCurrentAnimation(newAnimation),
      handleJump,
      setAnimSpeed: setAnimSpeed,
    }));

    if (error) {
      return <div className="text-red-500 font-bold">Error: {error}</div>;
    }

    if (!currentAnimation) {
      return <div className="text-blue-500 font-bold">Loading...</div>;
    }

    const currentAnim = loadedAnimations.find(
      (a) => a.Name === currentAnimation
    );
    if (!currentAnim) {
      return (
        <div className="text-red-500 font-bold">Error: Animation not </div>
      );
    }
    const scale = 3; // Scale factor for the sprite



    return (
      <div
        className="relative w-64 h-64 flex items-end justify-center"
        style={{pointerEvents: "none"}}
      >
        <div
          ref={childDivRef}
          style={{
            width: `${currentAnim.FrameWidth * scale}px`,
            height: `${currentAnim.FrameHeight * scale}px`,
            backgroundImage:
              currentAnimation === "Hop"
                ? `url(/smartrotom/img/pmd/sprite/${padWithZeroes(num, 4)}/Hop-Anim.png)`
                : `url(/smartrotom/img/pmd/sprite/${padWithZeroes(num, 4)}/Walk-Anim.png)`,
            backgroundPosition: `-${currentFrame * currentAnim.FrameWidth * scale}px -${direction * currentAnim.FrameHeight * scale}px`,
            backgroundSize: `${currentAnim.FrameWidth * currentAnim.Durations.length * scale}px ${currentAnim.FrameHeight * 8 * scale}px`,
            imageRendering: "pixelated",
            pointerEvents: "auto",
          }}
        />
      </div>
    );
  }
);

PmdSprite.displayName = "PmdSprite";

export function PmdSpriteWithControls({ num }: { num: number }) {
  const spriteRef = React.useRef<PmdSpriteRef>(null);
  const [direction, setDirection] = useState(0);
  const [currentAnimation, setCurrentAnimation] = useState<"Walk" | "Hop">(
    "Walk"
  );

  const updateState = () => {
    if (spriteRef.current) {
      setDirection(spriteRef.current.getDirection());
      setCurrentAnimation(spriteRef.current.getCurrentAnimation());
    }
  };

  const rotateLeft = () => {
    if (spriteRef.current) {
      spriteRef.current.setDirection((direction + 1) % 8);
      updateState();
    }
  };

  const rotateRight = () => {
    if (spriteRef.current) {
      spriteRef.current.setDirection((direction - 1 + 8) % 8);
      updateState();
    }
  };

  const handleJump = () => {
    if (spriteRef.current) {
      spriteRef.current.handleJump();
      updateState();
    }
  };

  return (
    <>
      <PmdSprite ref={spriteRef} num={num} animations={["Walk"]} />
      <div className="mt-4 flex space-x-2">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded flex items-center justify-center"
          onClick={rotateLeft}
        >
          Rotate Left
        </button>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded flex items-center justify-center"
          onClick={handleJump}
          disabled={currentAnimation === "Hop"}
        >
          Jump
        </button>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded flex items-center justify-center"
          onClick={rotateRight}
        >
          Rotate Right
        </button>
      </div>
      <div className="mt-4 text-text-tertiary">
        <p>Animation: {currentAnimation}</p>
        <p>Direction: {direction}</p>
      </div>
    </>
  );
}