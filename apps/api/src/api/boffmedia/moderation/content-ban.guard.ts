import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { ModerationService } from './moderation.service';

/**
 * Refuses a create/update request from an account under a live content ban.
 *
 * A guard rather than a check inside each service so a surface adopts the
 * sanction by adding one decorator, in the same spirit as the registry: the
 * moderation module stays the only place that knows what a ban is.
 *
 * Runs AFTER `JwtAuthGuard` — it reads `req.user.userId` and `req.user.mcUuid`,
 * which that guard populates (`mcUuid` is the in-game identity, the one Rooker
 * content is authored under). Put it second in the `@UseGuards` list; on its
 * own it silently lets everything through, because an unauthenticated request
 * has nobody to be banned.
 */
@Injectable()
export class ContentBanGuard implements CanActivate {
  constructor(private readonly moderation: ModerationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<
        Request & { user?: { userId?: number; mcUuid?: string | null } }
      >();
    const userId = req.user?.userId;
    const uuid = req.user?.mcUuid;
    if (userId == null && !uuid) return true;

    await this.moderation.assertCanCreateContent({ userId, uuid });
    return true;
  }
}
