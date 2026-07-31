# Minecraft Launcher — Project Handoff

Working notes and reference implementations for a custom Minecraft: Java Edition
launcher. Written as a handoff document: it carries the decisions **and the
reasoning behind them**, so settled questions don't get re-litigated.

Last updated: 30 July 2026

---

## 1. Goal

A desktop launcher to replace CurseForge for a private community, with:

- Mod installation and updates from **Modrinth** (primary) and **CurseForge** (fallback)
- Modpack sharing between users
- **Access control** — packs restricted to specific users, or gated behind a password
- Instance isolation, per-pack versioning, delta updates

The maintainer (`@luisc`) already runs **Boffmedia**: a Next.js frontend with a
NestJS backend. Reusing its design system and backend is a goal but not a
hard requirement.

---

## 2. Current status

| Item | State |
|---|---|
| Azure app registration | **Approved.** Full auth chain works end to end. |
| Client ID | `72c3e158-bb47-4ef7-a50c-f3ce51698108` (not a secret; safe to commit) |
| Auth chain (`mc_auth.py`) | **Working.** Signs in, returns profile, stores refresh token. |
| Install + launch | Rust/Tauri pipeline built and smoke-tested with vanilla and a custom NeoForge/Pixelmon pack. |
| Fabric / NeoForge | Implemented through `portablemc`; real-pack verification is ongoing. |
| Pack server / ACL | NestJS registry, launcher auth, ACLs, invites, overrides, and admin authoring are built. |
| CurseForge API key | Not yet applied for. |

Two Python scripts exist as **reference implementations / prototypes**, not as
the shipping launcher. They document the protocol precisely and are intended to
be ported. Full source in the appendices.

---

## 3. Hard constraints

These are non-negotiable and shaped several decisions below.

### 3.1 Microsoft authentication

- All Minecraft accounts are Microsoft accounts. Legacy Mojang/Yggdrasil auth is dead.
- Third-party launchers need an **approved Azure app registration**. Unapproved
  apps get HTTP 403 from `api.minecraftservices.com`. **Already approved for this project.**
- The registration must be a **public client / native app**. No client secret is
  used in the flow (one exists on the registration only because registration
  requires it).
- Sign-in must hit the **`consumers`** tenant. `common` or a tenant ID fails.
  Consequence: work/school accounts cannot sign in at all, by design.
- Scopes: `XboxLive.signin offline_access`. Nothing else is requested.
- Review form (for reference): `https://aka.ms/mce-reviewappid`

### 3.2 CurseForge

- API key required, obtained via a reviewed application at `console.curseforge.com`.
  Minecraft game ID is `432`.
- **`allowModDistribution: false`** — mod authors can opt out of third-party
  downloads. Those files cannot be fetched programmatically at all. Large packs
  typically contain one or more. Required UX: show the user a per-mod download
  link, then watch the Downloads folder and move files into place. This is not
  an edge case; budget for it.
- **As of 16 July 2026, `edge.forgecdn.net` requires an API key.** Requests
  without one return 401. Send it as an `x-api-key` header, not a query
  parameter. Any guide or library older than mid-2026 is broken on this.

### 3.3 Modrinth

- No API key. Requires a descriptive `User-Agent` with contact info. Rate limit
  ~300 req/min.
- `.mrpack` is an open, documented pack format with `env` flags for
  client/server × required/optional.
- **Prefer Modrinth everywhere it's an option.** Friendlier terms, no key, no
  distribution opt-out, no CDN authentication.

### 3.4 Licensing and distribution

- **Do not redistribute mod jars.** Most mods are ARR or have restrictive terms.
  Manifests must reference CF/Modrinth files and have the *client* fetch them.
- Your own configs, scripts, and resource packs **may** be distributed.
- **Do not bundle the Minecraft client jar.** Download from Mojang at install time.
- Launcher must be free. Per Mojang brand guidelines: don't lead the product
  name or domain with "Minecraft", don't imply official affiliation.
- Forking Prism / ATLauncher / HMCL means inheriting **GPL-3.0**. See §4.3.

---

## 4. Architecture

### 4.1 Three decisions, not one

```
        Next.js web app                    Launcher (desktop)
      [ pack management UI ]              [ install and play ]
                |                                  |
                +--------------+   +---------------+|
                               v   v                |
                          NestJS API                |
                 [ packs, auth, ACL, CF proxy ]     |
                               |                    |
                               v                    v
                        CurseForge            Mojang + Modrinth
                       (proxied)               (direct from client)
```

**Backend → extend the existing NestJS app.** The pack registry, `hasJoined`
verification, per-UUID ACLs, invite codes, and signed override URLs are all just
NestJS modules. This is the largest chunk of the interesting work and comes
nearly free.

**Management UI → the existing Next.js app.** This is the key unlock: *most of
the launcher's UI does not belong in the launcher.* Creating packs, adding mods,
bumping versions, granting/revoking access, seeing who's on which version — all
of that is a web dashboard. That leaves the desktop app with roughly six
screens: sign in, list packs, install/update, launch, logs, instance settings.
Style reuse is 100% here because it's literally the same app, and it shrinks the
launcher's surface enormously.

**Launcher shell → see below.**

### 4.2 Recommended launcher stack: Electron + React (Vite renderer)

> **SUPERSEDED 2026-07-30 — the shell is Tauri v2, not Electron.** Decided
> knowingly against the reasoning below, for the idle-RAM cost: the launcher sits
> open while a 4–6GB Pixelmon JVM runs, and ~300MB vs ~100MB is felt on an 8GB
> machine. Reason 1 below is the real casualty — `@xmcl/*` is Node-only, so §5
> and §6 become Rust rather than a near-mechanical port of the Python.
>
> **The Rust ecosystem covers §5 AND §6** (verified 2026-07-30): **`portablemc` 5.0**
> (Apache-2.0, five releases since 2025-12) has an `msa` module for the Microsoft
> auth chain, a `forge` module whose `Loader` enum installs **Forge and NeoForge**,
> Java runtime management, and a `Handler`/`Event` pair for progress. One crate.
> Shelling out to the official installer stays a fallback, not the plan; §6.4's
> "do not hand-roll this" is still binding.
>
> Lyceris was evaluated and rejected: offline-auth only, last released 2025-04.
>
> Reason 3 below still holds and is already proven: the renderer is unchanged
> React on `@boffmedia/ui`, verified rendering outside Next.
>
> Users are on Windows (WebView2), where Tauri is strongest. The WebKitGTK
> flakiness this section warns about is a *dev-environment* problem only — build
> the shell on Windows, and do renderer work in a plain browser.

Rationale, in order of weight:

1. The main process is Node, which unlocks **`@xmcl/core`, `@xmcl/installer`,
   `@xmcl/user`** (MIT) — by far the best-maintained launcher-core libraries.
   Both Python prototypes port near-mechanically.
2. One language across launcher, API, and web. Enables `packages/pack-schema`
   (see §4.4).
3. Renderer is plain React → shared Tailwind preset and design tokens work.

Costs: 150–250MB installers, ~300MB idle RAM. **These don't matter for a
modpack launcher** — users already download 800MB packs, and a 4GB JVM is
running alongside.

**Alternative: Tauri v2 + React.** ~10–20MB binaries, low memory, built-in
updater, same React reuse. Take this if the team is comfortable in Rust
(`lyceris` covers the core). Costs: two languages, thinner library ecosystem,
and WebKitGTK on Linux is meaningfully flakier than WebView2/WKWebView.

**Rejected:** Avalonia, JavaFX, Qt — all discard the existing design system.
Next.js static export inside Electron — works, but loses server components and
the router fights the desktop model.

### 4.3 Do not fork a full launcher

Prism (C++/Qt), ATLauncher (Java), HMCL (Java) are all excellent and all
**GPL-3.0**. Forking means inheriting copyleft plus a large unfamiliar codebase,
in order to replace the parts that differentiate this project anyway. Use
launcher-core *libraries* instead; write the app shell.

Verify library licenses independently — they change.

### 4.4 Monorepo layout

```
boffmedia/
  apps/
    web/               Next.js (existing) + pack dashboard
    api/               NestJS (existing) + pack, auth, acl modules
    launcher/          Tauri v2 (see the note in §4.2 — was Electron)
  packages/
    ui/                shared components, Tailwind preset, design tokens
    pack-schema/       zod schemas + TS types
```

`packages/pack-schema` is quietly the most valuable package: the same zod schema
validates a manifest when the dashboard publishes it *and* when the launcher
consumes it. Schema drift between server and client is a classic launcher bug
class, eliminated structurally.

For `packages/ui`, audit components first — anything using `next/image`,
`next/link`, or server components needs a client-safe variant. Extract design
tokens and presentational primitives; leave Next-coupled layout behind.

### 4.5 Why CurseForge is proxied

Since the CDN now requires an API key on every request (§3.2), embedding the key
in the launcher means it gets extracted, and an abused key is a revoked key —
which breaks the launcher for every user. Proxying keeps it server-side.

Cost is egress: roughly (users × pack size) per install. For a few dozen users
that's tens of GB/month — negligible. It would **not** scale to a public
launcher, which is fine, because this isn't one.

Modrinth needs no key, so those downloads go client-direct at zero cost. Another
reason to make Modrinth primary.

---

## 5. The authentication chain

Four HTTP hops, each feeding the next. Full working implementation in
Appendix A.

```
MS OAuth token -> XBL user token -> XSTS token -> Minecraft token -> profile
```

### 5.1 Microsoft OAuth (device code flow)

```
POST https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode
Content-Type: application/x-www-form-urlencoded

client_id=<CLIENT_ID>&scope=XboxLive.signin offline_access
```

Returns `user_code`, `device_code`, `verification_uri`, `interval`. Show the
user the code, then poll:

```
POST https://login.microsoftonline.com/consumers/oauth2/v2.0/token

grant_type=urn:ietf:params:oauth:grant-type:device_code
&client_id=<CLIENT_ID>
&device_code=<device_code>
```

Polling errors: `authorization_pending` (continue), `slow_down` (add 5s to
interval), `expired_token` / `authorization_declined` (terminal).

Auth-code + PKCE with a loopback listener is better desktop UX and should
replace this in the real launcher — the browser returns automatically instead of
making the user type a code.

### 5.2 Xbox Live user token

```
POST https://user.auth.xboxlive.com/user/authenticate
Content-Type: application/json

{
  "Properties": {
    "AuthMethod": "RPS",
    "SiteName": "user.auth.xboxlive.com",
    "RpsTicket": "d=<MS_ACCESS_TOKEN>"
  },
  "RelyingParty": "http://auth.xboxlive.com",
  "TokenType": "JWT"
}
```

**The `d=` prefix on `RpsTicket` is mandatory** for tokens from an Azure app
registration. Omitting it is the single most common mistake in this chain.

Keep `Token` and `DisplayClaims.xui[0].uhs`.

### 5.3 XSTS token

```
POST https://xsts.auth.xboxlive.com/xsts/authorize
Content-Type: application/json

{
  "Properties": { "SandboxId": "RETAIL", "UserTokens": ["<XBL_TOKEN>"] },
  "RelyingParty": "rp://api.minecraftservices.com/",
  "TokenType": "JWT"
}
```

User-specific failures arrive as HTTP 401 with an `XErr` code. Map these to real
messages — raw codes are useless to players:

| XErr | Meaning |
|---|---|
| 2148916227 | Account banned from Xbox services |
| 2148916233 | No Xbox profile — must create one at xbox.com |
| 2148916235 | Region unavailable |
| 2148916236 / 2148916237 | Adult verification required (South Korea) |
| 2148916238 | Under 18 — needs adding to a Microsoft Family group |

### 5.4 Minecraft access token

```
POST https://api.minecraftservices.com/authentication/login_with_xbox
Content-Type: application/json

{ "identityToken": "XBL3.0 x=<uhs>;<xsts_token>" }
```

Exact format matters: literal `XBL3.0 x=`, user hash, semicolon, XSTS token.

**Trap:** the response's `username` field is an internal account ID, **not** the
Minecraft username. The real name comes from the profile call.

Pre-approval this returns 403 `Invalid app registration`. Reaching *this*
specific error (rather than an Xbox-level one) proves the whole upstream chain
is correct.

### 5.5 Profile

```
GET https://api.minecraftservices.com/minecraft/profile
Authorization: Bearer <MC_ACCESS_TOKEN>
```

200 → `id` (32-hex UUID, no dashes) and `name`. 404 → no Java Edition profile:
either the account doesn't own the game, **or** it's a Game Pass account that
has never opened the official launcher to pick a username. Distinguish these in
the error message.

### 5.6 XUID requires a second XSTS call

The Minecraft relying party's XSTS claims contain **only** `uhs`. The XUID
(needed for the `${auth_xuid}` launch argument) and gamertag live on the
`http://xboxlive.com` relying party — a separate call against the same XBL user
token. See `fetch_xuid()` in Appendix A.

An empty XUID launches and plays fine on ordinary servers; it's used for
Xbox-side social features and telemetry, and is occasionally implicated in Realms
oddities.

### 5.7 Token lifetimes and storage

- Minecraft access token: ~24 hours. Re-derive per session; never persist it.
- Microsoft refresh token: long-lived. Revoked on password change / MFA reset.
- **Store only the refresh token, in the OS credential store** (Keychain /
  DPAPI / Secret Service). A refresh token is effectively the account.
  Several launchers have shipped plaintext JSON; it's a real account-theft vector.
- Never let a keychain read failure fail silently — it looks identical to a first
  run, and you'd re-authenticate on every launch forever without noticing.

---

## 6. The install and launch pipeline

Full implementation in Appendix B.

```
version_manifest_v2.json
   └─► version JSON
         ├─► client.jar
         ├─► libraries[]  ── filter by rules ──► classpath
         │                  └─ legacy natives ──► extract
         ├─► assetIndex ──► assets/objects/<ab>/<hash>
         └─► javaVersion ──► pick/validate a JRE
                     │
       build JVM args + game args, substitute ${...}
                     │
                  spawn
```

Endpoints:

- Manifest: `https://piston-meta.mojang.com/mc/game/version_manifest_v2.json`
- Assets: `https://resources.download.minecraft.net/<hash[:2]>/<hash>`

### 6.1 Three sources of most complexity

**Rule evaluation.** Libraries *and* arguments carry `rules` arrays gating them
on OS, arch, and feature flags. Algorithm: start disallowed if any rules exist,
then for each rule whose conditions match the environment, set the verdict to
that rule's action — **last match wins**. Get this wrong and macOS natives ship
to Windows users.

**Natives, two eras.** Pre-~1.19 versions have a `natives` map pointing into
`downloads.classifiers`; those jars must be extracted to a directory passed as
`-Djava.library.path`, honouring `extract.exclude`. Modern versions ship natives
as ordinary rule-gated libraries that just go on the classpath — LWJGL 3 unpacks
them itself. Both paths are needed.

**Argument templating.** 1.13+ uses `arguments.{game,jvm}` with conditional
`{rules, value}` objects. Pre-1.13 uses a flat `minecraftArguments` string and
has no `jvm` block at all. Same placeholder set either way.

### 6.2 Placeholders

Identity: `auth_player_name`, `auth_uuid`, `auth_access_token`, `auth_xuid`,
`clientid`, `user_type` (`msa`), `auth_session` (legacy).

Paths: `game_directory`, `assets_root`, `assets_index_name`, `game_assets`
(legacy virtual), `natives_directory`, `library_directory`.

Other: `version_name`, `version_type`, `launcher_name`, `launcher_version`,
`classpath`, `classpath_separator`.

### 6.3 Java

Version JSON specifies `javaVersion.majorVersion` (21 for 1.21.x). A real
launcher should download and manage its own runtimes. Adoptium is a stable
documented source:

```
https://api.adoptium.net/v3/binary/latest/{major}/ga/{os}/{arch}/jre/hotspot/normal/eclipse
```

Wrong Java version is the single most common launcher support ticket. Detect and
error clearly rather than launching into a confusing crash.

### 6.4 Mod loaders

**Fabric / Quilt — trivial.** Their meta APIs return a ready-made profile JSON
with `inheritsFrom` set. `resolve_version()` already merges these, and
`library_jobs()` already has the maven-coordinate fallback that Fabric's
hash-less `{name, url}` library entries require.

```
https://meta.fabricmc.net/v2/versions/loader/<mc>/<loader>/profile/json
https://meta.quiltmc.org/v3/versions/loader/<mc>/<loader>/profile/json
```

Write to `versions/fabric-loader-<loader>-<mc>/`; `install` and `launch` work
unchanged.

**Forge / NeoForge — hard.** Since 1.13 the installer runs local *processors*
that binary-patch and deobfuscate the client jar. Either shell out to the
official installer headlessly, or use a library implementing
`install_profile.json` processing. **Do not hand-roll this.** Mavens:
`https://maven.neoforged.net/releases`, `https://maven.minecraftforge.net/`.

Do Fabric end-to-end before touching NeoForge.

---

## 7. Pack format and access control

Built in the existing NestJS app and consumed by the Tauri launcher. The admin
dashboard authors and publishes manifests; the launcher revalidates access on
the manifest and every payload request.

### 7.1 Pack format — extend, don't invent

Base it on **`.mrpack`** (or packwiz TOML) with namespaced custom fields. A pack
version is a manifest listing, per file: source (Modrinth project/version, CF
project/file, or direct URL), SHA-512, target path, and `env`
(client/server × required/optional). Overrides — configs, scripts, resource
packs — ship as content-addressed blobs you host.

Interop means users can escape to Prism if the project is ever abandoned, which
paradoxically makes them *more* willing to adopt it.

### 7.2 Identity via `hasJoined`

The launcher has already authenticated the user, so it has a verified Minecraft
UUID. To prove that UUID to the pack server **without handing it any tokens**,
reuse Mojang's server-join handshake:

1. Server issues a `serverId` hash.
2. Launcher calls `https://sessionserver.mojang.com/session/minecraft/join`
   with it.
3. Server calls `hasJoined?username=…&serverId=…` to confirm.

Same mechanism vanilla servers use. The backend never touches a Microsoft token
and gets a cryptographically meaningful "this person owns this account."

From there: JWT session → per-pack ACL keyed on UUID → short-TTL presigned URLs
for override blobs. Add invite codes for onboarding and an audit log.

### 7.3 Passwords, honestly

A password is a low-friction gate, but the mods themselves come from public
CF/Modrinth URLs — so it protects only your configs and the pack composition. If
it should mean something, encrypt override blobs with a key derived from it.

### 7.4 There is no DRM here

Once a pack is installed, the JVM needs plaintext jars on disk. Any authorized
user can zip the folder and hand it to a friend.

What's being built is **distribution control and revocation**, not copy
protection. Design for "keeps honest people honest, lets me cut off a specific
person's updates" and the result is right. Design for "unstealable" and months
get wasted on a worse product.

---

## 8. Roadmap

1. ~~Submit Azure app registration~~ **done, approved**
2. ~~Authenticate and launch vanilla/NeoForge~~ **done; continue real-pack smoke tests**
3. ~~Pack server, ACLs, invites, and admin authoring~~ **done**
4. **Exercise password, invite, override, and CurseForge paths against production-like packs**
5. **Windows release: code signing, signed auto-update, crash diagnosis, and polish**

**The honest failure mode for this project is not technical difficulty — it's
that steps 2–6 are ~80% of the work and 0% of what the maintainer actually
wanted to build.** Lean hard on launcher-core libraries; consider building the
pack server (step 7) early to stay motivated.

### 8.1 Consider validating with packwiz first

**packwiz** (MIT, CLI) already does the manifest/update/delta side: pack as
git-friendly TOML, CurseForge + Modrinth support, and `packwiz-installer` as a
pre-launch hook in Prism so instances self-update on every start. Point it at an
HTTP server behind auth and you have private auto-updating packs in a weekend.

The gap is UX (CLI, requires Prism) and real per-user access control. If that
gap is the whole point, build the launcher — but shipping packwiz + a small web
service first validates demand cheaply.

---

## 9. Features not to forget

The ones that separate a toy from something people switch to:

- **Delta updates** — content-addressed hashing so an update pulls 3 changed
  mods, not 400MB. Non-negotiable for an iterated pack.
- **Locked vs. user space** — a separate mods folder that survives updates, so
  people can add a minimap without it being clobbered. Plus optional-mod toggles
  (`.mrpack` already models this).
- **Pack version pinning + rollback** — keep the last N versions. When an update
  bricks the pack for eight people mid-session, you want one-click revert.
- **Crash report parsing** — detect missing dependencies, loader mismatches,
  mixin conflicts, OOM; explain in plain language. Highest-leverage
  support-cost reducer there is.
- **Dependency resolution** — both APIs expose dependency graphs. Auto-pull
  Fabric API, Architectury, Cloth Config.
- **Server pack generation** from the same manifest.
- **Per-instance Java runtime + memory**, with a sane heuristic (not 2GB for a
  300-mod pack).
- **Quick Play** (`--quickPlayMultiplayer`, 1.20+) to boot straight into a server.
- **Resumable parallel downloads** with hash verification.
- **Launcher self-update + code signing.** Real money: Apple Developer ($99/yr)
  plus notarization, and a Windows code-signing cert. Skip it and SmartScreen
  and half of antivirus flag the launcher as malware — the classic launcher-dev
  nightmare.
- Telemetry **off** by default. Structured logs users can paste.

---

## 10. Gotchas index

Quick reference for things that cost time:

| Symptom | Cause |
|---|---|
| 403 `Invalid app registration` | App not approved, or wrong client ID |
| Xbox auth fails with unhelpful error | Missing `d=` prefix on `RpsTicket`, or `common`/tenant instead of `consumers` |
| `xuid` is `null` | Expected — needs a second XSTS call to `http://xboxlive.com` (§5.6) |
| Re-prompts for device code every run | Keychain write failed, or silent-login failure was swallowed |
| Profile 404 despite owning the game | Game Pass account that never opened the official launcher |
| 401 from `edge.forgecdn.net` | Missing `x-api-key` header (new as of 16 July 2026) |
| A CF mod simply won't download | `allowModDistribution: false` — needs manual-download UX |
| `UnsatisfiedLinkError` on launch | Natives — legacy extraction path (only affects older versions) |
| `ClassNotFoundException: net.minecraft.client.main.Main` | Classpath gap; a library got rule-filtered incorrectly |
| Confusing crash on 1.21.x | Wrong Java major version |

---

## Appendix A — `mc_auth.py`

Reference implementation of the full auth chain. **Verified working** against
the approved app registration: signs in, returns profile, persists the refresh
token.

```python
"""
Minecraft (Java Edition) authentication chain — reference implementation.

Flow:  MS OAuth2 (device code) -> Xbox Live -> XSTS -> Minecraft -> profile

Requires an approved Azure app registration. Until Microsoft approves it,
step 4 (login_with_xbox) returns 403 "Invalid app registration" — that is the
expected outcome and is the proof of activity Microsoft wants before review.

    pip install requests
    pip install keyring          # optional, for OS credential storage

    python mc_auth.py login
    python mc_auth.py whoami
    python mc_auth.py logout
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from dataclasses import dataclass, asdict
from typing import Any

import requests

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

CLIENT_ID = "00000000-0000-0000-0000-000000000000"  # <-- your Entra client ID
SCOPE = "XboxLive.signin offline_access"

# NOTE: 'consumers', not 'common' and not your tenant ID.
MS_DEVICECODE = "https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode"
MS_TOKEN = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token"

XBL_AUTH = "https://user.auth.xboxlive.com/user/authenticate"
XSTS_AUTH = "https://xsts.auth.xboxlive.com/xsts/authorize"
MC_LOGIN = "https://api.minecraftservices.com/authentication/login_with_xbox"
MC_PROFILE = "https://api.minecraftservices.com/minecraft/profile"
MC_ENTITLEMENTS = "https://api.minecraftservices.com/entitlements/mcstore"

USER_AGENT = "MyLauncher/0.1 (contact: you@example.com)"

TIMEOUT = 30

XERR_MESSAGES = {
    "2148916227": "This account has been banned from Xbox services.",
    "2148916233": (
        "This Microsoft account has no Xbox profile. Sign in at "
        "https://www.xbox.com once to create one, then try again."
    ),
    "2148916235": "Xbox Live is not available in this account's country/region.",
    "2148916236": "This account requires adult verification (South Korea).",
    "2148916237": "This account requires adult verification (South Korea).",
    "2148916238": (
        "This account is registered to a user under 18. An adult must add it "
        "to a Microsoft Family group before it can sign in."
    ),
}


class AuthError(Exception):
    """Any failure in the auth chain, with a message fit to show a user."""


# ---------------------------------------------------------------------------
# Result types
# ---------------------------------------------------------------------------

@dataclass
class MicrosoftTokens:
    access_token: str
    refresh_token: str
    expires_at: float  # unix seconds


@dataclass
class XboxToken:
    token: str
    user_hash: str
    xuid: str | None = None


@dataclass
class MinecraftSession:
    """Everything the launch command needs."""
    access_token: str
    uuid: str          # 32-hex, no dashes
    username: str
    xuid: str | None
    expires_at: float

    def launch_args(self, client_id: str = CLIENT_ID) -> dict[str, str]:
        """Values for the ${...} placeholders in the version JSON."""
        return {
            "auth_player_name": self.username,
            "auth_uuid": self.uuid,
            "auth_access_token": self.access_token,
            "auth_xuid": self.xuid or "",
            "clientid": client_id,
            "user_type": "msa",
        }


# ---------------------------------------------------------------------------
# HTTP helper
# ---------------------------------------------------------------------------

def _session() -> requests.Session:
    s = requests.Session()
    s.headers.update({"User-Agent": USER_AGENT, "Accept": "application/json"})
    return s


HTTP = _session()


# ---------------------------------------------------------------------------
# Step 1 — Microsoft OAuth2 (device code flow)
# ---------------------------------------------------------------------------

def start_device_code() -> dict[str, Any]:
    r = HTTP.post(
        MS_DEVICECODE,
        data={"client_id": CLIENT_ID, "scope": SCOPE},
        timeout=TIMEOUT,
    )
    if r.status_code != 200:
        raise AuthError(f"Could not start device login: {r.status_code} {r.text}")
    return r.json()


def poll_for_token(device_code: str, interval: int, expires_in: int) -> MicrosoftTokens:
    """Poll the token endpoint until the user completes the browser step."""
    deadline = time.time() + expires_in
    wait = max(interval, 1)

    while time.time() < deadline:
        time.sleep(wait)
        r = HTTP.post(
            MS_TOKEN,
            data={
                "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
                "client_id": CLIENT_ID,
                "device_code": device_code,
            },
            timeout=TIMEOUT,
        )
        body = r.json()

        if r.status_code == 200:
            return MicrosoftTokens(
                access_token=body["access_token"],
                refresh_token=body["refresh_token"],
                expires_at=time.time() + body.get("expires_in", 3600),
            )

        error = body.get("error")
        if error == "authorization_pending":
            continue
        if error == "slow_down":
            wait += 5
            continue
        if error == "authorization_declined":
            raise AuthError("Sign-in was declined.")
        if error == "expired_token":
            raise AuthError("The device code expired. Start again.")
        raise AuthError(f"Sign-in failed: {error}: {body.get('error_description', '')}")

    raise AuthError("Timed out waiting for sign-in.")


def refresh_microsoft(refresh_token: str) -> MicrosoftTokens:
    r = HTTP.post(
        MS_TOKEN,
        data={
            "grant_type": "refresh_token",
            "client_id": CLIENT_ID,
            "refresh_token": refresh_token,
            "scope": SCOPE,
        },
        timeout=TIMEOUT,
    )
    if r.status_code != 200:
        # Refresh tokens are revoked on password change, MFA reset, etc.
        raise AuthError("Session expired. Please sign in again.")
    body = r.json()
    return MicrosoftTokens(
        access_token=body["access_token"],
        # Microsoft may or may not rotate the refresh token; keep the old one if not.
        refresh_token=body.get("refresh_token", refresh_token),
        expires_at=time.time() + body.get("expires_in", 3600),
    )


# ---------------------------------------------------------------------------
# Step 2 — Xbox Live user token
# ---------------------------------------------------------------------------

def authenticate_xbox(ms_access_token: str) -> XboxToken:
    payload = {
        "Properties": {
            "AuthMethod": "RPS",
            "SiteName": "user.auth.xboxlive.com",
            # The "d=" prefix is REQUIRED for Azure app tokens. Omitting it is
            # the single most common mistake in this chain.
            "RpsTicket": f"d={ms_access_token}",
        },
        "RelyingParty": "http://auth.xboxlive.com",
        "TokenType": "JWT",
    }
    r = HTTP.post(XBL_AUTH, json=payload, timeout=TIMEOUT)
    if r.status_code != 200:
        raise AuthError(f"Xbox Live rejected the sign-in ({r.status_code}).")

    body = r.json()
    return XboxToken(
        token=body["Token"],
        user_hash=body["DisplayClaims"]["xui"][0]["uhs"],
    )


# ---------------------------------------------------------------------------
# Step 3 — XSTS token for the Minecraft relying party
# ---------------------------------------------------------------------------

def authorize_xsts(xbl_token: str) -> XboxToken:
    payload = {
        "Properties": {"SandboxId": "RETAIL", "UserTokens": [xbl_token]},
        "RelyingParty": "rp://api.minecraftservices.com/",
        "TokenType": "JWT",
    }
    r = HTTP.post(XSTS_AUTH, json=payload, timeout=TIMEOUT)

    if r.status_code == 401:
        try:
            xerr = str(r.json().get("XErr", ""))
        except ValueError:
            xerr = ""
        raise AuthError(
            XERR_MESSAGES.get(xerr, f"Xbox authorization failed (XErr {xerr or 'unknown'}).")
        )
    if r.status_code != 200:
        raise AuthError(f"Xbox authorization failed ({r.status_code}).")

    body = r.json()
    claims = body["DisplayClaims"]["xui"][0]
    return XboxToken(
        token=body["Token"],
        user_hash=claims["uhs"],
        xuid=claims.get("xid"),  # needed later for ${auth_xuid}
    )


def fetch_xuid(xbl_token: str) -> tuple[str | None, str | None]:
    """
    The Minecraft relying party's XSTS claims contain only 'uhs'. The XUID and
    gamertag live on the xboxlive.com relying party, so it needs its own call
    against the same XBL user token.
    """
    payload = {
        "Properties": {"SandboxId": "RETAIL", "UserTokens": [xbl_token]},
        "RelyingParty": "http://xboxlive.com",
        "TokenType": "JWT",
    }
    try:
        r = HTTP.post(XSTS_AUTH, json=payload, timeout=TIMEOUT)
        if r.status_code != 200:
            return None, None
        claims = r.json().get("DisplayClaims", {}).get("xui", [{}])[0]
        return claims.get("xid"), claims.get("gtg")
    except requests.RequestException:
        return None, None


# ---------------------------------------------------------------------------
# Step 4 — Minecraft access token
# ---------------------------------------------------------------------------

def login_with_xbox(xsts: XboxToken) -> tuple[str, float]:
    payload = {"identityToken": f"XBL3.0 x={xsts.user_hash};{xsts.token}"}
    r = HTTP.post(MC_LOGIN, json=payload, timeout=TIMEOUT)

    if r.status_code == 403:
        raise AuthError(
            "Minecraft rejected this app registration.\n"
            "If you have not been approved yet, this is expected — submit\n"
            "https://aka.ms/mce-reviewappid with your Client ID and Tenant ID.\n"
            f"Raw: {r.text[:300]}"
        )
    if r.status_code != 200:
        raise AuthError(f"Minecraft login failed ({r.status_code}): {r.text[:300]}")

    body = r.json()
    # body["username"] here is an internal account ID, NOT the Minecraft name.
    return body["access_token"], time.time() + body.get("expires_in", 86400)


# ---------------------------------------------------------------------------
# Step 5 — Profile (and optional entitlement check)
# ---------------------------------------------------------------------------

def fetch_profile(mc_token: str) -> dict[str, Any]:
    r = HTTP.get(
        MC_PROFILE,
        headers={"Authorization": f"Bearer {mc_token}"},
        timeout=TIMEOUT,
    )
    if r.status_code == 404:
        raise AuthError(
            "No Minecraft Java Edition profile on this account.\n"
            "Either the account does not own the game, or it is a Game Pass\n"
            "account that has never signed into the official launcher to pick\n"
            "a username."
        )
    if r.status_code != 200:
        raise AuthError(f"Could not fetch profile ({r.status_code}).")
    return r.json()


def owns_game(mc_token: str) -> bool:
    """Entitlement check. Unreliable for Game Pass — prefer the profile call."""
    r = HTTP.get(
        MC_ENTITLEMENTS,
        headers={"Authorization": f"Bearer {mc_token}"},
        timeout=TIMEOUT,
    )
    return r.status_code == 200 and bool(r.json().get("items"))


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def complete_chain(ms: MicrosoftTokens) -> MinecraftSession:
    """MS token -> full Minecraft session. Steps 2 through 5."""
    xbl = authenticate_xbox(ms.access_token)
    xsts = authorize_xsts(xbl.token)
    mc_token, mc_expiry = login_with_xbox(xsts)
    profile = fetch_profile(mc_token)

    xuid = xsts.xuid
    if not xuid:
        xuid, _gamertag = fetch_xuid(xbl.token)

    return MinecraftSession(
        access_token=mc_token,
        uuid=profile["id"],
        username=profile["name"],
        xuid=xuid,
        expires_at=mc_expiry,
    )


def interactive_login() -> tuple[MicrosoftTokens, MinecraftSession]:
    flow = start_device_code()
    print(f"\n  Open: {flow['verification_uri']}")
    print(f"  Code: {flow['user_code']}\n")
    ms = poll_for_token(flow["device_code"], flow.get("interval", 5), flow.get("expires_in", 900))
    return ms, complete_chain(ms)


def silent_login(refresh_token: str) -> tuple[MicrosoftTokens, MinecraftSession]:
    """Startup path: no user interaction if the refresh token still works."""
    ms = refresh_microsoft(refresh_token)
    return ms, complete_chain(ms)


# ---------------------------------------------------------------------------
# Credential storage
#
# Store ONLY the refresh token, and put it in the OS credential store.
# A refresh token is effectively the account — plaintext JSON in a config
# directory is a real account-theft vector and several launchers have shipped it.
# ---------------------------------------------------------------------------

SERVICE = "my-launcher"
ACCOUNT = "microsoft-refresh-token"


def save_refresh_token(token: str) -> None:
    try:
        import keyring
        keyring.set_password(SERVICE, ACCOUNT, token)
    except Exception as exc:
        print(f"[warn] could not use OS keychain ({exc}); token not persisted", file=sys.stderr)


def load_refresh_token() -> str | None:
    try:
        import keyring
        return keyring.get_password(SERVICE, ACCOUNT)
    except Exception as exc:
        # Never swallow this: a broken keychain looks exactly like a first run,
        # and you would silently re-authenticate on every launch forever.
        print(f"[warn] keychain read failed: {exc}", file=sys.stderr)
        return None


def clear_refresh_token() -> None:
    try:
        import keyring
        keyring.delete_password(SERVICE, ACCOUNT)
    except Exception:
        pass


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description="Minecraft auth chain reference")
    parser.add_argument("command", choices=["login", "whoami", "logout"])
    args = parser.parse_args()

    if args.command == "logout":
        clear_refresh_token()
        print("Signed out.")
        return 0

    try:
        stored = load_refresh_token()
        if stored:
            try:
                ms, session = silent_login(stored)
            except AuthError as exc:
                print(f"[info] silent login failed ({exc}); signing in again")
                ms, session = interactive_login()
        else:
            ms, session = interactive_login()

        save_refresh_token(ms.refresh_token)

    except AuthError as exc:
        print(f"\n{exc}\n", file=sys.stderr)
        return 1

    print(f"Signed in as {session.username}  ({session.uuid})")
    if args.command == "whoami":
        print(json.dumps(asdict(session) | {"access_token": "<redacted>"}, indent=2))
        print("\nLaunch placeholders:")
        for k, v in session.launch_args().items():
            shown = "<redacted>" if k == "auth_access_token" else v
            print(f"  ${{{k}}} = {shown}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

---

## Appendix B — `mc_install.py`

Reference implementation of install + launch. Pure logic is unit-verified (rule
evaluation across OS/arch/feature cases, maven coordinate mapping, conditional
argument flattening, `inheritsFrom` merging). Download paths have **not** yet
been exercised against Mojang's servers.

```python
"""
Minecraft installer + launcher — reference implementation.

Handles: version manifest, version JSON (incl. inheritsFrom merging for mod
loaders), rule evaluation, library download, native extraction, asset objects,
Java selection, argument templating, and process spawn.

    pip install requests
    python mc_install.py install 1.21.4
    python mc_install.py launch  1.21.4 --offline Dev

Pair with mc_auth.py for real sessions:
    from mc_auth import silent_login, load_refresh_token
    _, session = silent_login(load_refresh_token())
    launch(root, "1.21.4", session.launch_args())
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import re
import shutil
import subprocess
import sys
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any, Iterable

import requests

VERSION_MANIFEST = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json"
RESOURCES = "https://resources.download.minecraft.net"

LAUNCHER_NAME = "my-launcher"
LAUNCHER_VERSION = "0.1.0"
USER_AGENT = f"{LAUNCHER_NAME}/{LAUNCHER_VERSION} (contact: you@example.com)"

HTTP = requests.Session()
HTTP.headers.update({"User-Agent": USER_AGENT})

DOWNLOAD_THREADS = 16


# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------

def current_os() -> str:
    if sys.platform.startswith("win"):
        return "windows"
    if sys.platform == "darwin":
        return "osx"
    return "linux"


def current_arch() -> str:
    machine = platform.machine().lower()
    if machine in ("amd64", "x86_64"):
        return "x86_64"
    if machine in ("arm64", "aarch64"):
        return "arm64"
    if machine in ("i386", "i686", "x86"):
        return "x86"
    return machine


OS_NAME = current_os()
ARCH = current_arch()
CLASSPATH_SEP = ";" if OS_NAME == "windows" else ":"


# ---------------------------------------------------------------------------
# Rule evaluation
#
# Used by both libraries and arguments. Start disallowed if rules exist, then
# every rule whose conditions match flips the verdict to its action. Last
# match wins.
# ---------------------------------------------------------------------------

def rules_allow(rules: list[dict] | None, features: dict[str, bool] | None = None) -> bool:
    if not rules:
        return True
    features = features or {}
    allowed = False

    for rule in rules:
        if not _rule_matches(rule, features):
            continue
        allowed = rule.get("action") == "allow"

    return allowed


def _rule_matches(rule: dict, features: dict[str, bool]) -> bool:
    os_cond = rule.get("os")
    if os_cond:
        if "name" in os_cond and os_cond["name"] != OS_NAME:
            return False
        if "arch" in os_cond and os_cond["arch"] != ARCH:
            return False
        if "version" in os_cond:
            if not re.search(os_cond["version"], platform.release()):
                return False

    feat_cond = rule.get("features")
    if feat_cond:
        for key, expected in feat_cond.items():
            if features.get(key, False) != expected:
                return False

    return True


# ---------------------------------------------------------------------------
# Downloading
# ---------------------------------------------------------------------------

def sha1_of(path: Path) -> str:
    h = hashlib.sha1()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def download(url: str, dest: Path, sha1: str | None = None) -> None:
    """Idempotent: skips if the file exists and the hash matches."""
    if dest.exists():
        if sha1 is None or sha1_of(dest) == sha1:
            return
        dest.unlink()

    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".part")

    with HTTP.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        with tmp.open("wb") as fh:
            for chunk in r.iter_content(1 << 16):
                fh.write(chunk)

    if sha1 and sha1_of(tmp) != sha1:
        tmp.unlink()
        raise RuntimeError(f"Hash mismatch for {url}")

    tmp.replace(dest)


def download_all(jobs: Iterable[tuple[str, Path, str | None]], label: str) -> None:
    jobs = list(jobs)
    if not jobs:
        return

    done = 0
    with ThreadPoolExecutor(max_workers=DOWNLOAD_THREADS) as pool:
        futures = {pool.submit(download, *job): job for job in jobs}
        for future in as_completed(futures):
            future.result()  # re-raise
            done += 1
            print(f"\r  {label}: {done}/{len(jobs)}", end="", flush=True)
    print()


# ---------------------------------------------------------------------------
# Version resolution
# ---------------------------------------------------------------------------

def version_json_path(root: Path, version_id: str) -> Path:
    return root / "versions" / version_id / f"{version_id}.json"


def fetch_version_json(root: Path, version_id: str) -> dict:
    """Fetch from the manifest if we don't already have it on disk."""
    dest = version_json_path(root, version_id)
    if dest.exists():
        return json.loads(dest.read_text(encoding="utf-8"))

    manifest = HTTP.get(VERSION_MANIFEST, timeout=30).json()
    entry = next((v for v in manifest["versions"] if v["id"] == version_id), None)
    if entry is None:
        raise RuntimeError(f"Unknown version: {version_id}")

    download(entry["url"], dest, entry.get("sha1"))
    return json.loads(dest.read_text(encoding="utf-8"))


def resolve_version(root: Path, version_id: str) -> dict:
    """
    Load a version JSON, following inheritsFrom.

    Mod loaders (Fabric, Quilt, Forge, NeoForge) ship a thin JSON that inherits
    from a vanilla version: child libraries come first, arguments concatenate,
    and scalar fields override.
    """
    data = fetch_version_json(root, version_id)
    parent_id = data.get("inheritsFrom")
    if not parent_id:
        return data

    parent = resolve_version(root, parent_id)
    merged = dict(parent)

    for key, value in data.items():
        if key == "inheritsFrom":
            continue
        if key == "libraries":
            merged["libraries"] = value + parent.get("libraries", [])
        elif key == "arguments":
            merged_args = dict(parent.get("arguments", {}))
            for arg_type in ("game", "jvm"):
                merged_args[arg_type] = (
                    parent.get("arguments", {}).get(arg_type, [])
                    + value.get(arg_type, [])
                )
            merged["arguments"] = merged_args
        else:
            merged[key] = value

    return merged


# ---------------------------------------------------------------------------
# Libraries
# ---------------------------------------------------------------------------

def maven_to_path(coords: str) -> str:
    """net.fabricmc:tiny-remapper:0.8.2 -> net/fabricmc/tiny-remapper/0.8.2/tiny-remapper-0.8.2.jar"""
    parts = coords.split(":")
    group, artifact, version = parts[0], parts[1], parts[2]
    classifier = parts[3] if len(parts) > 3 else None

    name = f"{artifact}-{version}"
    if classifier:
        name += f"-{classifier}"

    return "/".join(group.split(".") + [artifact, version, name + ".jar"])


def library_jobs(root: Path, libraries: list[dict]) -> tuple[list[tuple], list[Path], list[dict]]:
    """Returns (download jobs, classpath entries, legacy native libs)."""
    lib_dir = root / "libraries"
    jobs: list[tuple] = []
    classpath: list[Path] = []
    natives: list[dict] = []

    for lib in libraries:
        if not rules_allow(lib.get("rules")):
            continue

        downloads = lib.get("downloads", {})
        artifact = downloads.get("artifact")

        if artifact:
            path = lib_dir / artifact["path"]
            jobs.append((artifact["url"], path, artifact.get("sha1")))
            classpath.append(path)
        elif "name" in lib and "url" in lib:
            # Loader-style entry: maven base URL + coordinates, no hashes.
            rel = maven_to_path(lib["name"])
            path = lib_dir / rel
            jobs.append((lib["url"].rstrip("/") + "/" + rel, path, None))
            classpath.append(path)

        # Legacy natives (pre ~1.19): a classifier jar that must be extracted.
        if "natives" in lib:
            key = lib["natives"].get(OS_NAME)
            if key:
                key = key.replace("${arch}", "64" if ARCH in ("x86_64", "arm64") else "32")
                native = downloads.get("classifiers", {}).get(key)
                if native:
                    path = lib_dir / native["path"]
                    jobs.append((native["url"], path, native.get("sha1")))
                    natives.append({"path": path, "extract": lib.get("extract", {})})

    return jobs, classpath, natives


def extract_natives(natives: list[dict], target: Path) -> None:
    if not natives:
        return
    if target.exists():
        shutil.rmtree(target)
    target.mkdir(parents=True, exist_ok=True)

    for entry in natives:
        exclude = entry.get("extract", {}).get("exclude", [])
        with zipfile.ZipFile(entry["path"]) as zf:
            for member in zf.namelist():
                if member.endswith("/"):
                    continue
                if any(member.startswith(prefix) for prefix in exclude):
                    continue
                zf.extract(member, target)


# ---------------------------------------------------------------------------
# Assets
# ---------------------------------------------------------------------------

def install_assets(root: Path, version: dict) -> None:
    index_info = version.get("assetIndex")
    if not index_info:
        return

    index_path = root / "assets" / "indexes" / f"{index_info['id']}.json"
    download(index_info["url"], index_path, index_info.get("sha1"))
    index = json.loads(index_path.read_text(encoding="utf-8"))

    objects_dir = root / "assets" / "objects"
    jobs = []
    for obj in index.get("objects", {}).values():
        h = obj["hash"]
        jobs.append((f"{RESOURCES}/{h[:2]}/{h}", objects_dir / h[:2] / h, h))

    download_all(jobs, "assets")

    # Pre-1.7 packs need a readable tree rather than hashed blobs.
    if index.get("virtual") or index.get("map_to_resources"):
        base = root / "assets" / "virtual" / index_info["id"]
        for name, obj in index.get("objects", {}).items():
            h = obj["hash"]
            dest = base / name
            if not dest.exists():
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy(objects_dir / h[:2] / h, dest)


# ---------------------------------------------------------------------------
# Java
# ---------------------------------------------------------------------------

def java_major(java_exe: str) -> int | None:
    try:
        out = subprocess.run(
            [java_exe, "-version"], capture_output=True, text=True, timeout=15
        ).stderr
    except (OSError, subprocess.SubprocessError):
        return None

    match = re.search(r'version "(\d+)(?:\.(\d+))?', out)
    if not match:
        return None
    major = int(match.group(1))
    # 1.8.0_xxx style
    return int(match.group(2)) if major == 1 and match.group(2) else major


def find_java(required_major: int) -> str:
    """
    Finds a usable JRE. A real launcher should download and manage its own —
    see https://api.adoptium.net/v3/binary/latest/{major}/ga/{os}/{arch}/jre/hotspot/normal/eclipse
    which is a stable, documented endpoint for per-platform Temurin builds.
    """
    candidates = [os.environ.get("JAVA_HOME"), None]
    for base in candidates:
        exe = (
            str(Path(base) / "bin" / ("java.exe" if OS_NAME == "windows" else "java"))
            if base else shutil.which("java")
        )
        if not exe:
            continue
        found = java_major(exe)
        if found is None:
            continue
        if found >= required_major:
            return exe
        print(f"  [warn] {exe} is Java {found}, need {required_major}+")

    raise RuntimeError(
        f"No Java {required_major}+ found. Install Temurin {required_major} "
        f"or set JAVA_HOME."
    )


# ---------------------------------------------------------------------------
# Install
# ---------------------------------------------------------------------------

def install(root: Path, version_id: str) -> dict:
    version = resolve_version(root, version_id)
    print(f"Installing {version_id} (assets {version.get('assets')}, "
          f"Java {version.get('javaVersion', {}).get('majorVersion', '?')})")

    client = version.get("downloads", {}).get("client")
    if client:
        jar = root / "versions" / version_id / f"{version_id}.jar"
        download(client["url"], jar, client.get("sha1"))
        print("  client.jar ok")

    jobs, _, natives = library_jobs(root, version.get("libraries", []))
    download_all(jobs, "libraries")
    extract_natives(natives, root / "versions" / version_id / "natives")

    install_assets(root, version)
    print("Done.")
    return version


# ---------------------------------------------------------------------------
# Argument building
# ---------------------------------------------------------------------------

def flatten_arguments(entries: list, features: dict[str, bool]) -> list[str]:
    """arguments.game / arguments.jvm entries are strings or {rules, value}."""
    out: list[str] = []
    for entry in entries:
        if isinstance(entry, str):
            out.append(entry)
            continue
        if not rules_allow(entry.get("rules"), features):
            continue
        value = entry.get("value", [])
        out.extend([value] if isinstance(value, str) else value)
    return out


def substitute(args: list[str], values: dict[str, str]) -> list[str]:
    out = []
    for arg in args:
        for key, val in values.items():
            arg = arg.replace("${" + key + "}", str(val))
        out.append(arg)
    return out


def build_command(
    root: Path,
    version_id: str,
    auth: dict[str, str],
    memory_mb: int = 4096,
    features: dict[str, bool] | None = None,
) -> list[str]:
    version = resolve_version(root, version_id)
    features = features or {}

    _, classpath, _ = library_jobs(root, version.get("libraries", []))
    classpath.append(root / "versions" / version_id / f"{version_id}.jar")

    required = version.get("javaVersion", {}).get("majorVersion", 8)
    java = find_java(required)

    placeholders = {
        # identity — supplied by mc_auth.py
        "auth_player_name": auth.get("auth_player_name", "Player"),
        "auth_uuid": auth.get("auth_uuid", "0" * 32),
        "auth_access_token": auth.get("auth_access_token", "0"),
        "auth_xuid": auth.get("auth_xuid", ""),
        "clientid": auth.get("clientid", ""),
        "user_type": auth.get("user_type", "msa"),
        "auth_session": "token:" + auth.get("auth_access_token", "0"),  # legacy
        # paths
        "game_directory": str(root),
        "assets_root": str(root / "assets"),
        "game_assets": str(root / "assets" / "virtual" / str(version.get("assets"))),
        "assets_index_name": str(version.get("assets", "legacy")),
        "natives_directory": str(root / "versions" / version_id / "natives"),
        "library_directory": str(root / "libraries"),
        # version + launcher
        "version_name": version_id,
        "version_type": version.get("type", "release"),
        "launcher_name": LAUNCHER_NAME,
        "launcher_version": LAUNCHER_VERSION,
        # classpath
        "classpath": CLASSPATH_SEP.join(str(p) for p in classpath),
        "classpath_separator": CLASSPATH_SEP,
    }

    if "arguments" in version:
        jvm_args = flatten_arguments(version["arguments"].get("jvm", []), features)
        game_args = flatten_arguments(version["arguments"].get("game", []), features)
    else:
        # Pre-1.13: no jvm block at all, and a flat argument string.
        jvm_args = ["-Djava.library.path=${natives_directory}", "-cp", "${classpath}"]
        game_args = version.get("minecraftArguments", "").split()

    memory = [f"-Xmx{memory_mb}M", f"-Xms{min(memory_mb, 512)}M"]

    return (
        [java]
        + memory
        + substitute(jvm_args, placeholders)
        + [version["mainClass"]]
        + substitute(game_args, placeholders)
    )


# ---------------------------------------------------------------------------
# Launch
# ---------------------------------------------------------------------------

def launch(root: Path, version_id: str, auth: dict[str, str], **kwargs) -> int:
    command = build_command(root, version_id, auth, **kwargs)

    root.mkdir(parents=True, exist_ok=True)
    proc = subprocess.Popen(
        command,
        cwd=root,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        errors="replace",
        bufsize=1,
    )

    assert proc.stdout is not None
    for line in proc.stdout:
        print(line, end="")

    code = proc.wait()
    if code != 0:
        print(f"\nGame exited with code {code}")
    return code


def offline_identity(name: str) -> dict[str, str]:
    """
    Development stub so you can test the install pipeline before Microsoft
    approves your app registration.

    This is NOT a substitute for real auth — it cannot join online-mode servers.
    Gate it behind a dev flag; do not ship it as a general 'play without an
    account' option.
    """
    import uuid
    offline_uuid = uuid.uuid3(uuid.NAMESPACE_OID, f"OfflinePlayer:{name}")
    return {
        "auth_player_name": name,
        "auth_uuid": offline_uuid.hex,
        "auth_access_token": "0",
        "auth_xuid": "",
        "clientid": "",
        "user_type": "legacy",
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description="Minecraft installer + launcher")
    parser.add_argument("command", choices=["install", "launch"])
    parser.add_argument("version")
    parser.add_argument("--root", default=None, help="game directory")
    parser.add_argument("--offline", metavar="NAME", help="dev stub identity")
    parser.add_argument("--memory", type=int, default=4096, help="max heap in MB")
    args = parser.parse_args()

    root = Path(args.root) if args.root else Path.home() / ".my-launcher" / "default"
    root.mkdir(parents=True, exist_ok=True)

    if args.command == "install":
        install(root, args.version)
        return 0

    install(root, args.version)

    if args.offline:
        auth = offline_identity(args.offline)
    else:
        try:
            from mc_auth import silent_login, load_refresh_token, interactive_login
            token = load_refresh_token()
            _, session = silent_login(token) if token else interactive_login()
            auth = session.launch_args()
        except Exception as exc:
            print(f"Auth unavailable ({exc}); use --offline NAME for now.", file=sys.stderr)
            return 1

    return launch(root, args.version, auth, memory_mb=args.memory)


if __name__ == "__main__":
    raise SystemExit(main())
```
