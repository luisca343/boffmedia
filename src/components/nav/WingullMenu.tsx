import { CustomDropdownMenu } from "./DropdownMenu"

const WINGULL_MENU = {
  triggerLabel: "Pixelmon Wingull",
  mainLink: { href: "/wingull", label: "Pixelmon Wingull" },
  sections: [
    {
      title: "Herramientas",
      items: [
        { href: "/smartrotom", label: "SmartRotom" },
      ],
    },
  ],
}

export function WingullMenu() {
  return <CustomDropdownMenu {...WINGULL_MENU} />
}