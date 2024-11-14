import { Joystick, WholeWord, Pickaxe, Grid, Puzzle, Bomb } from "lucide-react";
import { InternalLink } from "@/components/nav/Link";
import { RainbowText } from "./_components/RainbowText";
import StarsBackground from "./_components/StarsBackground";
import VoltorbImage from "./voltorb/_components/VoltorbIcon";

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
    href: "/mina",
  },
  {
    nombre: "Gira Voltorb",
    image: <VoltorbImage size="xl" />,
    color: "red",
    href: "/arcade/voltorb",
  },
  {
    nombre: "TypeDoku",
    icono: Grid,
    color: "yellow",
    href: "/arcade/typedoku",
  },
  {
    nombre: "Puzle",
    icono: Puzzle,
    color: "blue",
    href: "/arcade/puzle",
  },
];

export default function CentroArcade() {
  return (
    <div className="min-h-screen w-full bg-purple-900 flex flex-col items-center justify-center p-4 font-mono relative overflow-hidden">
      <StarsBackground />
      <RainbowText size="xl" text="Tu Estación Retro Arcade Sorprendente" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl w-full z-10">
        {juegos.map((juego) => (
          <InternalLink
            key={juego.nombre}
            href={juego.href}
            className={`bg-main-800 bg-opacity-80 border-4 border-${juego.color}-500 rounded-lg p-6 flex flex-col items-center justify-center space-y-4 hover:bg-main-700 hover:bg-opacity-80 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-${juego.color}-400 focus:ring-opacity-50`}
          >
            {juego.icono ? (
              <juego.icono className={`w-16 h-16 text-${juego.color}-400`} />
            ) : (
              juego.image
            )}
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
