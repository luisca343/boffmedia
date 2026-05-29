"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { SkinViewer } from "skinview3d"
import { Copy, RefreshCw, Check, SlidersHorizontal, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { MisionesService } from "@/services/api/smartrotom/misionesService"
import { INPC } from "@/app/smartrotom/misiones/_types/Quest"

const SKIN_BASE = "/smartrotom/img/customNPC"

type Params = {
  posX: number; posY: number; posZ: number
  rotX: number; rotY: number; rotZ: number
  playerX: number; playerY: number; playerZ: number
  canvasW: number; canvasH: number
  showHead: boolean; showBody: boolean
  showLeftArm: boolean; showRightArm: boolean
  showLeftLeg: boolean; showRightLeg: boolean
  showCape: boolean
}

const HEAD_PRESET: Params = {
  posX: -6, posY: 16, posZ: 10,
  rotX: -0.40, rotY: 0.50, rotZ: 0,
  playerX: 0, playerY: 0, playerZ: 0,
  canvasW: 128, canvasH: 128,
  showHead: true, showBody: false,
  showLeftArm: false, showRightArm: false,
  showLeftLeg: false, showRightLeg: false,
  showCape: false,
}

const BODY_PRESET: Params = {
  posX: -30.5, posY: 22, posZ: 42,
  rotX: -0.620, rotY: 0.534, rotZ: 0.348,
  playerX: 0, playerY: 0, playerZ: 0,
  canvasW: 200, canvasH: 400,
  showHead: true, showBody: true,
  showLeftArm: true, showRightArm: true,
  showLeftLeg: true, showRightLeg: true,
  showCape: false,
}

function r(n: number) { return parseFloat(n.toFixed(3)) }

function generateCode(p: Params): string {
  const lines: string[] = [
    `const viewer = new SkinViewer({ width: ${p.canvasW}, height: ${p.canvasH}, enableControls: false });`,
    `const { skin } = viewer.playerObject;`,
  ]
  if (!p.showHead)     lines.push(`skin.head.visible = false;`)
  if (!p.showBody)     lines.push(`skin.body.visible = false;`)
  if (!p.showLeftArm)  lines.push(`skin.leftArm.visible = false;`)
  if (!p.showRightArm) lines.push(`skin.rightArm.visible = false;`)
  if (!p.showLeftLeg)  lines.push(`skin.leftLeg.visible = false;`)
  if (!p.showRightLeg) lines.push(`skin.rightLeg.visible = false;`)
  if (!p.showCape)     lines.push(`viewer.playerObject.cape.visible = false;`)
  if (p.playerX !== 0 || p.playerY !== 0 || p.playerZ !== 0)
    lines.push(`viewer.playerObject.position.set(${r(p.playerX)}, ${r(p.playerY)}, ${r(p.playerZ)});`)
  lines.push(
    `viewer.camera.rotation.x = ${r(p.rotX)};`,
    `viewer.camera.rotation.y = ${r(p.rotY)};`,
    `viewer.camera.rotation.z = ${r(p.rotZ)};`,
    `viewer.camera.position.x = ${r(p.posX)};`,
    `viewer.camera.position.y = ${r(p.posY)};`,
    `viewer.camera.position.z = ${r(p.posZ)};`,
  )
  return lines.join("\n")
}

interface SliderRowProps {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void
}

function SliderRow({ label, value, min, max, step, onChange }: SliderRowProps) {
  const display = step <= 0.01 ? value.toFixed(3) : step < 1 ? value.toFixed(1) : String(value)
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--fg-faint)", width: 56, flexShrink: 0 }}>{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, cursor: "pointer", accentColor: "rgb(var(--term))", height: 4 }}
      />
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--fg-strong)", width: 56, textAlign: "right", flexShrink: 0 }}>
        {display}
      </span>
    </div>
  )
}

interface ToggleChipProps { label: string; value: boolean; onChange: (v: boolean) => void }

function ToggleChip({ label, value, onChange }: ToggleChipProps) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        padding: "3px 10px",
        fontFamily: "var(--mono)",
        fontSize: 11,
        borderRadius: "var(--radius)",
        border: value ? "1px solid rgb(var(--term))" : "1px solid var(--line)",
        background: value ? "rgb(var(--term) / 0.12)" : "transparent",
        color: value ? "var(--fg-strong)" : "var(--fg-faint)",
        cursor: "pointer",
        transition: "all .15s",
      }}
    >
      {value ? "\u2713" : "\u00b7"} {label}
    </button>
  )
}

export default function SkinTunerPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef    = useRef<SkinViewer | null>(null)

  const [params, setParams]           = useState<Params>(HEAD_PRESET)
  const [skinInput, setSkinInput]     = useState("steve")
  const [skinOptions, setSkinOptions] = useState<string[]>(["steve"])
  const [copied, setCopied]           = useState(false)

  const set = <K extends keyof Params>(key: K, val: Params[K]) =>
    setParams(prev => ({ ...prev, [key]: val }))

  const applyToViewer = useCallback((viewer: SkinViewer, p: Params) => {
    const { skin } = viewer.playerObject
    skin.head.visible     = p.showHead
    skin.body.visible     = p.showBody
    skin.leftArm.visible  = p.showLeftArm
    skin.rightArm.visible = p.showRightArm
    skin.leftLeg.visible  = p.showLeftLeg
    skin.rightLeg.visible = p.showRightLeg
    viewer.playerObject.cape.visible = p.showCape
    viewer.playerObject.position.set(p.playerX, p.playerY, p.playerZ)
    viewer.camera.rotation.x = p.rotX
    viewer.camera.rotation.y = p.rotY
    viewer.camera.rotation.z = p.rotZ
    viewer.camera.position.set(p.posX, p.posY, p.posZ)
    viewer.render()
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const viewer = new SkinViewer({
      width: HEAD_PRESET.canvasW,
      height: HEAD_PRESET.canvasH,
      enableControls: false,
    })
    container.appendChild(viewer.canvas)
    viewerRef.current = viewer
    viewer.loadSkin(`${SKIN_BASE}/steve.png`)
      .catch(() => {})
      .then(() => applyToViewer(viewer, HEAD_PRESET))
    return () => {
      viewerRef.current = null
      viewer.dispose()
      while (container.firstChild) container.removeChild(container.firstChild)
    }
  }, [applyToViewer])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    if (viewer.width !== params.canvasW || viewer.height !== params.canvasH) {
      viewer.width  = params.canvasW
      viewer.height = params.canvasH
    }
    applyToViewer(viewer, params)
  }, [params, applyToViewer])

  useEffect(() => {
    MisionesService.getAllNPCs()
      .then(res => {
        const npcs = (res.data as unknown as INPC[]) ?? []
        const unique = [
          ...new Set(npcs.map(n => (n.skin || "steve").replace(/[.]png$/i, ""))),
        ].sort()
        setSkinOptions(unique.length ? unique : ["steve"])
      })
      .catch(() => {})
  }, [])

  const loadSkin = useCallback((name: string) => {
    const viewer = viewerRef.current
    if (!viewer) return
    const base = name.replace(/[.]png$/i, "")
    viewer.loadSkin(`${SKIN_BASE}/${base}.png`)
      .catch(() => viewer.loadSkin(`${SKIN_BASE}/steve.png`))
      .then(() => applyToViewer(viewer, params))
  }, [applyToViewer, params])

  const applyPreset = (preset: Params) => {
    setParams(preset)
    const viewer = viewerRef.current
    if (!viewer) return
    if (viewer.width !== preset.canvasW || viewer.height !== preset.canvasH) {
      viewer.width  = preset.canvasW
      viewer.height = preset.canvasH
    }
    applyToViewer(viewer, preset)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(generateCode(params)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <>
      <div className="sr-page-head">
        <h1 className="sr-page-title"><SlidersHorizontal size={20} /> Camera Tuner</h1>
        <p className="sr-page-sub">
          Ajusta la c\u00e1mara de skinview3d para los renders de NPCs
          {" \u00b7 "}
          <Link href="/smartrotom/admin/skins" className="sr-faint" style={{ textDecoration: "underline", fontSize: 12 }}>
            <ChevronLeft size={11} style={{ display: "inline", verticalAlign: "middle" }} /> Volver a Skins
          </Link>
        </p>
      </div>

      <div style={{ display: "flex", gap: "var(--gap)", alignItems: "flex-start", flexWrap: "wrap" }}>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)", width: 320, flexShrink: 0 }}>

          <div className="sr-panel">
            <div className="sr-panel-head">
              <span className="sr-ttl">Preview</span>
              <span className="sr-meta sr-faint">{params.canvasW} \u00d7 {params.canvasH} px</span>
            </div>
            <div className="sr-panel-body" style={{ display: "flex", justifyContent: "center", background: "#000" }}>
              <div
                ref={containerRef}
                style={{ width: params.canvasW, height: params.canvasH, overflow: "hidden" }}
              />
            </div>
          </div>

          <div className="sr-panel">
            <div className="sr-panel-head"><span className="sr-ttl">// Skin</span></div>
            <div className="sr-panel-body sr-col" style={{ gap: 8 }}>
              <select
                className="sr-select"
                value={skinInput}
                onChange={e => { setSkinInput(e.target.value); loadSkin(e.target.value) }}
              >
                {skinOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  className="sr-input"
                  style={{ flex: 1 }}
                  value={skinInput}
                  onChange={e => setSkinInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && loadSkin(skinInput)}
                  placeholder="custom name\u2026"
                />
                <button onClick={() => loadSkin(skinInput)} className="sr-btn sr-sm">
                  <RefreshCw size={12} /> Load
                </button>
              </div>
            </div>
          </div>

          <div className="sr-panel">
            <div className="sr-panel-head"><span className="sr-ttl">// Presets</span></div>
            <div className="sr-panel-body" style={{ display: "flex", gap: 8 }}>
              <button className="sr-btn" onClick={() => applyPreset(HEAD_PRESET)}>Head only</button>
              <button className="sr-btn" onClick={() => applyPreset(BODY_PRESET)}>Full body</button>
            </div>
          </div>

          <div className="sr-panel">
            <div className="sr-panel-head">
              <span className="sr-ttl">// Code output</span>
              <button onClick={copyCode} className="sr-btn sr-ghost sr-sm">
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="sr-panel-body">
              <pre style={{ margin: 0, fontFamily: "var(--mono)", fontSize: 11, color: "var(--fg-muted)", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.7 }}>
                {generateCode(params)}
              </pre>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: "var(--gap)" }}>

          <div className="sr-panel">
            <div className="sr-panel-head"><span className="sr-ttl">// Camera Position</span></div>
            <div className="sr-panel-body sr-col" style={{ gap: 2 }}>
              {(["posX","posY","posZ"] as const).map(k => (
                <SliderRow key={k} label={k} value={params[k]} min={-60} max={60} step={0.5} onChange={v => set(k, v)} />
              ))}
            </div>
          </div>

          <div className="sr-panel">
            <div className="sr-panel-head">
              <span className="sr-ttl">// Camera Rotation</span>
              <span className="sr-meta sr-faint">Euler XYZ (rad)</span>
            </div>
            <div className="sr-panel-body sr-col" style={{ gap: 2 }}>
              {(["rotX","rotY","rotZ"] as const).map(k => (
                <SliderRow key={k} label={k} value={params[k]} min={-3.14} max={3.14} step={0.01} onChange={v => set(k, v)} />
              ))}
            </div>
          </div>

          <div className="sr-panel">
            <div className="sr-panel-head">
              <span className="sr-ttl">// Player Position</span>
              <span className="sr-meta sr-faint">shifts model in scene</span>
            </div>
            <div className="sr-panel-body sr-col" style={{ gap: 2 }}>
              {(["playerX","playerY","playerZ"] as const).map(k => (
                <SliderRow key={k} label={k} value={params[k]} min={-20} max={20} step={0.5} onChange={v => set(k, v)} />
              ))}
            </div>
          </div>

          <div className="sr-panel">
            <div className="sr-panel-head"><span className="sr-ttl">// Canvas Size</span></div>
            <div className="sr-panel-body sr-col" style={{ gap: 2 }}>
              <SliderRow label="width"  value={params.canvasW} min={64} max={512} step={8} onChange={v => set("canvasW", v)} />
              <SliderRow label="height" value={params.canvasH} min={64} max={512} step={8} onChange={v => set("canvasH", v)} />
            </div>
          </div>

          <div className="sr-panel">
            <div className="sr-panel-head">
              <span className="sr-ttl">// Visibility</span>
              <span className="sr-meta sr-faint">toggle body parts</span>
            </div>
            <div className="sr-panel-body" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(
                [
                  { k: "showHead",     l: "head" },
                  { k: "showBody",     l: "body" },
                  { k: "showLeftArm",  l: "leftArm" },
                  { k: "showRightArm", l: "rightArm" },
                  { k: "showLeftLeg",  l: "leftLeg" },
                  { k: "showRightLeg", l: "rightLeg" },
                  { k: "showCape",     l: "cape" },
                ] as const
              ).map(({ k, l }) => (
                <ToggleChip key={k} label={l} value={params[k]} onChange={v => set(k, v)} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
