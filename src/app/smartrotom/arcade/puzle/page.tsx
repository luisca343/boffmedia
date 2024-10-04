"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const GRID_SIZE = 3;
const EMPTY_TILE = GRID_SIZE * GRID_SIZE - 1;

export default function Component() {
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    const newTiles = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);
    for (let i = newTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newTiles[i], newTiles[j]] = [newTiles[j], newTiles[i]];
    }
    setTiles(newTiles);
    setMoves(0);
  };

  const handleTileClick = (index: number) => {
    const emptyIndex = tiles.indexOf(EMPTY_TILE);
    if (isAdjacent(index, emptyIndex)) {
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIndex]] = [
        newTiles[emptyIndex],
        newTiles[index],
      ];
      setTiles(newTiles);
      setMoves(moves + 1);
    }
  };

  const isAdjacent = (index1: number, index2: number) => {
    const row1 = Math.floor(index1 / GRID_SIZE);
    const col1 = index1 % GRID_SIZE;
    const row2 = Math.floor(index2 / GRID_SIZE);
    const col2 = index2 % GRID_SIZE;
    return Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;
  };

  const isSolved = () => {
    return tiles.every((tile, index) => tile === index);
  };

  const getTilePosition = (index: number) => {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    return { top: `-${row * 100}%`, left: `-${col * 100}%` };
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-orange-100">
      <h1 className="text-3xl font-bold mb-4 text-orange-600">Wingull Slide</h1>
      <div className="relative w-72 h-72 mb-4 bg-orange-200 rounded overflow-hidden">
        {tiles.map((tile, index) => (
          <Button
            key={index}
            onClick={() => handleTileClick(index)}
            className={`absolute w-24 h-24 p-0 overflow-hidden transition-all duration-300 ease-in-out ${
              tile === EMPTY_TILE ? "opacity-0" : "opacity-100"
            }`}
            style={{
              top: `${Math.floor(index / GRID_SIZE) * 33.333}%`,
              left: `${(index % GRID_SIZE) * 33.333}%`,
            }}
            disabled={tile === EMPTY_TILE}
          >
            {tile !== EMPTY_TILE && (
              <div className="relative w-full h-full overflow-hidden">
                <Image
                  src="/img/boff.png"
                  alt={`Wingull piece ${tile + 1}`}
                  objectFit="cover"
                  className="select-none"
                  width={96}
                  height={96}
                  style={{
                    position: "absolute",
                    ...getTilePosition(tile),
                  }}
                />
              </div>
            )}
          </Button>
        ))}
      </div>
      <p className="mb-4 text-orange-600">Moves: {moves}</p>
      {isSolved() && (
        <div className="mb-4 text-center">
          <p className="text-green-600 font-bold">
            Congratulations! You solved the puzzle!
          </p>
          <div className="w-48 h-48 mx-auto mt-2 relative">
            <Image
              width={96}
              height={96}
              src="/img/boff.png"
              alt="Complete Wingull"
              objectFit="contain"
            />
          </div>
        </div>
      )}
      <Button onClick={resetGame} className="bg-orange-500 hover:bg-orange-600">
        New Game
      </Button>
    </div>
  );
}
