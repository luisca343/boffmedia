import { type ClassValue, clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/** The text-shadow utilities are custom (see the `textShadow` plugin in the
 *  Tailwind config); tailwind-merge has to be told they conflict with text
 *  colour, or `cn()` keeps both and the later one silently wins. */
const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // @ts-ignore
      "text-shadow": ["text-shadow-border1", "text-shadow-border2", "text-shadow-custom"],
    },
    conflictingClassGroups: {
      // @ts-ignore
      "text-color": ["text-shadow"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs))
}
