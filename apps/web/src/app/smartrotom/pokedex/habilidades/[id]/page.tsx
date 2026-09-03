import { ScreenShell } from "../../_components/ScreenShell"
import { PageHead } from "../../_components/PageHead"
import { AbilityDetailPane } from "../_components/AbilityDetailPane"
import { SparklesIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function AbilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations("pokedex")
  const { id } = await params
  const abilityKey = decodeURIComponent(id)

  return (
    <ScreenShell>
      <PageHead icon={SparklesIcon} eyebrow={t("abilitydetail_eyebrow")} title={t("abilitydetail_title")} desc={t("abilitydetail_desc")} />
      <div className="max-w-[35rem]">
        <AbilityDetailPane abilityKey={abilityKey} />
      </div>
    </ScreenShell>
  )
}
