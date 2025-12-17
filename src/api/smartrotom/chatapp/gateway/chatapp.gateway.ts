import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatappFacadeService } from '../chatapp.facade.service';

@Injectable()
export class ChatAppSocketService {
  private readonly logger = new Logger(ChatAppSocketService.name);

  constructor(
    @Inject(forwardRef(() => ChatappFacadeService))
    private readonly chatAppService: ChatappFacadeService
  ) {}

  async handleExitCall(
    server: Server,
    users: Map<string, { uuid: string; socketId: string }>,
    data: { call: { chatId: number; users: { uuid: string; status: string }[]; caller: string }; user: any; startTime: number }
  ): Promise<void> {
    this.logger.log(`Exit call signal sent by ${data.user.uuid}`);
    
    // Remove the user from the call
    data.call.users = data.call.users.filter((user) => user.uuid !== data.user.uuid);
    const currentUsers = data.call.users.filter((user) => user.status === 'IN_CALL');
    this.logger.log(`Current users in call: ${currentUsers.length}`);

    data.call.users.forEach((user) => {
      const userSocket = users.get(user.uuid);
      if (userSocket) {
        this.logger.log(`Sending exit call signal to ${user.uuid}`);
        server.to(userSocket.socketId).emit('chat:exitcall', data);
      }
    });

    if (currentUsers.length === 0) {
      await this.chatAppService.endCall(data.call.chatId, data.startTime);
    }
  }

  handleJoinCall(
    server: Server,
    users: Map<string, { uuid: string; socketId: string }>,
    data: { call: { users: { uuid: string; status: string }[]; caller: string }; user: any }
  ): void {
    this.logger.log(`Join call signal sent by ${data.user.uuid}`);
    
    const callUsers = data.call.users.map((user) => user.uuid);
    const connectedUsers = Array.from(users.keys());

    this.logger.log(`Users: ${callUsers.join(', ')}`);
    this.logger.log(`Connected users: ${connectedUsers.join(', ')}`);

    data.call.users.forEach((user) => {
      const userSocket = users.get(user.uuid);
      if (userSocket) {
        this.logger.log(`Sending join call signal to ${user.uuid}`);
        server.to(userSocket.socketId).emit('chat:joincall', { uuid: data.user.uuid });
      }
    });
  }

  async handleTypingStart(
    server: Server,
    users: Map<string, { uuid: string; socketId: string }>,
    data: { chatId: number; uuid: string; username?: string }
  ): Promise<void> {
    try {
      const chatMembers = await this.chatAppService.getChatById(data.chatId, data.uuid);

      chatMembers.members.forEach((member) => {
        if (member.uuid !== data.uuid) {
          const userSocket = users.get(member.uuid);
          if (userSocket) {
            server.to(userSocket.socketId).emit('chat:typing:start', {
              chatId: data.chatId,
              uuid: data.uuid,
              username: data.username,
            });
          }
        }
      });
    } catch (error) {
      this.logger.error('Error broadcasting typing start:', error);
    }
  }

  async handleTypingStop(
    server: Server,
    users: Map<string, { uuid: string; socketId: string }>,
    data: { chatId: number; uuid: string }
  ): Promise<void> {
    this.logger.log(`Typing stopped by ${data.uuid} in chat ${data.chatId}`);

    try {
      const chatMembers = await this.chatAppService.getChatById(data.chatId, data.uuid);

      chatMembers.members.forEach((member) => {
        if (member.uuid !== data.uuid) {
          const userSocket = users.get(member.uuid);
          if (userSocket) {
            server.to(userSocket.socketId).emit('chat:typing:stop', {
              chatId: data.chatId,
              uuid: data.uuid,
            });
          }
        }
      });
    } catch (error) {
      this.logger.error('Error broadcasting typing stop:', error);
    }
  }
}
