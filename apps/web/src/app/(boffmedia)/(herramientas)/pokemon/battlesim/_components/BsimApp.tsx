"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { DkApp, DkBar, DkBody, DkTitle, DkBack, DkSeg, DkEmpty } from "@/components/boffmedia/ui/tools/datakit"
import { Button } from "@/components/boffmedia/primitives"
import { LobbyView } from "./LobbyView"
import { ReplaysView } from "./ReplaysView"
import { BSIM_TABS, type BsimView } from "../_lib/bsim-data"

export function BsimApp() {
  const t = useTranslations("battlesim")
  const [view, setView] = useState<BsimView>("lobby")

  return (
    <div data-ds="boffmedia" className="contents">
    <DkApp>
      <DkBar>
        <DkBack href="/pokemon" label={t("connection.backToLobby")} />
        <DkTitle icon="sword" label="Battlesim" sub={t("app.tagline")} />
        <span className="flex-1" />
        <DkSeg
          value={view}
          onChange={(v) => setView(v as BsimView)}
          ariaLabel={t("app.tabs.lobby")}
          options={BSIM_TABS.map((tab) => ({ value: tab.key, label: t(`app.tabs.${tab.key}`) }))}
        />
      </DkBar>

      <DkBody>
        {view === "lobby" && <LobbyView go={setView} />}
        {view === "equipos" && (
          <DkEmpty icon="layers" title={t("app.equipos.title")} lead={t("app.equipos.lead")} className="mx-auto max-w-[560px]">
            <Button href="/smartrotom/pc" variant="pri" icon="external">{t("app.equipos.cta")}</Button>
          </DkEmpty>
        )}
        {view === "repeticiones" && <ReplaysView />}
      </DkBody>
    </DkApp>
    </div>
  )
}
