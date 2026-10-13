"use client"

import { useState } from "react"
import { Button } from "@boffmedia/ui"
import { useTranslations } from "next-intl"
import { FortunesWeaveTracker } from "./FortunesWeaveTracker"
import { FortunesWeaveClasses } from "./FortunesWeaveClasses"

export function FortunesWeaveWorkspace({ accountKey }: { accountKey: string }) {
  const t = useTranslations("otros.fortunesWeave.classes")
  const [view, setView] = useState<"classes" | "recruitment">("classes")
  return <div className="grid gap-6">
    <nav aria-label={t("views")} className="flex flex-wrap gap-2">
      <Button aria-pressed={view === "classes"} variant={view === "classes" ? "pri" : "default"} onClick={() => setView("classes")}>{t("classesTab")}</Button>
      <Button aria-pressed={view === "recruitment"} variant={view === "recruitment" ? "pri" : "default"} onClick={() => setView("recruitment")}>{t("recruitmentTab")}</Button>
    </nav>
    {view === "classes" ? <FortunesWeaveClasses accountKey={accountKey} /> : <FortunesWeaveTracker accountKey={accountKey} />}
  </div>
}
