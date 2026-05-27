import React from "react"
import { NpcFace, NpcHead } from "@/components/smartrotom/MinecraftSkin"

export interface MinecraftHeadIconProps {
  skin?: string
  size?: number
}

export function MinecraftHeadIcon({ skin, size = 32 }: MinecraftHeadIconProps) {
  return <NpcFace npcName={skin ?? "steve"} width={size} height={size} />
}

export interface MinecraftSkinAvatarProps {
  skin?: string
  size?: number
  ring?: boolean
  ringColor?: string
  headOnly?: boolean
}

export function MinecraftSkinAvatar({
  skin,
  size = 56,
  ring = false,
  ringColor = "var(--gold-2)",
  headOnly = false,
}: MinecraftSkinAvatarProps) {
  const inner = headOnly ? (
    <NpcFace npcName={skin ?? "steve"} width={size} height={size} />
  ) : (
    <NpcHead
      npcName={skin ?? "steve"}
      width={size}
      height={size}
      style={{ display: "block", flexShrink: 0 }}
    />
  )

  if (ring) {
    return (
      <div
        style={{
          borderRadius: 3,
          background: "#1a1208",
          padding: 2,
          outline: `1.5px solid ${ringColor}`,
          display: "inline-block",
          flexShrink: 0,
        }}
      >
        {inner}
      </div>
    )
  }

  return inner
}
