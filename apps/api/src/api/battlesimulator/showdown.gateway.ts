import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import WebSocket from 'ws';
import axios from 'axios';
import { Actions } from '@pkmn/login';
import { Logger } from 'nestjs-pino';
import { env } from '@/config/env';
import { allowedOrigins } from '@/config/cors-origins';
import {
  BattleTicketService,
  type BattlePrincipal,
} from './battle-ticket.service';

/**
 * Relay between a Boffmedia client and Pokémon Showdown's own websocket.
 *
 * THE UPSTREAM OUTLIVES THE BROWSER SOCKET. A socket.io reconnect — a tunnel
 * blip, a laptop lid — used to tear the PS connection down and let the client
 * open a second, anonymous one: the player was logged in on a socket nobody was
 * listening to any more, and the new one had no identity, so every battle they
 * were in became unreachable. Now an entry is keyed by ACCOUNT, survives a
 * disconnect for `DETACH_GRACE_MS`, and a reconnecting socket is re-attached to
 * the upstream that is already logged in. What arrives while nobody is attached
 * is buffered and flushed on re-attach.
 */

interface ShowdownClientEntry {
  clientId: string;
  /** The browser socket currently attached, or null while it is away. */
  socket: Socket | null;
  showdownWs: WebSocket | null;
  reconnectAttempts: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  /** Terminates the upstream if the browser never comes back. */
  detachTimer: ReturnType<typeof setTimeout> | null;
  intentionallyClosed: boolean;
  /**
   * The last `|challstr|` PS sent. A re-attached client has lost its own copy,
   * and PS only sends one per upstream connection — without this the player
   * could never log in again without dropping a perfectly good session.
   */
  lastChallstr: string | null;
  /** Frames that arrived while detached, oldest first. */
  buffer: string[];
}

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY_MS = 1000;
/** How long a logged-in upstream waits for its browser socket to come back. */
const DETACH_GRACE_MS = 60_000;
/** Frames kept while detached. Enough for a reconnect, not enough to hoard. */
const MAX_BUFFERED_FRAMES = 200;

declare module 'socket.io' {
  interface Socket {
    /** Set by the middleware from a signed ticket. Never from a payload. */
    showdownUser?: BattlePrincipal;
  }
}

@WebSocketGateway({
  namespace: '/showdown',
  // Not `cors: true`: socket.io handles CORS itself, so the wildcard bypassed
  // the allowlist in main.ts and left the relay open to any origin.
  cors: {
    origin: allowedOrigins(env.NODE_ENV === 'production'),
    credentials: false,
  },
})
export class ShowdownGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly logger: Logger,
    private readonly tickets: BattleTicketService,
  ) {}

  afterInit(server: Server): void {
    // D5/§5.1.5: the relay requires a Boffmedia session. It opens a real
    // upstream socket to Pokémon Showdown per client and forwards credentials
    // through it, so leaving it unauthenticated made this API an open proxy
    // that anyone could point at PS from any origin.
    server.use((socket: Socket, next: (err?: Error) => void) => {
      const ticket = (socket.handshake.auth as { ticket?: unknown } | undefined)
        ?.ticket;
      if (typeof ticket !== 'string' || !ticket) {
        next(new Error('unauthorized'));
        return;
      }
      try {
        // Kept, not discarded: it is the key an upstream is re-found by.
        socket.showdownUser = this.tickets.verify(ticket);
        next();
      } catch {
        next(new Error('unauthorized'));
      }
    });
  }

  @WebSocketServer() server: Server;

  /** clientId -> entry. */
  private clients: Map<string, ShowdownClientEntry> = new Map();
  /** account id -> clientId, so a reconnect finds its own upstream. */
  private byUser: Map<number, string> = new Map();
  private showdownServer = env.SHOWDOWN_SERVER_URL;

  handleConnection(client: Socket) {
    const user = client.showdownUser;
    const existingId = user ? this.byUser.get(user.userId) : undefined;
    const existing = existingId ? this.clients.get(existingId) : undefined;

    // A reconnect onto a live upstream: re-attach instead of opening a second,
    // anonymous connection to PS.
    if (existing && existing.showdownWs?.readyState === WebSocket.OPEN) {
      if (existing.detachTimer) {
        clearTimeout(existing.detachTimer);
        existing.detachTimer = null;
      }
      existing.socket = client;
      existing.intentionallyClosed = false;
      client.data.clientId = existing.clientId;

      this.logger.log(`Client reattached: ${existing.clientId}`);
      client.emit('connected', { clientId: existing.clientId, resumed: true });
      client.emit('showdownConnected');
      // The client lost its session state, so it needs the challstr to log in
      // again over the SAME upstream. PS accepts a second `/trn`.
      if (existing.lastChallstr)
        client.emit('showdownMessage', existing.lastChallstr);
      const buffered = existing.buffer.splice(0, existing.buffer.length);
      for (const frame of buffered) client.emit('showdownMessage', frame);
      return;
    }

    // The upstream is gone (or there never was one). Drop the husk and hand out
    // a fresh identity; `connectToShowdown` will open a new upstream, and PS
    // sends a fresh `|challstr|` on it for the client to re-login with.
    if (existing) this.dispose(existing);

    const clientId = crypto.randomUUID();
    this.logger.log(`Client connected: ${clientId}`);
    const entry: ShowdownClientEntry = {
      clientId,
      socket: client,
      showdownWs: null,
      reconnectAttempts: 0,
      reconnectTimer: null,
      detachTimer: null,
      intentionallyClosed: false,
      lastChallstr: null,
      buffer: [],
    };
    this.clients.set(clientId, entry);
    if (user) this.byUser.set(user.userId, clientId);
    client.data.clientId = clientId;
    client.emit('connected', { clientId });
  }

  @SubscribeMessage('connectToShowdown')
  handleConnectToShowdown(client: Socket): void {
    const entry = this.entryFor(client);
    if (!entry) {
      this.logger.warn('connectToShowdown: no entry for socket');
      return;
    }
    if (entry.showdownWs) {
      this.logger.warn(
        `connectToShowdown: already connected for client ${entry.clientId}`,
      );
      return;
    }

    this.logger.log(
      `connectToShowdown: opening PS connection for client ${entry.clientId}`,
    );
    this.openShowdownConnection(entry.clientId, entry);
  }

  handleDisconnect(client: Socket) {
    const entry = this.entryFor(client);
    // A socket that was already replaced by a reconnect must not take the
    // upstream down when its own close event finally lands.
    if (!entry || entry.socket !== client) return;

    this.logger.log(`Client detached: ${entry.clientId}`);
    entry.socket = null;

    if (entry.showdownWs?.readyState === WebSocket.OPEN) {
      // Hold the PS session open for a reconnect.
      entry.detachTimer = setTimeout(() => {
        entry.detachTimer = null;
        if (entry.socket) return;
        this.logger.log(`Client did not return: ${entry.clientId}`);
        this.dispose(entry);
      }, DETACH_GRACE_MS);
      entry.detachTimer.unref?.();
      return;
    }

    this.dispose(entry);
  }

  @SubscribeMessage('sendToShowdown')
  handleMessage(client: Socket, payload: string): void {
    const entry = this.entryFor(client);
    if (!entry) {
      this.logger.warn('sendToShowdown: no entry for socket');
      return;
    }
    if (!entry.showdownWs) {
      this.logger.warn(
        `sendToShowdown: no showdownWs for client ${entry.clientId}`,
      );
      return;
    }
    if (entry.showdownWs.readyState !== WebSocket.OPEN) {
      this.logger.warn(
        `sendToShowdown: showdownWs not open (state=${entry.showdownWs.readyState}) for client ${entry.clientId}`,
      );
      return;
    }
    entry.showdownWs.send(payload);
  }

  /**
   * Log the player's OWN Pokémon Showdown identity in, registered or not.
   *
   * `password` is optional, and that is the whole of the guest support:
   * `Actions.login` posts to `/api/login` when it has one and to
   * `/api/getassertion` when it does not, which is exactly how the official
   * client claims an unregistered name. Both come back through `onResponse` as
   * the same `|/trn NAME,0,ASSERTION` command, so nothing downstream changes.
   *
   * The credential is relayed and never kept: it is read off this payload,
   * posted to PS, and dropped. It is not stored, not echoed back to the client
   * and — see below — not logged, not even the username.
   */
  @SubscribeMessage('login')
  async handleLogin(
    client: Socket,
    payload: { username?: string; password?: string; challstr?: string },
  ): Promise<void> {
    const username =
      typeof payload?.username === 'string' ? payload.username.trim() : '';
    const password =
      typeof payload?.password === 'string' ? payload.password : '';
    const challstr =
      typeof payload?.challstr === 'string' ? payload.challstr : '';

    // Validated here rather than trusted: this payload crosses the wire, and
    // `username` goes into a form-encoded POST to PS. 18 is Showdown's own
    // limit; a longer one is rejected there anyway, with a worse message.
    if (!username || username.length > 18) {
      client.emit('loginError', 'invalid_username');
      return;
    }
    if (!challstr) {
      client.emit('loginError', 'no_challstr');
      return;
    }

    try {
      const action = Actions.login({
        username,
        // Omitted, not empty: `Actions.login` branches on the property being
        // present, and this is what selects the unregistered-name path.
        ...(password ? { password } : {}),
        challstr,
      });
      // Username, the PS response body and the /trn assertion were all logged
      // at info level here. The assertion is a bearer credential for that PS
      // account; the username identifies the player. Only the outcome is logged.
      this.logger.log(
        `PS login attempt (${password ? 'registered' : 'guest'})`,
      );
      const response = await axios({
        url: action.url,
        method: action.method,
        headers: action.headers,
        data: action.data,
        responseType: action.responseType,
      });

      const cmd = action.onResponse(response.data);
      if (cmd) {
        const entry = this.entryFor(client);
        if (entry?.showdownWs?.readyState === WebSocket.OPEN) {
          entry.showdownWs.send(cmd);
          client.emit('loginSuccess', cmd);
          this.logger.log('PS login success');
        } else {
          client.emit('loginError', 'Not connected to Showdown server');
        }
      } else {
        client.emit('loginError', 'Login failed: No command returned');
      }
    } catch (error: any) {
      this.logger.error('PS login failed');
      client.emit(
        'loginError',
        error.message || 'An error occurred during login',
      );
    }
  }

  private openShowdownConnection(
    clientId: string,
    entry: ShowdownClientEntry,
  ): void {
    const showdownWs = new WebSocket(this.showdownServer);

    showdownWs.on('open', () => {
      this.logger.log(`Connected to Showdown server for client: ${clientId}`);
      entry.reconnectAttempts = 0;
      this.toClient(entry, 'showdownConnected');
    });

    showdownWs.on('message', (data) => {
      const msg = data.toString();
      // Deliberately NOT logged. Every frame from PS was written at info level,
      // which includes the player's private messages and their battle chat.
      if (msg.startsWith('|challstr|')) entry.lastChallstr = msg;
      if (entry.socket) {
        entry.socket.emit('showdownMessage', msg);
      } else {
        entry.buffer.push(msg);
        if (entry.buffer.length > MAX_BUFFERED_FRAMES) entry.buffer.shift();
      }
    });

    showdownWs.on('error', (err) => {
      this.logger.error(
        `Showdown WebSocket error for client ${clientId}:`,
        err.message,
      );
    });

    showdownWs.on('close', (code, reason) => {
      this.logger.log(
        `Showdown WS closed for client ${clientId}: code=${code} reason=${reason}`,
      );
      entry.showdownWs = null;
      entry.lastChallstr = null;
      this.toClient(entry, 'showdownDisconnected', {
        code,
        reason: reason?.toString(),
      });

      if (!entry.intentionallyClosed) {
        this.scheduleReconnect(clientId, entry);
      }
    });

    entry.showdownWs = showdownWs;
  }

  private scheduleReconnect(
    clientId: string,
    entry: ShowdownClientEntry,
  ): void {
    if (entry.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.logger.error(
        `Max reconnect attempts reached for client ${clientId}`,
      );
      this.toClient(entry, 'showdownReconnectFailed');
      return;
    }

    const delay =
      BASE_RECONNECT_DELAY_MS * Math.pow(2, entry.reconnectAttempts);
    entry.reconnectAttempts++;

    this.logger.log(
      `Scheduling reconnect for client ${clientId} in ${delay}ms (attempt ${entry.reconnectAttempts})`,
    );

    this.toClient(entry, 'showdownReconnecting', {
      attempt: entry.reconnectAttempts,
      maxAttempts: MAX_RECONNECT_ATTEMPTS,
      delayMs: delay,
    });

    entry.reconnectTimer = setTimeout(() => {
      entry.reconnectTimer = null;
      if (!entry.intentionallyClosed && entry.socket?.connected) {
        this.openShowdownConnection(clientId, entry);
      }
    }, delay);
    entry.reconnectTimer.unref?.();
  }

  /** O(1) — the id lives on the socket, not at the end of a scan over every client. */
  private entryFor(client: Socket): ShowdownClientEntry | undefined {
    const clientId = client.data?.clientId;
    if (typeof clientId !== 'string') return undefined;
    return this.clients.get(clientId);
  }

  private toClient(
    entry: ShowdownClientEntry,
    event: string,
    payload?: unknown,
  ): void {
    if (!entry.socket) return;
    if (payload === undefined) entry.socket.emit(event);
    else entry.socket.emit(event, payload);
  }

  /** Closes the upstream and forgets the entry, for good. */
  private dispose(entry: ShowdownClientEntry): void {
    entry.intentionallyClosed = true;
    if (entry.reconnectTimer) {
      clearTimeout(entry.reconnectTimer);
      entry.reconnectTimer = null;
    }
    if (entry.detachTimer) {
      clearTimeout(entry.detachTimer);
      entry.detachTimer = null;
    }
    if (entry.showdownWs) {
      entry.showdownWs.terminate();
      entry.showdownWs = null;
    }
    entry.buffer.length = 0;
    this.clients.delete(entry.clientId);
    for (const [userId, id] of this.byUser) {
      if (id === entry.clientId) this.byUser.delete(userId);
    }
  }
}
