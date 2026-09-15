import { Suspense } from "react"
import { VgcPreviewApp } from "@boffmedia/tools-pokemon"
import { VgcRouted } from "../_components/VgcRouted"

export default function Page() {
  return (
    <Suspense>
      <VgcRouted>
        <VgcPreviewApp />
      </VgcRouted>
    </Suspense>
  )
}
