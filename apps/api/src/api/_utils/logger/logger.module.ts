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
        redact: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.token',
        ],
        autoLogging: {
          ignore: (req) => ['/health', '/metrics'].includes(req.url ?? ''),
        },
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
