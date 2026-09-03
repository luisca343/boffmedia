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

/** Asks the API for a socket ticket. Requires a session on either host. */
export async function fetchBattleTicket(): Promise<string> {
  const response = await toolApi().request<TicketResponse>("/battlesimulator/ws-ticket", {
    method: "POST",
    auth: "required",
  });
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
  const origin = getToolHost().apiUrl("");

  const socket = io(`${origin}${namespace}`, {
    auth: { ticket },
    // websocket first, polling as the fallback: a corporate proxy or a
    // reverse proxy that does not forward `Upgrade` will refuse the former,
    // and silently degrading beats a battle that never starts.
    transports: ["websocket", "polling"],
    // Reconnection is on, but the ticket has to be refreshed for each attempt
    // or every one of them is refused for the same reason.
    reconnection: true,
  });

  socket.io.on("reconnect_attempt", () => {
    void fetchBattleTicket()
      .then((fresh) => {
        socket.auth = { ticket: fresh };
      })
      .catch(() => {
        // Offline, or the session is gone. The attempt still fires and is
        // refused; the UI reports a disconnected socket, which is honest.
      });
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
