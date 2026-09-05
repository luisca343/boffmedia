# Changelog

What changed, in words a player reads. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions are the
**Boffmedia App**'s, which is the only artifact users install and therefore the
only thing they can be "on a version" of.

The web platform and the API deploy continuously from immutable run-number image
tags and are not versioned here. When a change to either is something a player
would notice, it goes under the app release that shipped alongside it — a
changelog is organised around who reads it, not around which container restarted.

**This file is load-bearing, not decoration.** `.github/workflows/desktop-release.yml`
refuses to build a version that has no section here, and uses the section body as
the release notes shown in the in-app update banner when the workflow's `notes`
input is left blank. So an entry written badly is an entry users read.

- Draft a starting point from the commits: `node scripts/release-notes.mjs --draft [<since>]`
  — then rewrite every line. Commit subjects are addressed to developers.
- Check a version is documented: `node scripts/release-notes.mjs --check 0.9.0`
- Keep the three version fields in step: `node scripts/release-notes.mjs --check-versions`
  (runs in `pnpm lint`).

## [Unreleased]

### Added

- Ownership, environment and release gates now run in the lint chain, so a
  route, an environment variable or a version that drifts fails a pull request
  instead of a production request.

### Fixed

- The API now refuses to start on an invalid environment with a report that
  names each offending variable, instead of a stack trace containing a zod
  `path` array.
- `pnpm lint` no longer rewrites files. Fixing is `pnpm lint:fix`.

## [0.9.0] - 2026-09-05

First release with notes. The app has been installable for some time; this is
the point at which what shipped in it started being written down.

### Added

- **Installs resume.** An interrupted download picks up where it stopped rather
  than starting the pack again.
- **Crashes are named.** Common failures — a missing Java, a mod conflict, a
  full disk — are reported as what happened instead of a stack trace.
- **The previous build is kept** after an update, so a bad release can be rolled
  back without reinstalling.
- **Sentry error reporting**, off unless you opt in and scrubbed of personal
  data before it is sent.

### Fixed

- **Switching Boffmedia account mid-install no longer corrupts the install.**
  Signing out had no guard at all, which is the case that actually bit.
- **Exporting a pack twice no longer opens two save dialogs** over each other.
- **JVM arguments** show the command line they produce, and the RAM slider no
  longer silently moves a value you typed.
