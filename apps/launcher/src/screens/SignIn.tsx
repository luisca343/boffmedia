import { useState } from "react"

import { Badge, Button, Icon, Kicker, Panel, Spinner } from "@boffmedia/ui"

import { authOpenVerification, copyText } from "../runtime"
import { useLauncher } from "../state/launcher"

/** A button that reports what happened, because a copy that silently does
 *  nothing is worse than no button at all. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle")

  return (
    <Button
      size="sm"
      variant="ghost"
      icon={state === "ok" ? "check" : "copy"}
      onClick={() => {
        void copyText(value).then((ok) => {
          setState(ok ? "ok" : "fail")
          setTimeout(() => setState("idle"), 2000)
        })
      }}
    >
      {state === "ok" ? "Copiado" : state === "fail" ? "No se pudo" : label}
    </Button>
  )
}

// HANDOFF §5.1 — the Microsoft device-code flow. The user reads a short code
// here and types it into microsoft.com/link in a real browser; we poll until
// they finish. Deliberately NOT an embedded webview: putting Microsoft's login
// inside our own window is both a phishing-training exercise for users and a
// thing Microsoft's terms discourage.

export function SignIn() {
  const { signIn, cancelSignIn, signingIn, deviceCode } = useLauncher()

  return (
    <div className="grid h-full place-items-center px-8 py-10">
      <div className="w-full max-w-[520px]">
        <div className="mb-6 text-center">
          <Kicker>Boff Launcher</Kicker>
          <h1 className="font-display text-[34px]/none font-bold uppercase tracking-[0.06em] text-txt">
            Inicia sesión
          </h1>
          <p className="mt-3 text-sm text-txt-muted">
            Necesitas una cuenta de Minecraft con Java Edition. El launcher nunca ve tu
            contraseña — la sesión se abre en tu navegador.
          </p>
        </div>

        {!signingIn && (
          <Panel>
            <div className="flex flex-col items-center gap-4 py-4">
              <span className="cut-seal grid h-14 w-14 place-items-center bg-accent text-accent-ink">
                <Icon name="key" size={26} />
              </span>
              <Button variant="pri" size="lg" icon="external" onClick={() => void signIn()}>
                Entrar con Microsoft
              </Button>
              <p className="max-w-[380px] text-center text-xs text-txt-dim">
                Guardamos únicamente el token de actualización, en el almacén de credenciales
                del sistema. Nunca en un archivo de texto.
              </p>
            </div>
          </Panel>
        )}

        {signingIn && !deviceCode && (
          <Panel>
            <div className="flex items-center justify-center gap-3 py-8 text-sm text-txt-muted">
              <Spinner /> Contactando con Microsoft…
            </div>
          </Panel>
        )}

        {signingIn && deviceCode && (
          <Panel title="Completa el acceso" aside={<Badge tone="warn">Esperando</Badge>}>
            <ol className="flex flex-col gap-4">
              <li className="flex gap-3">
                <span className="cut-seal grid h-6 w-6 shrink-0 place-items-center bg-accent text-[12px] font-bold text-accent-ink [--cut:5px]">
                  1
                </span>
                <div className="min-w-0 flex-1">
                  <p className="mb-2 text-sm text-txt">
                    Copia este código — lo necesitarás en el navegador:
                  </p>
                  {/* Selectable, so it works even if the clipboard is denied. */}
                  <div className="cut select-text border-2 border-solid border-accent-line bg-base-deep px-5 py-3 text-center font-display text-[30px]/none font-bold tracking-[0.24em] text-accent-bright">
                    {deviceCode.userCode}
                  </div>
                  <div className="mt-2 flex justify-center">
                    <CopyButton value={deviceCode.userCode} label="Copiar código" />
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="cut-seal grid h-6 w-6 shrink-0 place-items-center bg-accent text-[12px] font-bold text-accent-ink [--cut:5px]">
                  2
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-txt">
                    Abre Microsoft en tu navegador. El código va ya incluido en el enlace.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="pri"
                      icon="external"
                      onClick={() => {
                        void authOpenVerification(deviceCode.verificationUri).catch(
                          () => undefined,
                        )
                      }}
                    >
                      Abrir en el navegador
                    </Button>
                    <CopyButton value={deviceCode.verificationUri} label="Copiar enlace" />
                  </div>
                  <p className="mt-2 select-text font-mono text-[11px] text-txt-dim">
                    {deviceCode.verificationUri}
                  </p>
                </div>
              </li>
            </ol>
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
              <span className="flex items-center gap-2 text-xs text-txt-dim">
                <Spinner size={12} /> Esperando confirmación…
              </span>
              <Button size="sm" variant="ghost" onClick={cancelSignIn}>
                Cancelar
              </Button>
            </div>
          </Panel>
        )}
      </div>
    </div>
  )
}
