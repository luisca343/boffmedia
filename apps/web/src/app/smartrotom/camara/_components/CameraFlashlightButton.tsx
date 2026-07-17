import { Flashlight, FlashlightOff } from "lucide-react"
import { Button } from "@/components/ui/primitives/button"
import { useEffect, useState } from "react"
import { getFlashlight, setFlashlight, subscribeFlashlightChanged } from "@/services/mcef/mcefApi"

export function CameraFlashlightButton() {
  // The switch, not whether it's lit. The reply's `active` also requires the camera in
  // hand, which is only false once the page is out of sight — and the mod's push carries
  // `on` alone, so tracking `active` here could only ever go stale.
  const [on, setOn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadFlashlight = async () => {
      const result = await getFlashlight()
      if (result.success && result.on !== undefined) {
        setOn(result.on)
      }
    }
    loadFlashlight()
  }, [])

  // `L` in-game is a second source of truth; without this the button sits stale while the
  // viewfinder's marker moves. A set from this page pushes nothing, so there's no echo.
  useEffect(() => subscribeFlashlightChanged(({ on }) => setOn(on)), [])

  const toggle = async () => {
    if (isLoading) return

    setIsLoading(true)
    const next = !on
    setOn(next)

    const result = await setFlashlight(next)
    if (result.success && result.on !== undefined) {
      setOn(result.on)
    }
    setIsLoading(false)
  }

  const Icon = on ? Flashlight : FlashlightOff

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`rounded-full ${on ? 'bg-white/50' : 'bg-black/50'}`}
      onClick={toggle}
      disabled={isLoading}
      title={on ? 'Turn flashlight off' : 'Turn flashlight on'}
      aria-pressed={on}
    >
      <Icon className="h-6 w-6" />
    </Button>
  )
}
