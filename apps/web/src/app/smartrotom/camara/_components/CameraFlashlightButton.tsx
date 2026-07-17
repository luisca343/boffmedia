import { Flashlight, FlashlightOff } from "lucide-react"
import { useEffect, useState } from "react"
import { getFlashlight, setFlashlight, subscribeFlashlightChanged } from "@/services/mcef/mcefApi"
import { cn } from "@/lib/utils"

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

  // A viewfinder overlay control, not a DS button: round and translucent over the feed,
  // which neither DS gives. `sr-accent-bright` = `primary-hover`, the sibling controls' orange.
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isLoading}
      title={on ? 'Turn flashlight off' : 'Turn flashlight on'}
      aria-pressed={on}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full",
        "text-sr-accent-bright transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sr-accent",
        "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
        on ? 'bg-white/50' : 'bg-black/50',
      )}
    >
      <Icon className="h-6 w-6" />
    </button>
  )
}
