import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: { colorize: true, singleLine: false },
              }
            : undefined,
        customProps: () => ({
          service: 'boffmedia-api',
          environment: process.env.NODE_ENV,
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
