import { resolve } from "node:path"
import type { Config } from "tailwindcss"

// Same reason as index.css: @boffmedia/tailwind-config is not a dependency of
// @boffmedia/tools-battlesim, so pnpm never links it here and it is reached by
// path rather than by name.
import { colors, fontFamily, geometry } from "../../../../tailwind-config/base"

/**
 * Mirrors apps/desktop/tailwind.config.ts, narrowed to what this host renders.
 *
 * ABSOLUTE `content` globs, and that is the whole trick. Tailwind resolves
 * relative globs against the PROCESS CWD, not against this file — and the CWD
 * here is packages/tools/battlesim, because that is where Playwright's
 * webServer starts Vite. Written relatively, `../../src/**` pointed at
 * `packages/src`, matched nothing, and every utility was purged. The symptom is
 * not an error: the page renders with correct markup and no styles at all, so
 * `absolute inset-0` on the battle field computes as `position: static` and the
 * field measures 1600x0. It looks exactly like a layout bug in the app.
 */
const here = (...p: string[]) => resolve(__dirname, ...p)

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    here("index.html"),
    here("main.tsx"),
    // The tool itself, plus the packages whose components it renders. Miss one
    // and only that package's classes vanish, which is harder to spot than
    // missing them all.
    here("../../src/**/*.{ts,tsx}"),
    here("../../../../ui/src/**/*.{ts,tsx}"),
    here("../../../pokemon/src/**/*.{ts,tsx}"),
    here("../../../kit/src/**/*.{ts,tsx}"),
  ],
  theme: { extend: { colors, fontFamily } },
  plugins: [geometry],
}

export default config
