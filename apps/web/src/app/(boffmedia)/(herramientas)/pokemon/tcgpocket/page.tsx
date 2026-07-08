import { Suspense } from "react"
import { TcgpApp } from "./_components/TcgpApp"

export default function TcgpPanelPage() {
  return (
    <Suspense>
      <TcgpApp view="panel" />
    </Suspense>
  )
}
