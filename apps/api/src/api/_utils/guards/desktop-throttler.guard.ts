import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate-limits desktop-app actions per **app principal**. App requests do
 * not populate `req.user` (DesktopAuthGuard fills `req.desktopClient` instead), so
 * UserThrottlerGuard would key every app install in the world onto the same IP
 * bucket. Falls back to IP when the guard has not run.
 */
@Injectable()
export class DesktopThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const client = req.desktopClient;
    const id = client?.userId ?? client?.uuid;
    return id ? `desktop:${id}` : req.ip;
  }
}
