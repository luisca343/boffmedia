# NextAuth 4 → Auth.js 5 migration plan

**Date:** 2026-09-04 · **Branch:** `audit/product-backlog-2026-09` · **Status:** planned, not started
**Audit finding:** X7 (should) — "NextAuth 4 is in maintenance mode"
**Owner decision (Q3, 2026-09-04):** write the plan now, execute it in its own cycle.

---

## 1. Goal, and what this document is not

`next-auth@4.24.13` receives security fixes and nothing else. The successor, Auth.js 5, has been
`next-auth@5.0.0-beta.*` for over two years. This document exists so the migration can be started on
a known map rather than a generic upgrade guide.

It is **not** a v4→v5 changelog. Everything below is tied to a file in this repo. Anything v5 changed
that `apps/web` does not use — database adapters, `withAuth`, `next-auth/middleware`, the Email
provider, `unstable_getServerSession` — is omitted on purpose, because listing it would hide the
seven things that actually break.

**Nothing in this document is executed by this cycle.** `apps/web/src/features/authOptions.ts` and
every file it touches are unchanged.

---

## 2. Versions, as installed today

| Package | `apps/web/package.json` | Installed | Note |
|---|---|---|---|
| `next-auth` | `^4.24.6` | `4.24.13` | maintenance mode |
| `next` | `16.0.7` | — | pinned exact |
| `react` / `react-dom` | `19.2.3` | — | pinned exact |
| `@playwright/test` | `^1.49.1` | — | e2e |
| `vitest` | `^4.1.10` | — | unit |

**The peer-dependency question is the first thing to check, and it is not answerable from inside this
repo.** `next-auth@5` beta has historically declared `next: ^14 || ^15` and `react: ^18.2 || ^19`.
Next 16 is very likely outside that range, which means the install needs a `pnpm.overrides` entry or
a `peerDependencyRules.allowedVersions` rule. Before Stage 1, run:

```
pnpm view next-auth@beta version peerDependencies
```

If the answer still excludes Next 16, that alone is a reason to wait (§9). A pinned-exact
`next: 16.0.7` plus a peer override on the auth layer is precisely the configuration that
type-checks and then misbehaves at runtime in a way no gate catches.

---

## 3. The surface being migrated

### 3.1 Everything that imports `next-auth`

Confirmed by grep across `apps/web/src` **and** `packages/`. `packages/` has **zero** hits — no
workspace package imports `next-auth`, so `@boffmedia/ui` stays host-agnostic through this work and
`apps/desktop` is not in scope at all. The blast radius is exactly `apps/web/src`.

| Import | Files | v5 status |
|---|---|---|
| `next-auth` (`NextAuthOptions`, `Session`, `CookiesOptions`, `DefaultSession`, `DefaultUser`) | `features/authOptions.ts`, `types/index.ts`, `stores/useSessionStore.ts`, `utils/socketHelpers.ts`, `services/useBoffSession.ts`, `services/useSocketAuth.ts`, `providers/UserSocketListener.tsx`, `components/smartrotom/AppWrapper.tsx`, `app/smartrotom/chatapp/_hooks/useGetChats.ts` | `NextAuthOptions` **renamed**; `Session` survives |
| `next-auth/react` (`useSession`, `signIn`, `signOut`, `getSession`, `SessionProvider`) | 16 files | survives unchanged |
| `next-auth/next` (`getServerSession`) | 8 route handlers under `app/api/{discord,google,twitch,steam}/**` | **package path removed** |
| `next-auth/providers/{credentials,google,discord,twitch}` | `features/authOptions.ts` | survives; profile types re-exported |
| `next-auth/jwt` (module augmentation) | `types/index.ts:52` | augmentation target moves |
| default `NextAuth()` | `app/api/auth/[...nextauth]/route.ts` | **initialisation model changes** |

### 3.2 What is *not* in the surface, and why that is good news

- **No middleware.** Next 16 renamed `middleware.ts` to `proxy.ts`; `apps/web/src/proxy.ts` is 46
  lines and contains no reference to auth, sessions, tokens or cookies. The single largest v5
  migration pain — `withAuth` and the edge-runtime session read — does not apply here.
- **No adapter.** `session.strategy: "jwt"`, no database adapter. The adapter API churn is moot.
- **No `events`.** `events: {}` in `authOptions` is empty.

### 3.3 The session shape

Declared in `apps/web/src/types/index.ts` as `BoffUser`, then augmented onto three v4 interfaces:

```ts
declare module "next-auth"      { interface Session { user: BoffUser & DefaultSession["user"] }
                                  interface User extends BoffUser {} }
declare module "next-auth/jwt"  { interface JWT extends BoffUser {} }
```

`BoffUser` carries `id · email · username · mcUuid? · roles · smartRotomUser? · discordId? · image? ·
profilePicture? · accessToken? · refreshToken? · twoFactorPending? · twoFactorEnrolled? ·
challengeToken?`.

Note the asymmetry that already exists and must be preserved: `refreshToken` lives on the **JWT
only**. The `session` callback in `authOptions.ts` copies `accessToken` onto `session.user` and
deliberately does not copy `refreshToken`. Any migration that "simplifies" that callback into a
spread of the token leaks a 7-day credential to the browser.

---

## 4. What landed on 2026-09-04, and why it changes the migration

Commit `0e77dc038` — *"rotate refresh tokens with reuse detection, require 2FA for admins"*. This is
the newest and least-settled part of the auth surface, and two of its mechanisms are coupled to v4
*behaviour* rather than merely running on top of it.

### 4.1 Refresh rotation and the 30-second grace window

`apps/api/src/api/auth/auth.service.ts` keeps a jti/family ledger. A refresh token dies the instant
it is exchanged; presenting a spent one revokes the whole family. `REFRESH_ROTATION_GRACE_MS =
30_000` forgives a second presentation inside 30 seconds, and its comment names the reason
explicitly:

> NextAuth runs its `jwt` callback per request, so two page loads landing in the same millisecond
> both read the same stored refresh token and both post it.

The web side already narrows this: the `jwt` callback refreshes only when `trigger === 'update'`,
when `lastUpdated` is unset, or when the token is older than 55 minutes. A `TERMINAL_REFRESH_CODES`
list (`AUTH_REFRESH_REUSE_DETECTED`, `AUTH_REFRESH_INVALID`,
`AUTH_TWO_FACTOR_ENROLMENT_REQUIRED` — all present in
`packages/shared/src/errorCodes.generated.ts`) clears both tokens; anything else, including a 5xx or
a network failure, leaves the pair alone.

**Does the grace window survive v5? Yes — and the case for it gets stronger, not weaker.**

Auth.js 5 did not change *when* the `jwt` callback runs. It still fires on every session read: every
`/api/auth/session` fetch, every `auth()` call, every `useSession()` mount that misses the client
cache. The mechanism the comment describes — concurrent reads of the same stored refresh token — is
unchanged.

What v5 *adds* is a new place the callback can be invoked from: `auth()` inside a proxy/middleware.
This repo does not do that today (§3.2), and **the migration must not start doing it.** Wrapping
`proxy.ts` in `auth()` would run the `jwt` callback once for the document request and again for the
session fetch it triggers, doubling the number of racing refreshes the 30-second window has to
absorb. If a later cycle wants route protection in `proxy.ts`, the window has to be re-derived first.

Two caveats to verify rather than assume, because both would be silent:

1. **`trigger` and `session` in the v5 `jwt` callback.** The two-factor promotion path
   (`trigger === 'update' && session.twoFactor`) is the only writer of a real `accessToken` after a
   pending sign-in. If v5 renames or reshapes either argument, the promotion silently never fires and
   the admin is stuck on `/entrar/2fa` holding a session that looks authenticated.
2. **`token.lastUpdated`.** A custom claim. It survives an encoding change in *shape*, but not across
   a decode failure (§5.4) — after which every token is treated as new and refreshes at once. That is
   a thundering-herd risk against the grace window on the deploy itself, not afterwards.

**Verdict: the 30s window stays as-is. It needs no replacement.** What it needs is a line added to its
comment saying the justification was re-checked against v5 — that comment is currently the only
record of why the number exists.

### 4.2 Mandatory admin TOTP

Four doors create a *pending* session: the `boffmedia` credentials provider (`authorize` returns a
stub) and the `google` / `discord` / `twitch` branches of the `signIn` callback (each **mutates the
`user` object** in place). A pending session carries `id: PENDING_TWO_FACTOR_USER_ID` (`"pending-2fa"`,
from `features/twoFactorSession.ts`), `roles: []`, `twoFactorPending: true`, a `challengeToken`, and
**no `accessToken`** — so it can reach nothing.

`features/TwoFactorGate.tsx`, mounted once in `app/GlobalProviders.tsx`, watches
`session.user.twoFactorPending` and redirects to `/entrar/2fa`. Its own comment is honest that this is
convenience, not enforcement — the API is what refuses.
`components/boffmedia/ui/auth/TwoFactorScreen.tsx` finishes the flow by calling
`update({ twoFactor: <AuthLoginResponseEntity> })`, which the `jwt` callback reads and promotes.

**The migration risk here is the `signIn` callback mutating `user`.** Three of the four doors depend
on the object identity of `user` being carried from `signIn` into `jwt`. That is documented v4
behaviour but it is *behaviour*, not a contract — v5 rebuilt the OAuth flow on `@auth/core`. If the
mutation is dropped, an admin signing in through Google gets a session with `twoFactorPending`
undefined, `roles: []` and no `accessToken`: `TwoFactorGate` never fires, the app renders as a
signed-in user with no permissions, and every API call 401s. Nothing throws. This is the single most
important thing to test by hand in Stage 4.

---

## 5. Breaking changes that affect *this* repo

Ordered by how expensive they are to get wrong, not by how much code they touch.

### 5.1 `authorize()` throws no longer reach the client — `CredentialsForm.tsx`

**Severity: high, and silent.**

`features/authOptions.ts` rethrows `ApiErrorCode.SERVICE_DATABASE_UNAVAILABLE` out of `authorize()`
specifically so that an API outage does not read as a wrong password. The comment says so. The
receiving end is `components/boffmedia/ui/auth/CredentialsForm.tsx:101`:

```ts
const unreachable = res.error.includes(ApiErrorCode.SERVICE_DATABASE_UNAVAILABLE)
toast.error(t(unreachable ? "errors.serviceUnavailable" : "errors.signIn"))
```

Auth.js 5 wraps everything thrown from `authorize()` in `CredentialsSignin` and does **not** pass the
message through — `res.error` becomes the literal string `"CredentialsSignin"`. The `.includes()`
check goes permanently false, and a database outage tells every user their password is wrong. The
regression is invisible in normal operation; it appears only during an incident, which is the worst
possible time to discover it.

Fix: the API's error code has to travel in a channel v5 preserves — a custom `code` on a
`CredentialsSignin` subclass, read off `res.code`, or a pre-flight probe. Decide this in Stage 0, not
mid-migration.

### 5.2 `getServerSession(authOptions)` → `auth()` — 8 route handlers

**Severity: medium, loud.** `next-auth/next` no longer exists, so these fail to compile:

| File | Line |
|---|---|
| `app/api/discord/link/route.ts` | 18 |
| `app/api/discord/link/callback/route.ts` | 36 |
| `app/api/google/link/route.ts` | 18 |
| `app/api/google/link/callback/route.ts` | 36 |
| `app/api/twitch/link/route.ts` | 18 |
| `app/api/twitch/link/callback/route.ts` | 36 |
| `app/api/steam/link/route.ts` | 11 |
| `app/api/steam/callback/route.ts` | 22 |

Four of the eight then read `(session?.user as { accessToken?: string })?.accessToken` and forward it
to the API. That cast is doing real work — it is how a link callback authenticates. It must keep
returning a value, and a `null` there fails as a 401 from the API rather than as a local error.

### 5.3 The initialisation model — `[...nextauth]/route.ts` and `authOptions.ts`

**Severity: medium, loud.** Today: a `NextAuthOptions` object → `NextAuth(authOptions)` → one
`handler` exported as both `GET` and `POST`. In v5: a `NextAuthConfig` passed to `NextAuth()`, which
returns `{ handlers, auth, signIn, signOut }`, conventionally from a root `auth.ts`, with the route
file reduced to `export const { GET, POST } = handlers`.

Mechanical, but it changes *where* the config lives, and `features/authOptions.ts` is imported by 11
files. Keep the file name and the `authOptions` export as an alias through the migration; renaming it
in the same commit turns one reviewable diff into forty.

### 5.4 Cookie names, JWT encryption, and the mass sign-out

**Severity: high, and it hits every logged-in user at once.**

`authOptions.ts` explicitly names the session cookie — `next-auth.session-token` on a plain-HTTP
host, `__Secure-next-auth.session-token` otherwise, with `domain: '.boffmedia.es'` in production and
`.ficuslab.es` elsewhere, chosen by whether `NEXTAUTH_URL`/`NEXT_PUBLIC_URL` starts with `http://`.
Because the name is explicit, v5's rename to `authjs.session-token` **does not** apply to it. That is
a genuine advantage this repo has over most v4 codebases. The CSRF and callback-url cookies are not
overridden, so those do get renamed; harmless.

The problem is underneath the name. `@auth/core` changed the JWT encryption derivation (the HKDF salt
is derived from the cookie name, and the content encryption algorithm changed). An existing v4 token
in an existing v4-named cookie **cannot be decrypted by v5**. The browser holds a cookie the server
reads as garbage. What the user sees depends on how v5 handles a decode failure — best case an
immediate sign-out, worst case a loop between a page that believes there is a cookie and a session
endpoint that says there is not.

`session.maxAge` is 30 days, so this is not a handful of users. Plan for it: it is a one-shot event at
deploy, it cannot be undone by reverting the code (the cookie is already invalid in the user's
browser either way), and it is why Stage 5 exists as its own stage.

Second-order effect: every signed-out user re-authenticates at once, and every admin re-runs the TOTP
challenge. If admin 2FA enrolment (§4.2) is still fresh at that point, a deploy-time mass sign-out is
also a mass first-time enrolment. Do not do both in the same week.

### 5.5 Environment variables and `AUTH_TRUST_HOST`

**Severity: medium; loud in one direction, silent in the other.**

`apps/web/src/config/env.ts` requires `NEXTAUTH_SECRET` (zod, no default). `authOptions.ts` reads
`process.env.NEXTAUTH_URL` **directly**, outside the schema, to decide the cookie hardening. v5
prefers `AUTH_SECRET` / `AUTH_URL` and infers provider credentials from `AUTH_GOOGLE_ID`-style names;
the legacy names are still read, so the rename is not urgent.

The trap is that direct `process.env.NEXTAUTH_URL` read. If a later cleanup renames the deployment's
variable to `AUTH_URL` without touching that line, `appUrl` falls back to `env.NEXT_PUBLIC_URL` and
the branch can pick the wrong cookie. Fail-closed saves you (an unset value does not start with
`http://`, so the hardened cookie wins) — but only by luck, and only in one direction.

`AUTH_TRUST_HOST` is the loud one: v5 refuses to run behind a reverse proxy without it unless
`AUTH_URL` is set, and this deployment is self-hosted behind one. Missing it is an outright
`UntrustedHost` failure on the first request, which is the good kind of failure.

### 5.6 Module augmentation target — `types/index.ts`

**Severity: low, loud — if you check.** `declare module "next-auth/jwt"` needs to become the
`@auth/core/jwt` augmentation (v5 re-exports `next-auth/jwt`, but the interface it merges into
moved). If the augmentation silently stops applying, `token.accessToken` and friends degrade to
`any`/`unknown` and typos in token fields stop being errors. Verify by deliberately breaking one
field and confirming the type error appears — an augmentation that quietly does nothing still
compiles.

### 5.7 Provider profile types

**Severity: low, loud.** `GoogleProfile`, `DiscordProfile`, `TwitchProfile` are imported from
`next-auth/providers/*` and used in the `signIn` callback to read `sub` / `picture` / `avatar` /
`global_name` / `preferred_username`. v5 re-exports these from the same paths but the shapes come
from `@auth/core/providers`. Field-level drift shows up as a type error — except where the code
already casts (`profile as (GoogleProfile & { image?: string }) | undefined`), which would absorb a
rename. Re-check those four fields by hand.

---

## 6. Session and JWT shape: before and after

**No intentional change.** The point of this migration is that nothing downstream of the `session`
callback notices. The shape below is the contract all 16 `useSession()` files depend on and it must
be identical after.

| Field | JWT (v4) | Session (v4) | JWT (v5) | Session (v5) |
|---|---|---|---|---|
| `id` | ✓ | ✓ | ✓ | ✓ |
| `email`, `name`, `image` | ✓ | ✓ | ✓ | ✓ |
| `roles: UserRole[]` | ✓ | ✓ | ✓ | ✓ |
| `smartRotomUser` | ✓ | ✓ | ✓ | ✓ |
| `accessToken` | ✓ | ✓ | ✓ | ✓ |
| `refreshToken` | ✓ | **✗ (deliberate)** | ✓ | **✗ (must stay ✗)** |
| `twoFactorPending` | ✓ | ✓ | ✓ | ✓ |
| `twoFactorEnrolled` | ✓ | ✓ | ✓ | ✓ |
| `challengeToken` | ✓ | ✓ | ✓ | ✓ |
| `lastUpdated` | ✓ | ✗ | ✓ | ✗ |

Two shape facts that are load-bearing and easy to lose in a rewrite:

- **`name` is written from `user.username ?? user.name`.** The Minecraft provider's own comment says
  `AppWrapper`'s `boffMediaLinked()` gate requires it. A v5 rewrite that trusts the provider's `name`
  breaks the SmartRotom link check with no error anywhere.
- **A pending session's `roles` is `[]`, not `undefined`.** `useBoffSession().hasRole()` handles both,
  but `tests/admin.setup.ts` asserts on `session.user.roles` and prints the array in its failure
  message.

---

## 7. Staged sequence

Each stage is one commit on a branch off `master`, with a named rollback point. The gate for every
stage is `pnpm --filter web type-check` — never root `pnpm lint`, which runs with `--fix` and rewrites
unrelated `apps/api` files.

### Stage 0 — decide the two open questions (no code)

1. How does the `SERVICE_DATABASE_UNAVAILABLE` signal survive `CredentialsSignin` (§5.1)?
2. Does `next-auth@beta` accept Next 16, or does it need a `pnpm` override (§2)?

**Rollback:** n/a. **Verified by:** an owner decision written back into §2 and §5.1 of this document.
If (2) needs an override, stop and re-read §9 before continuing.

### Stage 1 — install and initialise, behaviour frozen

Bump `next-auth`, add `AUTH_TRUST_HOST` to the deployment, introduce the `NextAuth()` call returning
`{ handlers, auth, signIn, signOut }`, keep the config object in `features/authOptions.ts` and keep
exporting it as `authOptions`. Update `app/api/auth/[...nextauth]/route.ts`. Fix the `types/index.ts`
augmentation. Do not touch a single callback body.

**Rollback:** revert the commit; nothing has been deployed.
**Verified by:** `pnpm --filter web type-check`, and `pnpm --filter web test:unit` (14 vitest files —
none of them touch auth, so this proves only that nothing unrelated regressed).

### Stage 2 — the 8 `getServerSession` call sites

Mechanical replacement with `auth()`. Keep the `accessToken` cast.

**Rollback:** revert; Stage 1 is independently valid.
**Verified by:** type-check, plus a manual link/unlink round trip for Discord, Google, Twitch and
Steam against a dev API. **There is no automated coverage for these eight routes** — `tests/specs/`
has no linking spec. This is a known hole and Stage 2 is where it costs you.

### Stage 3 — the credentials error channel (§5.1)

Implement the Stage 0 decision in `authorize()` and `CredentialsForm.tsx`.

**Rollback:** revert; the app still signs in, it just misreports outages.
**Verified by:** stop the API and attempt a login. Expect `errors.serviceUnavailable`, not
`errors.signIn`. This is a manual test and it must actually be run — it is the entire point of the
stage.

### Stage 4 — the two-factor and refresh paths

Verify, do not rewrite: that `signIn` mutations on `user` still reach `jwt` (§4.2); that
`trigger === 'update'` with `{ twoFactor }` still promotes (§4.1 caveat 1); that a 55-minute-old token
still refreshes and an `AUTH_REFRESH_REUSE_DETECTED` response still clears both tokens.

**Rollback:** revert to Stage 3. This is the last cleanly reversible stage.
**Verified by:** manual, on a dev deployment, all four sign-in doors — credentials, Google, Discord,
Twitch — with an admin account and a non-admin account. Eight paths. Then
`pnpm --filter web test -- --project=chromium:auth` and `--project=chromium:admin`, which mint real
sessions through the UI (`tests/auth.setup.ts`, `tests/admin.setup.ts`) and assert that
`/api/auth/session` returns a user with the expected roles. Those two setup files are the only
automated proof that a session survives this migration at all — and per §10 they need fixing before
they can prove anything.

### Stage 5 — deploy, and the mass sign-out

Deploy at a low-traffic hour. Every existing session dies (§5.4).

**Rollback:** the point of no return, in one direction only. Reverting the code restores a working
v4, but every cookie the v5 deploy invalidated stays invalid — the users signed out by the deploy stay
signed out either way. Announce it; do not schedule it in the same week as an admin 2FA enrolment
push; watch the API's `Refresh token reuse detected` warning log for a spike (§4.1 caveat 2).

**Verified by:** a fresh sign-in from a cleared browser on production; `/api/auth/session` returns a
populated `user`; an admin receives the TOTP challenge; the API log shows no family revocations
beyond expected re-login noise.

---

## 8. Risks — specifically the silent ones

Loud failures are cheap: the type-checker or a 500 finds them. These are the ones that pass every gate
and get discovered by a user.

| # | What breaks | Why nothing catches it | Detection |
|---|---|---|---|
| 1 | `signIn` mutations on `user` stop reaching `jwt` (§4.2) | The mutation is a side effect on an object, not a return value. An admin gets a session that renders as signed-in with `roles: []` and no `accessToken`; `TwoFactorGate` never fires. Every API call 401s, which reads as "the API is down" | Stage 4, manual, all three OAuth doors with an admin account. Nothing else will find it |
| 2 | A DB outage reported as a bad password (§5.1) | `res.error.includes(...)` goes false and takes the `else`. Correct-looking code, correct-looking toast, wrong message — and only during an incident | Stage 3, manual, with the API stopped |
| 3 | `token.name` sourced from the provider instead of `user.username ?? user.name` | `AppWrapper`'s `boffMediaLinked()` gate goes false; SmartRotom looks unlinked for users who are linked | Stage 4 with a Minecraft-linked account |
| 4 | The `jwt` augmentation stops merging (§5.6) | Fields degrade to `any`. Everything still compiles, and a typo in a token field is no longer an error | Deliberately break one field; confirm the error appears |
| 5 | `refreshToken` leaks into the session (§6) | A "simplification" of the `session` callback into a token spread. Nothing fails; the browser now holds a 7-day credential | Assert on the JSON from `/api/auth/session` in Stage 4 |
| 6 | Refresh thundering herd at deploy (§4.1 caveat 2) | Every token decodes as new, so every client refreshes near-simultaneously. The 30s grace window absorbs pairs, not crowds | Watch the API warn log at Stage 5 |
| 7 | `auth()` added to `proxy.ts` "because v5 makes it easy" | Doubles the per-request `jwt` invocations and quietly halves the grace window's headroom | Do not do it. If a later cycle wants it, re-derive `REFRESH_ROTATION_GRACE_MS` first |
| 8 | `NEXTAUTH_URL` → `AUTH_URL` rename without touching `authOptions.ts` (§5.5) | That line reads `process.env` directly, bypassing the zod schema. Fail-closed hides it in production; it misbehaves on a dev box instead | Grep for `NEXTAUTH_URL` before any env rename |

---

## 9. Effort, and when to do it

**Estimate: 3–5 working days**, on this basis:

| Stage | Basis | Days |
|---|---|---|
| 0 | Two decisions, one of them a design choice for the error channel | 0.5 |
| 1 | One config file, one route file, one types file. Mechanical | 0.5 |
| 2 | 8 near-identical call sites, then a manual round trip on 4 OAuth link flows with no test coverage | 1 |
| 3 | Small diff, but it is a new error-propagation design | 0.5 |
| 4 | 8 sign-in paths × manual verification, plus refresh and promotion. This is where the time goes | 1.5 |
| 5 | Deploy window and observation | 0.5 |

The dominant cost is not the code. It is that **the parts most likely to break silently are the parts
with no automated coverage**: 14 vitest files, none auth-related; a Playwright suite whose only auth
assertions live in two setup files; zero coverage of the OAuth link routes; zero coverage of the
two-factor flow that shipped today.

### The case for waiting

1. **Auth.js 5 is still `5.0.0-beta`.** Migrating off a maintained-but-frozen v4 onto a beta trades a
   known-stale dependency for an unknown-moving one. X7 is a *should*, not a *must*: v4 still gets
   security fixes.
2. **Next 16 is probably outside the beta's peer range (§2).** An auth layer installed through a peer
   override is exactly the configuration that type-checks and then surprises you in production.
3. **The 2FA and rotation work is one day old.** Commit `0e77dc038` has not been through a full
   admin-enrolment cycle in production. Migrating the framework underneath code that new means every
   bug found afterwards has two candidate causes, and the cost of that ambiguity exceeds the
   migration itself.
4. **The mass sign-out (§5.4) is a user-visible event** and should not land in the same window as
   mandatory admin TOTP enrolment.

### The recommendation

**Do Stage 0 now — half a day, pure information.** It tells you whether Next 16 is even supported, and
it forces the credentials-error design decision while the reasoning behind `CredentialsForm.tsx:101`
is still fresh in someone's head.

**Hold Stages 1–5 until two conditions are met:** `next-auth@5` is out of beta *or* declares Next 16
support, and the 2FA/rotation work has run for at least one full 7-day refresh cycle in production
without incident.

**Then, before Stage 1, spend a day on coverage rather than on migration:** a Playwright spec for the
two-factor gate, and one for an OAuth link round trip. Those two specs turn risks 1 and 3 from
"discovered by an admin" into "discovered by CI", and they are worth having whether or not this
migration ever happens. That is the cheapest risk reduction available here by a wide margin.

---

## 10. Found while reading — reported, not fixed

Pre-existing, unrelated to v5, and left alone by this cycle.

1. **`tests/auth.setup.ts:28` and `tests/admin.setup.ts:45` both `page.goto("/auth")`, and `/auth` no
   longer exists.** `authOptions.ts` states plainly that `/entrar` is the only login entry point, and
   `apps/web/src/app/(boffmedia)/` contains `entrar` with no `auth` sibling. Both setups then wait for
   `!url.pathname.startsWith("/auth")` — a condition a 404 satisfies instantly. The Playwright auth
   projects are very likely authenticating nothing. `auth.setup.ts` would still fail at its
   `/api/auth/session` check, so this is loud rather than silent — but the error message points at
   cookie options, not at a dead route.

2. **`tests/admin.setup.ts` cannot pass now that admin 2FA is mandatory.** It performs a credentials
   login and asserts the session carries `ROTOM_ADMIN` or `BOFF_ADMIN`. After `0e77dc038`, an admin's
   credentials login returns a *pending* session with `roles: []`. The assertion fails loudly with a
   message instructing the operator to grant a role the account already holds. Its comment about the
   localhost cookie workaround ("nothing to work around now") also now describes a flow that ends at
   a challenge rather than at a session.

3. **`utils/refreshSession.ts` calls `window.location.reload()`** after `getSession()`, and
   `useBoffSession().refreshSession()` falls back to it whenever `update()` throws. A full page reload
   as the error path for a token refresh looks to a user like a random reload mid-form. Unrelated to
   v5, but it sits in the blast radius of Stage 4 testing and will muddy those results.

4. **`components/smartrotom/Settings.tsx:41–42` copies `session.user.accessToken` to the clipboard.**
   It reads as a deliberate developer affordance, but it puts a bearer token in the system clipboard,
   where any page can read it on the next paste. Worth an explicit decision rather than leaving it as
   an accident.
