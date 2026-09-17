import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const allowedReactIcons = path.normalize("packages/ui/src/primitives/icon.tsx")
const violations = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", ".next", "dist", "target"].includes(entry.name)) continue
    const absolute = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(absolute)
      continue
    }
    if (!/\.(?:ts|tsx)$/.test(entry.name)) continue

    const relative = path.relative(root, absolute)
    const source = fs.readFileSync(absolute, "utf8")
    const imports = [
      ...source.matchAll(/from\s*["'](lucide-react|react-icons\/[^"']+)["']/g),
      ...source.matchAll(/import\s*["'](lucide-react|react-icons\/[^"']+)["']/g),
    ]

    for (const match of imports) {
      if (path.normalize(relative) === allowedReactIcons) continue
      violations.push(`${relative}: direct icon-library import ${match[1]}`)
    }

    if (/from\s*["']@\/lib\/smartrotom\/customIcons["']/.test(source)) {
      violations.push(`${relative}: import custom SmartRotom artwork from @boffmedia/ui instead`)
    }
  }
}

walk(root)

if (violations.length > 0) {
  console.error("Icon centralization check failed:")
  for (const violation of violations) console.error(`- ${violation}`)
  process.exit(1)
}

console.log("Icon centralization check passed: feature code imports icons through @boffmedia/ui.")
