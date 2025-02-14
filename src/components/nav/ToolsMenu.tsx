import { FaSteam } from 'react-icons/fa'
import { CustomDropdownMenu } from './DropdownMenu'
import { 
  Gamepad2, 
  Swords, 
  Cpu, 
  Gift, 
} from 'lucide-react'

const HERRAMIENTAS_MENU = {
  triggerLabel: "Herramientas",
  sections: [
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
      title: "Gaming",
      description: "Utilidades para jugadores",
      items: [
        { 
          href: "/otros/keys", 
          label: "Claves de Steam", 
          description: "Gestiona y comparte tus claves de juegos",
          icon: <FaSteam className="h-5 w-5" />
        },
        { 
          href: "/otros/sorteos", 
          label: "Sorteos", 
          description: "Participa en sorteos de juegos y más",
          icon: <Gift className="h-5 w-5" />
        },
      ],
    },
  ],
}

export function HerramientasMenu() {
  return <CustomDropdownMenu {...HERRAMIENTAS_MENU} />
}