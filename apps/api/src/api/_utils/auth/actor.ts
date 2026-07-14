import { Request } from 'express';

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
