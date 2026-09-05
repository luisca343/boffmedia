import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayDisconnect,
  type OnGatewayConnection,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatappFacadeService } from '@api/smartrotom/chatapp/chatapp.facade.service';
import { PresenceService } from './presence.service';
import { identifySocket } from './socket-identity';
import { Logger } from 'nestjs-pino';
import { env } from '@/config/env';

@WebSocketGateway(env.SOCKET_PORT, {
  cors: {
    origin: '*',
  },
})
export class SocketsGateway
  implements OnGatewayDisconnect, OnGatewayConnection
{
  @WebSocketServer()
  server: Server;
  users: Map<string, { uuid: string; socketId: string }> = new Map();

  /** Every live socket a uuid currently holds, which is NOT the same question
   *  as `users` answers. `users` keeps ONE socket per uuid so a targeted emit
   *  has somewhere to go; presence has to outlive any single tab. Keying
   *  presence on `users` alone meant a player with two tabs went offline the
   *  moment they closed the newer one, while still connected in the other —
   *  invisible until S8 put that list on screen. */
  private socketsOf: Map<string, Set<string>> = new Map();

  constructor(
    private readonly logger: Logger,

    @Inject(forwardRef(() => ChatappFacadeService))
    private chatAppService: ChatappFacadeService,

    private readonly presence: PresenceService,

    private readonly jwt: JwtService,
  ) {}

  /** The uuid this socket PROVED at connection time. Every handler keys on this
   *  rather than on whatever the message body claims. */
  private uuidOf(client: Socket): string | null {
    return client.identity?.mcUuid ?? null;
  }

  private broadcastPresence(uuid: string): void {
    this.server.emit('presence:update', {
      uuid,
      status: this.presence.get(uuid),
    });
  }

  private sendPresenceList(client: Socket): void {
    const onlineList = Array.from(this.users.keys()).map((uuid) => ({
      uuid,
      status: this.presence.get(uuid),
    }));
    client.emit('presence:list', onlineList);
  }

  handleConnection(client: Socket) {
    // Authenticate here, not per message: a socket that never proved who it is
    // has no business holding a connection, and checking once means no handler
    // can forget to.
    const identity = identifySocket(this.jwt, client);
    if (!identity) {
      this.logger.warn(`Socket ${client.id} rejected: no valid session token`);
      client.emit('auth:error', { message: 'Sesión no válida' });
      client.disconnect(true);
      return;
    }

    client.identity = identity;
    this.logger.log(
      `Client with ID ${client.id} connected as user ${identity.userId}`,
    );
    this.logger.log('Total connections:', this.server.sockets.sockets.size);
  }

  @SubscribeMessage('smartrotom:connection')
  handleSmartRotomConnection(
    @ConnectedSocket() client: Socket,
    @MessageBody() smartRotomUser: any,
  ): boolean {
    // The uuid comes from the token, never from the body. `inGame` still does:
    // it is a presentation flag (online vs in-game), not an identity claim.
    const uuid = this.uuidOf(client);
    if (!uuid) {
      this.logger.warn(
        `Socket ${client.id} has no linked Minecraft account; refusing presence`,
      );
      return client.emit('auth:error', {
        message: 'Esta cuenta no tiene Minecraft vinculado',
      });
    }

    this.users.set(uuid, { uuid, socketId: client.id });
    const sockets = this.socketsOf.get(uuid) ?? new Set<string>();
    sockets.add(client.id);
    this.socketsOf.set(uuid, sockets);
    this.presence.setOnline(uuid, !!smartRotomUser?.inGame);
    this.broadcastPresence(uuid);

    // Send full online list to the connecting client
    this.sendPresenceList(client);

    this.logger.log(`Updated connection for user ${uuid}`);
    this.logger.log('Current users:', this.users.size);

    return client.emit('smartrotom:connection', { ...smartRotomUser, uuid });
  }

  /**
   * Emit to EVERY socket one uuid currently holds, and to nobody else.
   *
   * Use this instead of `server.emit` for anything addressed to one player.
   * `server.emit` reaches every connected socket, which turns a per-player
   * signal into two problems at once: every other client acts on it (an
   * invalidation broadcast makes N clients refetch for one player's change),
   * and the payload is delivered to people it was never about.
   *
   * It walks `socketsOf`, not `users`, because a player with two tabs holds
   * two sockets and `users` keeps only one of them — the same distinction
   * N12 was about.
   *
   * Returns the number of sockets written to, so a caller can tell "delivered"
   * from "that player is not connected" rather than assuming.
   */
  emitToUuid(uuid: string, event: string, payload: unknown): number {
    const sockets = this.socketsOf.get(uuid);
    if (!sockets?.size) return 0;
    for (const socketId of sockets) {
      this.server.to(socketId).emit(event, payload);
    }
    return sockets.size;
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client with ID ${client.id} disconnected`);

    // A uuid goes offline when its LAST socket goes, not when the one that
    // happened to be in `users` goes: two tabs are one player.
    for (const [uuid, sockets] of this.socketsOf.entries()) {
      if (!sockets.delete(client.id)) continue;

      if (sockets.size === 0) {
        this.socketsOf.delete(uuid);
        this.users.delete(uuid);
        this.presence.setOffline(uuid);
        this.broadcastPresence(uuid);
        this.logger.log(`Removed user ${uuid} from connections`);
      } else if (this.users.get(uuid)?.socketId === client.id) {
        // Still connected elsewhere: repoint the targeted-emit socket at a
        // surviving tab instead of leaving `users` pointing at a dead one.
        const [survivor] = sockets;
        this.users.set(uuid, { uuid, socketId: survivor });
      }
      break;
    }

    this.logger.log('Current users:', this.users.size);
    this.logger.log('Total connections:', this.server.sockets.sockets.size);
  }

  /* ChatApp */
  @SubscribeMessage('chat:exitcall')
  async handleChatExit(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      call: {
        chatId: number;
        users: { uuid: string; status: string }[];
        caller: string;
      };
      user: any;
      startTime: number;
    },
  ): Promise<void> {
    const actor = this.uuidOf(client);
    if (!actor) return;

    const chatId = Number(data.call.chatId);
    let members: { uuid: string }[];
    try {
      // getChatById is also the membership check: it throws for a chat this
      // uuid is not in, so neither the fan-out nor endCall runs on a chatId the
      // caller does not belong to.
      const chat = await this.chatAppService.getChatById(chatId, actor);
      members = chat.members;
    } catch (error: any) {
      this.logger.error(
        `exitcall membership check failed for ${actor}:`,
        error,
      );
      return;
    }

    this.logger.log(`Exit call signal sent by ${actor}`);
    // Recipients come from proven chat membership, never from the client body.
    members.forEach((member) => {
      if (member.uuid === actor) return;
      const userSocket = this.users.get(member.uuid);
      if (userSocket) {
        this.logger.log(`Sending exit call signal to ${member.uuid}`);
        this.server.to(userSocket.socketId).emit('chat:exitcall', data);
      }
    });

    // Whether the call is over is still read from the client-reported statuses,
    // but only after membership is proven and only for this verified chatId.
    const remaining = (data.call.users ?? []).filter(
      (user) => user.uuid !== actor && user.status === 'IN_CALL',
    );
    if (remaining.length === 0) {
      this.chatAppService.endCall(chatId, data.startTime);
    }
  }
  @SubscribeMessage('chat:joincall')
  async handleChatJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      call: {
        chatId: number;
        users: { uuid: string; status: string }[];
        caller: string;
      };
      user: any;
    },
  ): Promise<void> {
    const actor = this.uuidOf(client);
    if (!actor) return;

    const chatId = Number(data.call.chatId);
    let members: { uuid: string }[];
    try {
      const chat = await this.chatAppService.getChatById(chatId, actor);
      members = chat.members;
    } catch (error: any) {
      this.logger.error(
        `joincall membership check failed for ${actor}:`,
        error,
      );
      return;
    }

    this.logger.log(`Join call signal sent by ${actor}`);
    // Recipients come from proven chat membership, never from the client body.
    members.forEach((member) => {
      if (member.uuid === actor) return;
      const userSocket = this.users.get(member.uuid);
      if (userSocket) {
        this.logger.log(`Sending join call signal to ${member.uuid}`);
        this.server
          .to(userSocket.socketId)
          .emit('chat:joincall', { uuid: actor });
      }
    });
  }

  @SubscribeMessage('chat:typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: number; username?: string },
  ): Promise<void> {
    const actor = this.uuidOf(client);
    if (!actor) return;

    try {
      // getChatById is also the membership check: it throws for a chat this
      // uuid is not in, so a typing signal cannot be broadcast into a stranger's
      // conversation.
      const chatMembers = await this.chatAppService.getChatById(
        data.chatId,
        actor,
      );

      // Broadcast typing indicator to all other members in the chat
      chatMembers.members.forEach((member) => {
        if (member.uuid !== actor) {
          const userSocket = this.users.get(member.uuid);
          if (userSocket) {
            this.server.to(userSocket.socketId).emit('chat:typing:start', {
              chatId: data.chatId,
              uuid: actor,
              username: data.username,
            });
          }
        }
      });
    } catch (error: any) {
      this.logger.error('Error broadcasting typing start:', error);
    }
  }

  @SubscribeMessage('chat:typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: number },
  ): Promise<void> {
    const actor = this.uuidOf(client);
    if (!actor) return;

    this.logger.log(`Typing stopped by ${actor} in chat ${data.chatId}`);

    try {
      const chatMembers = await this.chatAppService.getChatById(
        data.chatId,
        actor,
      );

      // Broadcast typing stop to all other members in the chat
      chatMembers.members.forEach((member) => {
        if (member.uuid !== actor) {
          const userSocket = this.users.get(member.uuid);
          if (userSocket) {
            this.server.to(userSocket.socketId).emit('chat:typing:stop', {
              chatId: data.chatId,
              uuid: actor,
            });
          }
        }
      });
    } catch (error: any) {
      this.logger.error('Error broadcasting typing stop:', error);
    }
  }
}
