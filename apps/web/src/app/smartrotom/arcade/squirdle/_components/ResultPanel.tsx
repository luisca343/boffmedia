import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button, Icon, Panel } from "../../_components/ui"

export interface ResultPanelProps {
  message: string
  won: boolean
  gameOver: boolean
  onReset: () => void
}

/** The verdict. Only the outcome states are celebratory — an invalid name is not. */
export function ResultPanel({ message, won, gameOver, onReset }: ResultPanelProps) {
  const t = useTranslations("")
  if (!message) return null

  return (
    <Panel tone={won ? "cyan" : "magenta"} tight className={cn(won && "animate-ar-pop")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          aria-live="polite"
          className={cn(
            "m-0 inline-flex items-center gap-2.5 font-ar text-[14px] font-semibold",
            won ? "text-ar-lime" : "text-ar-ink",
          )}
        >
          <span className={won ? "text-ar-lime" : "text-ar-magenta-2"}>
            {won ? <Icon.Trophy s={18} /> : <Icon.Info s={18} />}
          </span>
          {message}
        </p>
        {gameOver && (
          <Button variant="cyan" size="sm" icon={<Icon.Reset s={12} />} onClick={onReset}>
            {t("arcade.squirdle.result.playAgain")}
          </Button>
        )}
      </div>
    </Panel>
  )
}
