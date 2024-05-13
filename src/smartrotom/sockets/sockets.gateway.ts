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
    users: {uuid: string, socketId: string}[] = [];
    
    @SubscribeMessage('connection')
    handleConnection(@ConnectedSocket() client: Socket): boolean{
        console.log(`Client with ID ${client.id} connected`);
        console.log('Users: ', this.server.sockets.sockets.size);
        return client.emit('connection', null);
        
    }
    @SubscribeMessage('smartrotom:connection')
    handleSmartRotomConnection(@ConnectedSocket() client: Socket, @MessageBody() smartRotomUser: any): boolean{
        const sockets = this.server.sockets.sockets;
        const user = {...smartRotomUser, socketId: client.id};

        const userIndex = this.users.findIndex(user => user.uuid === smartRotomUser.uuid);
        if(userIndex !== -1){
            this.users[userIndex].socketId = client.id;
            return client.emit('smartrotom:connection', smartRotomUser);
        }
        
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
    
    
    /* ChatApp */
    @SubscribeMessage('chat:exitcall')
    handleChatExit(@ConnectedSocket() client: Socket, @MessageBody() data: {call: {users: {uuid:string, status:string}[], caller: string}, user: any}): void{
       // Remove the user from the call
       console.log(`Exit call signal sent by ${data.user.uuid}`);
       data.call.users = data.call.users.filter(user => user.uuid !== data.user.uuid);
       const sockets = this.server.sockets.sockets;

        data.call.users.forEach(user => {
            const userSocket = this.users.find(u => u.uuid === user.uuid);
            if(userSocket){
                this.server.to(userSocket.socketId).emit('chat:exitcall', data);
            }
        });
    }
    @SubscribeMessage('chat:joincall')
    handleChatJoin(@ConnectedSocket() client: Socket, @MessageBody() data: {call: {users: {uuid:string, status:string}[], caller: string}, user: any}): void{
        console.log(`Join call signal sent by ${data.user.uuid}`);
        const sockets = this.server.sockets.sockets;
        const users = data.call.users.map(user => user.uuid);
        const connectedUsers = this.users.map(user => user.uuid);

        console.log('Users: ', users);
        console.log('Connected users: ', connectedUsers);

        data.call.users.forEach(user => {
            const userSocket = this.users.find(u => u.uuid === user.uuid);
            if(userSocket){
                this.server.to(userSocket.socketId).emit('chat:joincall', {uuid: data.user.uuid});
            }
        });
    }
  }