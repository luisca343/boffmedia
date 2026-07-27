import { ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { ApiErrorCode } from '@/common/errors/error-codes.generated';

/**
 * Who is performing a money/admin action, as resolved by GameOrUserAuthGuard.
 * `serverAuthed` = the trusted game server (ownership checks skipped).
 * Otherwise `mcUuid` identifies the signed-in user; when it is present,
 * ownership MUST be enforced. `mcUuid` is undefined only on the transitional
 * tripwire path (ENFORCE_MONEY_AUTH off), where ownership is not yet enforced.
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

// The trusted server and the transitional tripwire path carry no identity, so there is
// nothing to compare against and ownership cannot be enforced on them.
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
