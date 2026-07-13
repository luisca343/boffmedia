import { ScreenShell } from "../../_components/ScreenShell"
import { PageHead } from "../../_components/PageHead"
import { AbilityDetailPane } from "../_components/AbilityDetailPane"
import { SparklesIcon } from "lucide-react"

export default async function AbilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const abilityKey = decodeURIComponent(id)

  return (
    <ScreenShell>
      <PageHead icon={SparklesIcon} eyebrow="Habilidad" title="Ficha de habilidad" desc="Efecto completo y los Pokémon que la portan." />
      <div className="max-w-[560px]">
        <AbilityDetailPane abilityKey={abilityKey} />
      </div>
    </ScreenShell>
  )
}
