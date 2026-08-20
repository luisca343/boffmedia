"use client"

import { useTranslations } from "next-intl"
import { useArcadePrefs, type ScanlineIntensity } from "../../_hooks/useArcadePrefs"
import { Panel, Segmented, Switch } from "../../_components/ui"
import { SettingsRow } from "./SettingsRow"

/**
 * The three preferences the cabinet actually reads. "Música arcade", "Mostrar
 * tooltips", "Atajos de teclado" and "Mostrar avisos diarios" have no system
 * behind them, so they are deliberately not switches here.
 */
export function CabinaSection() {
  const t = useTranslations("arcade")
  const { sound, motion, scanlines, setPref } = useArcadePrefs()

  const scanlineOptions: { value: ScanlineIntensity; label: string }[] = [
    { value: "off", label: t("ajustes.cabina.scanlineOptions.off") },
    { value: "subtle", label: t("ajustes.cabina.scanlineOptions.subtle") },
    { value: "strong", label: t("ajustes.cabina.scanlineOptions.strong") },
  ]

  return (
    <>
      <Panel tone="void">
        <div className="mb-2.5 font-ar-display text-[9px] uppercase leading-relaxed tracking-[0.12em] text-ar-cyan">
          {t("ajustes.cabina.audioMotion")}
        </div>

        <SettingsRow
          label={t("ajustes.cabina.soundEffects")}
          hint={t("ajustes.cabina.soundEffectsHint")}
        >
          <Switch
            label={t("ajustes.cabina.soundEffects")}
            on={sound}
            onToggle={() => setPref("sound", !sound)}
          />
        </SettingsRow>

        <SettingsRow
          label={t("ajustes.cabina.reduceMotion")}
          hint={t("ajustes.cabina.reduceMotionHint")}
        >
          {/* `motion: true` = animaciones activas, así que el interruptor «reducir» es su inverso. */}
          <Switch
            label={t("ajustes.cabina.reduceMotion")}
            on={!motion}
            onToggle={() => setPref("motion", !motion)}
          />
        </SettingsRow>
      </Panel>

      <Panel tone="void">
        <div className="mb-2.5 font-ar-display text-[9px] uppercase leading-relaxed tracking-[0.12em] text-ar-magenta-2">
          {t("ajustes.cabina.visual")}
        </div>

        <SettingsRow
          label={t("ajustes.cabina.scanlines")}
          hint={t("ajustes.cabina.scanlinesHint")}
        >
          <Segmented
            label={t("ajustes.cabina.scanlines")}
            options={scanlineOptions}
            value={scanlines}
            onChange={(value) => setPref("scanlines", value)}
          />
        </SettingsRow>

        <p className="mt-3.5 font-ar-mono text-[10px] leading-relaxed text-ar-ink-muted">
          {t("ajustes.cabina.localNotice")}
        </p>
      </Panel>
    </>
  )
}
