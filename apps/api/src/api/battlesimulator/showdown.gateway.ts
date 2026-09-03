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
import { BattleTicketService } from './battle-ticket.service';

interface ShowdownClientEntry {
  socket: Socket;
  showdownWs: WebSocket | null;
  reconnectAttempts: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  intentionallyClosed: boolean;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY_MS = 1000;

@WebSocketGateway({
  namespace: '/showdown',
  // Not `cors: true`: socket.io handles CORS itself, so the wildcard bypassed
  // the allowlist in main.ts and left the relay open to any origin.
  cors: { origin: allowedOrigins(env.NODE_ENV === 'production'), credentials: false },
})
export class ShowdownGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly logger: Logger,
    private readonly tickets: BattleTicketService,
  ) {}

  afterInit(server: Server): void {
    // D5/§5.1.5: the relay now requires a Boffmedia session. It opens a real
    // upstream socket to Pokémon Showdown per client and forwards credentials
    // through it, so leaving it unauthenticated made this API an open proxy
    // that anyone could point at PS from any origin.
    server.use((socket: Socket, next: (err?: Error) => void) => {
      const ticket = (socket.handshake.auth as { ticket?: unknown } | undefined)?.ticket;
      if (typeof ticket !== 'string' || !ticket) {
        next(new Error('unauthorized'));
        return;
      }
      try {
        this.tickets.verify(ticket);
        next();
      } catch {
        next(new Error('unauthorized'));
      }
    });
  }

  @WebSocketServer() server: Server;

  private clients: Map<string, ShowdownClientEntry> = new Map();
  private showdownServer = env.SHOWDOWN_SERVER_URL;

  handleConnection(client: Socket) {
    const clientId = crypto.randomUUID();
    this.logger.log(`Client connected: ${clientId}`);
    this.clients.set(clientId, {
      socket: client,
      showdownWs: null,
      reconnectAttempts: 0,
      reconnectTimer: null,
      intentionallyClosed: false,
    });
    client.emit('connected', { clientId });
  }

  @SubscribeMessage('connectToShowdown')
  handleConnectToShowdown(client: Socket): void {
    const clientId = this.getClientId(client);
    if (!clientId) {
      this.logger.warn('connectToShowdown: no clientId found');
      return;
    }

    const entry = this.clients.get(clientId);
    if (!entry) {
      this.logger.warn(`connectToShowdown: no entry for client ${clientId}`);
      return;
    }
    if (entry.showdownWs) {
      this.logger.warn(
        `connectToShowdown: already connected for client ${clientId}`,
      );
      return;
    }

    this.logger.log(
      `connectToShowdown: opening PS connection for client ${clientId}`,
    );
    this.openShowdownConnection(clientId, entry);
  }

  handleDisconnect(client: Socket) {
    const clientId = this.getClientId(client);
    if (clientId) {
      this.logger.log(`Client disconnected: ${clientId}`);
      const entry = this.clients.get(clientId);
      if (entry) {
        entry.intentionallyClosed = true;
        if (entry.reconnectTimer) {
          clearTimeout(entry.reconnectTimer);
        }
        if (entry.showdownWs) {
          entry.showdownWs.terminate();
        }
      }
      this.clients.delete(clientId);
    }
  }

  @SubscribeMessage('sendToShowdown')
  handleMessage(client: Socket, payload: string): void {
    const clientId = this.getClientId(client);
    if (!clientId) {
      this.logger.warn('sendToShowdown: no clientId found');
      return;
    }
    const entry = this.clients.get(clientId);
    if (!entry) {
      this.logger.warn(`sendToShowdown: no entry for client ${clientId}`);
      return;
    }
    if (!entry.showdownWs) {
      this.logger.warn(`sendToShowdown: no showdownWs for client ${clientId}`);
      return;
    }
    if (entry.showdownWs.readyState !== WebSocket.OPEN) {
      this.logger.warn(
        `sendToShowdown: showdownWs not open (state=${entry.showdownWs.readyState}) for client ${clientId}`,
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
    const username = typeof payload?.username === 'string' ? payload.username.trim() : '';
    const password = typeof payload?.password === 'string' ? payload.password : '';
    const challstr = typeof payload?.challstr === 'string' ? payload.challstr : '';

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
      this.logger.log(`PS login attempt (${password ? 'registered' : 'guest'})`);
      const response = await axios({
        url: action.url,
        method: action.method,
        headers: action.headers,
        data: action.data,
        responseType: action.responseType,
      });

      const cmd = action.onResponse(response.data);
      if (cmd) {
        const clientId = this.getClientId(client);
        if (clientId) {
          const entry = this.clients.get(clientId);
          if (entry?.showdownWs?.readyState === WebSocket.OPEN) {
            entry.showdownWs.send(cmd);
            client.emit('loginSuccess', cmd);
            this.logger.log('PS login success');
          } else {
            client.emit('loginError', 'Not connected to Showdown server');
          }
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
      entry.socket.emit('showdownConnected');
    });

    showdownWs.on('message', (data) => {
      const msg = data.toString();
      // Deliberately NOT logged. Every frame from PS was written at info level,
      // which includes the player's private messages and their battle chat.
      entry.socket.emit('showdownMessage', msg);
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
      entry.socket.emit('showdownDisconnected', {
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
      entry.socket.emit('showdownReconnectFailed');
      return;
    }

    const delay =
      BASE_RECONNECT_DELAY_MS * Math.pow(2, entry.reconnectAttempts);
    entry.reconnectAttempts++;

    this.logger.log(
      `Scheduling reconnect for client ${clientId} in ${delay}ms (attempt ${entry.reconnectAttempts})`,
    );

    entry.socket.emit('showdownReconnecting', {
      attempt: entry.reconnectAttempts,
      maxAttempts: MAX_RECONNECT_ATTEMPTS,
      delayMs: delay,
    });

    entry.reconnectTimer = setTimeout(() => {
      entry.reconnectTimer = null;
      if (!entry.intentionallyClosed && entry.socket.connected) {
        this.openShowdownConnection(clientId, entry);
      }
    }, delay);
  }

  private getClientId(client: Socket): string | undefined {
    for (const [id, data] of this.clients.entries()) {
      if (data.socket === client) {
        return id;
      }
    }
    return undefined;
  }
}
