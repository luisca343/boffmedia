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

export default function GamingLandingPage() {
  return (
    <BoffLayout>
      <div className="min-h-screen text-white font-sans relative">
        <div className="relative z-10">
          <main className="container mx-auto px-4 py-12">
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
              <p className="text-2xl mb-10 text-gray-300 max-w-3xl mx-auto">
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
                  className="bg-gray-800 text-white px-8 py-4 rounded-full font-bold text-xl hover:bg-gray-700 transition duration-300 inline-flex items-center border-2 border-purple-500"
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
                    className="bg-gray-800 p-8 rounded-lg border border-gray-700 shadow-lg hover:shadow-2xl transition duration-300 transform hover:-translate-y-1"
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
                    <p className="text-gray-300 mb-6">{item.description}</p>
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
                    Próximos Eventos
                  </h2>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-inner">
                      <h3 className="text-2xl font-bold mb-4 text-blue-400">
                        Minecraft Bingo
                      </h3>
                      <p className="text-gray-300 mb-4">
                        ¡Pon a prueba tu conocimiento y velocidad en Minecraft
                        en nuestros emocionantes eventos de Bingo!
                      </p>
                      <Link
                        href="/eventos/minecraft-bingo"
                        className="inline-flex items-center text-blue-400 hover:text-blue-300 font-bold"
                      >
                        Unirse al Evento
                        <ChevronRight className="ml-1" />
                      </Link>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-inner">
                      <h3 className="text-2xl font-bold mb-4 text-green-400">
                        Project ZomBOFF
                      </h3>
                      <p className="text-gray-300 mb-4">
                        Sobrevive al apocalipsis zombi con amigos en nuestros
                        servidores personalizados de Project Zomboid.
                      </p>
                      <Link
                        href="/eventos/project-zomboff"
                        className="inline-flex items-center text-green-400 hover:text-green-300 font-bold"
                      >
                        Unirse al Evento
                        <ChevronRight className="ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-24">
              <h2 className="text-4xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-yellow-400">
                Calendario de Eventos
              </h2>
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { date: "15 Oct", event: "Torneo Pixelmon", time: "18:00" },
                    { date: "22 Oct", event: "Minecraft Bingo", time: "20:00" },
                    {
                      date: "29 Oct",
                      event: "Noche de ZomBOFF",
                      time: "22:00",
                    },
                    {
                      date: "5 Nov",
                      event: "Carrera de Elytra",
                      time: "19:00",
                    },
                    {
                      date: "12 Nov",
                      event: "Batalla de Constructores",
                      time: "17:00",
                    },
                    {
                      date: "19 Nov",
                      event: "Maratón de Supervivencia",
                      time: "15:00",
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg"
                    >
                      <Calendar className="w-8 h-8 text-yellow-400" />
                      <div>
                        <p className="font-bold text-white">{item.event}</p>
                        <p className="text-gray-300">
                          {item.date} - {item.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mb-24">
              <h2 className="text-4xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
                Tabla de Clasificación
              </h2>
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-3 px-4">Posición</th>
                      <th className="py-3 px-4">Jugador</th>
                      <th className="py-3 px-4">Puntos</th>
                      <th className="py-3 px-4">Insignias</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        position: 1,
                        player: "Herobrine",
                        points: 420000,
                        badges: 69,
                      },
                      {
                        position: 2,
                        player: "Lausci",
                        points: 14500,
                        badges: 7,
                      },
                      {
                        position: 3,
                        player: "Manolo el Furro",
                        points: 14000,
                        badges: 7,
                      },
                      {
                        position: 4,
                        player: "El Martillo que perforará los cielos",
                        points: 13500,
                        badges: 5,
                      },
                      {
                        position: 5,
                        player: "Eskarmina",
                        points: 13000,
                        badges: 6,
                      },
                      {
                        position: 6,
                        player: "Walfie",
                        points: 13500,
                        badges: 6,
                      },
                      { position: 7, player: "Yho", points: 12000, badges: 5 },
                      { position: 999, player: "Cuason", points: 0, badges: 0 },
                    ].map((item, index) => (
                      <tr key={index} className="border-b border-gray-700">
                        <td className="py-3 px-4 font-bold text-yellow-400">
                          {item.position}
                        </td>
                        <td className="py-3 px-4">{item.player}</td>
                        <td className="py-3 px-4">{item.points}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Trophy className="w-5 h-5 text-yellow-400 mr-2" />
                            {item.badges}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="text-center mb-24">
              <h2 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Únete a la Comunidad BoffMedia
              </h2>
              <p className="text-xl mb-10 text-gray-300 max-w-2xl mx-auto">
                ¡Mantente actualizado sobre nuestros últimos eventos, servidores
                y herramientas!
              </p>
              <form className="max-w-md mx-auto mb-12">
                <div className="flex flex-col sm:flex-row">
                  <input
                    type="email"
                    placeholder="Ingresa tu correo electrónico"
                    className="flex-grow px-6 py-4 rounded-full border-2 border-purple-500 bg-gray-800 text-white mb-4 sm:mb-0 sm:mr-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="text-gray-300 hover:text-purple-400 transition duration-300"
                >
                  <Gamepad2 className="w-8 h-8" />
                  <span className="sr-only">Únete a nuestro Discord</span>
                </Link>
                <Link
                  href="https://twitch.tv/boffmedia"
                  className="text-gray-300 hover:text-purple-400 transition duration-300"
                >
                  <Twitch className="w-8 h-8" />
                  <span className="sr-only">Síguenos en Twitch</span>
                </Link>
              </div>
            </section>
          </main>
        </div>
      </div>
    </BoffLayout>
  );
}
