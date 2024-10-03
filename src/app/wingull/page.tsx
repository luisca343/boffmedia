import { MovingSection } from "./_components/MovingSection";
import { BackgroundDecorations } from "./_components/BackgroundDecorations";
import Image from "next/image";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col text-white relative">
      <BackgroundDecorations />
      <main className="flex-grow container mx-auto px-4 py-16 relative">
        <div className="text-center mb-16 relative">
          <Image
            src="/img/win-full.png"
            alt="Logo de Pixelmon Wingull"
            width={300}
            height={150}
            className="mx-auto mb-8 drop-shadow-2xl"
          />
          <h1 className="text-5xl font-bold mb-4 text-yellow-300 drop-shadow-lg">
            Bienvenido a Pixelmon Wingull
          </h1>
          <p className="text-2xl text-blue-100">
            ¡Explora la región de Teras y experimenta el choque de eras!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-blue-800 bg-opacity-70 p-8 rounded-lg shadow-xl transform hover:scale-105 transition-transform duration-300">
            <h2 className="text-3xl font-bold mb-4 text-yellow-300">
              Fukitsu-Gansolia: El Pasado
            </h2>
            <p className="text-blue-100 text-lg">
              Sumérgete en los antiguos misterios y legendarias tradiciones de
              Fukitsu-Gansolia. Desvela Pokémon ancestrales y enfrenta desafíos
              épicos forjados en la historia.
            </p>
          </div>
          <div className="bg-blue-800 bg-opacity-70 p-8 rounded-lg shadow-xl transform hover:scale-105 transition-transform duration-300">
            <h2 className="text-3xl font-bold mb-4 text-yellow-300">
              Narukami-Akina: El Futuro
            </h2>
            <p className="text-blue-100 text-lg">
              Abraza la tecnología de vanguardia y los paisajes futuristas de
              Narukami-Akina. Domina la ciencia avanzada en el arte del
              entrenamiento Pokémon y reta a la élite tecnológica en combates
              legendarios.
            </p>
          </div>
        </div>
        <MovingSection />
      </main>
      <footer className="bg-blue-900 bg-opacity-80 py-6 mt-auto border-t border-blue-300">
        <div className="container mx-auto px-4 text-center">
          <p className="text-blue-200">
            &copy; 2024 Pixelmon Wingull. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
