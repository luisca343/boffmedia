# Randomizer local-dev jars (`fvx-local/`)

This folder holds the FVX randomizer jars used **only for local development**, where the
API runs on your host (`pnpm --filter api dev`) instead of inside the Docker image.

- `fvx.jar` — UPR-FVX randomizer, built from the fork
  ([luisca343/universal-pokemon-randomizer-fvx](https://github.com/luisca343/universal-pokemon-randomizer-fvx))
  at the pinned commit with the `--seed` flag, on the **Java 21** toolchain with `--enable-preview`.
  This is the exact build whose determinism was proven in the Phase 0 spike and reproduced
  byte-for-byte by the Phase 1 e2e test — sha512 `2cb5057c358b28e66def17a8…`.
- `settings-shim.jar` — the JSON⇄`.rnqs` encoder, compiled against that same `fvx.jar`.

## The jars are git-excluded on purpose

`apps/api/fvx-local/*.jar` is listed in `.git/info/exclude` — the binaries never enter git.
Production gets its own jars by **building FVX from source inside `apps/api/Dockerfile`**
(the `fvx-build` stage), so nothing here ships to prod. This README *is* tracked.

If the jars are missing from your checkout, ask a teammate or rebuild them (see below).

## Running the randomizer locally

The runner and shim are env-gated. With the vars **unset**, the randomizer endpoints return
`503` (via `StubRandomizerRunner` / `StubSettingsShim`) and the rest of the API runs normally —
so you only need this if you're actually working on the randomizer.

Requirements:
- **Java 21, exactly** (the runner passes `--enable-preview`, and preview features are locked to
  their version — 22/23/25 will not run this jar).

Set these environment variables for the API dev process (paths relative to the repo root):

| Var | Value |
|---|---|
| `RANDOMIZER_JAR` | `apps/api/fvx-local/fvx.jar` |
| `RANDOMIZER_SHIM_JAR` | `apps/api/fvx-local/settings-shim.jar` |
| `RANDOMIZER_JAVA` | path to your Java 21 `java` — omit if `java` on `PATH` is already 21 |
| `RANDOMIZER_SCRATCH_DIR` | optional; defaults to `%TEMP%/randomizer` (or `$TMPDIR/randomizer`) |

The classpath separator is handled per-platform in code (`;` on Windows, `:` on Linux), so the
same jars work in Windows dev and the Linux container.

## Rebuilding the jars from the fork

```bash
git clone https://github.com/luisca343/universal-pokemon-randomizer-fvx.git
cd universal-pokemon-randomizer-fvx
git checkout <pinned-commit>        # the fork commit carrying --seed + the Java 21 toolchain
./gradlew jar -x test               # -> random/build/libs/UPR-FVX.jar
cp random/build/libs/UPR-FVX.jar  <repo>/apps/api/fvx-local/fvx.jar

# shim (compiled against the built jar):
javac --release 21 --enable-preview -cp fvx.jar -d shim-out \
  <repo>/apps/api/docker/fvx/SettingsShim.java
jar cf <repo>/apps/api/fvx-local/settings-shim.jar -C shim-out .
```

Notes for a faithful rebuild:
- **Pin the Gradle toolchain to Java 21** (with `--enable-preview`) in the fork. Pristine upstream
  now targets a Java 25 toolchain; building on 25 diverges from the determinism anchor above.
- To keep the sha512 stable across rebuilds, enable reproducible-jar flags in the fork's `jar`
  task (`preserveFileTimestamps = false`, `reproducibleFileOrder = true`) — Gradle jars are not
  byte-reproducible by default.

## Production build (for reference)

`apps/api/Dockerfile` builds these jars from source in the `fvx-build` stage and copies them into
the runner image alongside a Java 21 JRE. For "build from my GitHub", point that stage's
`git clone` at the fork and ensure the fork commit already carries `--seed` (then the separate
`seed-flag.patch` apply step can be dropped). See `apps/api/docker/fvx/` for the prod build inputs.
