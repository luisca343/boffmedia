# Boff Launcher — release QA checklist

Run this on a **clean Windows machine** (no dev toolchain, no `%APPDATA%\BoffLauncher`)
before publishing a release. The whole point is to exercise the paths a developer
box hides: a first-ever install, a missing Java, an empty credential store.

Because 1.0 ships **unsigned**, expect and note the SmartScreen prompt on first run
("Windows protected your PC" → More info → Run anyway). Verifying that flow is part
of the test, not a failure.

## 0. Fresh install
- [ ] Download the published installer from the `/launcher` page (not a local build).
- [ ] SmartScreen prompt appears; "Run anyway" installs without admin rights (currentUser NSIS).
- [ ] First launch shows the boot splash, then the Sign-In screen (no white flash, no SignIn flash-then-hide).
- [ ] `%APPDATA%\BoffLauncher` is created (prod), not `BoffLauncher Dev`.

## 1. Authentication (§5)
- [ ] Device-code sign-in: code shown, system browser opens pre-filled, completes.
- [ ] Refresh token lands in the Windows credential store; access token never on disk.
- [ ] Relaunch → silent restore, no re-prompt.
- [ ] Add a second account; switch between them; the pack library changes with the active account.
- [ ] Remove an account; the roster updates; last-account removal returns to Sign-In.
- [ ] **Revalidar sesión** (Settings → Cuenta) re-mints and logs "Sesión revalidada.".
- [ ] Offline mode ("Jugar sin conexión") succeeds only for an account that signed in here before.

## 2. Managed pack install + launch (§6)
- [ ] Install a NeoForge pack from scratch: all 8 phases report, Java auto-installs.
- [ ] Progress bar advances monotonically; no phase sits at 0%.
- [ ] Launch: game reaches the main menu; "Jugar" is NOT offered mid-install.
- [ ] Quick Play (pack with a server) boots straight into the server (MC ≥ 1.20).
- [ ] Close game → state returns to idle; `closeOnLaunch` honored if set.

## 3. Delta update + rollback (§9)
- [ ] Publish a new version changing a few mods; the pack shows "outdated".
- [ ] Update pulls only the changed files (watch bytes/log), not the whole pack.
- [ ] A user-added mod (dropped into mods/) survives the update.
- [ ] Roll back to the prior version; the instance pins; next launch does not silently re-update.
- [ ] Optional-mod toggles persist across update and launch.

## 4. Resilience
- [ ] Kill Wi-Fi mid-install → the download retries, then fails with a clear message (not a hang).
- [ ] Restore Wi-Fi, re-run install → resumes from cache (already-downloaded mods are not re-fetched).
- [ ] Corrupt a cached blob → repair re-downloads it; saves/worlds untouched.
- [ ] Force a crash (bad mod) → crash card names the cause; **Copiar informe** yields a bundle with
      launcher/pack/Java context above the log tail.

## 5. Local packs + import/export
- [ ] Create a local pack; add mods via the Modrinth browser; launch it.
- [ ] (If enabled) add a CurseForge mod; a blocked mod surfaces the manual-download UX.
- [ ] Import a third-party `.mrpack` (file and URL); overrides install; renamed-on-collision notice shows.
- [ ] Export a pack to `.mrpack`; re-import the export cleanly.
- [ ] Duplicate a local pack; the copy installs independently.

## 6. Backups, worlds, files
- [ ] Create an instance backup and a single-world backup; both restore.
- [ ] Worlds tab lists saves with mode/size/last-played; delete a world (armed confirm).
- [ ] Files tab browses `.minecraft`; `.boff-*` entries hidden at root; reveal-in-Explorer works.

## 7. Self-update
- [ ] With this build installed, publish the NEXT version to the dev feed.
- [ ] Update banner appears on next launch; download shows progress; relaunch into the new version.
- [ ] Portable build (`BOFF_PORTABLE=1`) does NOT offer the in-app update (re-download model).

## 8. Settings + i18n
- [ ] Memory auto/manual, Java path, game dir, retained-versions all persist across relaunch.
- [ ] Switch language (es ⇄ en): every screen, the crash card, and error banners follow.

## Sign-off
- [ ] `pnpm type-check` green · `cargo test` green (in `src-tauri`).
- [ ] Version bumped in `tauri.conf.json`; release notes written.
- [ ] SHA-512 on the `/launcher` page matches the uploaded artifact.
