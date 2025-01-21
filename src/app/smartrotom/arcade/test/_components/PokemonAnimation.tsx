"use client";

import React, { useState, useEffect, useRef } from "react";
import { PmdSprite, PmdSpriteRef } from "./PmdSprite2";

interface Hurdle {
  id: number;
  position: number;
}

interface Pokemon {
  ref: React.RefObject<PmdSpriteRef>;
  isJumping: boolean;
  isCrashed: boolean;
  crashDirection: number;
  hurdles: Hurdle[];
  startTime: number | null;
  endTime: number | null;
  goalPosition: number;
  speed: number;
  isBoosted: boolean;
}

export default function PokeathonHurdleGame() {
  const [gameState, setGameState] = useState<"ready" | "playing" | "finished">(
    "ready"
  );
  const [currentTime, setCurrentTime] = useState(0);

  const pokemonRefs = [
    useRef<PmdSpriteRef>(null),
    useRef<PmdSpriteRef>(null),
    useRef<PmdSpriteRef>(null),
  ];
  const [pokemons, setPokemons] = useState<Pokemon[]>([
    {
      ref: pokemonRefs[0],
      isJumping: false,
      isCrashed: false,
      crashDirection: 0,
      hurdles: [],
      startTime: null,
      endTime: null,
      goalPosition: 5000,
      speed: 2,
      isBoosted: false,
    },
    {
      ref: pokemonRefs[1],
      isJumping: false,
      isCrashed: false,
      crashDirection: 0,
      hurdles: [],
      startTime: null,
      endTime: null,
      goalPosition: 5000,
      speed: 2,
      isBoosted: false,
    },
    {
      ref: pokemonRefs[2],
      isJumping: false,
      isCrashed: false,
      crashDirection: 0,
      hurdles: [],
      startTime: null,
      endTime: null,
      goalPosition: 5000,
      speed: 2,
      isBoosted: false,
    },
  ]);

  // Game constants
  const HURDLE_HEIGHT = 60;
  const GAME_HEIGHT = 600;
  const GAME_WIDTH = 300;
  const POKEMON_HEIGHT = 40;
  const NORMAL_GAME_SPEED = 2;
  const CRASHED_GAME_SPEED = 1;
  const BOOSTED_GAME_SPEED = 3;
  const CRASH_DURATION = 1000; // 1 second
  const JUMP_DURATION = 1000; // 1 second
  const BOOST_DURATION = 3000; // 3 seconds
  const CLOSE_JUMP_THRESHOLD = 70;
  const GOAL_DISTANCE = 12000;
  const BORDER_WIDTH = 4; // Thick white border between tracks

  useEffect(() => {
    if (gameState === "ready" || gameState === "finished") return;

    const gameLoop = setInterval(() => {
      setCurrentTime((prevTime) => prevTime + 1 / 60);

      setPokemons((prevPokemons) =>
        prevPokemons.map((pokemon) => {
          if (pokemon.endTime) return pokemon; // Skip if this Pokémon has finished

          // Start time if not set
          const updatedPokemon = { ...pokemon };
          if (updatedPokemon.startTime === null) {
            updatedPokemon.startTime = Date.now();
          }

          // Move hurdles and goal
          updatedPokemon.hurdles = updatedPokemon.hurdles
            .map((hurdle) => ({
              ...hurdle,
              position: hurdle.position - updatedPokemon.speed,
            }))
            .filter((hurdle) => hurdle.position > -HURDLE_HEIGHT);
          updatedPokemon.goalPosition -= updatedPokemon.speed;

          // Generate new hurdles
          if (
            gameState === "playing" &&
            (updatedPokemon.hurdles.length === 0 ||
              updatedPokemon.hurdles[updatedPokemon.hurdles.length - 1]
                .position < GAME_HEIGHT)
          ) {
            const randomDistance = Math.random() * GAME_HEIGHT + GAME_HEIGHT; // Between 1x and 2x canvas height
            updatedPokemon.hurdles.push({
              id: Date.now(),
              position: GAME_HEIGHT + randomDistance,
            });
          }

          // Check for collisions
          if (!updatedPokemon.isCrashed) {
            const collidedHurdle = updatedPokemon.hurdles.find(
              (hurdle) =>
                hurdle.position < POKEMON_HEIGHT &&
                hurdle.position > 0 &&
                !updatedPokemon.isJumping
            );

            if (collidedHurdle) {
              updatedPokemon.isCrashed = true;
              updatedPokemon.crashDirection = 0;
              updatedPokemon.speed = CRASHED_GAME_SPEED;
              updatedPokemon.isBoosted = false;
            }
          }

          // Check if goal is reached
          if (
            updatedPokemon.goalPosition <= POKEMON_HEIGHT &&
            !updatedPokemon.endTime
          ) {
            updatedPokemon.endTime = Date.now();
            if (updatedPokemon.ref.current) {
              updatedPokemon.ref.current.setCurrentAnimation("Walk");
              updatedPokemon.ref.current.setDirection(0);
            }
          }

          return updatedPokemon;
        })
      );

      // Check if all Pokémon have finished
      if (pokemons.every((pokemon) => pokemon.endTime !== null)) {
        setGameState("finished");
        clearInterval(gameLoop);
      }
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(gameLoop);
  }, [gameState, pokemons]);

  useEffect(() => {
    pokemons.forEach((pokemon, index) => {
      if (pokemon.isCrashed) {
        const crashAnimation = setInterval(() => {
          setPokemons((prevPokemons) =>
            prevPokemons.map((p, i) => {
              if (i !== index) return p;
              const newDirection = (p.crashDirection + 1) % 8;
              if (p.ref.current) {
                p.ref.current.setDirection(newDirection);
              }
              if (newDirection === 4) {
                clearInterval(crashAnimation);
                return {
                  ...p,
                  isCrashed: false,
                  crashDirection: 4,
                  speed: NORMAL_GAME_SPEED,
                };
              }
              return { ...p, crashDirection: newDirection };
            })
          );
        }, CRASH_DURATION / 8);

        return () => clearInterval(crashAnimation);
      }
    });
  }, [pokemons]);

  const handleJump = (lane: number) => {
    if (
      gameState === "playing" &&
      !pokemons[lane].isJumping &&
      !pokemons[lane].isCrashed
    ) {
      setPokemons((prevPokemons) =>
        prevPokemons.map((pokemon, index) => {
          if (index !== lane) return pokemon;
          if (pokemon.ref.current) {
            pokemon.ref.current.handleJump(3);
          }

          // Check for close jump
          const closestHurdle = pokemon.hurdles.find(
            (hurdle) => hurdle.position > 0
          );
          if (
            closestHurdle &&
            closestHurdle.position <= CLOSE_JUMP_THRESHOLD &&
            !pokemon.isBoosted
          ) {
            if (pokemon.ref.current) {
              pokemon.ref.current.setAnimSpeed(5);
            }

            return {
              ...pokemon,
              isJumping: true,
              speed: BOOSTED_GAME_SPEED,
              isBoosted: true,
            };
          }

          return { ...pokemon, isJumping: true };
        })
      );

      setTimeout(() => {
        setPokemons((prevPokemons) =>
          prevPokemons.map((pokemon, index) => {
            if (index !== lane) return pokemon;
            if (pokemon.ref.current && !pokemon.endTime) {
              pokemon.ref.current.setCurrentAnimation("Walk");
            }
            return { ...pokemon, isJumping: false };
          })
        );
      }, JUMP_DURATION);

      // Reset boost after BOOST_DURATION
      setTimeout(() => {
        setPokemons((prevPokemons) =>
          prevPokemons.map((pokemon, index) => {
            if (pokemon.ref.current) {
              pokemon.ref.current.setAnimSpeed(2);
            }
            if (index !== lane) return pokemon;
            return { ...pokemon, speed: NORMAL_GAME_SPEED, isBoosted: false };
          })
        );
      }, BOOST_DURATION);
    }
  };

  const handleStartGame = () => {
    setGameState("playing");
    setCurrentTime(0);
    setPokemons((prevPokemons) =>
      prevPokemons.map((pokemon) => ({
        ...pokemon,
        isJumping: false,
        isCrashed: false,
        crashDirection: 0,
        hurdles: [],
        startTime: null,
        endTime: null,
        goalPosition: GOAL_DISTANCE,
        speed: NORMAL_GAME_SPEED,
        isBoosted: false,
      }))
    );
    pokemons.forEach((pokemon) => {
      if (pokemon.ref.current) {
        pokemon.ref.current.setDirection(4); // Reset to looking up
        pokemon.ref.current.setCurrentAnimation("Walk");
        pokemon.ref.current.setAnimSpeed(2);
      }
    });
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-400 to-blue-600">
      <h1 className="text-4xl font-bold mb-4 text-white">
        Pokéathlon Hurdle Game
      </h1>
      <div className="relative w-[300px] h-[600px] bg-white border-4 border-white rounded-lg overflow-hidden shadow-lg">
        {[0, 1, 2].map((lane) => (
          <div
            key={lane}
            className={`absolute h-full cursor-pointer ${
              pokemons[lane].isBoosted ? "bg-yellow-400" : "bg-red-600"
            } transition-colors duration-300 overflow-hidden`}
            style={{
              left: `${lane * (GAME_WIDTH / 3)}px`,
              width: `${GAME_WIDTH / 3 - BORDER_WIDTH}px`,
              borderRight: lane < 2 ? `${BORDER_WIDTH}px solid white` : "none",
            }}
            onClick={() => handleJump(lane)}
          >
            {pokemons[lane].hurdles.map((hurdle) => (
              <div
                key={hurdle.id}
                className="absolute w-full h-[60px]"
                style={{
                  bottom: `${hurdle.position}px`,
                }}
              >
                <div className="absolute bottom-0 w-full h-[10px] bg-blue-800"></div>
                <div className="absolute bottom-[10px] left-[5px] w-[2px] h-[50px] bg-blue-800"></div>
                <div className="absolute bottom-[10px] right-[5px] w-[2px] h-[50px] bg-blue-800"></div>
                <div className="absolute top-0 w-full h-[5px] bg-yellow-400"></div>
              </div>
            ))}
            {pokemons[lane].goalPosition > 0 &&
              pokemons[lane].goalPosition <= GAME_HEIGHT && (
                <div
                  className="absolute w-full h-[40px]"
                  style={{
                    bottom: `${pokemons[lane].goalPosition}px`,
                    backgroundImage:
                      "repeating-linear-gradient(45deg, #000, #000 10px, #fff 10px, #fff 20px)",
                  }}
                />
              )}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
              <PmdSprite
                ref={pokemonRefs[lane]}
                num={134}
                animations={["Walk", "Hop", "Idle"]}
              />
            </div>
            <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 text-white text-xs text-center py-1">
              {pokemons[lane].endTime
                ? formatTime(
                    (pokemons[lane]?.endTime ?? 0 - (pokemons[lane]?.startTime ?? 0)) /
                      1000
                  )
                : formatTime(currentTime)}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-white text-center">
        <p className="text-lg font-semibold">Game State: {gameState}</p>
        {gameState === "ready" && (
          <button
            className="mt-4 px-6 py-3 bg-yellow-500 text-blue-900 rounded-full font-bold text-lg shadow-lg hover:bg-yellow-400 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-opacity-50"
            onClick={handleStartGame}
          >
            Start Game
          </button>
        )}
        {gameState === "finished" && (
          <div>
            {pokemons.map((pokemon, index) => (
              <p key={index} className="text-lg font-bold mt-2">
                Pokémon {index + 1} Time:{" "}
                {pokemon.startTime && pokemon.endTime
                  ? formatTime((pokemon.endTime - pokemon.startTime) / 1000)
                  : "N/A"}
              </p>
            ))}
            <button
              className="mt-4 px-6 py-3 bg-yellow-500 text-blue-900 rounded-full font-bold text-lg shadow-lg hover:bg-yellow-400 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-opacity-50"
              onClick={handleStartGame}
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}