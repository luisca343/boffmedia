import * as React from "react"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"

const HERRAMIENTAS = {
  pokemon: [
    { href: "/pokemon/pmdsky", label: "Generador de Correos Mundo Misterioso" },
    { href: "/pokemon/tcgpocket/cartas", label: "Gestión colecciones TCG Pocket" },
  ],
  otros: [
    { href: "/otros/keys", label: "Claves de Steam" },
  ],
}

export function HerramientasMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger variant="boffmedia">
            Herramientas
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-surface-900 rounded-md border border-surface-800 shadow-xl">
              {Object.entries(HERRAMIENTAS).map(([category, tools]) => (
                <li key={category} className="row-span-3 space-y-3">
                  <h3 className="font-bold text-lg text-primary-300 mb-2 pl-3">{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                  <ul className="space-y-2">
                    {tools.map((tool) => (
                      <ListItem key={tool.href} href={tool.href} title={tool.label} />
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { title: string }
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors",
            "text-primary-300 hover:text-primary-100 hover:bg-surface-800",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          {children && (
            <p className="line-clamp-2 text-sm leading-snug text-surface-400 mt-2">
              {children}
            </p>
          )}
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"