/**
 * Who is using the tool, if anyone.
 *
 * The `api` capability can already fail a call with `needsSignin`, but that is
 * an answer arriving after the question. A tool needs to know BEFORE it renders:
 * a collection screen for a signed-out player is not an error state, it is a
 * different (and perfectly good) screen — plan D4 says the Tools section works
 * with no Boffmedia account at all, and a tool that demanded one at the door
 * would be breaking that promise rather than reporting it.
 *
 * Deliberately thin. This says who the player is and how to offer them a
 * sign-in; it carries no roles, no token and no permissions, because a tool has
 * no business making an authorisation decision the API is going to make
 * properly anyway.
 */

export type ToolSessionStatus =
  /** The host has not resolved it yet. Render neither branch on this. */
  | "loading"
  /** No account. Not an error: the tool works, locally. */
  | "anonymous"
  | "signed-in";

export interface ToolSessionUser {
  /** The Boffmedia user id, as the API keys collections by. */
  id: string;
  name: string;
  avatarUrl?: string | null;
  /**
   * The account's roles, for HOST-SIDE VISIBILITY ONLY — see
   * `ToolManifest.requiredRoles`.
   *
   * This is the one exception to the "no roles" rule above, and the boundary
   * is worth stating precisely, because the rule itself is still right: a tool
   * must not branch on these. Deciding whether a request is ALLOWED belongs to
   * the API and nowhere else; deciding whether a tile is worth putting in
   * front of someone is a listing concern the host cannot answer without them.
   * Hiding a tool a player can never open is a courtesy, not a control — the
   * endpoint behind it refuses them either way.
   *
   * Empty for an anonymous session, and empty is also what a host that cannot
   * resolve roles reports: a listing that silently drops an admin tool is a
   * far better failure than one that offers a tool whose every call 403s.
   */
  roles?: string[];
}

export interface ToolSession {
  status(): ToolSessionStatus;
  /** Non-null exactly when `status()` is `"signed-in"`. */
  user(): ToolSessionUser | null;
  subscribe(listener: () => void): () => void;
  /**
   * Offer a sign-in, however this host does it: a route on the web, the device
   * flow screen in the app. Never assume it completes — a player can decline,
   * and the tool has to keep working when they do.
   */
  signIn(): void;
}

/**
 * A session store plus its publisher, for a host to drive.
 *
 * Both hosts learn about sign-in from React (next-auth on the web, the shell's
 * reducer in the app) while `configureToolHost` runs at import time, before any
 * provider exists — so the host holds this store and pushes into it, exactly as
 * the desktop does for `network`.
 */
/** Order-insensitive: two hosts may list the same roles differently. */
function sameRoles(a: string[] | undefined, b: string[] | undefined): boolean {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((role, index) => role === right[index]);
}

export function createToolSession(options: { signIn: () => void }): {
  session: ToolSession;
  publish(next: { status: ToolSessionStatus; user?: ToolSessionUser | null }): void;
} {
  let status: ToolSessionStatus = "loading";
  let user: ToolSessionUser | null = null;
  const listeners = new Set<() => void>();

  return {
    session: {
      status: () => status,
      user: () => user,
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      signIn: options.signIn,
    },
    publish(next) {
      const nextUser = next.status === "signed-in" ? (next.user ?? null) : null;
      // Compared rather than assigned blindly: a host that republishes on every
      // render (next-auth hands back a new object each time) would otherwise
      // notify every subscriber on every render.
      if (
        next.status === status &&
        nextUser?.id === user?.id &&
        nextUser?.name === user?.name &&
        nextUser?.avatarUrl === user?.avatarUrl &&
        // Compared by VALUE: roles arrive as a fresh array on every publish, so
        // an identity check here would notify on every render — and skipping
        // the comparison entirely would leave a listing showing yesterday's
        // tiles after a role change.
        sameRoles(nextUser?.roles, user?.roles)
      ) {
        return;
      }
      status = next.status;
      user = nextUser;
      for (const listener of listeners) listener();
    },
  };
}
