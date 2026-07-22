"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"
import { Button, Icon, Modal } from "../../_components/ui"

interface RulesModalProps {
  isOpen: boolean
  onClose: () => void
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5 last:mb-0">
      <h3 className="mb-2 font-ar-display text-[11px] uppercase tracking-[0.12em] text-ar-amber">
        {title}
      </h3>
      {children}
    </section>
  )
}

const LIST = "ml-4 list-disc space-y-1.5 marker:text-ar-cyan"

export function RulesModal({ isOpen, onClose }: RulesModalProps) {
  const t = useTranslations("arcade")

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="lg"
      tone="cyan"
      kicker={t("voltorb.howToPlay")}
      title={t("voltorb.rulesTitle")}
      footer={
        <Button variant="cyan" size="sm" icon={<Icon.Joystick s={12} />} onClick={onClose}>
          {t("voltorb.understood")}
        </Button>
      }
    >
      <Section title={t("voltorb.introduction")}>
        <p>{t("voltorb.introText")}</p>
      </Section>

      <Section title={t("voltorb.theBoard")}>
        <ul className={LIST}>
          {(["boardItems.0", "boardItems.1", "boardItems.2", "boardItems.3"] as const).map((key) => (
            <li key={key}>{t(`voltorb.${key}`)}</li>
          ))}
        </ul>
      </Section>

      <Section title={t("voltorb.howToPlaySection")}>
        <ol className="ml-4 list-decimal space-y-1.5 marker:font-ar-mono marker:text-ar-cyan">
          {(["playSteps.0", "playSteps.1", "playSteps.2", "playSteps.3", "playSteps.4"] as const).map((key) => (
            <li key={key}>{t(`voltorb.${key}`)}</li>
          ))}
        </ol>
      </Section>

      <Section title={t("voltorb.levelsProgression")}>
        <ul className={LIST}>
          {(["levelItems.0", "levelItems.1", "levelItems.2", "levelItems.3"] as const).map((key) => (
            <li key={key}>{t(`voltorb.${key}`)}</li>
          ))}
        </ul>
      </Section>

      <Section title={t("voltorb.level8")}>
        <p>{t("voltorb.level8Text")}</p>
      </Section>

      <Section title={t("voltorb.memoMode")}>
        <p>{t("voltorb.memoModeText")}</p>
      </Section>

      <Section title={t("voltorb.tips")}>
        <ul className={LIST}>
          {(["tipItems.0", "tipItems.1", "tipItems.2", "tipItems.3"] as const).map((key) => (
            <li key={key}>{t(`voltorb.${key}`)}</li>
          ))}
        </ul>
      </Section>
    </Modal>
  )
}
