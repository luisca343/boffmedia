"use client"

import { MewNote, MewPanel, MewText } from "../../MewAtoms"
import { MewFlag } from "../MewRefs"
import { MewCol, MewDetail, MewFacts, MewHero, type ViewProps } from "./scaffold"

export function KeywordView({ rec }: ViewProps) {
  const blocks = [
    { label: "Regla", v: rec.tip },
    { label: "Acumulación positiva", v: rec.tipPos },
    { label: rec.nameNeg ? rec.nameNeg + " (negativo)" : "Acumulación negativa", v: rec.tipNeg },
    { label: "Sin acumulación", v: rec.tipLess },
  ].filter((b) => b.v && !/^[A-Z_]+$/.test(b.v))
  return (
    <MewDetail>
      <MewHero cat="keywords" rec={rec} badges={<MewFlag icon="flame" tone="warn">Estado</MewFlag>} />
      <MewCol single>
        {blocks.length ? (
          blocks.map((b, i) => (
            <MewPanel key={i} title={b.label} icon="flame"><MewText>{b.v}</MewText></MewPanel>
          ))
        ) : (
          <MewNote>Este estado no expone una descripción en el conjunto de datos.</MewNote>
        )}
        <MewPanel title="Datos" icon="database"><MewFacts rows={[{ label: "ID", value: rec.id, mono: true }]} /></MewPanel>
      </MewCol>
    </MewDetail>
  )
}
