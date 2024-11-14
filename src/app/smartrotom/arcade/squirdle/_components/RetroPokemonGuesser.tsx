"use client"
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Check,
  X,
  Joystick,
} from "lucide-react";
import Fuse from "fuse.js";
import { useGetWordlePokemon } from "../_hooks/useGetWordlePokemon";
import StarsBackground from "../../_components/StarsBackground";
import {RainbowText} from "../../_components/RainbowText";
import {useTranslations} from 'next-intl';

type Pokemon = {
  name: string;
  gen: number;
  type1: string;
  type2?: string;
  height: number;
  weight: number;
};

const MAX_GUESSES = 7;

const TypeBadge = ({
    type,
    status,
  }: {
    type: string;
    status: "possible" | "incorrect" | "correct" | "present";
  }) => {
    const commonTrans = useTranslations("");
  
    return (
      <span
        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mr-1 mb-1 border-2 ${
          status === "possible"
            ? "bg-blue-500 text-white border-blue-300"
            : status === "incorrect"
            ? "bg-foreground text-black border-border-dark"
            : status === "correct"
            ? "bg-green-500 text-white border-green-300"
            : "bg-yellow-500 text-black border-yellow-300"
        }`}
      >
        {commonTrans(`type_${type}`)}
        {status === "incorrect" && <X className="inline-block ml-1 h-3 w-3" />}
        {status === "present" && (
          <ArrowRight className="inline-block ml-1 h-3 w-3" />
        )}
      </span>
    );
  };
  
  const DoubleTypeBadge = ({
    isDoubleType,
  }: {
    isDoubleType: boolean | null;
  }) => {
    if (isDoubleType === null) return null;
    return (
      <span
        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mr-1 mb-1 border-2 ${
          isDoubleType
            ? "bg-purple-500 text-white border-purple-300"
            : "bg-yellow-500 text-black border-yellow-300"
        }`}
      >
        {isDoubleType ? "Doble Tipo" : "Tipo Único"}
      </span>
    );
  };


export default function RetroPokemonGuesser() {
    const [guesses, setGuesses] = useState<Pokemon[]>([]);
    const [currentGuess, setCurrentGuess] = useState("");
    const [message, setMessage] = useState("");
    const [suggestions, setSuggestions] = useState<Pokemon[]>([]);
    const [gameOver, setGameOver] = useState(false);
    const [isDoubleType, setIsDoubleType] = useState<boolean | null>(null);
    const formsTrans =  useTranslations("");
    const commonTrans = useTranslations("");
  
    const { pokemonData, allTypes, targetPokemon } = useGetWordlePokemon();
  
    const [typeStatuses, setTypeStatuses] = useState<
      Record<string, "possible" | "incorrect" | "correct" | "present">
    >(Object.fromEntries(allTypes.map((type) => [type, "possible"])));
  
    const fuse = new Fuse(pokemonData, {
      keys: ["name"],
      threshold: 0.4,
    });
  
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setCurrentGuess(value);
      if (value.length > 1) {
        const results = fuse.search(value);
        const filteredSuggestions = results.map((result) => result.item);
        setSuggestions(filteredSuggestions);
      } else {
        setSuggestions([]);
      }
    };
  
    const handleGuess = (e: React.FormEvent) => {
      e.preventDefault();
      if (gameOver) return;
  
      const guessedPokemon = pokemonData.find(
        (p) => getPokemonName(p.name.toLowerCase()) === currentGuess
      );
      if (!guessedPokemon) {
        setMessage("¡Ese no es un Pokémon válido!");
        return;
      }
  
      const newGuesses = [...guesses, guessedPokemon];
      setGuesses(newGuesses);
      setCurrentGuess("");
      setSuggestions([]);
  
      if (guessedPokemon.name === targetPokemon?.name) {
        setMessage(
          `¡Felicidades! Has adivinado el Pokémon: ${getPokemonName(
            targetPokemon.name
          )}`
        );
        setGameOver(true);
      } else if (newGuesses.length >= MAX_GUESSES) {
        setMessage(
          `¡Has perdido! El Pokémon era: ${getPokemonName(targetPokemon?.name)}`
        );
        setGuesses([...newGuesses, targetPokemon]); // Add the correct Pokémon as the last row
        setGameOver(true);
      }
  
      updateTypeStatuses(guessedPokemon);
      updateDoubleTypeInfo(guessedPokemon);
    };
  
    const updateTypeStatuses = (guessedPokemon: Pokemon) => {
      const newTypeStatuses = { ...typeStatuses };
      const type1 = checkType(guessedPokemon.type1, 1);
      const type2 = checkType(guessedPokemon.type2, 2);
      newTypeStatuses[guessedPokemon.type1] = type1;
      if (guessedPokemon.type2) {
        newTypeStatuses[guessedPokemon.type2] = type2;
      }
      setTypeStatuses(newTypeStatuses);
    };
  
    const updateDoubleTypeInfo = (guessedPokemon: Pokemon) => {
      if (isDoubleType === null) {
        if (
          guessedPokemon.type2 === targetPokemon?.type2 ||
          checkType(guessedPokemon.type1, 1) === "present" ||
          (checkType(guessedPokemon.type2, 2) === "incorrect" &&
            guessedPokemon.type2 === undefined)
        ) {
          setIsDoubleType(true);
        }
      }
    };
  
    function checkType(type: string | undefined, slot: 1 | 2) {
      if (!type && slot === 1 || !targetPokemon) return "incorrect";
      const currentSlotName = `type${slot}` as "type1" | "type2";
      const oppositeSlotName = `type${slot === 1 ? 2 : 1}` as "type1" | "type2";
  
      if (type === targetPokemon[currentSlotName]) {
        return "correct";
      }
  
      if (type === targetPokemon[oppositeSlotName]) {
        return "present";
      }
  
      return "incorrect";
    }
  
    function renderTypeResult(type: string | undefined, slot: 1 | 2) {
      const status = checkType(type, slot);
      if (!type) {
        type = " - ";
      } else {
        type = commonTrans(`type_${type}`);
      }
      return (
        <span className="flex items-center justify-center">
          {type}
          {status === "correct" && <Check className="text-green-500 ml-1" />}
          {status === "present" && (
            <ArrowRight className="text-yellow-500 ml-1" />
          )}
          {status === "incorrect" && <X className="text-red-500 ml-1" />}
        </span>
      );
    }
  
    function getPokemonName(pokemon: string) {
      let [pokemonName, formName] = pokemon.split("_");
      if (pokemonName === "ho-oh") pokemonName = "ho_oh";
      if (pokemonName === "porygon-z") pokemonName = "porygon_z";
  
      const translatedName = formsTrans(`pixelmon_${pokemonName}`);
      if (formName === "base") return translatedName;
      return `${translatedName} (${formsTrans(`form_${formName}`)})`;
    }
  
    const renderGuessResult = (guess: Pokemon, isCorrectPokemon = false) => {
      if (!targetPokemon) return null;
      return (
        <TableRow
          key={guess.name}
          className={`border-b-2 border-purple-400 ${
            isCorrectPokemon
              ? "bg-green-500 bg-opacity-50"
              : "bg-purple-800 bg-opacity-70"
          }`}
        >
          <TableCell className="text-yellow-300 font-semibold">
            {getPokemonName(guess.name)}
          </TableCell>
          <TableCell className="text-center">
            <div className="flex items-center justify-center">
              <span className="mr-2">{guess.gen}</span>
              {guess.gen === targetPokemon.gen ? (
                <Check className="text-green-500" />
              ) : guess.gen < targetPokemon.gen ? (
                <ArrowUpRight className="text-yellow-500" />
              ) : (
                <ArrowDownRight className="text-yellow-500" />
              )}
            </div>
          </TableCell>
          <TableCell className="text-center">
            {renderTypeResult(guess.type1, 1)}
          </TableCell>
          <TableCell className="text-center">
            {renderTypeResult(guess.type2, 2)}
          </TableCell>
          <TableCell className="text-center">
            <div className="flex items-center justify-center">
              <span className="mr-2">{guess.height}</span>
              {guess.height === targetPokemon.height ? (
                <Check className="text-green-500" />
              ) : guess.height < targetPokemon.height ? (
                <ArrowUpRight className="text-yellow-500" />
              ) : (
                <ArrowDownRight className="text-yellow-500" />
              )}
            </div>
          </TableCell>
          <TableCell className="text-center">
            <div className="flex items-center justify-center">
              <span className="mr-2">{guess.weight}</span>
              {guess.weight === targetPokemon.weight ? (
                <Check className="text-green-500" />
              ) : guess.weight < targetPokemon.weight ? (
                <ArrowUpRight className="text-yellow-500" />
              ) : (
                <ArrowDownRight className="text-yellow-500" />
              )}
            </div>
          </TableCell>
        </TableRow>
      );
    };
  
    const renderSuggestion = (suggestion: Pokemon) => {
      return (
        <li
          key={suggestion.name}
          className="p-3 hover:bg-purple-700 cursor-pointer text-yellow-200 border-b border-purple-500 last:border-b-0"
          onClick={() => {
            setCurrentGuess(getPokemonName(suggestion.name));
            setSuggestions([]);
          }}
        >
          <div className="grid grid-cols-6 gap-2 items-center">
            <span className="font-bold col-span-2">
              {getPokemonName(suggestion.name)}
            </span>
            <span className="text-center">Gen: {suggestion.gen}</span>
            <span className="text-center">
              {commonTrans(`type_${suggestion.type1}`)}
            </span>
            <span className="text-center">
              {suggestion.type2 ? commonTrans(`type_${suggestion.type2}`) : "-"}
            </span>
            <span className="text-right">
              {suggestion.height}m / {suggestion.weight}kg
            </span>
          </div>
        </li>
      );
    };
  
    return (
      <div className="min-h-full w-full bg-gradient-to-b from-purple-900 to-indigo-900 text-white font-mono flex flex-col relative overflow-hidden">
        <StarsBackground />
        <main className="flex-grow p-6 overflow-auto container mx-auto max-w-4xl relative z-10">
          <RainbowText text="Retro Pokémon Guesser" />
          <form onSubmit={handleGuess} className="mb-8 relative">
            <div className="flex space-x-2">
              <div className="flex-grow relative">
                <Input
                  type="text"
                  value={currentGuess}
                  onChange={handleInputChange}
                  placeholder="Escribe un nombre de Pokémon"
                  aria-label="Intento de nombre de Pokémon"
                  className="bg-purple-800 bg-opacity-80 text-yellow-300 border-2 border-yellow-300 placeholder-yellow-200 w-full text-lg py-6 rounded-lg shadow-md focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  disabled={gameOver}
                />
                {suggestions.length > 0 && !gameOver && (
                  <ul className="absolute z-20 w-full bg-purple-800 border-2 border-yellow-300 rounded-b-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {suggestions.map(renderSuggestion)}
                  </ul>
                )}
              </div>
              <Button
                type="submit"
                className="bg-yellow-400 text-purple-800 hover:bg-yellow-300 text-lg px-8 py-6 rounded-lg shadow-md border-2 border-yellow-500 transition-all duration-200 ease-in-out transform hover:scale-105"
                disabled={gameOver}
              >
                Adivinar
              </Button>
            </div>
          </form>
  
          {message && (
            <div className="mb-8 p-6 bg-purple-800 bg-opacity-90 rounded-lg shadow-xl border-2 border-pink-500">
              <p
                className="text-center font-bold text-yellow-300 text-2xl animate-pulse"
                aria-live="polite"
              >
                {message}
              </p>
            </div>
          )}
  
          <div className="bg-purple-900 bg-opacity-80 rounded-lg p-6 mb-8 overflow-x-auto shadow-xl border-2 border-cyan-500">
            <Table>
              <TableHeader>
                <TableRow className="bg-purple-800 bg-opacity-90">
                  <TableHead className="text-yellow-300 text-lg border-b-2 border-yellow-500">
                    Nombre
                  </TableHead>
                  <TableHead className="text-yellow-300 text-lg text-center border-b-2 border-yellow-500">
                    Gen
                  </TableHead>
                  <TableHead className="text-yellow-300 text-lg text-center border-b-2 border-yellow-500">
                    Tipo1
                  </TableHead>
                  <TableHead className="text-yellow-300 text-lg text-center border-b-2 border-yellow-500">
                    Tipo2
                  </TableHead>
                  <TableHead className="text-yellow-300 text-lg text-center border-b-2 border-yellow-500">
                    Altura
                  </TableHead>
                  <TableHead className="text-yellow-300 text-lg text-center border-b-2 border-yellow-500">
                    Peso
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guesses.map((guess, index) =>
                  renderGuessResult(
                    guess,
                    index === guesses.length - 1 &&
                      gameOver &&
                      guess.name === targetPokemon?.name
                  )
                )}
              </TableBody>
            </Table>
          </div>
  
          <div className="text-center text-yellow-300 text-3xl font-bold mb-6 bg-purple-800 bg-opacity-70 p-4 rounded-lg shadow-md border-2 border-yellow-500">
            Intentos restantes: {Math.max(0, MAX_GUESSES - guesses.length)}
          </div>
  
          <div className="bg-purple-900 bg-opacity-80 rounded-lg p-6 mb-8 shadow-xl border-2 border-green-500">
            <h2 className="text-2xl font-bold mb-4 text-yellow-300">
              Información de Tipos:
            </h2>
            <div className="mb-4">
              {allTypes.map((type) => (
                <TypeBadge key={type} type={type} status={typeStatuses[type]} />
              ))}
            </div>
            <DoubleTypeBadge isDoubleType={isDoubleType} />
          </div>
        </main>
      </div>
    );
  }