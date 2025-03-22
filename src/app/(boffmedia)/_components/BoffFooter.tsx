import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Gamepad } from "lucide-react"

export function BoffFooter() {
  return (
    <footer className="border-t border-surface-700 bg-surface-800 h-72 z-10 relative">
      <div className="container mx-auto px-4 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Gamepad className="h-6 w-6 text-primary-500" />
              <span className="text-lg font-bold text-surface-50">BoffMedia</span>
            </div>
            <p className="text-sm text-surface-300">Tu plataforma de gaming definitiva</p>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-surface-50">Plataforma</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/games"
                  className="text-surface-300 hover:text-primary-400 transition-colors"
                >
                  Juegos
                </Link>
              </li>
              <li>
                <Link
                  href="/events"
                  className="text-surface-300 hover:text-primary-400 transition-colors"
                >
                  Eventos
                </Link>
              </li>
              <li>
                <Link
                  href="/community"
                  className="text-surface-300 hover:text-primary-400 transition-colors"
                >
                  Comunidad
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-surface-50">Compañía</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-surface-300 hover:text-primary-400 transition-colors"
                >
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-surface-300 hover:text-primary-400 transition-colors"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-surface-50">Suscríbete al Newsletter</h4>
            <div className="flex space-x-2">
              <Input
                placeholder="Email"
                type="email"
                className="bg-surface-700 border-surface-600"
              />
              <Button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white">
                Unirse
              </Button>
            </div>
          </div>
        </div>
        <div className="border-t border-surface-700 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-surface-300">
            © 2024 BoffMedia. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <Link
              href="/privacidad"
              className="text-sm text-surface-300 hover:text-primary-400 transition-colors"
            >
              Privacidad
            </Link>
            <Link
              href="/terminos"
              className="text-sm text-surface-300 hover:text-primary-400 transition-colors"
            >
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

