import Image from "next/image";
import Link from "next/link";
import { Gamepad2, Twitch, Twitter } from "lucide-react";

export function BoffFooter() {
  return (
    <footer className="bg-gray-800 text-orange-100 py-8">
      <div className="container mx-auto px-4 text-center">
        <Image
          src="/img/boff.png"
          alt="Logo de BoffMedia"
          width={100}
          height={100}
          className="mx-auto mb-6 drop-shadow-glow"
        />
        <p className="text-xl mb-4">
          &copy; 2024 BoffMedia. Todos los derechos reservados.
        </p>
        <nav>
          <ul className="flex justify-center space-x-6">
            {[
              { name: "Contacto", link: "/contacto" },
              {
                name: "Política de Devoluciones y Cancelaciones",
                link: "/politicas/devoluciones",
              },
              {
                name: "Política de Reembolsos",
                link: "/politicas/reembolsos",
              },
              {
                name: "Términos de Servicio",
                link: "/politicas/terminos",
              },
              {
                name: "Política de Privacidad",
                link: "/politicas/privacidad",
              },
            ].map((item) => (
              <li key={item.name}>
                <Link
                  href={item.link}
                  className="text-orange-300 hover:text-orange-400 transition duration-300"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex justify-center space-x-6 mt-6">
          <Link
            href="https://twitter.com/boffmedia"
            className="text-orange-300 hover:text-orange-400 transition duration-300"
          >
            <Twitter className="w-8 h-8" />
            <span className="sr-only">Síguenos en Twitter</span>
          </Link>
          <Link
            href="https://twitch.tv/boffmedia"
            className="text-orange-300 hover:text-orange-400 transition duration-300"
          >
            <Twitch className="w-8 h-8" />
            <span className="sr-only">Síguenos en Twitch</span>
          </Link>
          <Link
            href="https://discord.gg/boffmedia"
            className="text-orange-300 hover:text-orange-400 transition duration-300"
          >
            <Gamepad2 className="w-8 h-8" />
            <span className="sr-only">Únete a nuestro Discord</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
