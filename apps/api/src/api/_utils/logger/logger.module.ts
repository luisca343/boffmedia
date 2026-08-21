import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { env } from '@/config/env';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: env.NODE_ENV === 'production' ? 'info' : 'debug',
        // Dev logs go to BOTH the console and a file. The console is the one
        // people read, but a terminal scrollback truncates, and a flow worth
        // debugging (the Microsoft device-code chain, say) can outlive it. The
        // file is relative to apps/api, and `*.log` is gitignored.
        transport:
          env.NODE_ENV !== 'production'
            ? {
                targets: [
                  {
                    target: 'pino-pretty',
                    options: { colorize: true, singleLine: false },
                    level: 'debug',
                  },
                  {
                    target: 'pino/file',
                    options: { destination: 'logs/api-dev.log', mkdir: true },
                    level: 'debug',
                  },
                ],
              }
            : undefined,
        customProps: () => ({
          service: 'boffmedia-api',
          environment: env.NODE_ENV,
        }),
        // Belt and braces: call sites must not log credentials, but a single
        // `logger.log('...', dto)` anywhere puts the DTO under `context`, so
        // redact the credential-shaped keys there (and one level down) too.
        redact: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["set-cookie"]',
          'res.headers["set-cookie"]',
          'req.body.password',
          'req.body.token',
          'context.password',
          'context.newPassword',
          'context.currentPassword',
          'context.token',
          'context.accessToken',
          'context.refreshToken',
          'context.secret',
          'context.*.password',
          'context.*.token',
        ],
        // Without these, pino serializes the WHOLE header block — and because
        // nestjs-pino binds the request to every line logged inside its scope,
        // one request printed it three times over. Keep what identifies the
        // call and who made it; the rest (sec-ch-ua, cf-*, accept-*) is bulk
        // that makes the log unreadable and costs disk on every hit.
        serializers: {
          req: (req: {
            id?: unknown;
            method?: string;
            url?: string;
            query?: unknown;
            headers?: Record<string, string | string[] | undefined>;
            remoteAddress?: string;
          }) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            query: req.query,
            // Behind Cloudflare the socket address is always the proxy, so the
            // caller is only identifiable from the forwarded header.
            ip:
              req.headers?.['cf-connecting-ip'] ??
              req.headers?.['x-real-ip'] ??
              req.remoteAddress,
            userAgent: req.headers?.['user-agent'],
          }),
          res: (res: { statusCode?: number }) => ({
            statusCode: res.statusCode,
          }),
        },
        autoLogging: {
          ignore: (req) => ['/health', '/metrics'].includes(req.url ?? ''),
        },
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
