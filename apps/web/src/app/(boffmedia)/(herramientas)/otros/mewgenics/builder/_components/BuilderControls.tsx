"use client"

import React from "react"
import { useTranslations } from "next-intl"
import type { CatParts } from "@/components/boffmedia/ui/mewgenics/cat"
import { PartThumbnailGrid } from "@/components/boffmedia/ui/mewgenics/cat/part-picker"

interface BuilderControlsProps {
  state: {
    parts: CatParts
    palette: number
    pose: { eyes?: "open" | "closed"; mouth?: "normal" | "open" | "smile" }
    equipment: Record<string, number>
  }
  onChange: (partKey: keyof CatParts, frame: number) => void
  onPoseChange: (poseType: "eyes" | "mouth", value: string) => void
}

// Map part keys to clip names
// clipName (lowercase) is for SVG directory URLs
// clipNamePascal is for part_bounds lookup in catparts_placements.json
const PART_CLIPS: Record<keyof CatParts, { clipName: string; clipNamePascal: string }> = {
  body: { clipName: "catbody", clipNamePascal: "CatBody" },
  head: { clipName: "cathead", clipNamePascal: "CatHead" },
  ears: { clipName: "catear", clipNamePascal: "CatEar" },
  eyes: { clipName: "cateye", clipNamePascal: "CatEye" },
  eyebrows: { clipName: "cateyebrow", clipNamePascal: "CatEyebrow" },
  mouth: { clipName: "catmouth", clipNamePascal: "CatMouth" },
  tail: { clipName: "cattail", clipNamePascal: "CatTail" },
  legs: { clipName: "catleg", clipNamePascal: "CatLeg" },
  texture: { clipName: "cattexture", clipNamePascal: "CatTexture" },
  claws: { clipName: "catclaws", clipNamePascal: "CatClaws" },
  arms: { clipName: "catleg", clipNamePascal: "CatLeg" }, // arms use the same clip as legs
}

export function BuilderControls({ state, onChange, onPoseChange }: BuilderControlsProps) {
  const t = useTranslations("mewgenics")

  const partKeys = ["body", "head", "ears", "eyes", "eyebrows", "mouth", "tail", "legs", "texture", "claws"] as const
  // One slot visible at a time. Stacking ten 320px grids inside one scroller
  // buried every slot but the first.
  const [activeSlot, setActiveSlot] = React.useState<(typeof partKeys)[number]>("body")
  const clips = PART_CLIPS[activeSlot]

  return (
    <div className="flex flex-col gap-4">
      {/* Part slot switcher + the active slot's thumbnail grid */}
      <div className="bg-[color:var(--mwp-night-2)] p-3 [border-radius:var(--wob-sm)] border-2 border-solid border-[color:var(--mwp-nline)]">
        <div className="mb-3 flex flex-wrap gap-1.5" role="tablist">
          {partKeys.map((partKey) => (
            <button
              key={partKey}
              type="button"
              role="tab"
              aria-selected={activeSlot === partKey}
              onClick={() => setActiveSlot(partKey)}
              className={`px-2 py-1 text-[11px] font-bold [border-radius:var(--wob-sm)] border-2 border-solid transition-all ${
                activeSlot === partKey
                  ? "bg-[color:var(--mwp-red)] text-[color:var(--mwp-paper)] border-[color:var(--mwp-red)]"
                  : "bg-transparent border-[color:var(--mwp-nline)] text-[color:var(--mwp-cream-dim)] hover:border-[color:var(--mwp-ink)]"
              }`}
            >
              {t(`builder.parts.${partKey}`)}
            </button>
          ))}
        </div>
        <PartThumbnailGrid
          key={activeSlot}
          partKey={activeSlot}
          value={state.parts[activeSlot] ?? 1}
          onChange={(frame) => onChange(activeSlot, frame)}
          clipName={clips.clipName}
          clipNamePascal={clips.clipNamePascal}
        />
      </div>

      {/* Pose Controls */}
      <div className="bg-[color:var(--mwp-night-2)] p-3 [border-radius:var(--wob-sm)] border-2 border-solid border-[color:var(--mwp-nline)]">
        <div className="text-[11px] font-bold text-[color:var(--mwp-cream-dim)] uppercase mb-3">
          {t("builder.poseTitle")}
        </div>

        {/* Eyes */}
        <div className="flex flex-col gap-2 mb-3">
          <label className="text-[11px] font-bold text-[color:var(--mwp-cream)]">
            {t("builder.poseEyesLabel")}
          </label>
          <div className="flex gap-2">
            {(["open", "closed"] as const).map((eyeState) => (
              <button
                key={eyeState}
                type="button"
                onClick={() => onPoseChange("eyes", eyeState)}
                className={`flex-1 py-1 text-[11px] font-bold [border-radius:var(--wob-sm)] border-2 border-solid transition-all ${
                  state.pose.eyes === eyeState
                    ? "bg-[color:var(--mwp-red)] text-[color:var(--mwp-paper)] border-[color:var(--mwp-red)]"
                    : "bg-transparent border-[color:var(--mwp-nline)] text-[color:var(--mwp-cream-dim)] hover:border-[color:var(--mwp-ink)]"
                }`}
              >
                {t(`builder.pose.eyes.${eyeState}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Mouth */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold text-[color:var(--mwp-cream)]">
            {t("builder.poseMouthLabel")}
          </label>
          <div className="flex gap-2">
            {(["normal", "open", "smile"] as const).map((mouthState) => (
              <button
                key={mouthState}
                type="button"
                onClick={() => onPoseChange("mouth", mouthState)}
                className={`flex-1 py-1 text-[11px] font-bold [border-radius:var(--wob-sm)] border-2 border-solid transition-all ${
                  state.pose.mouth === mouthState
                    ? "bg-[color:var(--mwp-red)] text-[color:var(--mwp-paper)] border-[color:var(--mwp-red)]"
                    : "bg-transparent border-[color:var(--mwp-nline)] text-[color:var(--mwp-cream-dim)] hover:border-[color:var(--mwp-ink)]"
                }`}
              >
                {t(`builder.pose.mouth.${mouthState}`)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
