import { CustomDropdownMenu } from './DropdownMenu'
import { 
  Bird, 
  Cpu, 
  BookOpen, 
  Map,
  Users,
  Trophy
} from 'lucide-react'

const WINGULL_MENU = {
  triggerLabel: "Pixelmon Wingull",
  mainLink: { 
    href: "/wingull", 
    label: "Pixelmon Wingull", 
    icon: <Bird className="h-5 w-5" />,
    description: "Tu aventura Pokémon en Minecraft"
  },
  sections: [
    {
      title: "Herramientas",
      description: "Mejora tu experiencia de juego",
      items: [
        { 
          href: "/smartrotom", 
          label: "SmartRotom", 
          description: "Tu compañero digital en el mundo Pixelmon",
          icon: <Cpu className="h-5 w-5" />
        },
        { 
          href: "/wingull/guia", 
          label: "Guía del Jugador", 
          description: "Todo lo que necesitas saber para empezar",
          icon: <BookOpen className="h-5 w-5" />
        },
        { 
          href: "/wingull/mapa", 
          label: "Mapa Interactivo", 
          description: "Explora el mundo de Wingull",
          icon: <Map className="h-5 w-5" />
        }
      ],
    },
    {
      title: "Comunidad",
      description: "Conéctate con otros entrenadores",
      items: [
        { 
          href: "/wingull/eventos", 
          label: "Eventos", 
          description: "Calendario de eventos y torneos",
          icon: <Trophy className="h-5 w-5" />
        },
        { 
          href: "/wingull/discord", 
          label: "Discord", 
          description: "Únete a nuestra comunidad",
          icon: <Users className="h-5 w-5" />,
          isExternal: true
        }
      ],
    }
  ],
}

export function WingullMenu() {
  return <CustomDropdownMenu {...WINGULL_MENU} />
}