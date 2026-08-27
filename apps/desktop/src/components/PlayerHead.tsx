import { useEffect, useState } from "react"

// The player's face, cropped out of the raw Minecraft skin sheet.
//
// `Account.skinUrl` is the WHOLE 64×64 PNG on textures.minecraft.net, not a
// head render — Mojang serves no head endpoint, and routing this through a
// third-party avatar service would tell that service which of our players is
// launching what. So the crop happens here: the front of the head lives at
// (8,8)-(16,16) in skin space, which is one eighth of the sheet's width, hence
// the ×8 scale and the one-avatar-width offset in both axes.
//
// `width: size*8, height: auto` rather than a fixed height on purpose: legacy
// 64×32 skins are still legal, and letting the height follow the aspect ratio
// puts the head in the same place on both layouts.
//
// The CSP (`img-src 'self' data: https:`) already allows textures.minecraft.net,
// so this needs none of the icon cache in icons.rs — that exists for catalog art
// on arbitrary hosts, which is a different problem.

/** A monogram, for a player with no skin and for a sheet that fails to load.
 *  Never a default Steve: a wrong face reads as the wrong ACCOUNT, which is
 *  precisely the thing an account switcher must not get wrong. */
function Monogram({ username, size }: { username: string; size: number }) {
  const letter = (username.trim()[0] ?? "?").toUpperCase()
  return (
    <span
      className="cut-seal grid shrink-0 place-items-center bg-panel-2 font-display font-bold text-txt"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.44) }}
      aria-hidden
    >
      {letter}
    </span>
  )
}

export function PlayerHead({
  skinUrl,
  username,
  size = 32,
}: {
  skinUrl: string
  username: string
  size?: number
}) {
  const [failed, setFailed] = useState(false)
  // A switcher row can be re-keyed onto a different player; without this the
  // previous player's load failure would blank the new one's face.
  useEffect(() => setFailed(false), [skinUrl])

  if (!skinUrl || failed) return <Monogram username={username} size={size} />

  return (
    <span
      className="relative block shrink-0 overflow-hidden"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <img
        src={skinUrl}
        alt=""
        onError={() => setFailed(true)}
        className="absolute max-w-none"
        style={{
          width: size * 8,
          height: "auto",
          left: -size,
          top: -size,
          imageRendering: "pixelated",
        }}
      />
    </span>
  )
}
