import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class MinecraftMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if(req.method === 'GET' || req.body.server === process.env.MC_WORLD) {
      console.log(`Accessing ${req.method} ${req.url}`);
      if(req.body) console.log(req.body);
      next();
    } else {
      console.log(`Failed to access ${req.method} ${req.url}`);
      console.log(req.body);
      res.status(403).send({message: 'You are not authorized to access this route.'});
    }
  }
}