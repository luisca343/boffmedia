"use client";
import { useState } from "react";
import { PmdSprite } from "./PmdSprite";
import { Button } from "@/components/ui/button";

export default function PokemonAnimation() {
  const [num, setNum] = useState(909);
  return (
    <div>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <PmdSprite num={num} />
      </div>
    </div>
  );
}
