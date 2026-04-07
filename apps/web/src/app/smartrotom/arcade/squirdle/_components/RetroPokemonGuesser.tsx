"use client"
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/primitives/table";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Check,
  X,
  Joystick,
  RefreshCw,
  Info,
  ChevronLeft
} from "lucide-react";
import { InternalLink } from "@/components/ui/navigation/Link";
import Fuse from "fuse.js";
import { useGetWordlePokemon } from "../_hooks/useGetWordlePokemon";
import StarsBackground from "../../_components/StarsBackground";
import { RainbowText } from "../../_components/RainbowText";
import { useTranslations } from 'next-intl';
import ArcadeTopBar from "../../_components/ArcadeTopBar";
import ArcadeFooter from "../../_components/ArcadeFooter";
import InstructionsModal from "../../_components/InstructionsModal";

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
  const t = useTranslations("pokedex");

  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold mr-1.5 mb-1.5 border-2 
        ${status === "possible"
          ? "bg-indigo-600 text-white border-indigo-400"
          : status === "incorrect"
            ? "bg-surface-400 text-black border-surface-600 opacity-50"
            : status === "correct"
              ? "bg-emerald-500 text-white border-emerald-300"
              : "bg-amber-500 text-black border-amber-300"
        } shadow-sm transition-all`}
    >
      {t(`type_${type}`)}
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
      className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold mr-2 mb-1.5 border-2 shadow-md ${
        isDoubleType
          ? "bg-accent-600 text-white border-accent-400"
          : "bg-yellow-500 text-black border-yellow-400"
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
  const t = useTranslations("pokedex");  
  const [showInstructions, setShowInstructions] = useState(false);


  const { pokemonData, allTypes, targetPokemon } = useGetWordlePokemon();

  const [typeStatuses, setTypeStatuses] = useState<
    Record<string, "possible" | "incorrect" | "correct" | "present">
  >(Object.fromEntries(allTypes.map((type) => [type, "possible"])));
  

  const fuse = new Fuse(pokemonData, {
    keys: ["name", "transName"],
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
      type = t(`type_${type}`);
    }
    return (
      <span className="flex items-center justify-center">
        {type}
        {status === "correct" && <Check className="text-emerald-500 ml-1.5" />}
        {status === "present" && (
          <ArrowRight className="text-amber-500 ml-1.5" />
        )}
        {status === "incorrect" && <X className="text-red-500 ml-1.5" />}
      </span>
    );
  }

  function getPokemonName(pokemon: string) {
    let [pokemonName, formName] = pokemon.split("_");
    if (pokemonName === "ho-oh") pokemonName = "ho_oh";
    if (pokemonName === "porygon-z") pokemonName = "porygon_z";

    const translatedName = t(`pixelmon_${pokemonName}`);
    if (formName === "base") return translatedName;
    return `${translatedName} (${t(`form_${formName}`)})`;
  }

  const renderGuessResult = (guess: Pokemon, isCorrectPokemon = false) => {
    if (!targetPokemon) return null;
    return (
      <TableRow
        key={guess.name}
        className={`
          ${
            isCorrectPokemon
              ? "bg-emerald-500 bg-opacity-20 border-emerald-500"
              : "bg-indigo-900 bg-opacity-30 hover:bg-indigo-800/40"
          } 
          border-b-2 border-opacity-50 transition-colors animate-fadeIn`}
      >
        <TableCell className={`text-yellow-300 font-semibold py-3 ${isCorrectPokemon ? 'text-emerald-400' : ''}`}>
          {getPokemonName(guess.name)}
        </TableCell>
        <TableCell className="text-center">
          <div className="flex items-center justify-center">
            <span className="mr-2">{guess.gen}</span>
            {guess.gen === targetPokemon.gen ? (
              <Check className="text-emerald-500" />
            ) : guess.gen < targetPokemon.gen ? (
              <ArrowUpRight className="text-amber-500" />
            ) : (
              <ArrowDownRight className="text-amber-500" />
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
              <Check className="text-emerald-500" />
            ) : guess.height < targetPokemon.height ? (
              <ArrowUpRight className="text-amber-500" />
            ) : (
              <ArrowDownRight className="text-amber-500" />
            )}
          </div>
        </TableCell>
        <TableCell className="text-center">
          <div className="flex items-center justify-center">
            <span className="mr-2">{guess.weight}</span>
            {guess.weight === targetPokemon.weight ? (
              <Check className="text-emerald-500" />
            ) : guess.weight < targetPokemon.weight ? (
              <ArrowUpRight className="text-amber-500" />
            ) : (
              <ArrowDownRight className="text-amber-500" />
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
        className="p-3 hover:bg-indigo-600 cursor-pointer text-yellow-200 border-b border-indigo-700 last:border-b-0 transition-colors"
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
            {t(`type_${suggestion.type1}`)}
          </span>
          <span className="text-center">
            {suggestion.type2 ? t(`type_${suggestion.type2}`) : "-"}
          </span>
          <span className="text-right">
            {suggestion.height}m / {suggestion.weight}kg
          </span>
        </div>
      </li>
    );
  };

  const handleShowInstructions = () => {
    setShowInstructions(!showInstructions);
  };

  return (
    <div className="min-h-full w-full bg-gradient-to-b from-indigo-950 via-accent-950 to-violet-950 text-white font-mono flex flex-col relative overflow-hidden">
      <StarsBackground />

      <ArcadeTopBar 
        title="Retro Pokémon Guesser" 
        onShowInstructions={handleShowInstructions}
      />

      <main className="flex-grow p-6 overflow-auto container mx-auto max-w-4xl relative z-10">
      <InstructionsModal
        title="¿Cómo jugar?"
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      >
        <ul className="list-disc pl-5 space-y-2">
          <li>Adivina cuál es el Pokémon misterioso en menos de {MAX_GUESSES} intentos.</li>
          <li>Con cada intento, recibirás pistas sobre las características del Pokémon.</li>
          <li>✓ indica que la característica es correcta.</li>
          <li>↑ indica que el valor debería ser mayor.</li>
          <li>↓ indica que el valor debería ser menor.</li>
          <li>→ en un tipo indica que ese tipo está presente pero en la otra posición.</li>
        </ul>
      </InstructionsModal>

        <form onSubmit={handleGuess} className="mb-8 relative">
          <div className="flex space-x-2">
            <div className="flex-grow relative">
              <Input
                type="text"
                value={currentGuess}
                onChange={handleInputChange}
                placeholder="Escribe un nombre de Pokémon"
                aria-label="Intento de nombre de Pokémon"
                className="bg-indigo-900/80 text-yellow-300 border-2 border-cyan-700 placeholder-cyan-300/60 w-full text-lg py-6 rounded-lg shadow-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                disabled={gameOver}
              />
              {suggestions.length > 0 && !gameOver && (
                <ul className="absolute z-20 w-full bg-indigo-900 border-2 border-cyan-700 rounded-b-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                  {suggestions.map(renderSuggestion)}
                </ul>
              )}
            </div>
            <Button
              type="submit"
              className="bg-gradient-to-r from-cyan-500 to-secondary-600 hover:from-cyan-600 hover:to-secondary-700 text-white text-lg px-8 py-6 rounded-lg shadow-lg border-2 border-cyan-700/70 transition-all duration-300 transform hover:scale-105"
              disabled={gameOver}
            >
              Adivinar
            </Button>
          </div>
        </form>

        {message && (
          <div className="mb-8 p-5 bg-indigo-900/90 rounded-lg shadow-xl border-2 border-pink-600/50">
            <p
              className="text-center font-bold text-yellow-300 text-2xl animate-pulse"
              aria-live="polite"
            >
              {message}
            </p>
          </div>
        )}

        <div className="bg-indigo-950/90 rounded-lg overflow-hidden mb-8 shadow-xl border-2 border-cyan-700/50">
          {/* CRT Scan line effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-20 animate-scanline pointer-events-none"></div>
          
          <div className="bg-gradient-to-r from-indigo-800/50 to-accent-800/50 p-3 border-b border-cyan-700/30">
            <h2 className="text-xl font-bold text-cyan-300">Intentos</h2>
          </div>
          
          <div className="p-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-indigo-900/70 border-b-2 border-cyan-700/50">
                  <TableHead className="text-cyan-300 text-lg">
                    Nombre
                  </TableHead>
                  <TableHead className="text-cyan-300 text-lg text-center">
                    Gen
                  </TableHead>
                  <TableHead className="text-cyan-300 text-lg text-center">
                    Tipo1
                  </TableHead>
                  <TableHead className="text-cyan-300 text-lg text-center">
                    Tipo2
                  </TableHead>
                  <TableHead className="text-cyan-300 text-lg text-center">
                    Altura
                  </TableHead>
                  <TableHead className="text-cyan-300 text-lg text-center">
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
                {guesses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-surface-400">
                      Aún no hay intentos. ¡Adivina un Pokémon para comenzar!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

          
            <div className="bg-indigo-900/80 rounded-lg p-4 shadow-xl border-2 border-accent-600/40">
              <h2 className="text-xl font-bold mb-3 text-accent-300">
                Información de Tipos:
              </h2>
              <div className="mb-4 flex flex-wrap">
                {allTypes.map((type) => (
                  <TypeBadge key={type} type={type} status={typeStatuses[type]} />
                ))}
              </div>
              <DoubleTypeBadge isDoubleType={isDoubleType} />
            </div>

            <div className="text-center text-yellow-300 text-3xl font-bold mt-4 bg-indigo-900/80 p-4 rounded-lg shadow-md border-2 border-yellow-600/40">
              Intentos restantes: {Math.max(0, MAX_GUESSES - guesses.length)}
            </div>
        
        <ArcadeFooter 
          title="Retro Pokémon Guesser" 
          description="¡Adivina el Pokémon misterioso y pon a prueba tus conocimientos!" 
        />
      </main>
      
      {/* Add custom styles for animations */}
      <style jsx global>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scanline {
          animation: scanline 2s linear infinite;
        }
        @keyframes text-shine {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .animate-text-shine {
          background-size: 200% auto;
          animation: text-shine 4s linear infinite;
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        .neon-text-yellow {
          text-shadow: 0 0 5px rgba(253, 224, 71, 0.8),
                       0 0 10px rgba(253, 224, 71, 0.5);
        }
      `}</style>
    </div>
  );
}