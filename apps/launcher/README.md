# Boff Launcher

Tauri v2 + React. Design system from `@boffmedia/ui`, pack validation from
`@boffmedia/pack-schema` — the same schema `apps/api` validates with.

Decisions and reference implementations: [`docs/LAUNCHER_HANDOFF.md`](docs/LAUNCHER_HANDOFF.md).
Read §4.2's superseded note first — the shell is Tauri, not Electron.

## Working on the UI (no Rust needed)

```bash
pnpm --filter launcher dev:renderer     # http://localhost:5273
```

This is where most work happens. Every screen, the whole design system and the
pack schema run in a plain browser. `runtime_info` returns null there, so the
Runtime panel shows dashes — that is the tell that you are not in the shell.

## Working on the shell (needs Rust)

```bash
pnpm --filter launcher dev              # tauri dev: builds Rust, opens the window
pnpm --filter launcher build            # tauri build: produces installers
```

**Build this on Windows.** That is what users run (WebView2), and it avoids
WebKitGTK, which is the flaky path. Install [rustup](https://rustup.rs) plus the
VS Build Tools and run the commands above from the repo on Windows.

Building in WSL additionally needs `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`,
`librsvg2-dev`, `libayatana-appindicator3-dev` and a WSLg display
(`export DISPLAY=:0`). It works, but it exercises a webview none of your users have.

## Layout

```
src/screens/    SignIn · Packs · PackDetail (install/update/launch) · Logs · Settings
src/components/ Shell (sidebar, account, running indicator)
src/state/      the launcher store — install and launch are STATE MACHINES,
                not independent booleans
src/services/   types + mock data. Every mock carries a TODO(rust) naming the
                Tauri command that replaces it
src/runtime.ts  the ONLY module that imports @tauri-apps/*, so screens stay
                browser-runnable
src-tauri/      Rust: window, commands, and eventually §5 auth + §6 install
docs/           handoff + the Python reference implementations
```

The screens are complete and driven by mock data. Replacing a mock with a real
Tauri command should not require touching a screen — if it does, the seam is in
the wrong place.

## Not built yet

The Rust side: the pack registry (§7), the auth chain (§5) and the install
pipeline (§6).
`mc_auth.py` and `mc_install.py` in `docs/` are working references to port.

Dependencies are chosen (verified 2026-07-30): **`portablemc` 5.0** (Apache-2.0) covers
all of it — its `msa` module is the Microsoft auth chain (§5), its `forge` module installs
**both Forge and NeoForge** via a `Loader` enum (§6.4), it manages Java runtimes (§6.3),
and its `Handler` trait + `Event` enum drive the install progress UI. Lyceris was rejected:
offline-auth only, and 15 months without a release.

`keyring` holds the refresh token in the OS credential store (§5.7) — never a file.

## The manifest contract (TS ↔ Rust)

`packages/pack-schema` (zod) is the single source of truth. Its build emits
`schema/pack-manifest.schema.json`, and `src-tauri/build.rs` turns that into Rust
structs with `typify`. The schema file is **committed**, so a Rust-only checkout builds
without Node.

**The one rule:** JSON Schema cannot express zod refinements, so `.superRefine` blocks
are *silently dropped*. Every refinement in `boffmedia.ts` must be mirrored by hand in
`src-tauri/src/pack.rs` — today that is the case-insensitive duplicate-path check. Use
`parse_manifest()`, never bare `serde_json::from_str`, or a manifest reaches the
installer half-checked.

`pnpm check:schema` fails the build when the committed JSON Schema is stale.
