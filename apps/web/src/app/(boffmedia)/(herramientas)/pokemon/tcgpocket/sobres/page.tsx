import { Suspense } from "react"
import { TcgpApp } from "../_components/TcgpApp"

export default function TcgpSobresPage() {
  return (
    <Suspense>
      <TcgpApp view="sobres" />
    </Suspense>
  )
}
