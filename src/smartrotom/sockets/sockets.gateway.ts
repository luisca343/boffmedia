import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  
  @WebSocketGateway(34304, {
    cors: {
      origin: '*',
    }
  })
  export class SocketsGateway {
    @WebSocketServer()
    server: Server;
    users: any[] = [];
    
    @SubscribeMessage('connection')
    handleConnection(@ConnectedSocket() client: Socket): boolean{
        return client.emit('connection', null);
        
    }
    @SubscribeMessage('smartrotom:connection')
    handleSmartRotomConnection(@ConnectedSocket() client: Socket, @MessageBody() smartRotomUser: any): boolean{
        const sockets = this.server.sockets.sockets;
        const user = {...smartRotomUser, socketId: client.id};
        /*
        const userIndex = this.users.findIndex(user => user.uuid === smartRotomUser.uuid);
        if(userIndex !== -1){
            this.users[userIndex].socketId = client.id;
            return client.emit('smartrotom:connection', smartRotomUser);
        }*/
        
        this.users.push(user);
        return client.emit('smartrotom:connection', smartRotomUser);
    }
  
    @SubscribeMessage('disconnect')
    handleDisconnect(@ConnectedSocket() client: Socket): void{
        console.log(`Client with ID ${client.id} disconnected`);
        console.log('Previuos users: ', this.users);
        this.users = this.users.filter(user => user.socketId !== client.id);
        console.log('Current users: ', this.users);
        console.log(`Client with ID ${client.id} disconnected`);
    }
  }