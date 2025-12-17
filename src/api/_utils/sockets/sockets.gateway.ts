import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    type OnGatewayDisconnect,
    type OnGatewayConnection,
  } from "@nestjs/websockets"
  import type { Server, Socket } from "socket.io"
  import { Inject, forwardRef } from "@nestjs/common"
import { ChatappFacadeService } from "@api/smartrotom/chatapp/chatapp.facade.service";
import { ChatAppSocketService } from "@api/smartrotom/chatapp/gateway/chatapp.gateway";
import { MillionaireSocketService } from "@api/smartrotom/millionaire/gateway/millionaire.gateway";
  
  @WebSocketGateway(34304, {
    cors: {
      origin: "*",
    },
  })
  export class SocketsGateway implements OnGatewayDisconnect, OnGatewayConnection {
    @WebSocketServer()
    server: Server
    users: Map<string, { uuid: string; socketId: string }> = new Map();
  
    constructor(
      @Inject(forwardRef(() => ChatappFacadeService))
      private chatAppService: ChatappFacadeService,
      @Inject(forwardRef(() => ChatAppSocketService))
      private chatAppSocketService: ChatAppSocketService,
      @Inject(forwardRef(() => MillionaireSocketService))
      private millionaireSocketService: MillionaireSocketService
    ) {}
  
    handleConnection(client: Socket) {
      console.log(`Client with ID ${client.id} connected`)
      console.log("Total connections:", this.server.sockets.sockets.size)
    }
  
    @SubscribeMessage("smartrotom:connection")
    handleSmartRotomConnection(@ConnectedSocket() client: Socket, @MessageBody() smartRotomUser: any): boolean {
      console.log(`SmartRotom connection for user ${smartRotomUser.uuid}`)
  
      // If the user already has a connection, disconnect the old one
      const existingUser = this.users.get(smartRotomUser.uuid)
      /*
      if (existingUser && existingUser.socketId !== client.id) {
        const oldSocket = this.server.sockets.sockets.get(existingUser.socketId)
        if (oldSocket) {
          console.log(`Disconnecting old socket for user ${smartRotomUser.uuid}`)
          oldSocket.disconnect(true)
        }
      }*/
  
      // Update or add the new connection
      this.users.set(smartRotomUser.uuid, { uuid: smartRotomUser.uuid, socketId: client.id })
      console.log(`Updated connection for user ${smartRotomUser.uuid}`)
      console.log("Current users:", this.users.size)
  
      return client.emit("smartrotom:connection", smartRotomUser)
    }
  
    handleDisconnect(client: Socket) {
      console.log(`Client with ID ${client.id} disconnected`)
  
      // Handle millionaire disconnections
      this.millionaireSocketService.handleDisconnect(this.server, client);

      // Find and remove the disconnected user
      for (const [uuid, user] of this.users.entries()) {
        if (user.socketId === client.id) {
          this.users.delete(uuid)
          console.log(`Removed user ${uuid} from connections`)
          break
        }
      }
  
      console.log("Current users:", this.users.size)
      console.log("Total connections:", this.server.sockets.sockets.size)
    }
  
    /* ChatApp */
    @SubscribeMessage("chat:exitcall")
    async handleChatExit(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: {call: {chatId: number, users: { uuid:string, status:string}[], caller: string}, user: any, startTime: number},
    ): Promise<void> {
      await this.chatAppSocketService.handleExitCall(this.server, this.users, data);
    }

    @SubscribeMessage("chat:joincall")
    handleChatJoin(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: {call: {users: {uuid:string, status:string}[], caller: string}, user: any},
    ): void {
      this.chatAppSocketService.handleJoinCall(this.server, this.users, data);
    }

    @SubscribeMessage("chat:typing:start")
    async handleTypingStart(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { chatId: number; uuid: string; username?: string },
    ): Promise<void> {
      await this.chatAppSocketService.handleTypingStart(this.server, this.users, data);
    }

    @SubscribeMessage("chat:typing:stop")
    async handleTypingStop(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { chatId: number; uuid: string },
    ): Promise<void> {
      await this.chatAppSocketService.handleTypingStop(this.server, this.users, data);
    }

    /* Millionaire Game */
    @SubscribeMessage("millionaire:session:join")
    async handleMillionaireJoinSession(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { sessionCode: string; uuid: string; role: 'conductor' | 'player' }
    ) {
      return await this.millionaireSocketService.handleJoinSession(this.server, client, data);
    }

    @SubscribeMessage("millionaire:heartbeat")
    handleMillionaireHeartbeat(@ConnectedSocket() client: Socket) {
      this.millionaireSocketService.handleHeartbeat(client);
    }

    @SubscribeMessage("millionaire:game:start")
    async handleMillionaireGameStart(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { sessionId: number }
    ) {
      return await this.millionaireSocketService.handleGameStart(this.server, client, data);
    }

    @SubscribeMessage("millionaire:question:reveal")
    async handleMillionaireRevealQuestion(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { sessionId: number }
    ) {
      return await this.millionaireSocketService.handleRevealQuestion(this.server, client, data);
    }

    @SubscribeMessage("millionaire:answer:reveal")
    async handleMillionaireRevealAnswer(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { sessionId: number; isCorrect: boolean }
    ) {
      return await this.millionaireSocketService.handleRevealAnswer(this.server, client, data);
    }

    @SubscribeMessage("millionaire:game:pause")
    async handleMillionairePauseGame(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { sessionId: number }
    ) {
      return await this.millionaireSocketService.handlePauseGame(this.server, client, data);
    }

    @SubscribeMessage("millionaire:game:resume")
    async handleMillionaireResumeGame(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { sessionId: number }
    ) {
      return await this.millionaireSocketService.handleResumeGame(this.server, client, data);
    }

    @SubscribeMessage("millionaire:answer:submit")
    async handleMillionaireSubmitAnswer(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { sessionId: number; answerIndex: number }
    ) {
      return await this.millionaireSocketService.handleSubmitAnswer(this.server, client, data);
    }

    @SubscribeMessage("millionaire:lifeline:request")
    async handleMillionaireLifelineRequest(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { sessionId: number; lifelineType: any }
    ) {
      return await this.millionaireSocketService.handleLifelineRequest(this.server, client, data);
    }

    @SubscribeMessage("millionaire:state:request")
    async handleMillionaireStateRequest(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { sessionId: number }
    ) {
      return await this.millionaireSocketService.handleStateRequest(this.server, client, data);
    }
  }
  
  