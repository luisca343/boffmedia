// Pins the module system per output dir. Without these, Node reads the root
// package.json (no "type") and treats dist/esm/*.js as CommonJS, which breaks
// the ESM entry point for every bundler that follows it.
import { writeFileSync } from "node:fs"
writeFileSync("dist/cjs/package.json", JSON.stringify({ type: "commonjs" }, null, 2) + "\n")
writeFileSync("dist/esm/package.json", JSON.stringify({ type: "module" }, null, 2) + "\n")
