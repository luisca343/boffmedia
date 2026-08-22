import * as dotenv from 'dotenv';
dotenv.config();

import { env } from './config/env';
import * as express from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { apiReference } from '@scalar/nestjs-api-reference';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ApiResponseEntity } from './common/entities/api-response.entity';
import { Logger } from 'nestjs-pino';
import { publicPath, uploadsPath } from '@/config/paths';

/**
 * Socket failures that say nothing about this process's health: the peer went
 * away. They arrive as an 'error' event on whichever client emitted them, and
 * an EventEmitter with no listener for 'error' is fatal to Node — so a public
 * WebSocket dropping an idle connection could take the whole API down, taking
 * every unrelated route with it.
 */
const RECOVERABLE_SOCKET_CODES = new Set([
  'ECONNRESET',
  'EPIPE',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EAI_AGAIN',
]);

function installProcessGuards(): void {
  process.on('uncaughtException', (error: NodeJS.ErrnoException) => {
    if (error?.code && RECOVERABLE_SOCKET_CODES.has(error.code)) {
      // Deliberately kept alive: a dropped peer connection is not a reason to
      // stop serving requests that have nothing to do with it.
      console.error(
        JSON.stringify({
          level: 50,
          service: 'boffmedia-api',
          msg: `Recovered from an unhandled socket error (${error.code})`,
          err: { message: error.message, stack: error.stack },
        }),
      );
      return;
    }
    // Anything else is a real defect, and continuing from an unknown state is
    // worse than restarting: let the process die so the supervisor replaces it.
    console.error(
      JSON.stringify({
        level: 60,
        service: 'boffmedia-api',
        msg: 'Fatal uncaught exception — exiting',
        err: { message: error?.message, stack: error?.stack },
      }),
    );
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    const error = reason as NodeJS.ErrnoException;
    console.error(
      JSON.stringify({
        level: 50,
        service: 'boffmedia-api',
        msg: 'Unhandled promise rejection',
        err: { message: error?.message ?? String(reason), stack: error?.stack },
      }),
    );
  });
}

async function bootstrap() {
  installProcessGuards();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // Security headers. CSP is disabled because the Swagger/Scalar reference UIs load
  // inline assets, and cross-origin resource policy is relaxed so the web app can
  // load the static /public/uploads assets served by this API from another origin.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

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
  // JSON body cap. File uploads go through multer/FileInterceptor (multipart),
  // not express.json, so this only bounds JSON payloads — 5mb is very generous
  // for those while cutting the DoS surface from the previous 50mb. Bump a
  // specific route with its own body-parser middleware if it ever needs more.
  app.use(express.json({ limit: '5mb' }));

  const configService = app.get(ConfigService);
  app.useGlobalFilters(new GlobalExceptionFilter(app.get(Logger)));

  // Static assets are served only under the prefixes external consumers rely on
  // (DB-stored URLs, Minecraft clients, the external blog) — not the whole folder
  // at the root, so an API route never pays a filesystem probe per request.
  // sprites/packs/jcef are content-addressed or append-only → immutable; uploads
  // are overwritten in place (profile pics keyed by userId) → short TTL, and they
  // come from the laboon store because they are written while the app runs.
  const staticOpts = (
    maxAge: string,
  ): Parameters<typeof express.static>[1] => ({
    index: false,
    maxAge,
  });
  app.use('/uploads', express.static(uploadsPath(), staticOpts('5m')));
  app.use(
    '/jcef',
    express.static(publicPath('jcef'), {
      ...staticOpts('365d'),
      immutable: true,
    }),
  );
  app.use('/blog', express.static(publicPath('blog'), staticOpts('1h')));
  app.use(
    '/smartrotom',
    express.static(publicPath('smartrotom'), {
      ...staticOpts('1h'),
      setHeaders: (res, filePath) => {
        if (/[/\\]smartrotom[/\\](img|packs)[/\\]/.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }),
  );

  const port = configService.get<number>('PORT') ?? 34301;

  if (env.NODE_ENV !== 'production') {
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
      extraModels: [ApiResponseEntity],
    });

    if (document.tags && document.tags.length > 0) {
      document.tags.sort((a, b) => a.name.localeCompare(b.name));
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
    }

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
  }

  // Unset is a WORKING but degraded state, which is why it warns rather than
  // throws: the download/update URLs fall back to `x-forwarded-proto`/`-host`,
  // so an unexpected Host header mints a wrong absolute URL for the Tauri
  // updater. A deployed .env naming the variable anything but
  // `DESKTOP_UPDATE_BASE_URL` lands here silently.
  if (!env.DESKTOP_UPDATE_BASE_URL) {
    console.warn(
      '[config] DESKTOP_UPDATE_BASE_URL is not set — desktop update and ' +
        'download URLs will be derived from request headers. Set it in ' +
        'production to pin the absolute URL.',
    );
  }

  // Registers the SIGTERM/SIGINT listeners that run Nest's shutdown hooks, so
  // in-flight requests finish and the DB pool drains before the process leaves.
  // This is load-bearing rather than a nicety: in the container Node is PID 1,
  // and the kernel applies no default action to a signal PID 1 has no handler
  // for — so without this `docker stop` is a 10s wait followed by SIGKILL
  // (exit 137), never a shutdown.
  //
  // Disjoint from installProcessGuards() above, which listens only for
  // 'uncaughtException' and 'unhandledRejection'; its process.exit(1) on a
  // fatal defect deliberately bypasses this path, because draining from an
  // unknown state is not safer than dying.
  app.enableShutdownHooks();

  await app.listen(port);
  console.log(`Server listening on port ${port}`);
}

bootstrap();
