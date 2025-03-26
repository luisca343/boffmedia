import { FaSteam } from 'react-icons/fa'
import { CustomDropdownMenu, MenuSectionProps } from './DropdownMenu'
import { 
  Gamepad2, 
  Swords, 
  Cpu, 
  Gift, 
} from 'lucide-react'

const HERRAMIENTAS_MENU = {
  triggerLabel: "Herramientas",
  mainLink: { 
    href: "/herramientas", 
    label: "Herramientas", 
    icon: <Gamepad2 className="h-5 w-5" />,
    description: "Utilidades para jugadores y desarrolladores",
  },
  sections: [
    {
      items: [
        { 
          href: "/herramientas", 
          label: "Herramientas", 
          description: "Herramientas para desarrolladores de BOFF",
          icon: <Cpu className="h-5 w-5" />
        },
      ]
    },
    {
      title: "Pokémon",
      description: "Herramientas relacionadas con juegos Pokémon",
      items: [
        { 
          href: "/pokemon/pmdsky", 
          label: "Exploradores del Cielo", 
          description: "Generador de correos para Pokémon Mystery Dungeon",
          icon: <Gamepad2 className="h-5 w-5" />
        },
        { 
          href: "/pokemon/tcgpocket", 
          label: "TCG Pocket", 
          description: "Herramientas para Pokémon Trading Card Game",
          icon: <Swords className="h-5 w-5" />
        },
      ],
    },
    {
      title: "Monster Hunter Wilds",
      description: "Herramientas para Monster Hunter Wilds",
      items: [
        { 
          href: "/mhwilds/builds/planner", 
          label: "Planificador de Builds", 
          description: "Crea y comparte builds para Monster Hunter Wilds",
          icon: <Gamepad2 className="h-5 w-5" />
        },
      ],
    },
    {
      title: "Gaming",
      description: "Utilidades para jugadores",
      items: [
        { 
          href: "/otros/keys", 
          label: "Claves de Steam", 
          description: "Gestiona y comparte tus claves de juegos",
          icon: <FaSteam className="h-5 w-5" />,
          roles: ["BOFF_ADMIN"]
        },
        { 
          href: "/otros/sorteos", 
          label: "Sorteos", 
          description: "Participa en sorteos de juegos y más",
          icon: <Gift className="h-5 w-5" />
        },
      ],
    },
  ] as MenuSectionProps[],
}

export function HerramientasMenu() {
  return <CustomDropdownMenu {...HERRAMIENTAS_MENU} />
}