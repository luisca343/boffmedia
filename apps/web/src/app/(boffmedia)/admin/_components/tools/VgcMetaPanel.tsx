"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Seg } from "@/components/boffmedia/primitives"
import { AvSectionHead } from "../ui/av-kit"
import { VgcSmogonFetcher } from "./VgcSmogonFetcher"
import { VgcChampionsFetcher } from "./VgcChampionsFetcher"
import { VgcLimitlessFetcher } from "./VgcLimitlessFetcher"

type Tab = "smogon" | "champions" | "limitless"

export function VgcMetaPanel() {
  const t = useTranslations("admin.vgc")
  const [tab, setTab] = useState<Tab>("smogon")
  const desc = { smogon: t("descSmogon"), champions: t("descChampions"), limitless: t("descLimitless") }[tab]

  return (
    <div>
      <AvSectionHead title={t("title")} desc={desc} />
      <div className="mb-5">
        <Seg
          value={tab}
          onChange={(v) => setTab(v as Tab)}
          options={[
            { value: "smogon", label: t("tabSmogon") },
            { value: "champions", label: t("tabChampions") },
            { value: "limitless", label: t("tabLimitless") },
          ]}
        />
      </div>

      {tab === "smogon" && <VgcSmogonFetcher />}
      {tab === "champions" && <VgcChampionsFetcher />}
      {tab === "limitless" && <VgcLimitlessFetcher />}
    </div>
  )
}
