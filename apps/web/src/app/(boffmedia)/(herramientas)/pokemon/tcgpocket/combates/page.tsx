import { getTranslations } from "next-intl/server"
import { Empty, Button } from "@boffmedia/ui"

// Solo-battles data has no working backend yet (the /solobattles endpoint is
// disabled and getBattleData is unimplemented), so this view is on hold.
export default async function TcgpCombatesPage() {
  const t = await getTranslations("tcgpocket")
  return (
    <div className="mx-auto grid min-h-[60vh] w-full max-w-[1400px] place-items-center p-[clamp(18px,3vw,34px)]">
      <Empty icon="sword" title={t("app.combates.title")} lead={t("app.combates.lead")}>
        <Button variant="pri" icon="back" href="/pokemon/tcgpocket">{t("app.combates.back")}</Button>
      </Empty>
    </div>
  )
}
