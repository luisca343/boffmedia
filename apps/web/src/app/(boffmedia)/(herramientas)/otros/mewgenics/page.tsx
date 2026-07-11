import type { Metadata } from "next"
import { MewCodex } from "@/components/boffmedia/ui/mewgenics/codex"

export const metadata: Metadata = {
  title: "Codex Mewgenics",
  description: "Base de datos completa de Mewgenics: objetos, bestiario, habilidades, pasivas, estados, eventos, clases y mapas.",
}

export default function MewgenicsPage() {
  return <MewCodex />
}
