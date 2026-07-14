import { createLucideIcon } from "lucide-react"

// The Rotom mascot, from the user's art — round plasma head with the tall
// spark, big eyes and a smile, lightning-bolt arms swept down-and-out, tail
// point below. One glyph shared by the pasaporte and media icon maps.
export const Rotom = createLucideIcon("Rotom", [
  ["circle", { cx: "12", cy: "9.6", r: "4.2", key: "head" }],
  ["path", { d: "M11.1 5.8C10.6 4 11 2.2 12.2 1.5C13.2 2.6 13.3 4.4 12.8 5.9", key: "spark" }],
  ["path", { d: "M11.1 13.7L12 17L12.9 13.7", key: "tail" }],
  ["polyline", { points: "7.7 10.6 3.4 10.4 6.6 13.4 2.6 17.6", key: "armL" }],
  ["polyline", { points: "16.3 10.6 20.6 10.4 17.4 13.4 21.4 17.6", key: "armR" }],
  ["circle", { cx: "10.4", cy: "8.9", r: "0.95", key: "eyeL" }],
  ["circle", { cx: "13.6", cy: "8.9", r: "0.95", key: "eyeR" }],
  ["path", { d: "M11 11.6Q12 12.3 13 11.6", key: "mouth" }],
])
