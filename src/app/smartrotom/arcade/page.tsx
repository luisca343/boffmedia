"use client";
import {
  Joystick,
  WholeWord,
  Pickaxe,
  Grid,
  Puzzle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { InternalLink } from "@/components/nav/Link";

const juegos = [
  {
    nombre: "Squirdle",
    icono: WholeWord,
    color: "pink",
    href: "/arcade/squirdle",
  },
  {
    nombre: "Minería",
    icono: Pickaxe,
    color: "green",
    href: "/arcade/mineria",
  },
  {
    nombre: "Pokedoku",
    icono: Grid,
    color: "yellow",
    href: "/arcade/pokedoku",
  },
  {
    nombre: "Puzle",
    icono: Puzzle,
    color: "blue",
    href: "/arcade/puzle",
  },
];

export default function CentroArcade() {
  const [estrellas, setEstrellas] = useState<
    { x: number; y: number; tamaño: number }[]
  >([]);

  useEffect(() => {
    const nuevasEstrellas = Array.from({ length: 100 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      tamaño: Math.random() * 2 + 1,
    }));
    setEstrellas(nuevasEstrellas);
  }, []);

  return (
    <div className="min-h-screen w-full bg-purple-900 flex flex-col items-center justify-center p-4 font-mono relative overflow-hidden">
      {estrellas.map((estrella, index) => (
        <div
          key={index}
          className="absolute bg-white rounded-full animate-twinkle"
          style={{
            left: `${estrella.x}%`,
            top: `${estrella.y}%`,
            width: `${estrella.tamaño}px`,
            height: `${estrella.tamaño}px`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
      <h1 className="text-4xl font-bold mb-12 text-center z-10 animate-pulse">
        <span className="text-pink-500 text-6xl">T</span>
        <span className="text-pink-500">he </span>
        <span className="text-cyan-400 text-6xl">E</span>
        <span className="text-cyan-400">xciting </span>
        <span className="text-yellow-300 text-6xl">R</span>
        <span className="text-yellow-300">etro </span>
        <span className="text-green-400 text-6xl">A</span>
        <span className="text-green-400">rcade </span>
        <span className="text-purple-400 text-6xl">S</span>
        <span className="text-purple-400">tation</span>
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl w-full z-10">
        {juegos.map((juego) => (
          <InternalLink
            key={juego.nombre}
            href={juego.href}
            className={`bg-gray-800 bg-opacity-80 border-4 border-${juego.color}-500 rounded-lg p-6 flex flex-col items-center justify-center space-y-4 hover:bg-gray-700 hover:bg-opacity-80 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-${juego.color}-400 focus:ring-opacity-50`}
          >
            <juego.icono className={`w-16 h-16 text-${juego.color}-400`} />
            <h2 className={`text-2xl font-bold text-${juego.color}-300`}>
              {juego.nombre}
            </h2>
          </InternalLink>
        ))}
      </div>

      <div className="mt-12 flex items-center justify-center space-x-4 z-10">
        <Joystick className="w-8 h-8 text-red-500 animate-bounce" />
        <p className="text-lg text-white">¡Elige tu juego y diviértete!</p>
        <Joystick className="w-8 h-8 text-blue-500 animate-bounce" />
      </div>
    </div>
  );
}