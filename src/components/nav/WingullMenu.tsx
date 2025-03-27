import { CustomDropdownMenu } from './DropdownMenu'
import { 
  Bird, 
  Cpu, 
  BookOpen, 
  Map,
  Users,
  Trophy
} from 'lucide-react'
import { useTranslations } from 'next-intl'

export function WingullMenu() {
  const t = useTranslations('nav.menus.wingull')
  
  const WINGULL_MENU = {
    triggerLabel: t("triggerLabel"),
    mainLink: { 
      href: "/wingull", 
      label: t("mainLink.label"), 
      icon: <Bird className="h-5 w-5" />,
      description: t("mainLink.description")
    },
    sections: [
      {
        title: t("sections.tools.title"),
        description: t("sections.tools.description"),
        items: [
          { 
            href: "/smartrotom", 
            label: t("sections.tools.items.smartrotom.label"), 
            description: t("sections.tools.items.smartrotom.description"),
            icon: <Cpu className="h-5 w-5" />
          },
          { 
            href: "/wingull/guia", 
            label: t("sections.tools.items.guide.label"), 
            description: t("sections.tools.items.guide.description"),
            icon: <BookOpen className="h-5 w-5" />
          },
          { 
            href: "/wingull/mapa", 
            label: t("sections.tools.items.map.label"), 
            description: t("sections.tools.items.map.description"),
            icon: <Map className="h-5 w-5" />
          }
        ],
      },
      {
        title: t("sections.community.title"),
        description: t("sections.community.description"),
        items: [
          { 
            href: "/wingull/eventos", 
            label: t("sections.community.items.events.label"), 
            description: t("sections.community.items.events.description"),
            icon: <Trophy className="h-5 w-5" />
          },
          { 
            href: "/wingull/discord", 
            label: t("sections.community.items.discord.label"), 
            description: t("sections.community.items.discord.description"),
            icon: <Users className="h-5 w-5" />,
            isExternal: true
          }
        ],
      }
    ],
  }

  return <CustomDropdownMenu {...WINGULL_MENU} />
}