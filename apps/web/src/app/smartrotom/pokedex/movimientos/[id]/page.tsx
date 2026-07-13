import { ScreenShell } from "../../_components/ScreenShell"
import { PageHead } from "../../_components/PageHead"
import { MoveDetailPane } from "../_components/MoveDetailPane"
import { ZapIcon } from "lucide-react"

export default async function MoveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const moveKey = decodeURIComponent(id)

  return (
    <ScreenShell>
      <PageHead icon={ZapIcon} eyebrow="Movimiento" title="Ficha de movimiento" desc="Poder, precisión, efecto y los Pokémon que lo aprenden." />
      <div className="max-w-[560px] flex flex-col gap-3.5">
        <MoveDetailPane moveKey={moveKey} />
      </div>
    </ScreenShell>
  )
}
