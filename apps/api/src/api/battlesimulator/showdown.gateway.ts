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

interface ShowdownClientEntry {
  socket: Socket;
  showdownWs: WebSocket | null;
  reconnectAttempts: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  intentionallyClosed: boolean;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY_MS = 1000;

@WebSocketGateway({ namespace: '/showdown', cors: true })
export class ShowdownGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly logger: Logger) {}

  @WebSocketServer() server: Server;

  private clients: Map<string, ShowdownClientEntry> = new Map();
  private showdownServer =
    process.env.SHOWDOWN_SERVER_URL || 'wss://sim3.psim.us/showdown/websocket';

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
    this.logger.log(
      `sendToShowdown: forwarding to PS for client ${clientId}: ${payload.substring(0, 80)}`,
    );
    entry.showdownWs.send(payload);
  }

  @SubscribeMessage('login')
  async handleLogin(
    client: Socket,
    payload: { username: string; password: string; challstr: string },
  ): Promise<void> {
    const { username, password, challstr } = payload;
    try {
      const action = Actions.login({
        username,
        password,
        challstr,
      });
      this.logger.log(`Login request to PS for ${username}: ${action.url}`);
      const response = await axios({
        url: action.url,
        method: action.method,
        headers: action.headers,
        data: action.data,
        responseType: action.responseType,
      });

      this.logger.log(`PS login response: ${response.data.substring(0, 120)}`);
      const cmd = action.onResponse(response.data);
      if (cmd) {
        this.logger.log(`Login assertion cmd: ${cmd.substring(0, 100)}`);
        const clientId = this.getClientId(client);
        if (clientId) {
          const entry = this.clients.get(clientId);
          if (entry?.showdownWs?.readyState === WebSocket.OPEN) {
            entry.showdownWs.send(cmd);
            client.emit('loginSuccess', cmd);
          } else {
            client.emit('loginError', 'Not connected to Showdown server');
          }
        }
      } else {
        client.emit('loginError', 'Login failed: No command returned');
      }
    } catch (error: any) {
      this.logger.error('Login error:', error.message);
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
      // Log ALL messages from PS for debugging
      this.logger.log(`PS→client ${clientId}: ${msg.substring(0, 200)}`);
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
