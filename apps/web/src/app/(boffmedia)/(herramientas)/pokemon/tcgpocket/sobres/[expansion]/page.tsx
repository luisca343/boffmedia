import { Suspense } from "react"
import { TcgpApp } from "../../_components/TcgpApp"

export default function TcgpPackPage({ params }: { params: { expansion: string } }) {
  return (
    <Suspense>
      <TcgpApp view="sobres" expansion={params.expansion} />
    </Suspense>
  )
}
