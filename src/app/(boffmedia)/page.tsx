import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Smartphone, Gamepad2, ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <main className="container mx-auto px-4 py-12">
        <header className="mb-16 text-center">
          <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-8 rounded-lg shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div className="relative z-10">
              <Image
                src="/img/boff.png"
                alt="BoffMedia Logo"
                width={150}
                height={150}
                className="mx-auto mb-8 drop-shadow-glow"
              />
              <h1 className="text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">
                Bienvenido a BoffMedia
              </h1>
              <p className="text-2xl mb-10 text-gray-300">
                Tu portal a experiencias de juego inmersivas y herramientas
                útiles
              </p>
              <Link
                href="/wingull"
                className="bg-red-500 text-white px-8 py-4 rounded-full font-bold text-xl hover:bg-red-600 transition duration-300 inline-flex items-center shadow-neon"
              >
                Explora Pixelmon Wingull 2
                <ArrowRight className="ml-2" />
              </Link>
            </div>
          </div>
        </header>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
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
              color: "from-yellow-500 to-orange-400",
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
                  <img
                    src={item.icon}
                    alt={`Icono de ${item.title}`}
                    className="w-20 h-20 object-cover"
                  />
                ) : (
                  item.icon
                )}
              </div>
              <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                {item.title}
              </h2>
              <p className="text-gray-300 mb-6">{item.description}</p>
              <Link
                href={item.link}
                className="text-blue-400 hover:text-blue-300 font-bold text-lg flex items-center transition duration-300"
              >
                Saber más
                <ChevronRight className="ml-1" />
              </Link>
            </div>
          ))}
        </section>

        <section className="bg-gradient-to-r from-blue-600 to-purple-600 p-12 mb-16 rounded-lg shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">
              Otros Eventos Emocionantes
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-inner">
                <h3 className="text-2xl font-bold mb-4 text-blue-400">
                  Minecraft Bingo
                </h3>
                <p className="text-gray-300 mb-4">
                  ¡Pon a prueba tu conocimiento y velocidad en Minecraft en
                  nuestros emocionantes eventos de Bingo!
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-inner">
                <h3 className="text-2xl font-bold mb-4 text-green-400">
                  Project ZomBOFF
                </h3>
                <p className="text-gray-300 mb-4">
                  Sobrevive al apocalipsis zombi con amigos en nuestros
                  servidores personalizados de Project Zomboid.
                </p>
              </div>
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/events"
                className="inline-flex items-center bg-purple-600 text-white px-8 py-4 rounded-full font-bold text-xl hover:bg-purple-700 transition duration-300 shadow-neon"
              >
                <Gamepad2 className="mr-2" />
                Ver Todos los Eventos
              </Link>
            </div>
          </div>
        </section>

        <section className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Únete a la Comunidad BoffMedia
          </h2>
          <p className="text-xl mb-10 text-gray-300 max-w-2xl mx-auto">
            ¡Mantente actualizado sobre nuestros últimos eventos, servidores y
            herramientas!
          </p>
          <form className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row">
              <input
                type="email"
                placeholder="Ingresa tu correo electrónico"
                className="flex-grow px-6 py-4 rounded-full border-2 border-purple-500 bg-gray-800 text-white mb-4 sm:mb-0 sm:mr-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
              <button
                type="submit"
                className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold text-xl hover:from-purple-700 hover:to-blue-600 transition duration-300 shadow-neon"
              >
                Suscribirse
              </button>
            </div>
          </form>
        </section>
      </main>

      <footer className="bg-gray-800 text-gray-300 py-12">
        <div className="container mx-auto px-4 text-center">
          <Image
            src="/img/boff.png"
            alt="BoffMedia Logo"
            width={100}
            height={100}
            className="mx-auto mb-6 drop-shadow-glow"
          />
          <p className="text-xl">
            &copy; 2024 BoffMedia. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
