import { useEffect, useState } from "react"

import { Icon } from "@boffmedia/ui"

import { useT } from "../i18n"
import { closeWindow, isMaximized, minimizeWindow, toggleMaximize } from "../runtime"
import logoUrl from "../../src-tauri/icons/32x32.png"

/** Tracks whether the native window is maximized. The webview viewport resizes
 *  whenever the window does, so a plain resize listener catches every path
 *  (control buttons, double-click, Win+Up, aero snap) without polling. Always
 *  false in a browser tab. */
export function useWindowMaximized(): boolean {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    let mounted = true
    const check = async () => {
      const isMax = await isMaximized()
      if (mounted) setMaximized(isMax)
    }
    void check()
    window.addEventListener("resize", check)
    return () => {
      mounted = false
      window.removeEventListener("resize", check)
    }
  }, [])

  return maximized
}

/** Custom titlebar for frameless Tauri windows.
 *  Provides a drag region and window control buttons (minimize, maximize, close). */
export function Titlebar() {
  const t = useT("titlebar")
  const maximized = useWindowMaximized()

  return (
    <div className="flex h-[40px] min-h-[40px] items-center justify-between bg-base-deep" data-tauri-drag-region>
      {/* Left: drag region + branding. Tauri only starts a window drag when
          the mousedown TARGET element carries data-tauri-drag-region — the
          attribute does not cascade — so the branding children are made
          pointer-transparent to let every press land on this div. */}
      <div
        data-tauri-drag-region
        className="flex flex-1 items-center gap-2 self-stretch px-4"
        onDoubleClick={() => toggleMaximize()}
      >
        <img
          src={logoUrl}
          width={20}
          height={20}
          alt=""
          draggable={false}
          className="pointer-events-none select-none"
        />
        {/* L4 — "Boffmedia App", not "Boff Launcher": this stopped being a
            launcher when Tools became a first-class section. UI STRINGS ONLY —
            the executable, installer and updater feed keep their current
            identity until a dedicated release cycle. */}
        <span className="pointer-events-none select-none font-display text-[14px]/none font-bold uppercase tracking-[0.06em] text-txt">{t("brandName")}</span>
        <span className="pointer-events-none select-none font-display text-[14px]/none font-bold uppercase tracking-[0.06em] text-txt-dim">{t("brandSuffix")}</span>
      </div>

      {/* Right: window controls */}
      <div className="flex items-center gap-1 pr-2">
        {/* Minimize button */}
        <button
          type="button"
          onClick={() => minimizeWindow()}
          title={t("minimize")}
          className="flex h-8 w-8 items-center justify-center rounded text-txt hover:bg-surface-bright active:bg-surface-bright/50"
          aria-label={t("minimize")}
        >
          <Icon name="minus" size={14} />
        </button>

        {/* Maximize / Restore button */}
        <button
          type="button"
          onClick={() => toggleMaximize()}
          title={maximized ? t("restore") : t("maximize")}
          className="flex h-8 w-8 items-center justify-center rounded text-txt hover:bg-surface-bright active:bg-surface-bright/50"
          aria-label={maximized ? t("restore") : t("maximize")}
        >
          <Icon name={maximized ? "exitFullscreen" : "fullscreen"} size={14} />
        </button>

        {/* Close button */}
        <button
          type="button"
          onClick={() => closeWindow()}
          title={t("close")}
          className="flex h-8 w-8 items-center justify-center rounded text-txt hover:bg-red-500/20 hover:text-red-500 active:bg-red-500/30"
          aria-label={t("close")}
        >
          <Icon name="x" size={14} />
        </button>
      </div>
    </div>
  )
}
