import { MovingSection } from "./_components/MovingSection";
import Image from "next/image";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 text-white">
      <main className="flex-grow container mx-auto px-4 py-16 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
          <Image
            src="/img/Wingull_silhouette.png"
            alt="Wingull silhouette"
            width={200}
            height={200}
            className="absolute top-10 left-10 transform -rotate-12 animate-float-wingull"
          />
          <Image
            src="/img/Refined_Pokeball_silhouette.png"
            alt="Pokeball silhouette"
            width={150}
            height={150}
            className="absolute bottom-20 right-20 animate-bounce-spin"
          />
        </div>

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
