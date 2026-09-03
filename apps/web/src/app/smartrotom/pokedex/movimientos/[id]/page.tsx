import { ScreenShell } from "../../_components/ScreenShell"
import { PageHead } from "../../_components/PageHead"
import { MoveDetailPane } from "../_components/MoveDetailPane"
import { ZapIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function MoveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations("pokedex")
  const { id } = await params
  const moveKey = decodeURIComponent(id)

  return (
    <ScreenShell>
      <PageHead icon={ZapIcon} eyebrow={t("movedetail_eyebrow")} title={t("movedetail_title")} desc={t("movedetail_desc")} />
      <div className="max-w-[35rem] flex flex-col gap-3.5">
        <MoveDetailPane moveKey={moveKey} />
      </div>
    </ScreenShell>
  )
}
