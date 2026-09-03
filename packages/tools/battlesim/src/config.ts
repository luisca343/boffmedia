/**
 * Host opt-ins (D5).
 *
 * The Showdown proxy screen ships in this package but is only reachable on the
 * website: it relays a player's Pokémon Showdown session through the Boffmedia
 * API, which is a web-only arrangement. The launcher must not offer it at all —
 * not merely hide the button, since a nav seam can be driven straight to a
 * screen by a restored hash.
 *
 * A module-level flag rather than a prop threaded through every screen: the
 * host declares this once, when it registers the tool, and nothing below that
 * point has a reason to disagree with it. Defaults to OFF so a host that never
 * declares anything gets the safe half.
 */

let showdownProxy = false;

export function setShowdownProxyEnabled(enabled: boolean): void {
  showdownProxy = enabled;
}

export function isShowdownProxyEnabled(): boolean {
  return showdownProxy;
}
