"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Icon, cn, type IconName } from "@boffmedia/ui"
import { DkSelect } from "@boffmedia/ui/datakit"
import { openUrl, siteUrl, useToolOnline, useToolSession } from "@boffmedia/tool-kit"
import { usePkmnNameMode, type PkmnNameMode } from "@boffmedia/pkmn-names"

import { useBsimNav, type BsimScreen } from "../nav"
import { isShowdownProxyEnabled } from "../config"
import { getPref, setPref } from "../storage"
import { BSIM_MODES, BSIM_FORMATS, BSIM_FORMAT_KEY, type BsimMode, type BsimView } from "../lib/bsim-data"
import { BSIM_FOCUS_CUT, BSIM_PAGE_NARROW, BsimChip, BsimKicker, type BsimChipTone } from "../components/bsim-kit"
import { useTeams } from "../teambuilder/useTeams"
import { useTeamValidation } from "../teambuilder/useTeamValidation"
import { useBattleTeams } from "../play/useBattleTeams"
import { useToolT, BATTLESIM_NS } from "../i18n"

const MODE_SCREEN: Record<BsimMode, BsimScreen> = {
  ia: "play",
  pvp: "pvp",
  showdown: "showdown",
}

/** Which modes need the network and an account, and which work on a plane. */
const MODE_NEEDS: Record<BsimMode, { online: boolean; account: boolean }> = {
  ia: { online: false, account: false },
  pvp: { online: true, account: true },
  // `account: true` because the RELAY requires one. It reads as a Showdown
  // login, so it looked like it needed no Boffmedia account — but §5.1.5 put
  // the `/showdown` namespace behind the same ws-ticket `/battle` is behind
  // (it opens a real upstream PS connection per client, and an open one made
  // this API a public proxy). The tile advertised "EN LÍNEA", let a signed-out
  // player straight through, and the screen answered with a bare error.
  showdown: { online: true, account: true },
}

type Availability = "ok" | "offline" | "signin" | "checking"

/**
 * The lobby: pick a mode, pick a format, pick a team, go.
 *
 * The screen is the same object it was — the console panel with the accent top
 * rule, three mode cards, one big orange button — because that is the strongest
 * surface in the tool and the point here was never to redraw it. What changed is
 * that it now tells the truth BEFORE the click: a mode that needs an account
 * says so on the card, a team format shows which team is about to be sent and
 * whether it is legal, and the launch button turns into whatever would actually
 * unblock you instead of throwing you at a screen that fails.
 */
export function LobbyView({ go }: { go: (view: BsimView) => void }) {
  const t = useToolT(BATTLESIM_NS)
  const nav = useBsimNav()
  const online = useToolOnline()
  const session = useToolSession()

  const [mode, setMode] = useState<BsimMode>("ia")
  // D5: the Showdown relay is a website-only arrangement, so the launcher must
  // not offer it as a mode at all. Gating only the SCREEN was not enough — the
  // lobby still advertised it, and the tile was the way in.
  const modes = BSIM_MODES.filter((m) => m.id !== "showdown" || isShowdownProxyEnabled())
  const [format, setFormat] = useState<string>(BSIM_FORMATS[0].value)
  const [teamId, setTeamId] = useState<string | null>(null)

  // The tool store rather than localStorage: it is the one persistence both
  // hosts have (IndexedDB on the web, SQLite in the launcher). The read is
  // async, so it is skipped once the player has touched the control: landing a
  // stale preference on top of a choice someone just made is worse than not
  // restoring it at all.
  const touched = useRef(false)
  useEffect(() => {
    let live = true
    void getPref<string>(BSIM_FORMAT_KEY)
      .then((saved) => {
        if (!live || touched.current) return
        if (saved && BSIM_FORMATS.some((f) => f.value === saved)) setFormat(saved)
      })
      .catch(() => { /* first run, or storage unavailable */ })
    return () => { live = false }
  }, [])

  const setFmt = (v: string) => {
    touched.current = true
    setFormat(v)
    setTeamId(null)
    void setPref(BSIM_FORMAT_KEY, v).catch(() => { /* non-fatal */ })
  }

  // Read-only use of the play screen's own team logic, so the lobby and the
  // battle it launches cannot disagree about which team is going in.
  const { teams } = useTeams()
  const { available, needsTeam, blocked } = useBattleTeams(format, teams)
  const chosen = available.find((tm) => tm.clientId === teamId) ?? available[0] ?? null
  const validation = useTeamValidation(format, chosen?.packed ?? "", { enabled: !!chosen })

  const availability = useMemo<Availability>(() => {
    const needs = MODE_NEEDS[mode]
    if (needs.online && !online) return "offline"
    if (needs.account) {
      if (session.status === "loading") return "checking"
      if (!session.signedIn) return "signin"
    }
    return "ok"
  }, [mode, online, session.status, session.signedIn])

  // Showdown picks its formats from the PS server once connected, so offering
  // ours here would be a control whose value the next screen ignores.
  const showsFormat = mode !== "showdown"
  const showsTeam = showsFormat && needsTeam

  const launch = () => {
    const screen = MODE_SCREEN[mode]
    if (screen === "showdown") {
      nav.push(screen)
      return
    }
    // `team` travels with the launch so the next screen opens on the same team
    // this panel just showed. An empty value is dropped by the nav seam.
    nav.push(screen, { format, ...(showsTeam && chosen ? { team: chosen.clientId } : {}) })
  }

  // One column at the tool's narrow measure until the quick-access rail can sit
  // beside the console, then the wide one. The wide cap is written out rather
  // than composed from the constant: a class assembled at runtime is a class
  // Tailwind never saw, so it compiles to nothing.
  //
  // The cap is respelled at EVERY tier, and that is not redundancy. Tailwind
  // orders min-width variants ascending, so `BSIM_PAGE_NARROW`'s own
  // `min-[2240px]:max-w-*` sorts AFTER the `min-[1200px]` override below and
  // wins — which silently shrank this screen at 2240 while the rail beside it
  // grew, and squeezed the mode row until `CLASIFICATORIA` truncated to `CL…`.
  // A `cn()` override of a capped constant only holds while no LATER breakpoint
  // in the constant touches the same property.
  return (
    <div className={cn(BSIM_PAGE_NARROW, "grid gap-[0.875rem] min-[1200px]:max-w-[77.5rem] min-[1600px]:max-w-[80rem] min-[2240px]:max-w-[90rem] min-[1200px]:grid-cols-[minmax(0,1fr)_18.75rem] min-[1600px]:grid-cols-[minmax(0,1fr)_21.875rem] min-[2240px]:grid-cols-[minmax(0,1fr)_25rem] min-[1200px]:items-start")}>
      {/* ============ GAME CONSOLE ============ */}
      <section className="cut-corner cut-corner-edge [--cut-line:var(--line-2)] relative grid gap-[0.9375rem] border border-solid border-line-2 border-t-[3px] border-t-accent px-[1.375rem] pb-[1.375rem] pt-5 [background:linear-gradient(180deg,var(--panel),var(--bg-2))]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-[-45%_35%_auto_-12%] h-[20rem] [background:radial-gradient(50%_60%_at_30%_0,var(--accent-soft),transparent_70%)]" />

        <header className="relative grid gap-[0.375rem]">
          <BsimKicker className="inline-flex items-center gap-[0.4375rem] text-accent-bright">
            <Icon name="sword" size={13} />{t("app.lobby.kick")}
          </BsimKicker>
          <h2 className="m-0 font-display text-[clamp(1.75rem,4.5vw,2.25rem)] font-extrabold italic uppercase leading-[0.95] tracking-[0.02em] text-txt">
            {t("app.lobby.title")}
          </h2>
        </header>

        {/* modes */}
        <div role="radiogroup" aria-label={t("app.lobby.modeLabel")} className="relative grid grid-cols-3 gap-2 max-[620px]:grid-cols-1">
          {modes.map((m) => (
            <ModeCard
              key={m.id}
              icon={m.icon}
              on={mode === m.id}
              onSelect={() => setMode(m.id)}
              label={t(`app.lobby.modes.${m.id}.label`)}
              sub={t(`app.lobby.modes.${m.id}.sub`)}
              chip={gateChip(m.id, online, session.status === "loading", session.signedIn, t)}
            />
          ))}
        </div>

        {/* format */}
        {showsFormat && (
          <div className="relative grid gap-[0.4375rem]">
            <BsimKicker>{t("app.lobby.formatLabel")}</BsimKicker>
            <DkSelect value={format} onChange={setFmt} ariaLabel={t("app.lobby.formatLabel")}
              options={BSIM_FORMATS.map((f) => ({ value: f.value, label: f.label }))} />
          </div>
        )}

        {/* team — only a team format asks for one; a random format builds both
            sides itself and a picker there would be a control that does nothing */}
        {showsTeam && (
          <div className="relative grid gap-[0.4375rem]">
            <BsimKicker>{t("hub.team.label")}</BsimKicker>
            {available.length > 0 ? (
              <div className="grid gap-[0.4375rem] min-[520px]:grid-cols-[minmax(0,1fr)_auto] min-[520px]:items-center">
                <DkSelect
                  value={chosen?.clientId ?? ""}
                  onChange={setTeamId}
                  ariaLabel={t("hub.team.pickAria")}
                  options={available.map((tm) => ({ value: tm.clientId, label: tm.name }))}
                />
                <ValidityChip
                  checking={validation.checking || validation.ok === null}
                  ok={validation.ok === true}
                  problems={validation.problems.length}
                  t={t}
                />
              </div>
            ) : (
              <div className="grid gap-[0.4375rem] min-[520px]:grid-cols-[minmax(0,1fr)_auto] min-[520px]:items-center">
                <p className={cn("m-0 font-mono text-[0.6875rem] leading-[1.4]", blocked ? "text-warn" : "text-txt-dim")}>
                  {blocked ? t("hub.team.noneTitle") : t("hub.team.sample")}
                </p>
                <button
                  type="button"
                  onClick={() => go("equipos")}
                  className={cn(
                    "cut-tag cut-tag-edge [--cut-tag:8px] [--cut-line:var(--line-2)] hover:[--cut-line:var(--accent-line)]",
                    "inline-flex h-8 flex-none items-center gap-[0.375rem] border border-solid border-line-2 bg-panel px-3 font-mono text-[0.625rem] font-semibold uppercase leading-none tracking-[0.08em] text-txt-muted transition-[color,border-color] duration-[140ms] hover:border-accent-line hover:text-accent-bright",
                    BSIM_FOCUS_CUT,
                  )}
                >
                  <Icon name="plus" size={12} />{t("hub.team.create")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* launch — or, when the mode is not available, the thing that would
            make it available. A button that navigates to a screen which can
            only show an error is not an action, it is a trap. */}
        <div className="relative grid gap-2">
          {availability === "ok" ? (
            <>
              <button type="button" onClick={launch} disabled={showsTeam && blocked}
                className={cn(
                  "cut [--cut:12px] relative flex w-full items-center justify-center gap-3 overflow-hidden border-0 bg-accent p-4 text-accent-ink transition-[background,transform] duration-[140ms] hover:-translate-y-px hover:bg-accent-bright motion-reduce:hover:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
                  BSIM_FOCUS_CUT,
                )}>
                <Icon name={mode === "ia" ? "sword" : "search"} size={22} />
                <b className="font-display text-[1.1875rem] font-extrabold italic uppercase leading-none tracking-[0.05em]">{t(`app.lobby.launch.${mode}`)}</b>
              </button>
              <p className="m-0 text-center font-mono text-[0.6875rem] leading-[1.4] text-txt-dim">
                {showsTeam && blocked ? t("play.needsTeam") : t(`app.lobby.modes.${mode}.note`)}
              </p>
            </>
          ) : (
            <GateNotice
              availability={availability}
              onSignIn={session.signIn}
              onPlayAi={() => setMode("ia")}
              t={t}
            />
          )}
        </div>
      </section>

      {/* ============ QUICK ACCESS ============ */}
      <div className="grid content-start gap-[0.625rem]">
      <nav aria-label={t("hub.tiles.aria")} className="grid grid-cols-3 gap-[0.625rem] max-[620px]:grid-cols-1 min-[1200px]:grid-cols-1">
        <LobbyTile icon="layers" title={t("app.lobby.tiles.builder")} sub={t("app.lobby.tiles.builderSub")} onClick={() => go("equipos")} />
        <LobbyTile icon="play" title={t("app.lobby.tiles.replays")} sub={t("app.lobby.tiles.replaysSub")} onClick={() => go("repeticiones")} />
        {/* Not an <a href="/clasificacion">: that route exists on the website and
            nowhere in the launcher, where following it would navigate the whole
            webview out of the app. `openUrl` is the host's own answer to "open
            this for a person" — a tab on the web, the system browser in the app. */}
        <LobbyTile
          icon="trending"
          title={t("app.lobby.tiles.ladder")}
          sub={t("app.lobby.tiles.ladderSub")}
          note={t("hub.tiles.ladderNote")}
          external
          onClick={() => void openUrl(siteUrl("/clasificacion"))}
        />
      </nav>

      <NamesLanguage t={t} />
      </div>
    </div>
  )
}

/**
 * Which language MOVE, ABILITY AND ITEM names are shown in — a separate question
 * from which language the site is in, and separate on purpose.
 *
 * Competitive Pokémon is played in English everywhere else the player goes:
 * Showdown, damage calculators, every team paste they are handed, every guide
 * they read. So someone can reasonably want this tool in Spanish and its names
 * in English, and `auto` — follow the site — is only the DEFAULT, not the rule.
 * It sits in the hub because it is the tool's front door and the setting reaches
 * every screen behind it, the teambuilder included.
 */
function NamesLanguage({ t }: { t: T }) {
  const [mode, setMode] = usePkmnNameMode()
  return (
    <section className="cut-tag cut-tag-edge [--cut-tag:10px] grid gap-[0.4375rem] border border-solid border-line bg-panel px-4 py-[0.875rem]">
      <BsimKicker>{t("app.lobby.names.label")}</BsimKicker>
      <DkSelect
        value={mode}
        onChange={(value) => setMode(value as PkmnNameMode)}
        ariaLabel={t("app.lobby.names.label")}
        options={[
          { value: "auto", label: t("app.lobby.names.auto") },
          { value: "es", label: t("app.lobby.names.es") },
          { value: "en", label: t("app.lobby.names.en") },
        ]}
      />
      <small className="font-mono text-[0.5625rem] leading-[1.4] text-txt-dim">{t("app.lobby.names.hint")}</small>
    </section>
  )
}

/* ── pieces ──────────────────────────────────────────────────────────────── */

type T = (key: string, values?: Record<string, string | number | Date>) => string

/** The availability tag on a mode card, or null for a mode that always works. */
function gateChip(mode: BsimMode, online: boolean, loading: boolean, signedIn: boolean, t: T) {
  const needs = MODE_NEEDS[mode]
  if (!needs.online && !needs.account) return null
  if (!online) return { tone: "bad" as const, label: t("hub.gate.offline") }
  if (needs.account) {
    if (loading) return { tone: "checking" as const, label: t("hub.gate.checking") }
    if (!signedIn) return { tone: "warn" as const, label: t("hub.gate.needsAccount") }
  }
  return { tone: "ok" as const, label: t("hub.gate.online") }
}

function ModeCard({
  icon, on, onSelect, label, sub, chip,
}: {
  icon: IconName
  on: boolean
  onSelect: () => void
  label: string
  sub: string
  chip: { tone: BsimChipTone; label: string } | null
}) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onSelect}
      className={cn(
        "cut cut-edge-slant [--cut:8px] grid min-h-[3.25rem] min-w-0 gap-[0.25rem] border border-solid px-3 py-[0.6875rem] text-left transition-[background,border-color,color] duration-[140ms]",
        BSIM_FOCUS_CUT,
        on
          ? "border-accent [--cut-line:var(--accent)] bg-accent-soft text-txt"
          : "border-line [--cut-line:var(--line)] bg-base text-txt-muted hover:border-line-2 hover:[--cut-line:var(--line-2)] hover:text-txt",
      )}>
      {/* Two rows rather than one: the availability chip and the sub-line were
          competing for the same track, and in a three-across grid the sub lost
          — "Emparejamiento PvP" read as "Emparejamiento…". */}
      <span className="flex min-w-0 items-center gap-[0.5625rem]">
        <Icon name={icon} size={17} className={cn("flex-none", on ? "text-accent-bright" : "text-txt-dim")} />
        <b className="min-w-0 flex-1 truncate font-display text-[0.8125rem] font-bold uppercase leading-none tracking-[0.03em]">{label}</b>
        {chip && (
          <BsimChip tone={chip.tone} size="xs" dot={false} pulse={chip.tone === "checking"}>
            {chip.label}
          </BsimChip>
        )}
      </span>
      <small className="min-w-0 truncate pl-[1.625rem] font-mono text-[0.5625rem] leading-[1.3] text-txt-dim">{sub}</small>
    </button>
  )
}

/** The chosen team's legality, beside the team select. The SAME pill the
 *  teambuilder's cards and the PvP queue draw — see `BsimChip`. */
function ValidityChip({ checking, ok, problems, t }: { checking: boolean; ok: boolean; problems: number; t: T }) {
  const tone: BsimChipTone = checking ? "checking" : ok ? "ok" : "warn"
  const label = checking ? t("hub.team.checking") : ok ? t("hub.team.legal") : t("hub.team.problems", { count: problems })
  return (
    <BsimChip tone={tone} size="md" pulse={checking}>
      {label}
    </BsimChip>
  )
}

/** What replaces the launch button when the chosen mode cannot run. */
function GateNotice({
  availability, onSignIn, onPlayAi, t,
}: {
  availability: Availability
  onSignIn: () => void
  onPlayAi: () => void
  t: T
}) {
  if (availability === "checking") {
    return (
      <p role="status" className="m-0 py-4 text-center font-mono text-[0.6875rem] leading-[1.4] text-txt-dim">{t("hub.gate.checking")}</p>
    )
  }
  const offline = availability === "offline"
  return (
    <div className="cut-tag cut-tag-edge [--cut-tag:10px] grid gap-[0.625rem] border border-solid px-4 py-[0.875rem]"
      style={{ borderColor: offline ? "color-mix(in srgb, var(--bad) 40%, transparent)" : "color-mix(in srgb, var(--warn) 40%, transparent)" }}>
      <p className="m-0 flex items-start gap-[0.5625rem] font-body text-[0.8125rem] leading-[1.45] text-txt-muted">
        <Icon name={offline ? "globe" : "lock"} size={15} className={cn("mt-[2px] flex-none", offline ? "text-bad" : "text-warn")} />
        {offline ? t("hub.gate.offlineReason") : t("hub.gate.signInReason")}
      </p>
      <button
        type="button"
        onClick={offline ? onPlayAi : onSignIn}
        className={cn(
          "cut [--cut:8px] flex h-10 w-full items-center justify-center gap-2 border-0 bg-accent px-4 font-display text-[0.8125rem]/none font-bold uppercase tracking-[0.06em] text-accent-ink transition-[background] duration-[140ms] hover:bg-accent-bright",
          BSIM_FOCUS_CUT,
        )}
      >
        <Icon name={offline ? "target" : "user"} size={15} />
        {offline ? t("hub.gate.playAiInstead") : t("hub.gate.signIn")}
      </button>
    </div>
  )
}

function LobbyTile({
  icon, title, sub, note, onClick, external,
}: {
  icon: IconName
  title: string
  sub: string
  note?: string
  onClick: () => void
  external?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cut-corner cut-corner-edge hover:[--cut-line:var(--accent-line)] [--cut-line:var(--line)] group grid min-w-0 justify-items-start gap-[0.3125rem] border border-solid border-line bg-panel px-4 py-[0.9375rem] text-left text-txt-muted transition-[color,border-color,background,transform] duration-[140ms] hover:-translate-y-[2px] hover:border-accent-line hover:text-txt motion-reduce:hover:translate-y-0",
        BSIM_FOCUS_CUT,
      )}
    >
      <span className="flex w-full items-center gap-2">
        <Icon name={icon} size={20} className="text-accent-bright" />
        <span className="flex-1" />
        {external && <Icon name="external" size={13} className="text-txt-dim" />}
      </span>
      <b className="min-w-0 truncate font-display text-[0.875rem] font-bold uppercase leading-none tracking-[0.03em]">{title}</b>
      <small className="min-w-0 truncate font-mono text-[0.625rem] leading-[1.3] text-txt-dim">{note ?? sub}</small>
    </button>
  )
}
