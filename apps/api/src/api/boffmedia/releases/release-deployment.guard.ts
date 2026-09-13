import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { env } from '@/config/env';
import { matchesSecret } from '@api/_utils/auth/secret-compare';

@Injectable()
export class ReleaseDeploymentGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers['x-release-deployment-token'];
    if (
      typeof token !== 'string' ||
      !matchesSecret(token, env.RELEASE_DEPLOYMENT_TOKEN)
    ) {
      throw new UnauthorizedException('Invalid release deployment credential');
    }
    return true;
  }
}
