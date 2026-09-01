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
        nextUser?.avatarUrl === user?.avatarUrl
      ) {
        return;
      }
      status = next.status;
      user = nextUser;
      for (const listener of listeners) listener();
    },
  };
}
