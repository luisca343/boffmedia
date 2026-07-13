import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggingUtil } from './_utils/LoggingUtils';
import { Logger } from 'nestjs-pino';
import { env } from '@/config/env';

// NOT a security boundary. The required `server` value is NEXT_PUBLIC_MC_WORLD,
// which ships in the client bundle — anyone reading the JS can extract it. This
// is a tripwire against casual/accidental cross-environment writes; real
// authorization on /smartrotom routes is the JWT + roles guards.
@Injectable()
export class MinecraftMiddleware implements NestMiddleware {
  constructor(private readonly logger: Logger) {}

  use(req: Request, res: Response, next: NextFunction) {
    const isGet = req.method === 'GET';
    const mcWorld = env.MC_WORLD;
    const serverField = req.body && req.body.server;
    if (isGet || (serverField && serverField === mcWorld)) {
      if (LoggingUtil.getInstance().getLogging()) {
        this.logger.log(`Accessing ${req.method} ${req.url}`);
        if (req.body && Object.keys(req.body).length > 0)
          this.logger.log(req.body);
      }
      next();
    } else {
      if (LoggingUtil.getInstance().getLogging()) {
        this.logger.log(`Failed to access ${req.method} ${req.url}`);
        if (req.body) this.logger.log(req.body);
      }
      res
        .status(403)
        .send({ message: 'You are not authorized to access this route.' });
    }
  }
}
