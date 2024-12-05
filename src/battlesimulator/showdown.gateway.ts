import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { Actions } from '@pkmn/login';

@WebSocketGateway(34305, { cors: true })
export class ShowdownGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private clients: Map<string, { socket: Socket; showdownWs: WebSocket }> = new Map();
  private showdownServer = 'wss://sim3.psim.us/showdown/websocket';

  handleConnection(client: Socket) {
    const clientId = uuidv4();
    console.log(`Client connected: ${clientId}`);

    const showdownWs = new WebSocket(this.showdownServer);

    showdownWs.on('open', () => {
      console.log(`Connected to Showdown server for client: ${clientId}`);
    });

    showdownWs.on('message', (data) => {
      client.emit('showdownMessage', data.toString());
    });

    showdownWs.on('close', () => {
      console.log(`Disconnected from Showdown server for client: ${clientId}`);
      client.disconnect();
    });

    this.clients.set(clientId, { socket: client, showdownWs });

    client.emit('connection', { clientId });
  }

  handleDisconnect(client: Socket) {
    const clientId = this.getClientId(client);
    if (clientId) {
      console.log(`Client disconnected: ${clientId}`);
      const clientData = this.clients.get(clientId);
      if (clientData) {
        clientData.showdownWs.close();
        this.clients.delete(clientId);
      }
    }
  }

  @SubscribeMessage('sendToShowdown')
  handleMessage(client: Socket, payload: string): void {
    const clientId = this.getClientId(client);
    if (clientId) {
      const clientData = this.clients.get(clientId);
      if (clientData) {
        clientData.showdownWs.send(payload);
      }
    }
  }

  @SubscribeMessage('login')
  async handleLogin(client: Socket, payload: { username: string; password: string; challstr: string }): Promise<void> {
    const { username, password, challstr } = payload;
    try {
      const action = Actions.login({ username, password, challstr });
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
          const clientData = this.clients.get(clientId);
          if (clientData) {
            client.emit('loginSuccess', cmd);
          }
        }
      } else {
        client.emit('loginError', 'Login failed: No command returned');
      }
    } catch (error) {
      console.error('Login error:', error);
      client.emit('loginError', 'An error occurred during login');
    }
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

