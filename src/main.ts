import { join } from 'path';
import * as express from 'express';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { apiReference } from '@scalar/nestjs-api-reference'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DuplicateEntryExceptionFilter } from './_filters/DuplicateEntryExceptionFilter';

const bodyParser = require('body-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  let origin = [
    'http://localhost:3000',
    'http://148.251.3.244:34333',
    'https://lizardon.es',
    'https://boffmedia.es',
    'http://local.boffmedia.es',
    'http://smartrotom.local.boffmedia.es',
    'https://ficuslab.es',
    'https://blog.ficuslab.es',
  ];
  app.enableCors({ origin }); // Enable CORS for the specified origin
  app.use(bodyParser.json({ limit: '50mb' }));

  const configService = app.get(ConfigService);
  app.useGlobalFilters(new DuplicateEntryExceptionFilter());

  app.use('/public', express.static(join(__dirname, '..', 'public')));

  console.log('EL PUERTO ES: ' + configService.get('PORT'));

  if (process.env.NODE_ENV !== 'production') {
    /*
    const config = new DocumentBuilder()
      .setTitle('BoffMedia API')
      .setDescription('The BoffMedia API description')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);*/

    
    const config = new DocumentBuilder()
      .setTitle('BoffMedia API')
      .setDescription('The BoffMedia API description')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
  
    // Sort tags alphabetically

    
    if (document.tags) {
      document.tags = document.tags.sort((a, b) => a.name.localeCompare(b.name));
    }
    
  
    // Sort paths alphabetically
    const sortedPaths = {};
    Object.keys(document.paths)
      .sort()
      .forEach((key) => {
        sortedPaths[key] = document.paths[key];
  
        // Sort methods within each path
        const methods = ['get', 'post', 'put', 'delete'];
        const sortedMethods = {};
        methods.forEach((method) => {
          if (sortedPaths[key][method]) {
            sortedMethods[method] = sortedPaths[key][method];
          }
        });
        sortedPaths[key] = sortedMethods;
      });
    document.paths = sortedPaths;


    // Sort schemas alphabetically
    if (document.components && document.components.schemas) {
      const sortedSchemas = {};
      Object.keys(document.components.schemas)
        .sort()
        .forEach((key) => {
          sortedSchemas[key] = document.components.schemas[key];
        });
      document.components.schemas = sortedSchemas;
    }
  
    //SwaggerModule.setup('api', app, document);
  
    app.use(
      '/reference',
      apiReference({
        spec: {
          content: document,
        },
      }),
    )

  }

  await app.listen(34301);
  console.log('Server open');
}

bootstrap();
