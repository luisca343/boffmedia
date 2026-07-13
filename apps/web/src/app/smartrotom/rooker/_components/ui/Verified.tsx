import { Icon } from "./Icon"

/**
 * The staff check.
 *
 * [deferred] Nothing populates it yet: `rotom_users` has no role column, and the join
 * to `boffmedia_user_roles` (where ROTOM_ADMIN actually lives) is not wired, so the API
 * pins `isVerified` to `false` and this renders nothing at every call site. It is built
 * and specimened so that turning verification on is a server change alone.
 * Registered in docs/smartrotom/deferred/README.md.
 */
export function Verified({ size = 15 }: { size?: number }) {
  return (
    <span
      title="Entrenador verificado"
      className="relative inline-grid flex-none place-items-center text-rk-verified"
      style={{ width: size, height: size }}
    >
      <Icon name="verified" size={size} fill />
      {/* The tick is a second glyph laid over the seal, in the canvas colour — the
          seal is a solid fill, so a knocked-out tick has to be drawn, not cut. */}
      <Icon
        name="check"
        size={size * 0.5}
        stroke={3}
        className="absolute text-rk-bg"
      />
    </span>
  )
}
