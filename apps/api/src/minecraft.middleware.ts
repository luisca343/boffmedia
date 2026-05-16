import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggingUtil } from './_utils/LoggingUtils';
import multer from 'multer';

@Injectable()
export class MinecraftMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const isGet = req.method === 'GET';
    const mcWorld = process.env.MC_WORLD;
    const serverField = req.body && req.body.server;
    if (isGet || (serverField && serverField === mcWorld)) {
      if (LoggingUtil.getInstance().getLogging()) {
        console.log(`Accessing ${req.method} ${req.url}`);
        if (req.body && Object.keys(req.body).length > 0) console.log(req.body);
      }
      next();
    } else {
      if (LoggingUtil.getInstance().getLogging()) {
        console.log(`Failed to access ${req.method} ${req.url}`);
        if (req.body) console.log(req.body);
      }
      res
        .status(403)
        .send({ message: 'You are not authorized to access this route.' });
    }
  }
}
