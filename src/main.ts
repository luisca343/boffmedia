import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Server } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { DuplicateEntryExceptionFilter } from './filters/DuplicateEntryExceptionFilter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  let origin = ['http://localhost:3000', 'http://148.251.3.244:34333', 'https://lizardon.es', 'https://boffmedia.es']
  app.enableCors({ origin }); // Enable CORS for the specified origin


  const configService = app.get(ConfigService);
  app.useGlobalFilters(new DuplicateEntryExceptionFilter());

  console.log("EL PUERTO ES: "+ configService.get('PORT'));

  /*  
  const httpServer = app.getHttpServer();
  const io = new Server(httpServer, {
    cors: {
      origin,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.emit('connection', null);

    socket.on('patata', () => {
      console.log('Patata');
      socket.emit('patata', null);
    });
  });

  io.on('disconnect', (socket) => {
    console.log('Client disconnected');
  });

  io.listen(34304);
  console.log('Socket open');
*/
  await app.listen(34301);
  console.log('Server open');

}

bootstrap();
