import * as dotenv from 'dotenv';
dotenv.config();

import { join } from 'path';
import * as express from 'express';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { apiReference } from '@scalar/nestjs-api-reference';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // Add global validation pipe for better type generation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const origin = [
    'http://localhost:3000',
    'http://148.251.3.244:34333',
    'https://lizardon.es',
    'https://boffmedia.es',
    'http://local.boffmedia.es',
    'http://smartrotom.local.boffmedia.es',
    'https://ficuslab.es',
    'https://blog.ficuslab.es',
  ];
  app.enableCors({ origin });
  app.use(express.json({ limit: '50mb' }));

  const configService = app.get(ConfigService);
  app.useGlobalFilters(new GlobalExceptionFilter(app.get(Logger)));

  app.use('/', express.static(join(__dirname, '..', 'public')));

  console.log('EL PUERTO ES: ' + configService.get('PORT'));

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Ficus Labs API')
      .setDescription(
        'Comprehensive API for Ficus Labs services including SmartRotom and BoffMedia tools',
      )
      .setVersion('1.0.0')
      .setContact('Ficus Labs', 'https://ficuslab.es', 'contact@ficuslab.es')
      .addServer('https://api.ficuslab.es', 'Development server')
      .addServer('https://api.boffmedia.es', 'Production server')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token for authentication',
        },
        'JWT',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      deepScanRoutes: true,
      operationIdFactory: (controllerKey: string, methodKey: string) => {
        return `${controllerKey.replace('Controller', '')}${methodKey.charAt(0).toUpperCase() + methodKey.slice(1)}`;
      },
    });

    // YOUR ORIGINAL TAG SORTING LOGIC - KEPT EXACTLY AS IT WAS
    if (document.tags && document.tags.length > 0) {
      document.tags.sort((a, b) => a.name.localeCompare(b.name));
      console.log(
        'Tags sorted alphabetically:',
        document.tags.map((tag) => tag.name),
      );
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
        .map((tag) => ({ name: tag }));

      console.log(
        'Tags extracted and sorted:',
        document.tags.map((tag) => tag.name),
      );
    }

    console.log('Final document structure check:');
    console.log('Tags count:', document.tags?.length || 0);
    console.log('Paths count:', Object.keys(document.paths).length);

    // Set up the standard Swagger endpoints
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      },
      customSiteTitle: 'Ficus Labs API Documentation',
    });

    // Set up the Scalar API reference
    app.use(
      '/reference',
      apiReference({
        spec: {
          url: '/api-json', // Use the OpenAPI JSON endpoint
        },
        configuration: {
          hideTestRequestButton: false, // Ensure the button is visible
        },
      }),
    );

    // Log useful URLs for development
    console.log('\n🚀 API Documentation URLs:');
    console.log(`📖 Swagger UI: http://localhost:34301/api`);
    console.log(`📋 Scalar Reference: http://localhost:34301/reference`);
    console.log(`🔗 OpenAPI JSON: http://localhost:34301/api-json\n`);
  }

  await app.listen(34301);
  console.log('Server open');
}

bootstrap();
