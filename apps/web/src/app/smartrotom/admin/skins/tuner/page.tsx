"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { SkinViewer } from "skinview3d"
import { Copy, RefreshCw, Check } from "lucide-react"
import AdminPageLayout from "@/app/smartrotom/admin/_components/AdminPageLayout"
import TerminalCard from "@/app/smartrotom/admin/_components/TerminalCard"
import { MisionesService } from "@/services/api/smartrotom/misionesService"
import { NPCCatalogResponse } from "@/types/misiones"

const SKIN_BASE = "/smartrotom/img/customNPC"

type Params = {
  // Camera
  posX: number; posY: number; posZ: number
  rotX: number; rotY: number; rotZ: number
  // Model
  playerX: number; playerY: number; playerZ: number
  // Canvas
  canvasW: number; canvasH: number
  // Visibility
  showHead: boolean; showBody: boolean
  showLeftArm: boolean; showRightArm: boolean
  showLeftLeg: boolean; showRightLeg: boolean
  showCape: boolean
}

const HEAD_PRESET: Params = {
  posX: -6,    posY: 16,   posZ: 10,
  rotX: -0.40, rotY: 0.50, rotZ: 0,
  playerX: 0, playerY: 0, playerZ: 0,
  canvasW: 128, canvasH: 128,
  showHead: true,  showBody: false,
  showLeftArm: false, showRightArm: false,
  showLeftLeg: false, showRightLeg: false,
  showCape: false,
}

const BODY_PRESET: Params = {
  posX: -30.5, posY: 22,   posZ: 42,
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

// ─── Sub-components ────────────────────────────────────────────────────────────

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}

function Slider({ label, value, min, max, step, onChange }: SliderProps) {
  const display = step <= 0.01 ? value.toFixed(3) : step < 1 ? value.toFixed(1) : String(value)
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-highlight-600 text-xs font-mono w-14 shrink-0">{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 cursor-pointer accent-green-400"
        style={{ height: "4px" }}
      />
      <span className="text-highlight-300 text-xs font-mono w-14 text-right tabular-nums">{display}</span>
    </div>
  )
}

interface ToggleProps { label: string; value: boolean; onChange: (v: boolean) => void }

function Toggle({ label, value, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`text-xs px-2 py-0.5 border rounded-sm font-mono transition-colors ${
        value
          ? "border-green-500 text-green-400 bg-green-900/20"
          : "border-highlight-700 text-highlight-600 hover:border-highlight-500 hover:text-highlight-400"
      }`}
    >
      {value ? "✓" : "·"} {label}
    </button>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SkinTunerPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef    = useRef<SkinViewer | null>(null)

  const [params, setParams]       = useState<Params>(HEAD_PRESET)
  const [skinInput, setSkinInput] = useState("steve")
  const [skinOptions, setSkinOptions] = useState<string[]>(["steve"])
  const [copied, setCopied]       = useState(false)

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

  // Create viewer once on mount
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

  // Re-apply whenever params change
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    if (viewer.width !== params.canvasW || viewer.height !== params.canvasH) {
      viewer.width  = params.canvasW
      viewer.height = params.canvasH
    }
    applyToViewer(viewer, params)
  }, [params, applyToViewer])

  // Load skin list from catalog
  useEffect(() => {
    MisionesService.getNpcCatalog()
      .then(res => {
        const catalog = (res.data as unknown as NPCCatalogResponse) ?? {}
        const unique = [
          ...new Set(
            Object.values(catalog).flat()
              .map(n => (n.skin || "steve").replace(/\.png$/i, ""))
          ),
        ].sort()
        setSkinOptions(unique.length ? unique : ["steve"])
      })
      .catch(() => {})
  }, [])

  const loadSkin = (name: string) => {
    const viewer = viewerRef.current
    if (!viewer) return
    const base = name.replace(/\.png$/i, "")
    viewer.loadSkin(`${SKIN_BASE}/${base}.png`)
      .catch(() => viewer.loadSkin(`${SKIN_BASE}/steve.png`))
      .then(() => applyToViewer(viewer, params))
  }

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
    <AdminPageLayout title="Skin Camera Tuner" backLink="/smartrotom/admin/skins" addBackgroundEffects>
      <div className="flex flex-col xl:flex-row gap-4">

        {/* ── Left: preview + skin + code ── */}
        <div className="flex flex-col gap-4 xl:w-80 shrink-0">

          <TerminalCard title="Preview" description={`${params.canvasW} × ${params.canvasH} px`}>
            <div
              ref={containerRef}
              className="bg-black/60 border border-highlight-800/40 rounded overflow-hidden"
              style={{ width: params.canvasW, height: params.canvasH }}
            />
          </TerminalCard>

          <TerminalCard title="Skin">
            <div className="flex flex-col gap-2">
              <select
                className="text-xs bg-black border border-highlight-700 text-highlight-300 px-2 py-1 rounded-sm font-mono w-full"
                value={skinInput}
                onChange={e => { setSkinInput(e.target.value); loadSkin(e.target.value) }}
              >
                {skinOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="flex gap-2">
                <input
                  value={skinInput}
                  onChange={e => setSkinInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && loadSkin(skinInput)}
                  placeholder="custom name…"
                  className="flex-1 text-xs bg-black border border-highlight-700 text-highlight-300 px-2 py-1 rounded-sm font-mono"
                />
                <button
                  onClick={() => loadSkin(skinInput)}
                  className="text-xs px-2 py-1 border border-highlight-600 text-highlight-400 hover:bg-highlight-900/40 flex items-center gap-1 rounded-sm"
                >
                  <RefreshCw className="w-3 h-3" /> Load
                </button>
              </div>
            </div>
          </TerminalCard>

          <TerminalCard title="Presets">
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => applyPreset(HEAD_PRESET)}
                className="text-xs px-2 py-1 border border-highlight-600 text-highlight-400 hover:bg-highlight-900/40 rounded-sm">
                Head only
              </button>
              <button onClick={() => applyPreset(BODY_PRESET)}
                className="text-xs px-2 py-1 border border-highlight-600 text-highlight-400 hover:bg-highlight-900/40 rounded-sm">
                Full body
              </button>
            </div>
          </TerminalCard>

          <TerminalCard title="Code output" description="Paste into generateNpcHeadRender">
            <pre className="text-xs text-highlight-400 font-mono leading-relaxed whitespace-pre-wrap break-all bg-black/40 p-2 rounded border border-highlight-800/40">
              {generateCode(params)}
            </pre>
            <button onClick={copyCode}
              className="mt-2 text-xs px-2 py-1 border border-highlight-600 text-highlight-400 hover:bg-highlight-900/40 flex items-center gap-1 rounded-sm">
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </TerminalCard>
        </div>

        {/* ── Right: controls ── */}
        <div className="flex-1 flex flex-col gap-4">

          <TerminalCard title="Camera Position">
            <div className="flex flex-col gap-1">
              <Slider label="posX" value={params.posX} min={-60} max={60} step={0.5} onChange={v => set("posX", v)} />
              <Slider label="posY" value={params.posY} min={-60} max={60} step={0.5} onChange={v => set("posY", v)} />
              <Slider label="posZ" value={params.posZ} min={-60} max={60} step={0.5} onChange={v => set("posZ", v)} />
            </div>
          </TerminalCard>

          <TerminalCard title="Camera Rotation" description="Euler XYZ (radians, −π to π)">
            <div className="flex flex-col gap-1">
              <Slider label="rotX" value={params.rotX} min={-3.14} max={3.14} step={0.01} onChange={v => set("rotX", v)} />
              <Slider label="rotY" value={params.rotY} min={-3.14} max={3.14} step={0.01} onChange={v => set("rotY", v)} />
              <Slider label="rotZ" value={params.rotZ} min={-3.14} max={3.14} step={0.01} onChange={v => set("rotZ", v)} />
            </div>
          </TerminalCard>

          <TerminalCard title="Player Position" description="Shifts the model in scene space">
            <div className="flex flex-col gap-1">
              <Slider label="playerX" value={params.playerX} min={-20} max={20} step={0.5} onChange={v => set("playerX", v)} />
              <Slider label="playerY" value={params.playerY} min={-20} max={20} step={0.5} onChange={v => set("playerY", v)} />
              <Slider label="playerZ" value={params.playerZ} min={-20} max={20} step={0.5} onChange={v => set("playerZ", v)} />
            </div>
          </TerminalCard>

          <TerminalCard title="Canvas Size">
            <div className="flex flex-col gap-1">
              <Slider label="width"  value={params.canvasW} min={64} max={512} step={8} onChange={v => set("canvasW", v)} />
              <Slider label="height" value={params.canvasH} min={64} max={512} step={8} onChange={v => set("canvasH", v)} />
            </div>
          </TerminalCard>

          <TerminalCard title="Visibility" description="Toggle which body parts are rendered">
            <div className="flex flex-wrap gap-2">
              <Toggle label="head"     value={params.showHead}     onChange={v => set("showHead", v)} />
              <Toggle label="body"     value={params.showBody}     onChange={v => set("showBody", v)} />
              <Toggle label="leftArm"  value={params.showLeftArm}  onChange={v => set("showLeftArm", v)} />
              <Toggle label="rightArm" value={params.showRightArm} onChange={v => set("showRightArm", v)} />
              <Toggle label="leftLeg"  value={params.showLeftLeg}  onChange={v => set("showLeftLeg", v)} />
              <Toggle label="rightLeg" value={params.showRightLeg} onChange={v => set("showRightLeg", v)} />
              <Toggle label="cape"     value={params.showCape}     onChange={v => set("showCape", v)} />
            </div>
          </TerminalCard>

        </div>
      </div>
    </AdminPageLayout>
  )
}
