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
            <section className="mb-24 text-center">
              <Image
                src="/img/boff.png"
                alt="Logo de BoffMedia"
                width={150}
                height={150}
                className="mx-auto mb-8 drop-shadow-glow"
              />
              <h1 className="text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Bienvenido a BoffMedia
              </h1>
              <p className="text-2xl mb-10 text-main-300 max-w-3xl mx-auto">
                Sumérgete en experiencias de juego inmersivas y herramientas
                poderosas para gamers
              </p>
              <div className="flex justify-center space-x-6">
                <Link
                  href="/wingull"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold text-xl hover:from-purple-700 hover:to-pink-700 transition duration-300 inline-flex items-center shadow-neon"
                >
                  Explora Pixelmon Wingull 2
                  <ArrowRight className="ml-2" />
                </Link>
                <Link
                  href="/comunidad"
                  className="bg-main-800 text-white px-8 py-4 rounded-full font-bold text-xl hover:bg-main-700 transition duration-300 inline-flex items-center border-2 border-purple-500"
                >
                  Únete a la Comunidad
                  <ChevronRight className="ml-2" />
                </Link>
              </div>
            </section>

            <section className="mb-24">
              <h2 className="text-4xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                Juegos y Herramientas Destacados
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                    icon: <Smartphone className="w-20 h-20" />,
                    link: "/smartrotom",
                    color: "from-orange-500 to-red-600",
                  },
                  {
                    title: "Herramientas de Juego",
                    description:
                      "Mejora tu experiencia de juego con nuestra colección de herramientas útiles.",
                    icon: <Gamepad2 className="w-20 h-20" />,
                    link: "/herramientas",
                    color: "from-purple-500 to-pink-400",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="bg-main-800 p-8 rounded-lg border border-main-700 shadow-lg hover:shadow-2xl transition duration-300 transform hover:-translate-y-1"
                  >
                    <div
                      className={`bg-gradient-to-br ${item.color} p-4 rounded-full inline-block mb-6`}
                    >
                      {typeof item.icon === "string" ? (
                        <Image
                          src={item.icon}
                          alt={`Icono de ${item.title}`}
                          width={80}
                          height={80}
                          className="object-cover"
                        />
                      ) : (
                        item.icon
                      )}
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                      {item.title}
                    </h3>
                    <p className="text-main-300 mb-6">{item.description}</p>
                    <Link
                      href={item.link}
                      className="text-purple-400 hover:text-purple-300 font-bold text-lg flex items-center transition duration-300"
                    >
                      Saber más
                      <ChevronRight className="ml-1" />
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-24">
              <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-12 rounded-lg shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-50"></div>
                <div className="relative z-10">
                  <h2 className="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">
                    Eventos Destacados
                  </h2>
                  <UpcomingEvents />
                </div>
              </div>
            </section>

            <section className="mb-24">
              <h2 className="text-4xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-yellow-400">
                Calendario de Eventos
              </h2>
              <EventCalendar />
            </section>

            <section className="mb-24">
              <h2 className="text-4xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
                Tabla de Clasificación
              </h2>
              <ClassificationTable />
            </section>
            {/* 
      <section className="text-center mb-24">
      <h2 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
      Únete a la Comunidad BoffMedia
      </h2>
      <p className="text-xl mb-10 text-main-300 max-w-2xl mx-auto">
      ¡Mantente actualizado sobre nuestros últimos eventos, servidores
      y herramientas!
      </p>
      <form className="max-w-md mx-auto mb-12">
      <div className="flex flex-col sm:flex-row">
      <input
      type="email"
      placeholder="Ingresa tu correo electrónico"
      className="flex-grow px-6 py-4 rounded-full border-2 border-purple-500 bg-main-800 text-white mb-4 sm:mb-0 sm:mr-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
      required
      />
      <button
      type="submit"
      className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl hover:from-purple-700 hover:to-pink-700 transition duration-300 shadow-neon"
      >
      Suscribirse
      </button>
      </div>
      </form>
      <div className="flex justify-center space-x-6">
      <Link
      href="https://discord.gg/boffmedia"
      className="text-main-300 hover:text-purple-400 transition duration-300"
      >
      <Gamepad2 className="w-8 h-8" />
      <span className="sr-only">Únete a nuestro Discord</span>
      </Link>
      <Link
      href="https://twitch.tv/boffmedia"
      className="text-main-300 hover:text-purple-400 transition duration-300"
      >
      <Twitch className="w-8 h-8" />
      <span className="sr-only">Síguenos en Twitch</span>
      </Link>
      </div>
      </section>
      */}
          </main>
        </div>
      </div>
    </BoffLayout>
  );
}
