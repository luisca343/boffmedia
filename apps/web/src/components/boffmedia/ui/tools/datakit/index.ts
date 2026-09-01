// The datakit now lives in @boffmedia/ui — it is the chassis for VGC, which
// ships in @boffmedia/tools-pokemon and therefore has to render in the desktop
// app too, where `@/` and next-intl do not exist.
//
// This barrel stays because ~20 web-only call sites (Torneos, the profile
// pages, the styles gallery) import from this path. New code should import
// from "@boffmedia/ui" directly.
export * from "@boffmedia/ui/datakit"
