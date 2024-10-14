"use client";

import { useEffect, useState } from "react";
import { PokemonSpriteLink } from "./PokemonSprite";
import useTranslation from "next-translate/useTranslation";
import { getSpawns } from "@/services/mcefApi";

export type PossibleSpawn = {
  dex: number;
  species: string;
  form: string;
  palette: string;
  rarity: number;
  percentage: number;
};

export function PossibleSpawnsSection({
  pokemonSpawns,
  hideCaught = true,
  hideSeen = true,
  title,
}: {
  pokemonSpawns?: PossibleSpawn[];
  hideCaught?: boolean;
  hideSeen?: boolean;
  title: string;
}) {
  const [show, setShow] = useState(true);
  const [loaded, setLoaded] = useState(false); // Step 1: Initialize loaded state
  const [count, setCount] = useState(pokemonSpawns?.length);

  useEffect(() => {
    const titleEl = document.getElementById(title);

    if (titleEl) {
      const children = titleEl.getElementsByTagName(
        "a"
      ) as HTMLCollectionOf<HTMLAnchorElement>;
      setCount(children.length);
      setShow(children.length > 0); // Corrected logic to set 'show'
    }
    setLoaded(true); // Step 2: Set loaded to true after operations
  }, [hideSeen, hideCaught, title]);

  if (!loaded) return null; // Step 3: Use loaded state in rendering logic
  return (
    <div
      className="flex flex-col  mb-4 rounded-xl p-2 w-[95%] m-auto"
      style={{ display: show ? "block" : "none" }}
    >
      <h1 className="text-4xl text-center text-main-100 font-bold">
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

export function PossibleSpawns({
  pokemonSpawns,
  hideCaught = true,
  hideSeen = true,
  id,
}: {
  pokemonSpawns?: PossibleSpawn[];
  hideCaught?: boolean;
  hideSeen?: boolean;
  id?: string;
}) {
  const { t } = useTranslation("smartrotom/pokedex/forms");
  const [spawns, setSpawns] = useState<PossibleSpawn[]>();
  useEffect(() => {
    if (pokemonSpawns && pokemonSpawns.length > 0) {
      setSpawns(pokemonSpawns);
      return;
    }
    const fetchAndSetSpawns = async () => {
      const result = await getSpawns();
      const res = result.data!;
      res.sort((a, b) => b.rarity - a.rarity);
      setSpawns(res);
    };

    fetchAndSetSpawns();

    const intervalId = setInterval(fetchAndSetSpawns, 30000);

    return () => clearInterval(intervalId);
  }, [pokemonSpawns]);

  return (
    <div className="flex  flex-wrap justify-center" id={id}>
      {spawns?.map((spawn) => (
        <PokemonSpriteLink
          hideCaught={hideCaught}
          hideSeen={hideSeen}
          key={spawn.species}
          id={spawn.dex}
          form={spawn.form}
          palette={spawn.palette}
          text={getDisplayName(spawn.species, spawn.form, spawn.palette)}
        >
          <div className="text-xs hidden 2xl:block">
            {getDisplayName(spawn.species, spawn.form, spawn.palette)}
          </div>
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

  function getDisplayName(species: string, form: string, palette: string) {
    //if (form.includes('segment')) form = 'base';
    const formDisplay = form !== "base" ? t(`form_${form}`) : "";
    const paletteDisplay = palette !== "none" ? t(`palette_${palette}`) : "";
    return `${species}${formDisplay ? ` ${formDisplay}` : ""}${
      paletteDisplay ? ` ${paletteDisplay}` : ""
    }`;
  }
}
