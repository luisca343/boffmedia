"use client"

import { useFormatter, useTranslations } from "next-intl"
import { CLASS_SOURCE_CHECKED, CLASS_SOURCE_URL, WEAVE_CLASSES } from "@/features/fortunes-weave/class-model"
import { FORTUNES_WEAVE_CHARACTERS } from "@/features/fortunes-weave/characters"
import { ClassPlanner } from "@/features/fortunes-weave/components/ClassPlanner"
import { useClassPlan } from "@/features/fortunes-weave/useClassPlan"

export function FortunesWeaveClasses({ accountKey }: { accountKey: string }) {
  const t = useTranslations("otros.fortunesWeave.classes")
  const heading = useTranslations("otros.fortunesWeave")
  const format = useFormatter()
  const { plan, ready, storageAvailable, assignClass } = useClassPlan(accountKey)
  return <main className="mx-auto grid w-full max-w-[112rem] gap-6">
    <header>
      <p className="mono-label mb-3">{heading("eyebrow")}</p>
      <h1 className="text-[clamp(2rem,4.5vw,4rem)]">{t("title")}</h1>
      <p className="mt-3 max-w-[75ch] text-txt-muted">{t("description")}</p>
      <a href={CLASS_SOURCE_URL} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm text-accent underline underline-offset-4">{t("sourceLink")} ↗</a>
      <p className="mt-2 max-w-[90ch] text-xs leading-5 text-txt-dim">{t("sourceNote", { date: format.dateTime(new Date(CLASS_SOURCE_CHECKED + "T12:00:00Z"), { year: "numeric", month: "short", day: "numeric" }) })}</p>
    </header>
    <div className="grid gap-2 text-xs leading-5 text-txt-muted">
      <p role="status">{t(storageAvailable ? "localSave" : "storageUnavailable")}</p>
      <p>{t("rankNote")}</p>
    </div>
    <ClassPlanner classes={WEAVE_CLASSES} characters={FORTUNES_WEAVE_CHARACTERS} plan={plan} onAssign={assignClass} ready={ready} />
  </main>
}
