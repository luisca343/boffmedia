import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import type { ReactNode } from "react"
import { ArcadePrefsProvider } from "./_hooks/useArcadePrefs"
import { AppQueryProvider as ArcadeQueryProvider } from "@/components/smartrotom/behavior/QueryProvider"
import { ArcadeShell } from "./_components/ArcadeShell"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.smartrotom")
  return { title: t("arcade.title"), description: t("arcade.description") }
}

export default function ArcadeLayout({ children }: { children: ReactNode }) {
  return (
    <ArcadeQueryProvider>
      <ArcadePrefsProvider>
        <ArcadeShell>{children}</ArcadeShell>
      </ArcadePrefsProvider>
    </ArcadeQueryProvider>
  )
}
