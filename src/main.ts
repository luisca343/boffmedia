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
    const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  
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

  app.use('/', express.static(join(__dirname, '..', 'public')));

  console.log('EL PUERTO ES: ' + configService.get('PORT'));

if (process.env.NODE_ENV !== 'production') {
  const config = new DocumentBuilder()
    .setTitle('BoffMedia API')
    .setDescription('The BoffMedia API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // Sort tags alphabetically
  if (document.tags && document.tags.length > 0) {
    document.tags.sort((a, b) => a.name.localeCompare(b.name));
    console.log('Tags sorted alphabetically:', document.tags.map(tag => tag.name));
  } else {
    // Extract tags from paths if they're not in the document.tags array
    const tagsSet = new Set<string>();
    
    Object.values(document.paths).forEach((pathItem: any) => {
      Object.values(pathItem).forEach((operation: any) => {
        if (operation.tags && Array.isArray(operation.tags)) {
          operation.tags.forEach((tag: string) => tagsSet.add(tag));
        }
      });
    });
    
    // Convert to sorted array and add to document
    document.tags = Array.from(tagsSet)
      .sort((a, b) => a.localeCompare(b))
      .map(tag => ({ name: tag }));
    
    console.log('Tags extracted and sorted:', document.tags.map(tag => tag.name));
  }

  console.log('Final document structure check:');
  console.log('Tags count:', document.tags?.length || 0);
  console.log('Paths count:', Object.keys(document.paths).length);
  
  // Set up the standard Swagger endpoints
  SwaggerModule.setup('api', app, document);
  
  // Set up the Scalar API reference
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
