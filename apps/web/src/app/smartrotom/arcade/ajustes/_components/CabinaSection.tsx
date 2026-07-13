"use client"

import { useArcadePrefs, type ScanlineIntensity } from "../../_hooks/useArcadePrefs"
import { Panel, Segmented, Switch } from "../../_components/ui"
import { SettingsRow } from "./SettingsRow"

const SCANLINE_OPTIONS: { value: ScanlineIntensity; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "subtle", label: "Sutil" },
  { value: "strong", label: "Intenso" },
]

/**
 * The three preferences the cabinet actually reads. The handoff also showed
 * "Música arcade", "Mostrar tooltips", "Atajos de teclado" and "Mostrar avisos
 * diarios"; none of them has a system behind it, so they are not switches here.
 */
export function CabinaSection() {
  const { sound, motion, scanlines, setPref } = useArcadePrefs()

  return (
    <>
      <Panel tone="void">
        <div className="mb-2.5 font-ar-display text-[9px] uppercase leading-relaxed tracking-[0.12em] text-ar-cyan">
          Audio y motion
        </div>

        <SettingsRow
          label="Efectos de sonido"
          hint="El carrete de las cajas hace clic mientras gira y suena al parar. Es el único audio que emite el arcade."
        >
          <Switch
            label="Efectos de sonido"
            on={sound}
            onToggle={() => setPref("sound", !sound)}
          />
        </SettingsRow>

        <SettingsRow
          label="Reducir motion"
          hint="Detiene los parpadeos, brillos, flotados y partículas de toda la cabina; el carrete pasa a resolverse sin animación. Si tu sistema ya pide prefers-reduced-motion, lo respetamos automáticamente sin tocar esto."
        >
          {/* `motion: true` = animaciones activas, así que el interruptor «reducir» es su inverso. */}
          <Switch
            label="Reducir motion"
            on={!motion}
            onToggle={() => setPref("motion", !motion)}
          />
        </SettingsRow>
      </Panel>

      <Panel tone="void">
        <div className="mb-2.5 font-ar-display text-[9px] uppercase leading-relaxed tracking-[0.12em] text-ar-magenta-2">
          Visual
        </div>

        <SettingsRow
          label="Intensidad de scanlines"
          hint="La capa CRT que cubre paneles, cartas y cabinas. «Off» la retira por completo."
        >
          <Segmented
            label="Intensidad de scanlines"
            options={SCANLINE_OPTIONS}
            value={scanlines}
            onChange={(value) => setPref("scanlines", value)}
          />
        </SettingsRow>

        <p className="mt-3.5 font-ar-mono text-[10px] leading-relaxed text-ar-ink-muted">
          Estas tres preferencias se guardan en este navegador, no en tu cuenta: en otro dispositivo
          empiezas de nuevo con los valores por defecto.
        </p>
      </Panel>
    </>
  )
}
