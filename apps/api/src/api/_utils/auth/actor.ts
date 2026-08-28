import { ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { ApiErrorCode } from '@/common/errors/error-codes.generated';
import { USER_ROLES } from './roles.constants';

/**
 * Who is performing a money/admin action, as resolved by GameOrUserAuthGuard.
 * `serverAuthed` = the trusted game server (ownership checks skipped).
 * Otherwise `mcUuid` identifies the signed-in user; when it is present,
 * ownership MUST be enforced.
 */
export interface ActorContext {
  serverAuthed: boolean;
  mcUuid?: string;
}

export function resolveActor(
  req: Request & { serverAuthed?: boolean; user?: { mcUuid?: string } },
): ActorContext {
  if (req.serverAuthed) return { serverAuthed: true };
  return { serverAuthed: false, mcUuid: req.user?.mcUuid };
}

// The trusted server carries no identity, so there is nothing to compare against
// and ownership cannot be enforced on it.
export function assertActsAsSelf(claimed: string, actor?: ActorContext): void {
  if (!actor || actor.serverAuthed || !actor.mcUuid) return;
  if (claimed !== actor.mcUuid) {
    throw new ForbiddenException({
      message: 'Actor may only act on their own behalf',
      code: ApiErrorCode.ACTOR_NOT_SELF,
      userMessage: 'No puedes actuar en nombre de otro jugador.',
    });
  }
}

// For bodies whose actor uuid is optional: a signed-in caller may omit it and is
// then resolved to their own uuid, never to somebody else's.
export function actingUuid(
  claimed: string | undefined,
  actor?: ActorContext,
): string | undefined {
  if (!actor || actor.serverAuthed || !actor.mcUuid) return claimed;
  if (claimed) assertActsAsSelf(claimed, actor);
  return actor.mcUuid;
}

/**
 * Which player a route acts on when the request body is allowed to name someone
 * other than the caller.
 *
 * `CurrentMcUuid` deliberately refuses to read an owner out of the body, and that
 * stays the rule: this helper is the single, explicit exception, and it only lets
 * an admin through. Anyone else naming another uuid is rejected rather than
 * silently redirected to their own rows — a silent fallback is what let the
 * Gobierno "Apps de jugador" screen edit the admin's own dock while showing
 * another player's name.
 */
export function adminTargetUuid(
  principal: { roles?: string[]; mcUuid?: string } | undefined,
  requested: string | undefined,
): string {
  const self = principal?.mcUuid;
  if (!self) {
    throw new ForbiddenException(
      'Esta cuenta no tiene una identidad de Minecraft vinculada',
    );
  }
  if (!requested || requested === self) return self;

  const roles = principal?.roles ?? [];
  const isAdmin =
    roles.includes(USER_ROLES.ROTOM_ADMIN) ||
    roles.includes(USER_ROLES.BOFF_ADMIN);
  if (!isAdmin) {
    throw new ForbiddenException({
      message: 'Only an admin may act on another player',
      code: ApiErrorCode.ACTOR_NOT_SELF,
      userMessage: 'No puedes actuar en nombre de otro jugador.',
    });
  }
  return requested;
}
