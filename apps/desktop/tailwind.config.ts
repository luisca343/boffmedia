import type { Config } from "tailwindcss"

import { colors, fontFamily, geometry, toolsContent } from "@boffmedia/tailwind-config/base"

// The whole point of packages/tailwind-config: the launcher's design system is
// four imports, with no copy of the web app's 4,400-line config and no access
// to the SmartRotom namespaces it has no business rendering.
const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
    // The Tools section renders @boffmedia/tools-* — without these globs every
    // class those packages own is purged out of the launcher build.
    ...toolsContent,
  ],
  theme: {
    extend: {
      colors,
      fontFamily,
    },
  },
  plugins: [geometry],
}

export default config
