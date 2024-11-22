import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Smartphone,
  Gamepad2,
  ChevronRight,
  Twitch,
  Calendar,
  Trophy,
} from "lucide-react";
import { BoffFooter } from "./_components/BoffFooter";
import BoffLayout from "./_components/BoffLayout";
import EventCalendar from "./_components/EventCalendar";
import { UpcomingEvents } from "./_components/UpcomingEvents";
import { ClassificationTable } from "./_components/ClassificationTable";

export default function GamingLandingPage() {
  return (
    <BoffLayout>
      <div className="min-h-screen text-white font-sans relative">
        <div className="relative z-10">
          <main className="container mx-auto px-4">
            <section className="mb-12 md:mb-24 text-center">
              <Image
                src="/img/boff-logo.webp"
                alt="Logo de BoffMedia"
                width={150}
                height={150}
                className="mx-auto mb-6 md:mb-8 drop-shadow-glow w-24 h-24 md:w-36 md:h-36"
              />
              <h1 className="text-4xl md:text-7xl font-bold mb-4 md:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Bienvenido a BoffMedia
              </h1>
              <p className="text-lg md:text-2xl mb-6 md:mb-10 text-surface-300 max-w-3xl mx-auto">
                Sumérgete en experiencias de juego inmersivas y herramientas
                poderosas para gamers
              </p>
              <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6">
                <Link
                  href="/wingull"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-bold text-lg md:text-xl hover:from-purple-700 hover:to-pink-700 transition duration-300 inline-flex items-center justify-center shadow-neon"
                >
                  Explora Pixelmon Wingull 2
                  <ArrowRight className="ml-2" />
                </Link>
                <Link
                  href="/comunidad"
                  className="bg-surface-800 text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-bold text-lg md:text-xl hover:bg-surface-700 transition duration-300 inline-flex items-center justify-center border-2 border-purple-500"
                >
                  Únete a la Comunidad
                  <ChevronRight className="ml-2" />
                </Link>
              </div>
            </section>

            <section className="mb-12 md:mb-24">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                Juegos y Herramientas Destacados
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {[
                  {
                    title: "Pixelmon Wingull 2",
                    description:
                      "Vive la última aventura Pokémon en Minecraft. ¡Próximamente!",
                    icon: "/img/win-80.png",
                    link: "/wingull",
                    color: "from-blue-500 to-green-400",
                  },
                  {
                    title: "SmartRotom",
                    description:
                      "Accede a tu smartphone del juego desde cualquier lugar. Mantente conectado al mundo Pixelmon.",
                    icon: <Smartphone className="w-16 h-16 md:w-20 md:h-20" />,
                    link: "/smartrotom",
                    color: "from-primary-500 to-red-600",
                  },
                  {
                    title: "Herramientas de Juego",
                    description:
                      "Mejora tu experiencia de juego con nuestra colección de herramientas útiles.",
                    icon: <Gamepad2 className="w-16 h-16 md:w-20 md:h-20" />,
                    link: "/herramientas",
                    color: "from-purple-500 to-pink-400",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="bg-surface-800 p-6 md:p-8 rounded-lg border border-surface-700 shadow-lg hover:shadow-2xl transition duration-300 transform hover:-translate-y-1"
                  >
                    <div
                      className={`bg-gradient-to-br ${item.color} p-3 md:p-4 rounded-full inline-block mb-4 md:mb-6`}
                    >
                      {typeof item.icon === "string" ? (
                        <Image
                          src={item.icon}
                          alt={`Icono de ${item.title}`}
                          width={80}
                          height={80}
                          className="object-cover w-16 h-16 md:w-20 md:h-20"
                        />
                      ) : (
                        item.icon
                      )}
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                      {item.title}
                    </h3>
                    <p className="text-surface-300 mb-4 md:mb-6 text-sm md:text-base">
                      {item.description}
                    </p>
                    <Link
                      href={item.link}
                      className="text-purple-400 hover:text-purple-300 font-bold text-base md:text-lg flex items-center transition duration-300"
                    >
                      Saber más
                      <ChevronRight className="ml-1" />
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-12 md:mb-24">
              <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-6 md:p-12 rounded-lg shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-50"></div>
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">
                    Eventos Destacados
                  </h2>
                  <UpcomingEvents />
                </div>
              </div>
            </section>

            <section className="mb-12 md:mb-24">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-yellow-400">
                Calendario de Eventos
              </h2>
              <EventCalendar />
            </section>

            <section className="mb-12 md:mb-24">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
                Tabla de Clasificación
              </h2>
              <ClassificationTable />
            </section>
          </main>
        </div>
      </div>
    </BoffLayout>
  );
}

