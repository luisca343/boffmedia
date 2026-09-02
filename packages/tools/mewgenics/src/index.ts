/**
 * @boffmedia/tools-mewgenics — the Mewgenics codex and cat builder.
 *
 * Host-agnostic by contract, like every package under `packages/tools`: no
 * `next/*`, no `next-intl`, no `@/` imports, no `@tauri-apps/*`. Translation
 * goes through `@boffmedia/ui`'s configured runtime (`./i18n`), files through
 * `@boffmedia/tool-kit`'s `saveFile`, assets through its `assetUrl`, and the
 * address bar — which neither host shares — through `./nav`.
 *
 * The skin travels with the code: `./mew-skin.css` carries every `--mwp-*`
 * token and both hosts import it. A host that forgets to renders grey boxes.
 */

// Entry points, for hosts that own their routing (apps/web).
export { MewRoot, MewCodexTool, MewBuilderTool } from "./MewRoot";
export { MewCodex } from "./codex";
export { MewCatBuilder } from "./builder/MewCatBuilder";

// The address seam. `useHashMewNav` is what a host with a real URL supplies;
// omitting it gets the memory backing, which is what the launcher runs on.
export {
  MewNavProvider,
  MewScreenLink,
  useHashMewNav,
  useMewNav,
  MEW_ROUTES,
  type MewNav,
  type MewScreen,
} from "./nav";

// Registry manifests. A registry-driven host imports `./tools` directly rather
// than this barrel, so listing a tool costs nothing but the manifest.
export { mewgenicsTools, mewgenicsCodexTool, mewgenicsBuilderTool } from "./tools";

// i18n handles, for hosts and for the styleguide.
export { MEWGENICS_NS, useToolT, useLocale, asMewLang, type MewLang } from "./i18n";

// The component kit. Exported because apps/web's styles gallery renders these
// directly against hand-written records, with no store behind them.
export * from "./ui";
