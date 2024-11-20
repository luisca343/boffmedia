
import { CustomDropdownMenu } from './DropdownMenu'
import { Wrench, GamepadIcon as PokemonGo, ComputerIcon as Steam } from 'lucide-react'

const HERRAMIENTAS_MENU = {
  triggerLabel: "Herramientas",
  sections: [
    {
      title: "Pokémon",
      items: [
        { href: "/pokemon/pmdsky", label: "Generador de Correos Exploradores del Cielo", icon: <PokemonGo className="h-5 w-5" /> },
        { href: "/pokemon/tcgpocket", label: "TCG Pocket", icon: <PokemonGo className="h-5 w-5" /> },
      ],
    },
    {
      title: "Otros",
      items: [
        { href: "/otros/keys", label: "Claves de Steam", icon: <Steam className="h-5 w-5" /> },
      ],
    },
  ],
}

export function HerramientasMenu() {
  return <CustomDropdownMenu {...HERRAMIENTAS_MENU} />
}