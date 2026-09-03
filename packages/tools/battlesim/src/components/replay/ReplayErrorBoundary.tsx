"use client"

import * as React from "react"
import { Button } from "@boffmedia/ui"

import { useToolT, BATTLESIM_NS } from "../../i18n"
import { BsimErrorState } from "../bsim-kit"
import { useBsimNavMaybe } from "../../nav"

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * The replay viewer's crash net.
 *
 * A malformed protocol line can throw deep inside the scene compositor, and
 * without a boundary that takes the whole tool down with it. The fallback is
 * built on the shared error surface rather than on the invented classes it used
 * to carry (`bg-layer-2`, `text-ink`, `bg-primary-active`) — none of which exist
 * in the launcher's Tailwind config, so the old fallback rendered as unstyled
 * text on the one host where a crash is hardest to report.
 */
export class ReplayErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // There is no error reporter wired into a tool package, and swallowing the
    // throw silently meant a crash left NOTHING anywhere — not in the UI, not
    // in the console. The stack is the only lead anyone debugging this has.
    console.error("[battlesim] replay viewer crashed", error, errorInfo.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <ReplayErrorFallback
            message={this.state.error?.message}
            onRetry={() => this.setState({ hasError: false, error: null })}
          />
        )
      )
    }

    return this.props.children
  }
}

/** Hooks cannot live in a class component, so the fallback is its own function. */
function ReplayErrorFallback({ message, onRetry }: { message?: string; onRetry: () => void }) {
  const t = useToolT(BATTLESIM_NS)
  // Optional on purpose: this viewer is also embedded on a SmartRotom page that
  // mounts no nav seam, and "there is nowhere to go back to" is a missing
  // button, not a second crash.
  const nav = useBsimNavMaybe()
  const back = React.useCallback(() => {
    if (nav && !nav.back()) nav.replace("hub", {})
  }, [nav])
  return (
    <div className="bg-base text-txt">
      <BsimErrorState
        icon="alert"
        title={t("replayError.title")}
        lead={t("replayError.message")}
        actions={
          <>
            <Button variant="pri" icon="refresh" onClick={onRetry}>{t("replayError.retry")}</Button>
            {nav && <Button icon="back" onClick={back}>{t("hub.replays.back")}</Button>}
          </>
        }
      />
      {message && (
        <pre className="cut-tag cut-tag-edge [--cut-tag:8px] [--cut-line:var(--line)] mx-auto mb-10 max-w-[40rem] overflow-auto border border-solid border-line bg-panel p-3 font-mono text-[0.6875rem] leading-[1.5] text-txt-dim">
          {message}
        </pre>
      )}
    </div>
  )
}
