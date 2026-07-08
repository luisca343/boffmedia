import { Suspense } from "react"
import { TcgpApp } from "../_components/TcgpApp"

export default function TcgpColeccionPage() {
  return (
    <Suspense>
      <TcgpApp view="coleccion" />
    </Suspense>
  )
}
