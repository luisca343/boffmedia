import { Suspense } from "react"
import { Home } from "./_components/Home"

export default function MewtubePage() {
  return (
    <Suspense fallback={null}>
      <Home />
    </Suspense>
  )
}
