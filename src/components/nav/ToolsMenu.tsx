import { FaSteam } from 'react-icons/fa'
import { CustomDropdownMenu, MenuSectionProps } from './DropdownMenu'
import { 
  Gamepad2, 
  Swords, 
  Cpu, 
  Gift, 
} from 'lucide-react'
import { useTranslations } from 'next-intl'

export function HerramientasMenu() {
  const t = useTranslations('nav.menus.tools')
  
  const HERRAMIENTAS_MENU = {
    triggerLabel: t("triggerLabel"),
    mainLink: { 
      href: "/herramientas", 
      label: t("mainLink.label"), 
      icon: <Gamepad2 className="h-5 w-5" />,
      description: t("mainLink.description"),
    },
    sections: [
      {
        items: [
          { 
            href: "/herramientas", 
            label: t("sections.main.items.tools.label"), 
            description: t("sections.main.items.tools.description"),
            icon: <Cpu className="h-5 w-5" />
          },
        ]
      },
      {
        title: t("sections.pokemon.title"),
        description: t("sections.pokemon.description"),
        href: "/pokemon", // Added href to make the section title clickable
        icon: <Gamepad2 className="h-4 w-4" />, // Added icon for section
        items: [
          { 
            href: "/pokemon/pmdsky", 
            label: t("sections.pokemon.items.pmdsky.label"), 
            description: t("sections.pokemon.items.pmdsky.description"),
            icon: <Gamepad2 className="h-5 w-5" />
          },
          { 
            href: "/pokemon/tcgpocket", 
            label: t("sections.pokemon.items.tcgpocket.label"), 
            description: t("sections.pokemon.items.tcgpocket.description"),
            icon: <Swords className="h-5 w-5" />
          },
        ],
      },
      {
        title: t("sections.mhwilds.title"),
        description: t("sections.mhwilds.description"),
        href: "/mhwilds", // Added href to make the section title clickable
        icon: <Swords className="h-4 w-4" />, // Added icon for section
        items: [
          { 
            href: "/mhwilds/builds/planner", 
            label: t("sections.mhwilds.items.buildPlanner.label"), 
            description: t("sections.mhwilds.items.buildPlanner.description"),
            icon: <Gamepad2 className="h-5 w-5" />
          },
        ],
      },
      {
        title: t("sections.gaming.title"),
        description: t("sections.gaming.description"),
        href: "/otros", // Added href to make the section title clickable
        icon: <Gift className="h-4 w-4" />, // Added icon for section
        items: [
          { 
            href: "/otros/keys", 
            label: t("sections.gaming.items.steamKeys.label"), 
            description: t("sections.gaming.items.steamKeys.description"),
            icon: <FaSteam className="h-5 w-5" />,
            roles: ["BOFF_ADMIN"]
          },
          { 
            href: "/otros/sorteos", 
            label: t("sections.gaming.items.giveaways.label"), 
            description: t("sections.gaming.items.giveaways.description"),
            icon: <Gift className="h-5 w-5" />
          },
        ],
      },
    ] as MenuSectionProps[],
  }

  return <CustomDropdownMenu {...HERRAMIENTAS_MENU} />
}