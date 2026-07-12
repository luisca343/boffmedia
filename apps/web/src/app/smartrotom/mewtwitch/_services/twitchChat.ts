export interface ChatMsg {
  id: string
  user: string
  color?: string
  msg: string
  mod?: boolean
  verified?: boolean
  system?: boolean
  you?: boolean
}

export type ChatStatus = "connecting" | "open" | "closed"

interface ParsedLine {
  tags: Record<string, string>
  command: string
  nick?: string
  text?: string
}

// Deterministic fallback colour when a chatter has no colour tag (Twitch does
// the same). HSL keeps it readable on the dark canvas.
function fallbackColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return `hsl(${h} 70% 68%)`
}

function parseLine(line: string): ParsedLine | null {
  let rest = line
  const tags: Record<string, string> = {}
  if (rest[0] === "@") {
    const sp = rest.indexOf(" ")
    for (const kv of rest.slice(1, sp).split(";")) {
      const eq = kv.indexOf("=")
      tags[kv.slice(0, eq)] = kv.slice(eq + 1)
    }
    rest = rest.slice(sp + 1)
  }
  let nick: string | undefined
  if (rest[0] === ":") {
    const sp = rest.indexOf(" ")
    nick = rest.slice(1, sp).split("!")[0]
    rest = rest.slice(sp + 1)
  }
  const sp = rest.indexOf(" ")
  const command = sp === -1 ? rest : rest.slice(0, sp)
  const params = sp === -1 ? "" : rest.slice(sp + 1)
  const colon = params.indexOf(" :")
  const text = colon === -1 ? undefined : params.slice(colon + 2)
  return { tags, command, nick, text }
}

let seq = 0

/**
 * Pure parse of a single IRC line into a ChatMsg (PRIVMSG / USERNOTICE), or
 * null for anything else (PING/JOIN/CAP…). Exported for unit testing.
 */
export function parseChatMessage(line: string): ChatMsg | null {
  const p = parseLine(line)
  if (!p) return null
  if (p.command === "PRIVMSG") {
    const user = p.tags["display-name"] || p.nick || "anónimo"
    const badges = p.tags["badges"] ?? ""
    return {
      id: p.tags["id"] || `m${seq++}`,
      user,
      color: p.tags["color"] || fallbackColor(user),
      msg: p.text ?? "",
      mod: /moderator|broadcaster/.test(badges),
      verified: /partner/.test(badges),
    }
  }
  if (p.command === "USERNOTICE") {
    const sys = p.tags["system-msg"]
    if (sys) return { id: p.tags["id"] || `s${seq++}`, user: "", msg: sys.replace(/\\s/g, " "), system: true }
  }
  return null
}

/**
 * Connect to Twitch chat anonymously (justinfan login — read only, no auth) and
 * stream parsed messages. Sending needs a `chat:edit` OAuth token, so the
 * composer stays gated (§13). Returns a disconnect function.
 */
export function connectTwitchChat(
  channel: string,
  onMessage: (m: ChatMsg) => void,
  onStatus?: (s: ChatStatus) => void,
): () => void {
  if (typeof window === "undefined") return () => {}
  let ws: WebSocket
  try {
    ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443")
  } catch {
    onStatus?.("closed")
    return () => {}
  }
  onStatus?.("connecting")

  ws.onopen = () => {
    ws.send("CAP REQ :twitch.tv/tags twitch.tv/commands")
    ws.send("PASS SCHMOOPIIE")
    ws.send(`NICK justinfan${Math.floor(Math.random() * 99999)}`)
    ws.send(`JOIN #${channel.toLowerCase()}`)
    onStatus?.("open")
  }

  ws.onmessage = (ev) => {
    for (const raw of String(ev.data).split("\r\n")) {
      if (!raw) continue
      if (raw.startsWith("PING")) {
        ws.send("PONG :tmi.twitch.tv")
        continue
      }
      const msg = parseChatMessage(raw)
      if (msg) onMessage(msg)
    }
  }

  ws.onclose = () => onStatus?.("closed")
  ws.onerror = () => onStatus?.("closed")

  return () => {
    try {
      ws.close()
    } catch {
      /* already closing */
    }
  }
}
