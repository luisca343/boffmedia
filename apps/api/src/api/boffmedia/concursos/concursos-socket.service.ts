import {
  BadRequestException,
  HttpException,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { Server, IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import type { Subscription } from 'rxjs';
import { WebSocket, WebSocketServer } from 'ws';
import { ApiErrorCode, userError } from '@/common/errors/user-error';
import { ConcursosRoomsService } from './concursos-rooms.service';
import {
  ConcursosSocketRequestDto,
  ConcursosSocketResponseDto,
  ConcursosConfigurationDto,
  ConcursosGroupDto,
  StartConcursosGameDto,
  ConcursosActionDto,
  EmptyConcursosCommandDto,
} from './concursos.dto';

type Client = {
  socket: WebSocket;
  connection: symbol;
  code?: string;
  token?: string;
  signature?: string;
  lastPing: number;
  chain: Promise<void>;
  count: number;
  window: number;
};

/** Plain WebSocket on the existing API port; independent of account Socket.IO.
 * One authenticated view per recipient, never a shared broadcast of private data. */
@Injectable()
export class ConcursosSocketService implements OnModuleInit, OnModuleDestroy {
  private server?: Server;
  private readonly sockets = new WebSocketServer({
    noServer: true,
    maxPayload: 1024 * 1024,
    perMessageDeflate: false,
  });
  private readonly clients = new Set<Client>();
  private readonly validation = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  private timer?: ReturnType<typeof setInterval>;
  private subscription?: Subscription;
  constructor(
    private readonly adapter: HttpAdapterHost,
    private readonly rooms: ConcursosRoomsService,
  ) {}

  private readonly upgrade = (
    request: IncomingMessage,
    socket: Duplex,
    head: Buffer,
  ) => {
    if (request.url?.split('?')[0] !== '/concursos/socket') return;
    // A bounded unauthenticated handshake; capability auth follows in a text frame.
    if (this.clients.size >= 600) {
      socket.destroy();
      return;
    }
    this.sockets.handleUpgrade(request, socket, head, (ws) =>
      this.connected(ws),
    );
  };
  onModuleInit() {
    this.server = this.adapter.httpAdapter.getHttpServer() as Server;
    this.server.on('upgrade', this.upgrade);
    this.subscription = this.rooms.changed.subscribe((code) =>
      setImmediate(() => this.broadcast(code)),
    );
    // Server-only deadline/presence maintenance. No client state polling or HTTP.
    this.timer = setInterval(() => {
      const now = Date.now();
      for (const client of this.clients) {
        if (now - client.lastPing > (client.code ? 20000 : 5000)) {
          client.socket.terminate();
        } else if (client.code) this.snapshot(client);
      }
    }, 100);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    this.subscription?.unsubscribe();
    this.server?.off('upgrade', this.upgrade);
    for (const client of this.clients) client.socket.terminate();
    this.sockets.close();
  }
  private connected(socket: WebSocket) {
    const client: Client = {
      socket,
      connection: Symbol('concursos-connection'),
      lastPing: Date.now(),
      chain: Promise.resolve(),
      count: 0,
      window: Date.now(),
    };
    this.clients.add(client);
    socket.on('error', () => socket.terminate());
    socket.on('close', () => {
      this.clients.delete(client);
      if (client.code && client.token)
        this.rooms.socketClosed(client.code, client.token, client.connection);
    });
    socket.on('message', (raw, binary) => {
      if (Date.now() - client.window >= 1000) {
        client.count = 0;
        client.window = Date.now();
      }
      if (++client.count > 40) {
        socket.close(1008);
        return;
      }
      // Serialize async validation so commands cannot overtake auth or each other.
      client.chain = client.chain.then(async () => {
        let id: string | undefined;
        try {
          if (binary) throw new BadRequestException();
          const parsed: unknown = JSON.parse(raw.toString());
          if (
            parsed &&
            typeof parsed === 'object' &&
            'id' in parsed &&
            typeof parsed.id === 'string' &&
            parsed.id.length <= 64
          )
            id = parsed.id;
          const frame = (await this.validation.transform(parsed, {
            type: 'body',
            metatype: ConcursosSocketRequestDto,
          })) as ConcursosSocketRequestDto;
          if (frame.type === 'auth') {
            if (client.code || !frame.code || !frame.token)
              throw new UnauthorizedException();
            this.rooms.read(frame.code, frame.token);
            client.code = frame.code;
            client.token = frame.token;
            client.lastPing = Date.now();
            this.rooms.socketOpened(frame.code, frame.token, client.connection);
            this.send(client, {
              type: 'ready',
              data: this.rooms.read(frame.code, frame.token, false),
            });
            this.broadcast(frame.code);
          } else {
            if (!client.code || !client.token)
              throw new UnauthorizedException();
            if (frame.type === 'ping') {
              this.rooms.read(client.code, client.token);
              client.lastPing = Date.now();
              this.send(client, { type: 'pong' });
            } else {
              if (!frame.id || !frame.operation)
                throw new BadRequestException();
              const data = await this.command(client, frame);
              this.send(client, { type: 'reply', id: frame.id, data });
              this.broadcast(client.code);
              if (frame.operation === 'leave') client.socket.close(1000);
            }
          }
        } catch (failure) {
          this.failure(client, failure, id);
          if (!client.code) client.socket.close(1008);
        }
      });
    });
  }
  private async command(client: Client, frame: ConcursosSocketRequestDto) {
    const code = client.code!;
    const token = client.token!;
    const dto = {
      configuration: ConcursosConfigurationDto,
      group: ConcursosGroupDto,
      start: StartConcursosGameDto,
      action: ConcursosActionDto,
      leave: EmptyConcursosCommandDto,
      close: EmptyConcursosCommandDto,
    }[frame.operation!];
    const body = await this.validation.transform(frame.body ?? {}, {
      type: 'body',
      metatype: dto,
    });
    switch (frame.operation) {
      case 'configuration':
        return this.rooms.configure(code, token, body);
      case 'group':
        return this.rooms.group(code, token, body.entityId);
      case 'start':
        return this.rooms.startGame(code, token, body);
      case 'action':
        return this.rooms.action(code, token, body);
      case 'leave':
        return this.rooms.leave(code, token);
      case 'close':
        return this.rooms.close(code, token);
      default:
        throw new BadRequestException();
    }
  }
  private send(client: Client, frame: ConcursosSocketResponseDto) {
    if (client.socket.readyState !== WebSocket.OPEN) return;
    if (client.socket.bufferedAmount > 2 * 1024 * 1024) {
      client.socket.terminate();
      return;
    }
    client.socket.send(JSON.stringify(frame));
  }
  private failure(client: Client, failure: unknown, id?: string) {
    const statusCode =
      failure instanceof HttpException ? failure.getStatus() : 400;
    const response =
      failure instanceof HttpException ? failure.getResponse() : {};
    const error =
      typeof response === 'object' && 'code' in response
        ? (response as { code: string; userMessage: string })
        : userError(
            statusCode === 401 || statusCode === 403
              ? ApiErrorCode.CONCURSOS_ACCESS
              : ApiErrorCode.CONCURSOS_GAME,
            'invalid socket message',
          );
    this.send(client, {
      type: 'error',
      id,
      statusCode,
      code: error.code,
      userMessage: error.userMessage,
    });
  }
  private snapshot(client: Client) {
    if (!client.code || !client.token) return;
    try {
      const data = this.rooms.read(client.code, client.token, false);
      const signature = JSON.stringify(data, (key, value: unknown) =>
        key === 'serverNow' ? undefined : value,
      );
      if (signature !== client.signature) {
        client.signature = signature;
        this.send(client, { type: 'snapshot', data });
      }
    } catch (failure) {
      this.failure(client, failure);
      client.socket.close(1008);
    }
  }
  private broadcast(code: string) {
    for (const client of this.clients)
      if (client.code === code) this.snapshot(client);
  }
}
