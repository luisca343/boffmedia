import { CustomDropdownMenu } from "./DropdownMenu"

const HERRAMIENTAS_MENU = {
  triggerLabel: "Herramientas",
  sections: [
    {
      title: "Pokémon",
      items: [
        { href: "/pokemon/pmdsky", label: "Generador de Correos Mundo Misterioso" },
        { href: "/pokemon/tcgpocket", label: "Herramientas para TCG Pocket" },
      ],
    },
    {
      title: "Otros",
      items: [
        { href: "/otros/keys", label: "Claves de Steam" },
      ],
    },
  ],
}

export function HerramientasMenu() {
  return <CustomDropdownMenu {...HERRAMIENTAS_MENU} />
}