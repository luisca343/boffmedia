import Link from "next/link"
import { TbBrandBluesky, TbBrandDiscord, TbBrandInstagram, TbBrandTiktok, TbBrandTwitch, TbBrandTwitter, TbBrandYoutube } from "react-icons/tb"

const footerLinks = [
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
]

const socialLinks = [
  {
    name: "Twitter",
    icon: TbBrandTwitter,
    href: "https://twitter.com/boffmedia",
  },
  {
    name: "Bluesky",
    icon: TbBrandBluesky,
    href: "https://bsky.app/profile/boffmedia.es",
  },
  {
    name: "Instagram",
    icon: TbBrandInstagram,
    href: "https://instagram.com/boffmedia",
  },
  {
    name: "YouTube",
    icon: TbBrandYoutube,
    href: "https://www.youtube.com/@boffmedia",
  },
  {
    name: "Twitch",
    icon: TbBrandTwitch,
    href: "https://twitch.tv/boffmedia",
  },
  {
    name: "TikTok",
    icon: TbBrandTiktok,
    href: "https://tiktok.com/@boffmedia",
  },
  {
    name: "Discord",
    icon: TbBrandDiscord,
    href: "https://discord.gg/RjhVY2eK9m",
  },
]

export function BoffFooter() {
  return (
    <footer className="bg-surface-800 text-primary-100 py-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-xl mb-4">
          &copy; 2024 BoffMedia. Todos los derechos reservados.
        </p>
        <nav>
          <ul className="flex flex-wrap justify-center gap-4">
            {footerLinks.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.link}
                  className="text-primary-300 hover:text-primary-400 transition duration-300"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex justify-center item space-x-4 mt-4">
          {socialLinks.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-primary-300 hover:text-primary-400 transition duration-300"
            >
              <item.icon className="w-8 h-8" />
              <span className="sr-only">Síguenos en {item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}