import Image from "next/image";
import Link from "next/link";
import {
  Smartphone,
  Gamepad2,
  ChevronRight,
} from "lucide-react";

  const featuredItems = [
    {
      title: "Pixelmon Wingull 2",
      description: "Vive la última aventura Pokémon en Minecraft. ¡Próximamente!",
      icon: "/img/win-80.png",
      link: "/wingull",
      color: "from-blue-500 to-green-400",
    },
    {
      title: "SmartRotom",
      description: "Accede a tu smartphone del juego desde cualquier lugar. Mantente conectado al mundo Pixelmon.",
      icon: <Smartphone className="w-16 h-16 md:w-20 md:h-20" />,
      link: "/smartrotom",
      color: "from-primary-500 to-red-600",
    },
    {
      title: "Herramientas de Juego",
      description: "Mejora tu experiencia de juego con nuestra colección de herramientas útiles.",
      icon: <Gamepad2 className="w-16 h-16 md:w-20 md:h-20" />,
      link: "/herramientas",
      color: "from-purple-500 to-pink-400",
    },
  ];

export function FeaturedSection() {
    return (
      <section className="mb-12 md:mb-24">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
          Juegos y Herramientas Destacados
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {featuredItems.map((item, index) => (
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
                <ChevronRight className="ml-1" aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>
      </section>
    );
  }
  