"use client"

import * as React from "react"
import { BotonesChipsSections } from "./primitivas/BotonesChipsSections"
import { ChromeSections } from "./primitivas/ChromeSections"
import { FormulariosSeleccionSections } from "./primitivas/FormulariosSeleccionSections"
import { IndicadoresSections } from "./primitivas/IndicadoresSections"
import { MenusSections } from "./primitivas/MenusSections"
import { NavegacionSections } from "./primitivas/NavegacionSections"

export function PrimitivasChapter() {
  // `rng` links the "Selección y rango" slider to the far-down "Anillo y carga" ring.
  const [rng, setRng] = React.useState(64)
  return (
    <>
      <BotonesChipsSections />
      <FormulariosSeleccionSections rng={rng} setRng={setRng} />
      <NavegacionSections />
      <ChromeSections />
      <MenusSections />
      <IndicadoresSections rng={rng} />
    </>
  )
}
