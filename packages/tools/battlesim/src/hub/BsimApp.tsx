"use client"

import * as React from "react"
import { DkApp, DkBody } from "@boffmedia/ui/datakit"
import { LobbyView } from "./LobbyView"
import { ReplaysView } from "./ReplaysView"
import { TeamsView } from "../teambuilder/TeamsView"
import { BSIM_TABS, type BsimView } from "../lib/bsim-data"
import { useBsimNav } from "../nav"

/** The tab lives in the address (`?tab=…`), so an unknown value falls back. */
function readTab(raw: string | undefined): BsimView {
  return BSIM_TABS.some((t) => t.key === raw) ? (raw as BsimView) : "lobby"
}

/**
 * THE SUB-TAB STRIP IS GONE FROM THIS BAR.
 *
 * Lobby · Equipos · Repeticiones used to be a `DkSeg` here, reachable only once
 * you were already on the hub. They are now the three PINNED tabs on
 * `BsimTabBar`, above every screen in the tool — which is the whole point: you
 * can reach your teams from inside a battle. The address did not change (the
 * section still lives in `?tab=`), so links, Back and the launcher's stack all
 * behave exactly as before; only the control moved, and there is now one of it
 * instead of two.
 */
export function BsimApp() {
  const nav = useBsimNav()

  // Not component state. A tab is a place — it should survive a reload, be
  // linkable, and be undone by Back — and the teambuilder hangs a `team` param
  // off the same address, which local state cannot hold.
  //
  // `teams` / `teamEdit` are the same section reached under another screen
  // name; without this line a `nav.push("teams")` landed on the lobby.
  const view: BsimView = nav.screen === "teams" || nav.screen === "teamEdit" ? "equipos" : readTab(nav.params.tab)
  const setView = React.useCallback(
    (next: BsimView) => nav.replace("hub", { ...nav.params, tab: next }),
    [nav],
  )

  return (
    <div className="contents">
    <DkApp>
      <DkBody>
        {view === "lobby" && <LobbyView go={setView} />}
        {view === "equipos" && <TeamsView />}
        {view === "repeticiones" && <ReplaysView />}
      </DkBody>
    </DkApp>
    </div>
  )
}
