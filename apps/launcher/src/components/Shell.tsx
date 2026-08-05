import { Badge, Banner, Button, Icon, type IconName, Kicker } from "@boffmedia/ui"

import { type View, useLauncher } from "../state/launcher"
import { AccountSwitcher } from "./AccountSwitcher"

const NAV: { view: View; label: string; icon: IconName }[] = [
  { view: "packs", label: "Packs", icon: "cube" },
  { view: "logs", label: "Registro", icon: "list" },
  { view: "settings", label: "Ajustes", icon: "sliders" },
]

// Two different degradations, and conflating them would mislead:
//
//   offline      — no network at all. The identity came from the roster, so
//                  only packs already on disk can be played.
//   packsPartial — we ARE online and signed in, but the pack registry did not
//                  answer. Local packs are all that loaded.
//
// Neither is an error: in both cases what is on screen works. The banner exists
// so a player does not think their packs have vanished.
function OfflineNotice() {
  const { offline, packsPartial, reloadPacks, packsLoading } = useLauncher()

  if (!offline && !packsPartial) return null

  return (
    <Banner
      tone="warn"
      icon="alert"
      title={offline ? "Sin conexión" : "No se pudo cargar toda tu biblioteca"}
      className="m-4 mb-0"
      actions={
        <Button size="sm" variant="ghost" icon="refresh" disabled={packsLoading} onClick={reloadPacks}>
          Reintentar
        </Button>
      }
    >
      {offline
        ? "Puedes jugar a los packs que ya tengas instalados. Instalar, actualizar y descargar packs necesita conexión."
        : "Se muestran tus packs locales. Los packs del servidor volverán a aparecer cuando se restablezca la conexión."}
    </Banner>
  )
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { view, go, game, logs } = useLauncher()

  const errorCount = logs.filter((l) => l.level === "error").length

  return (
    <div className="flex h-full min-h-0">
      <nav className="flex w-[228px] shrink-0 flex-col border-r border-line bg-base-deep">
        <div className="px-5 py-5">
          <Kicker>Boff</Kicker>
          <div className="font-display text-[22px]/none font-bold uppercase tracking-[0.06em] text-txt">
            Launcher
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => {
            const active = view === item.view || (item.view === "packs" && view === "pack")
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => go(item.view)}
                aria-current={active ? "page" : undefined}
                className={[
                  "cut flex items-center gap-3 px-3 py-2.5 text-left",
                  "font-display text-[14px]/none font-bold uppercase tracking-[0.08em]",
                  "border-2 border-solid transition-colors duration-[140ms]",
                  active
                    ? "border-accent bg-accent-soft text-accent-bright"
                    : "border-transparent text-txt-muted hover:text-txt",
                ].join(" ")}
              >
                <Icon name={item.icon} size={16} />
                {item.label}
                {item.view === "logs" && errorCount > 0 && (
                  <span className="ml-auto">
                    <Badge tone="bad">{errorCount}</Badge>
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {game.kind === "running" && (
          <div className="mx-3 mb-3 border-2 border-solid border-ok/40 bg-ok-soft px-3 py-2">
            <div className="flex items-center gap-2 text-[12px]/none font-semibold uppercase tracking-[0.1em] text-ok">
              <Icon name="play" size={12} />
              En ejecución
            </div>
            <div className="mt-1 font-mono text-[11px] text-txt-dim">pid {game.pid}</div>
          </div>
        )}

        <AccountSwitcher />
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <OfflineNotice />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
