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
import { ChatappFacadeService } from '@api/smartrotom/chatapp/chatapp.facade.service';

@WebSocketGateway(34304, {
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

  constructor(
    @Inject(forwardRef(() => ChatappFacadeService))
    private chatAppService: ChatappFacadeService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client with ID ${client.id} connected`);
    console.log('Total connections:', this.server.sockets.sockets.size);
  }

  @SubscribeMessage('smartrotom:connection')
  handleSmartRotomConnection(
    @ConnectedSocket() client: Socket,
    @MessageBody() smartRotomUser: any,
  ): boolean {
    console.log(`SmartRotom connection for user ${smartRotomUser.uuid}`);

    // If the user already has a connection, disconnect the old one
    const _existingUser = this.users.get(smartRotomUser.uuid);
    /*
      if (existingUser && existingUser.socketId !== client.id) {
        const oldSocket = this.server.sockets.sockets.get(existingUser.socketId)
        if (oldSocket) {
          console.log(`Disconnecting old socket for user ${smartRotomUser.uuid}`)
          oldSocket.disconnect(true)
        }
      }*/

    // Update or add the new connection
    this.users.set(smartRotomUser.uuid, {
      uuid: smartRotomUser.uuid,
      socketId: client.id,
    });
    console.log(`Updated connection for user ${smartRotomUser.uuid}`);
    console.log('Current users:', this.users.size);

    return client.emit('smartrotom:connection', smartRotomUser);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client with ID ${client.id} disconnected`);

    // Find and remove the disconnected user
    for (const [uuid, user] of this.users.entries()) {
      if (user.socketId === client.id) {
        this.users.delete(uuid);
        console.log(`Removed user ${uuid} from connections`);
        break;
      }
    }

    console.log('Current users:', this.users.size);
    console.log('Total connections:', this.server.sockets.sockets.size);
  }

  /* ChatApp */
  @SubscribeMessage('chat:exitcall')
  handleChatExit(
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
  ): void {
    // Remove the user from the call
    console.log(`Exit call signal sent by ${data.user.uuid}`);
    data.call.users = data.call.users.filter(
      (user) => user.uuid !== data.user.uuid,
    );
    const _sockets = this.server.sockets.sockets;
    const currentUsers = data.call.users.filter(
      (user) => user.status === 'IN_CALL',
    );
    console.log('Current users in call: ', currentUsers);

    data.call.users.forEach((user) => {
      const userSocket = this.users.get(user.uuid);
      if (userSocket) {
        console.log(`Sending exit call signal to ${user.uuid}`);
        this.server.to(userSocket.socketId).emit('chat:exitcall', data);
      }
    });

    if (currentUsers.length === 0) {
      this.chatAppService.endCall(data.call.chatId, data.startTime);
      return;
    }
  }
  @SubscribeMessage('chat:joincall')
  handleChatJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      call: { users: { uuid: string; status: string }[]; caller: string };
      user: any;
    },
  ): void {
    console.log(`Join call signal sent by ${data.user.uuid}`);
    const _sockets = this.server.sockets.sockets;
    const users = data.call.users.map((user) => user.uuid);
    const connectedUsers = Array.from(this.users.keys());

    console.log('Users: ', users);
    console.log('Connected users: ', connectedUsers);

    data.call.users.forEach((user) => {
      const userSocket = this.users.get(user.uuid);
      if (userSocket) {
        console.log(`Sending join call signal to ${user.uuid}`);
        this.server
          .to(userSocket.socketId)
          .emit('chat:joincall', { uuid: data.user.uuid });
      }
    });
  }

  @SubscribeMessage('chat:typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: number; uuid: string; username?: string },
  ): Promise<void> {
    try {
      // Get chat members to broadcast to
      const chatMembers = await this.chatAppService.getChatById(
        data.chatId,
        data.uuid,
      );

      // Broadcast typing indicator to all other members in the chat
      chatMembers.members.forEach((member) => {
        if (member.uuid !== data.uuid) {
          const userSocket = this.users.get(member.uuid);
          if (userSocket) {
            this.server.to(userSocket.socketId).emit('chat:typing:start', {
              chatId: data.chatId,
              uuid: data.uuid,
              username: data.username,
            });
          }
        }
      });
    } catch (error: any) {
      console.error('Error broadcasting typing start:', error);
    }
  }

  @SubscribeMessage('chat:typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: number; uuid: string },
  ): Promise<void> {
    console.log(`Typing stopped by ${data.uuid} in chat ${data.chatId}`);

    try {
      // Get chat members to broadcast to
      const chatMembers = await this.chatAppService.getChatById(
        data.chatId,
        data.uuid,
      );

      // Broadcast typing stop to all other members in the chat
      chatMembers.members.forEach((member) => {
        if (member.uuid !== data.uuid) {
          const userSocket = this.users.get(member.uuid);
          if (userSocket) {
            this.server.to(userSocket.socketId).emit('chat:typing:stop', {
              chatId: data.chatId,
              uuid: data.uuid,
            });
          }
        }
      });
    } catch (error: any) {
      console.error('Error broadcasting typing stop:', error);
    }
  }
}
