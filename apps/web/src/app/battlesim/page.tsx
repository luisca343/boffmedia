import { redirect } from "next/navigation"

// The v2 battlesim landing hub is retired — the v3 tool lives inside the
// tools shell. Live battle routes (/battlesim/play · /pvp · /showdown ·
// /replay) still resolve; only the hub redirects.
export default function BattlesimIndexRedirect() {
  redirect("/pokemon/battlesim")
}
