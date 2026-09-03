"use client"

import { useTranslations } from "next-intl"
import { Button, Icon, Panel } from "../../_components/ui"
import VoltorbImage from "./VoltorbIcon"

interface MessagesProps {
  gameOver: boolean
  gameWon: boolean
  showLevelComplete: boolean
  onNextLevel: () => void
  onQuit: () => void
  lostCoins: number
}

/** The two moments the cabinet shouts about: the bomb, and the clear. */
export default function Messages({
  gameOver,
  showLevelComplete,
  onNextLevel,
  onQuit,
  lostCoins,
}: MessagesProps) {
  const t = useTranslations("arcade")

  if (gameOver) {
    return (
      <Panel
        tone="magenta"
        className="w-full max-w-[35rem] animate-ar-pop motion-reduce:animate-none"
      >
        <div className="flex items-center justify-center gap-2.5">
          <VoltorbImage size="md" glow />
          <p className="ar-chrom m-0 font-ar-display text-[0.875rem] text-ar-magenta-2">{t("voltorb.gameOver")}</p>
        </div>
        <p className="mt-3 text-center font-ar text-[0.8125rem] leading-relaxed text-ar-ink-dim">
          {t("voltorb.gameOverText", { count: lostCoins })}
        </p>
        <p className="mt-1.5 text-center font-ar-mono text-[0.6875rem] text-ar-cyan">
          {t("voltorb.newGameHint")}
        </p>
      </Panel>
    )
  }

  if (showLevelComplete) {
    return (
      <Panel tone="cyan" className="w-full max-w-[35rem] animate-ar-pop motion-reduce:animate-none">
        <div className="flex items-center justify-center gap-2.5 text-ar-amber">
          <Icon.Trophy s={20} />
          <p className="ar-glow-amber m-0 font-ar-display text-[0.8125rem]">{t("voltorb.levelComplete")}</p>
        </div>
        <p className="mt-3 text-center font-ar text-[0.8125rem] leading-relaxed text-ar-ink-dim">
          {t("voltorb.levelCompleteText")}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2.5">
          <Button
            variant="cyan"
            size="md"
            iconRight={<Icon.Chevron s={14} />}
            onClick={onNextLevel}
          >
            {t("voltorb.nextLevel")}
          </Button>
          <Button variant="ghost" size="md" icon={<Icon.Coin s={16} />} onClick={onQuit}>
            {t("voltorb.saveAndQuit")}
          </Button>
        </div>
      </Panel>
    )
  }

  return null
}
