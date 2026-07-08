"use client"

import { DEMO_LEGAL } from "../showcase-data"
import { Sample, Section } from "../showcase-shared"
import { LegalDoc } from "@/components/boffmedia/ui/legal/LegalDoc"

export function LegalChapter() {

  return (
    <>
            <Section id="doclegal" kicker="Legal" title="Documento legal" lead={<>Documento legal (<code>LegalDoc</code>): índice pegajoso con scroll-spy y secciones numeradas (párrafos + listas). Alimenta <code>/privacidad</code>, <code>/terminos</code> y <code>/cookies</code>.</>}>
              <Sample title="Documento en vivo" code="<LegalDoc sections>" col note="Vista previa recortada; en la app ocupa la página completa con su propia rejilla e índice pegajoso.">
                <div className="w-full max-h-[520px] overflow-auto border border-solid border-line [&_main]:!pt-8 [&_main]:!pb-8">
                  <LegalDoc kicker="Legal · demo" title="Documento de ejemplo" lead="Demostración del componente con datos de ejemplo." updated="Actualizado hoy" sections={DEMO_LEGAL} />
                </div>
              </Sample>
            </Section>
    </>
  )
}
