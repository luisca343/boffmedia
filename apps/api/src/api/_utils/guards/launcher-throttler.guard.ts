import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate-limits launcher actions per **launcher principal**. Launcher requests do
 * not populate `req.user` (LauncherAuthGuard fills `req.launcher` instead), so
 * UserThrottlerGuard would key every launcher in the world onto the same IP
 * bucket. Falls back to IP when the guard has not run.
 */
@Injectable()
export class LauncherThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const launcher = req.launcher;
    const id = launcher?.userId ?? launcher?.uuid;
    return id ? `launcher:${id}` : req.ip;
  }
}
