import Link from "next/link"
import { TbBrandBluesky, TbBrandDiscord, TbBrandInstagram, TbBrandTiktok, TbBrandTwitch, TbBrandTwitter, TbBrandYoutube } from "react-icons/tb"

const footerLinks = [
  { name: "Contacto", link: "/contacto" },
  /*
  {
    name: "Política de Devoluciones y Cancelaciones",
    link: "/politicas/devoluciones",
  },
  {
    name: "Política de Reembolsos",
    link: "/politicas/reembolsos",
  },*/
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
    <footer className="bg-surface-800 text-primary-100 py-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="text-center md:text-left">
            <p className="text-sm">&copy; 2024 BoffMedia. Todos los derechos reservados.</p>
          </div>
          <nav className="order-last md:order-none">
            <ul className="flex flex-wrap justify-center gap-2 text-xs">
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
          <div className="flex justify-center md:justify-end space-x-3">
            {socialLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-primary-300 hover:text-primary-400 transition duration-300"
              >
                <item.icon className="w-6 h-6" />
                <span className="sr-only">Síguenos en {item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}