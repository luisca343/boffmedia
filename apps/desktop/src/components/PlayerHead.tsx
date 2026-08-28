import { useCachedImage } from "./useCachedImage"

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
// The sheet is fetched through the icon cache (icons.rs) rather than handed to
// <img> directly. The CSP does allow textures.minecraft.net, so that is not the
// reason here — these two are:
//
//   * OFFLINE. The roster caches `skin_url` so the switcher can draw faces with
//     no live session, which is exactly the state where a remote <img> is a
//     blank square. Caching the bytes is what makes that cached URL mean
//     anything.
//   * A failure becomes VISIBLE. `useCachedImage` reports a refused sheet to
//     the Logs screen. Before, a face that would not load and an account with
//     no skin were the same monogram, with nothing to tell them apart.
//
// Staleness, which the cache never expires, is a non-issue for skins: a
// textures.minecraft.net URL is content-addressed, so changing skin changes the
// URL and therefore the cache key.

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
  // Re-keying a switcher row onto a different player is handled inside the
  // hook: it restarts on every url change, so the previous player's failure
  // never blanks the new one's face.
  const { src, failed, onError } = useCachedImage(skinUrl)

  if (!skinUrl || !src || failed)
    return <Monogram username={username} size={size} />

  return (
    <span
      className="relative block shrink-0 overflow-hidden"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <img
        src={src}
        alt=""
        onError={onError}
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
