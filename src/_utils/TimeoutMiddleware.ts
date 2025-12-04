import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TimeoutMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.error(`⏱️ Request timeout: ${req.method} ${req.url}`);
        res.status(504).json({
          statusCode: 504,
          message: 'Gateway Timeout',
          error: 'The server took too long to respond',
          timestamp: new Date().toISOString(),
          path: req.url,
        });
      }
    }, 30000); // 30 second timeout

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
    
    next();
  }
}
