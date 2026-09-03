"use client"

import * as React from "react"
import { Sample, Section } from "../showcase-shared"
import { Banner, CodeBlock, Disclosure, OptionGroup, Select, Toggle } from "@boffmedia/ui"

const SEL_OPTS = [
  { value: "0", label: "Dinero" },
  { value: "2", label: "Objeto" },
  { value: "4", label: "Dinero + objeto" },
  { value: "5", label: "Reclutar al Pokémon" },
]
const QUEST_OPTS = [
  { value: "shield", label: "Rescatar", icon: "shield" as const },
  { value: "users", label: "Escoltar", icon: "users" as const },
  { value: "search", label: "Buscar", icon: "search" as const },
  { value: "sword", label: "Derrotar", icon: "sword" as const },
]
const FEAT_OPTS = [
  { value: "copy", label: "Copiar", icon: "copy" as const },
  { value: "link", label: "Compartir", icon: "link" as const },
  { value: "download", label: "Exportar", icon: "download" as const },
]

export function WonderMailChapter() {
  const [sel, setSel] = React.useState("2")
  const [opt, setOpt] = React.useState<string | string[]>("shield")
  const [multi, setMulti] = React.useState<string | string[]>(["copy"])
  const [eu, setEu] = React.useState(false)
  const [showBanner, setShowBanner] = React.useState(true)

  return (
    <>
      <Section
        id="wmforms"
        kicker="Wonder Mail"
        title="Selección y grupos de opciones"
        lead={<><code>Select</code> es la primitiva de selección nativa del sistema — hasta ahora cada herramienta llevaba la suya. <code>OptionGroup</code> es el «toggle group» de tarjetas: cuando conviene ver todas las opciones de un vistazo en lugar de un desplegable.</>}
      >
        <Sample title="Select" code="<Select label options value onChange />" col>
          <div className="w-full max-w-[20rem]">
            <Select label="Tipo de recompensa" value={sel} options={SEL_OPTS} onChange={setSel} />
          </div>
          <div className="mt-[0.875rem] w-full max-w-[20rem]">
            <Select label="Deshabilitado" value={sel} options={SEL_OPTS} onChange={setSel} disabled hint="La recompensa actual no da objeto" />
          </div>
        </Sample>
        <Sample title="OptionGroup — selección única" code="multi={false}" col>
          <div className="w-full">
            <OptionGroup options={QUEST_OPTS} value={opt} columns={4} onChange={setOpt} ariaLabel="Tipo de misión" />
          </div>
        </Sample>
        <Sample title="OptionGroup — selección múltiple" code="multi columns={3}" col note="Con <code>multi</code> el valor es un array; cada tarjeta se comporta como casilla.">
          <div className="w-full">
            <OptionGroup options={FEAT_OPTS} value={multi} columns={3} multi onChange={setMulti} ariaLabel="Acciones" />
          </div>
        </Sample>
      </Section>

      <Section
        id="wmreveal"
        kicker="Wonder Mail"
        title="Revelación progresiva y avisos"
        lead={<><code>Disclosure</code> pliega los ajustes avanzados para reducir la carga cognitiva. <code>Banner</code> es el aviso de estado a todo el ancho — cuatro tonos semánticos para validación, éxito y error.</>}
      >
        <Sample title="Disclosure" code="<Disclosure title icon sub />" col>
          <div className="w-full max-w-[32.5rem]">
            <Disclosure title="Ajustes avanzados" icon="settings" sub="Región y codificación">
              <div className="flex items-center justify-between gap-4 py-1">
                <span className="font-body text-[0.8125rem]/[1.4] font-semibold text-txt">Versión europea (EU)</span>
                <Toggle on={eu} onChange={setEu} ariaLabel="Versión europea (EU)" />
              </div>
            </Disclosure>
          </div>
        </Sample>
        <Sample title="Banner — tonos" code="<Banner tone />" col>
          <div className="grid w-full max-w-[35rem] gap-[0.625rem]">
            <Banner tone="success" title="Wonder Mail generada">El código está listo para copiar.</Banner>
            <Banner tone="warn">El cliente y el objetivo son el mismo Pokémon.</Banner>
            <Banner tone="error" title="Revisa la configuración">La planta supera el tamaño de la mazmorra.</Banner>
            {showBanner && <Banner tone="info" onClose={() => setShowBanner(false)}>Compatible con las versiones US / JP y europea. Descartable con la ✕.</Banner>}
          </div>
        </Sample>
      </Section>

      <Section
        id="wmcode"
        kicker="Wonder Mail"
        title="Bloque de código"
        lead={<><code>CodeBlock</code> muestra tokens o códigos en mono con copia integrada y una franja de escaneo opcional. Es el corazón del billete de resultado del generador.</>}
      >
        <Sample title="CodeBlock con copia y escaneo" code="<CodeBlock lines tone='accent' scan />" col note="El código del ejemplo es una muestra estática del generador de Wonder Mail.">
          <div className="w-full max-w-[28.75rem]">
            <CodeBlock
              label="Código · US / JP"
              tone="accent"
              scan
              lines={["F8CY PW♂@ 9@N6 MPCR", "XRC★ ?M♂1 @HHH H85♀", "K4"]}
              copyText="F8CYPW♂@9@N6MPCRXRC★?M♂1@HHHH85♀K4"
            />
          </div>
        </Sample>
      </Section>
    </>
  )
}
