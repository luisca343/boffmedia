"use client";

import { useEffect, useState } from "react";
import { PokemonSpriteLink } from "./PokemonSprite";
import { getSpawns } from "@/services/mcef/mcefApi";
import { Loading } from "@/components/smartrotom/Loading";

export type PossibleSpawn = {
  dex: number;
  species: string;
  form: string;
  palette: string;
  rarity: number;
  percentage: number;
  spriteUrl: string;
};

export function PossibleSpawnsSection({pokemonSpawns, hideCaught = true, hideSeen = true, title, }: { pokemonSpawns?: any; hideCaught?: boolean; hideSeen?: boolean; title: string; }) {
  const [show, setShow] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [count, setCount] = useState(pokemonSpawns?.length);

  useEffect(() => {
    const titleEl = document.getElementById(title);

    if (titleEl) {
      const children = titleEl.getElementsByTagName("a") as HTMLCollectionOf<HTMLAnchorElement>;
      setCount(children.length);
      setShow(children.length > 0);
    }
    setLoaded(true);
  }, [hideSeen, hideCaught, title]);

  if (!loaded) return null;
  return (
    <div
      className="flex flex-col  mb-4 rounded-xl p-2 w-[95%] m-auto"
      style={{ display: show ? "block" : "none" }}
    >
      <h1 className="text-4xl text-center text-surface-100 font-bold">
        {title} - {count}
      </h1>
      <PossibleSpawns
        id={title}
        pokemonSpawns={pokemonSpawns}
        hideCaught={hideCaught}
        hideSeen={hideSeen}
      />
    </div>
  );
}

export function PossibleSpawns({ pokemonSpawns, hideCaught = true, hideSeen = true, id, }: { pokemonSpawns?: PossibleSpawn[]; hideCaught?: boolean; hideSeen?: boolean; id?: string; }) {
  const [spawns, setSpawns] = useState<PossibleSpawn[]>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (pokemonSpawns && pokemonSpawns.length > 0) {
      setSpawns(pokemonSpawns);
      setIsLoading(false);
      return;
    }
    
    const fetchAndSetSpawns = async () => {
      setIsLoading(true);
      try {
        const result = await getSpawns();
        const res = result.data!;
        res.sort((a, b) => b.rarity - a.rarity);
        setSpawns(res);
      } catch (error) {
        console.error("Error fetching spawns:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndSetSpawns();

    const intervalId = setInterval(fetchAndSetSpawns, 30000);
    return () => clearInterval(intervalId);
  }, [pokemonSpawns]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-20">
        <Loading width={40} height={40} />
      </div>
    );
  }

  if (!spawns || spawns.length === 0) {
    return (
      <div className="flex justify-center items-center h-20 text-surface-300">
        No hay Pokémon disponibles para capturar
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-2" id={id}>
      {spawns.map((spawn) => (
        <PokemonSpriteLink
          hideCaught={hideCaught}
          hideSeen={hideSeen}
          key={`${spawn.dex}-${spawn.form}-${spawn.palette}`}
          id={spawn.dex}
          form={spawn.form}
          palette={spawn.palette}
          hide={true}
          displayName={true}
        >
          <div className="font-bold text-xl 2xl:text-base">
            {formatPercentage(spawn.percentage)} %
          </div>
        </PokemonSpriteLink>
      ))}
    </div>
  );

  function formatPercentage(percentage: number) {
    if (percentage <= 0.0009) {
      return percentage.toFixed(4);
    } else if (percentage <= 0.009) {
      return percentage.toFixed(3);
    } else {
      return percentage.toFixed(2);
    }
  }
}