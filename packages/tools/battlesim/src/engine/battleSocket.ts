import { io, type Socket } from "socket.io-client";
import { getToolHost, toolApi } from "@boffmedia/tool-kit";

/**
 * Connecting to a battle namespace, with proof of who is connecting.
 *
 * WHAT THIS REPLACES. The old module kept one socket per channel on
 * `window.__battlesim_socket` / `__pvp_socket` / `__showdown_socket`, plus three
 * more globals recording whether listeners had been attached. That had four
 * problems and this fixes all of them: a socket outlived the component that
 * made it (so a second mount silently reused a dead one), listeners were
 * attached exactly once per page load and never removed, nothing was ever
 * cleaned up on unmount, and the server had no idea who was on the other end.
 *
 * IDENTITY IS A TICKET. The server's `/battle` and `/showdown` namespaces now
 * refuse a socket that cannot present one. A ticket is minted over the ordinary
 * authenticated HTTP path and lasts 60 seconds — which is exactly why the
 * desktop app can use it: the launcher's session lives in the OS keyring and is
 * attached by the Rust proxy to HTTP requests, and the renderer never sees it.
 * No new Rust command, no token in JavaScript.
 *
 * Tickets are short, so a reconnect needs a NEW one. `reconnect_attempt` is the
 * hook for that: socket.io re-sends `auth` on every attempt, so refreshing it
 * there is what makes a reconnect after a long sleep work at all.
 */

export type SocketNamespace = "/battle" | "/showdown";

interface TicketResponse {
  data?: { ticket?: string; expiresIn?: number };
  ticket?: string;
}

/**
 * How long a ticket request may take before we call it a failed connection.
 *
 * `toolApi().request` has no deadline of its own, so a request that never
 * settles — a captive portal, a dead tunnel, a proxy holding the socket open —
 * left `openBattleSocket` permanently pending and every screen that awaited it
 * sitting on "connecting" with nothing to retry. A hang is a failure; it just
 * takes a clock to say so.
 */
const TICKET_TIMEOUT_MS = 10_000;

/** Asks the API for a socket ticket. Requires a session on either host. */
export async function fetchBattleTicket(): Promise<string> {
  // Constructed by hand rather than with `AbortSignal.timeout`, which the
  // package cannot assume: this runs in a browser, in the launcher's webview
  // and under jsdom in the tests.
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TICKET_TIMEOUT_MS);
  let response: TicketResponse | undefined;
  try {
    response = await toolApi().request<TicketResponse>("/battlesimulator/ws-ticket", {
      method: "POST",
      auth: "required",
      signal: abort.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  // The controller is enveloped ({success, statusCode, data}); `toolApi` hands
  // back the raw body, so the ticket is one level in. The bare form is accepted
  // too so this does not break if the route is ever marked @SkipEnvelope.
  const ticket = response?.data?.ticket ?? response?.ticket;
  if (!ticket) throw new Error("No battle ticket in response");
  return ticket;
}

/**
 * Opens an authenticated socket. The CALLER owns it and must `.close()` it —
 * there is no shared instance to fall back on any more.
 */
export async function openBattleSocket(namespace: SocketNamespace): Promise<Socket> {
  const ticket = await fetchBattleTicket();
  // `apiUrl(path)` joins with a slash, so `apiUrl("")` hands back the base with
  // a TRAILING one — and socket.io reads the pathname of the url it is given as
  // the NAMESPACE. `https://api…es/` + `/battle` is `//battle`, which is not a
  // namespace the server registered, so every connection was refused with
  // "Invalid namespace" on both `/battle` and `/showdown`. Strip it.
  const origin = getToolHost().apiUrl("").replace(/\/+$/, "");

  // Spent by the `auth` callback on the FIRST attempt; every attempt after it
  // mints its own. A ticket lasts 60 seconds and a reconnect can easily outlive
  // one, so reusing this would refuse every retry for the same stale reason.
  let firstTicket: string | null = ticket;

  const socket = io(`${origin}${namespace}`, {
    // The FUNCTION form, and that is the whole point: socket.io calls it and
    // waits for the callback before each connection attempt, reconnects
    // included. The previous code refreshed the ticket from `reconnect_attempt`
    // with a floating promise — which fires alongside the attempt, not before
    // it, so every retry went out carrying the ticket that had just been
    // refused and the fresh one only landed in time for the attempt after.
    auth: (cb: (data: object) => void) => {
      if (firstTicket) {
        const spend = firstTicket;
        firstTicket = null;
        cb({ ticket: spend });
        return;
      }
      void fetchBattleTicket()
        .then((fresh) => cb({ ticket: fresh }))
        // Offline, or the session is gone. An EMPTY ticket rather than no
        // callback at all: not calling back leaves the attempt pending
        // forever, which is the hang this whole file is trying not to have.
        // The server refuses it immediately and socket.io schedules the next
        // attempt, by which time the network may be back.
        .catch(() => cb({ ticket: "" }));
    },
    // websocket first, polling as the fallback: a corporate proxy or a
    // reverse proxy that does not forward `Upgrade` will refuse the former,
    // and silently degrading beats a battle that never starts.
    //
    // `tryAllTransports` is what makes that sentence TRUE. Engine.IO defaults
    // it to false, so listing two transports websocket-first bought no
    // fallback at all: a refused upgrade failed the connection outright and
    // the reconnection loop then retried websocket, forever, on a network
    // where it could never work — the client's half of "hung on connecting".
    transports: ["websocket", "polling"],
    tryAllTransports: true,
    reconnection: true,
  });

  return socket;
}

/** Resolves when the socket is connected, or rejects on timeout. */
export function waitForConnect(socket: Socket, timeoutMs = 8000): Promise<void> {
  if (socket.connected) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Socket connect timeout"));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      socket.off("connect", onConnect);
      socket.off("connect_error", onError);
    }
    function onConnect() {
      cleanup();
      resolve();
    }
    function onError(error: Error) {
      cleanup();
      reject(error);
    }

    socket.on("connect", onConnect);
    socket.on("connect_error", onError);
  });
}

/**
 * Attaches listeners and hands back the detach function.
 *
 * The predecessor (`registerListenersOnce`) attached once per page load, keyed
 * on a global flag, and had no way to detach — so a remounted screen either got
 * no listeners at all or leaked the previous mount's. Returning the cleanup
 * makes this usable from a `useEffect` the way it always should have been.
 */
export function attachListeners(
  socket: Socket,
  // socket.io hands a handler whatever the server emitted, so the parameter
  // list genuinely is unknown here; the events themselves are typed at the
  // call sites that know which payload they asked for.
  listeners: Array<[event: string, handler: (...args: any[]) => void]>,
): () => void {
  for (const [event, handler] of listeners) socket.on(event, handler);
  return () => {
    for (const [event, handler] of listeners) socket.off(event, handler);
  };
}
