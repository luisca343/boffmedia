import { Bird, Cpu } from 'lucide-react'
import { CustomDropdownMenu } from './DropdownMenu'

const WINGULL_MENU = {
  triggerLabel: "Pixelmon Wingull",
  mainLink: { href: "/wingull", label: "Pixelmon Wingull", icon: <Bird className="h-5 w-5" /> },
  sections: [
    {
      title: "Herramientas",
      items: [
        { href: "/smartrotom", label: "SmartRotom", icon: <Cpu className="h-5 w-5" /> },
      ],
    },
  ],
}

export function WingullMenu() {
  return <CustomDropdownMenu {...WINGULL_MENU} />
}