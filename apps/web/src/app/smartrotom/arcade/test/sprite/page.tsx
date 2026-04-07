"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Label } from "@/components/ui/primitives/label";
import { PmdSprite } from "../_components/PmdSprite";
import { PmdSpriteRef } from "../types";

export default function SpritePage() {
  const spriteRef = useRef<PmdSpriteRef>(null);
  const [pokemonNum, setPokemonNum] = useState(134);
  const [jumpTime, setJumpTime] = useState(1);

  const handleJump = () => {
    const sprite = spriteRef.current;
    if (sprite) {
      sprite.handleJump(jumpTime);
    }
  };

  const rotateLeft = () => {
    const sprite = spriteRef.current;
    if (sprite) {
      sprite.rotateLeft();
    }
  };

  const rotateRight = () => {
    const sprite = spriteRef.current;
    if (sprite) {
      sprite.rotateRight();
    }
  };

  return (
    <div>
      <div className="filter grayscale">
        <PmdSprite num={pokemonNum} ref={spriteRef} />
      </div>

      <div className="flex items-center">
        <Button onClick={handleJump}>Jump</Button>
        <Button onClick={rotateLeft}>Rotate Left</Button>
        <Button onClick={rotateRight}>Rotate Right</Button>
        <Label htmlFor="pokemonNum">Pokemon Number</Label>
        <Input
          name="pokemonNum"
          value={pokemonNum}
          type="number"
          className="w-16"
          onChange={(e) => setPokemonNum(Number(e.target.value))}
        />

        <Label htmlFor="jumpTime">Jump Time</Label>
        <Input
          name="jumpTime"
          value={jumpTime}
          type="number"
          className="w-16"
          onChange={(e) => setJumpTime(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
