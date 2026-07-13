import VoltorbFlipGame from "./_components/VoltorbFlipGame"

/**
 * The cabinet. `arcade/layout.tsx` already owns the `.ar-app` scope root, the
 * sidebar and the HUD, so this page is only the machine itself.
 */
export default function VoltorbFlipPage() {
  return (
    <div className="overflow-hidden rounded-2xl border border-ar-magenta/30 bg-ar-void shadow-[0_10px_40px_-12px_rgb(var(--ar-magenta)/.35)]">
      <VoltorbFlipGame />
    </div>
  )
}
