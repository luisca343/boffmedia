import { z } from "zod"

import { EnvSupport, FileEnv, InstancePath, MrpackDependencies, loaderOf } from "./mrpack.js"

// Boffmedia's additions to .mrpack, all under the `boffmedia:` namespace so a
// third-party tool (Prism, packwiz) ignores them and the pack still installs.
// Per file: source, SHA-512, target path, env.

/** A normalized, case-insensitive view of an instance path: lowercased with
 *  separators unified. Windows and macOS would silently overwrite one file with
 *  another differing only in case, while Linux installs both — a pack that
 *  installs differently per platform is a pack that cannot be supported. Every
 *  path comparison in this file goes through here so the three ends (the
 *  refinements, the optional model, and `pack.rs::norm_path`) agree. */
export const normPath = (p: string): string => p.toLowerCase().split("\\").join("/")

/** Which game a pack targets. Absent means `minecraft`, so a pack with no
 *  `gameType` still loads. All four values are declared even though only
 *  `minecraft` is playable: the discriminator, filtering and validation
 *  skeleton exist once, and each game lights up its own spec block and its own
 *  launcher arm. `gameType` is immutable after pack creation (enforced in the
 *  API) — a pack that changed games would break every installed instance. */
export const GameType = z.enum(["minecraft", "emulator", "zomboid", "stardew"])
export type GameType = z.infer<typeof GameType>

/** Where a file comes from — exactly three sources. CurseForge is proxied
 *  rather than fetched directly because an embedded CF key gets extracted, and
 *  an abused key is a revoked key. Modrinth is primary and goes client-direct
 *  at zero egress cost. */
export const FileSource = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("modrinth"),
    projectId: z.string().min(1),
    versionId: z.string().min(1),
  }),
  z.object({
    kind: z.literal("curseforge"),
    projectId: z.number().int().positive(),
    fileId: z.number().int().positive(),
  }),
  z.object({
    kind: z.literal("url"),
    url: z.url(),
  }),
  /** Configs, scripts, resource packs: content-addressed blobs we host.
   *  Fetched with a short-TTL presigned URL, never a public one. */
  z.object({
    kind: z.literal("override"),
    blobSha512: z.string().regex(/^[a-f0-9]{128}$/, "blobSha512 must be 128 lowercase hex chars"),
  }),
  /** A file the server NEVER stores: the player supplies it locally and the
   *  launcher verifies it against the entry's mandatory `sha512` + `fileSize`
   *  before placing it. Game-agnostic by design (ROMs, BIOS files, anything
   *  undistributable). `hint` is what the player sees when asked for the file —
   *  authors must write it precisely (region/revision matter). */
  z.object({
    kind: z.literal("user-provided"),
    hint: z.string().min(1).max(512),
  }),
  /** A romhack: the file materializes LOCALLY by applying `patch` to `base`,
   *  then is verified like any other file against the entry's own `sha512` +
   *  `fileSize` (which pin the PATCHED output). The pipeline stays uniform —
   *  every file has a way to materialize and a pinned hash. `base` must point at
   *  a `user-provided` files[] entry (the player's clean dump — the server never
   *  hosts ROM bytes, D3); `patch` at a distributable files[] entry
   *  (`override`/`url` — patches are freely redistributable). No `patched` entry
   *  may itself be the `base` of another (no chains in v1). Cross-field rules
   *  live in the superRefine and are mirrored in `pack.rs`. `.ips` is excluded:
   *  no embedded checksums. `.bps`/`.ups` both carry source/target CRC32s. */
  z.object({
    kind: z.literal("patched"),
    base: InstancePath,
    patch: InstancePath,
    format: z.enum(["bps", "ups"]),
  }),
])
export type FileSource = z.infer<typeof FileSource>

/** A file in a Boffmedia pack version. Unlike the raw .mrpack file, sha512 is
 *  mandatory — it is the integrity check on every download and, for overrides,
 *  the blob's own address. */
export const PackFile = z.object({
  path: InstancePath,
  sha512: z.string().regex(/^[a-f0-9]{128}$/, "sha512 must be 128 lowercase hex chars"),
  fileSize: z.number().int().nonnegative(),
  env: FileEnv.default({ client: "required", server: "required" }),
  source: FileSource,
  /** The mod loader this jar was built for, recorded ONLY when it differs from
   *  the pack's own — that is, a Fabric mod running on NeoForge through Sinytra
   *  Connector. Absent means "the pack's loader", which is every ordinary file.
   *
   *  Stored rather than re-derived because the alternative is one Modrinth
   *  round trip per entry, every time a pack page wants to show which mods are
   *  Fabric. Deliberately NOT enforced by a superRefine: a cross-field rule here
   *  would have to be hand-mirrored in `pack.rs` (JSON Schema drops refinements
   *  silently), and "Fabric files but no Connector" is better surfaced as a
   *  warning in the editor than as a manifest that refuses to parse. */
  loader: z.enum(["fabric", "quilt", "forge", "neoforge"]).optional(),
})
export type PackFile = z.infer<typeof PackFile>

/** The supported emulator systems. Azahar/3DS is deferred (it needs decrypted
 *  dumps plus keys); RetroArch is not supported. */
export const EmulatorKind = z.enum(["mgba", "melonds"])
export type EmulatorKind = z.infer<typeof EmulatorKind>

/** The per-game spec block for `gameType: "emulator"`. `rom` names the file
 *  handed to the emulator at launch — it MUST equal the `path` of a `files[]`
 *  entry whose source is `user-provided` or `patched` (the server never hosts
 *  ROM bytes, D3) and whose env is client:required / server:unsupported. `args`
 *  are extra CLI flags placed BEFORE the ROM path. Cross-field rules live in the
 *  PackManifest superRefine and are mirrored in `pack.rs`. */
export const EmulatorSpec = z.object({
  kind: EmulatorKind,
  rom: InstancePath,
  args: z.array(z.string().max(256)).max(32).optional(),
})
export type EmulatorSpec = z.infer<typeof EmulatorSpec>

/** A password gates composition and configs, not the mods themselves — those
 *  come from public CF/Modrinth URLs. This is distribution control and
 *  revocation, never copy protection. */
export const PackAccess = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("public") }),
  z.object({ kind: z.literal("password") }),
  /** ACL keyed on the Minecraft UUID proved via `hasJoined`. */
  z.object({
    kind: z.literal("allowlist"),
    uuids: z.array(z.uuid()),
  }),
])
export type PackAccess = z.infer<typeof PackAccess>

/** A world bundled INTO the pack: a zipped save the launcher extracts into
 *  `saves/<folder>` on install. First-install-only — an update never overwrites
 *  a save that already exists on disk, so a player's progress is safe. That is
 *  why a world is NOT a plain PackFile: files re-verify and re-download on every
 *  update, which would clobber a played world. The zip is content-addressed
 *  through the same blob store as override files (`source`); `sha512` is the
 *  hash of the zip, verified before extraction. */
export const BundledWorld = z.object({
  /** A single save-directory name under `saves/`. One path segment, no
   *  separators and no traversal — this value names a directory we create. */
  folder: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[^/\\]+$/, "folder must be a single path segment")
    .refine((f) => f !== "." && f !== "..", "folder must not be '.' or '..'"),
  source: FileSource,
  sizeBytes: z.number().int().nonnegative(),
  sha512: z.string().regex(/^[a-f0-9]{128}$/, "sha512 must be 128 lowercase hex chars"),
})
export type BundledWorld = z.infer<typeof BundledWorld>

/** Where a resourcepack / shaderpack / datapack has to be *switched on*, not
 *  merely placed.
 *
 *  For a mod, dropping the jar in `mods/` is the entire job. For the three kinds
 *  below it is half the job: the file sits on disk and the game ignores it until
 *  a config names it. `activate` is that other half, declared by the author so
 *  the launcher does not have to guess from a file extension.
 *
 *  `datapack` is the odd one out and deliberately so. Under D1 (see
 *  docs/packs-v2-plan.md §11) datapacks are delivered through a global loader —
 *  OpenLoader or Paxi — so the file's own `path` already puts it where the loader
 *  reads it, and there is no config to edit. The variant still exists because it
 *  declares INTENT: it is what lets validation insist on a loader directory
 *  (rule 9) and warn when no loader jar ships with the pack, and what lets the
 *  chooser say "datapack" instead of "a zip inside config/". */
export const ActivationSpec = z.discriminatedUnion("kind", [
  /** `options.txt` carries `resourcePacks:["vanilla","file/x.zip"]` — a JSON
   *  array on ONE line. Later entries win in-game, so `priority` decides where
   *  in that array the pack is inserted; higher wins. Absent = 0. */
  z.object({
    kind: z.literal("resourcepack"),
    file: InstancePath,
    priority: z.number().int().min(0).max(100).optional(),
  }),
  /** Iris/Oculus read `shaderPack=` out of their own properties file, which
   *  holds exactly ONE value. Two shaderpacks cannot both be active, so this
   *  variant is legal only inside a `one`/`atMostOne` group (rule 8) — the
   *  schema must not let an author imply a choice the game cannot honour. */
  z.object({
    kind: z.literal("shaderpack"),
    file: InstancePath,
  }),
  /** Declaration only — see the note above. `file` must live under a global
   *  loader's datapack directory (rule 9). */
  z.object({
    kind: z.literal("datapack"),
    file: InstancePath,
  }),
])
export type ActivationSpec = z.infer<typeof ActivationSpec>

/** Directory prefixes a global datapack loader reads. D1 picked the loader route
 *  because `saves/<world>/datapacks/` does not exist until the world does, and a
 *  player creates worlds whenever they like — a per-world copy can only ever
 *  cover the worlds that existed at install time. */
export const DATAPACK_LOADER_DIRS = ["config/openloader/datapacks/", "config/paxi/datapacks/"] as const

/** Substrings that identify a global datapack loader jar. A heuristic on the
 *  filename, which is why it drives a WARNING and never an error — a heuristic
 *  must not be able to make a valid pack unpublishable. */
const DATAPACK_LOADER_HINTS = ["openloader", "paxi"] as const

/** One thing a player switches on or off.
 *
 *  The unit is a FEATURE, not a file. "Shaders" is Iris + Sodium + a config +
 *  the `.zip`, and a player who can switch on three of those four has a crash,
 *  not a choice. `env.client: "optional"` marks a PATH as skippable, which is
 *  the right thing to tell Prism or packwiz; a feature is the decision that
 *  spans those paths, which is the right thing to show a person. */
export const OptionalFeature = z.object({
  /** Stable across versions — the player's saved choice keys on this id, so
   *  renaming it silently resets everyone's selection. */
  id: z
    .string()
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "feature id must be lowercase kebab-case"),
  name: z.string().min(1).max(64),
  description: z.string().max(512).optional(),
  iconUrl: z.url().optional(),
  /** Instance paths this feature owns. Every one must be a `files[]` entry whose
   *  `env.client` is `"optional"` (rules 1-2), and no path may be owned by two
   *  features (rule 4) — two switches fighting over one jar cannot both win. */
  paths: z.array(InstancePath).min(1).max(64),
  /** On unless the player says otherwise (opt-out) vs off until they ask for it
   *  (opt-in). This is precisely what `env.client` alone could never express:
   *  it has one "optional" and no way to say which way it leans.
   *
   *  Required, with no zod default, on purpose — an author must decide. It is
   *  also the value a player's stored state is a DEVIATION from, so a feature
   *  added in a later version lands here rather than on a value recorded before
   *  it existed. See OptionalState in apps/desktop/src-tauri/src/install/. */
  default: z.boolean(),
  /** Feature ids that must be ON for this one to be on. Targets must exist, must
   *  not cycle, and must live in an `any` group (rule 5) — a `requires` pointing
   *  into a radio group could force two of its members on at once. */
  requires: z.array(z.string().max(64)).max(8).optional(),
  /** Placement is not always activation — see ActivationSpec. */
  activate: ActivationSpec.optional(),
})
export type OptionalFeature = z.infer<typeof OptionalFeature>

/** How many features in a group may be on at once. */
export const OptionalSelect = z.enum(["any", "one", "atMostOne"])
export type OptionalSelect = z.infer<typeof OptionalSelect>

export const OptionalGroup = z.object({
  id: z
    .string()
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "group id must be lowercase kebab-case"),
  name: z.string().min(1).max(64),
  description: z.string().max(512).optional(),
  /** `any` — independent switches.
   *  `one` — exactly one on at all times (a radio; the group must declare
   *          exactly one `default: true`).
   *  `atMostOne` — a radio plus "ninguno".
   *
   *  OPTIONAL rather than `.default("any")`, following `gameType`: a zod default
   *  survives to the emitted JSON Schema as a `default` keyword on a field the
   *  schema still lists as required, and whether the Rust codegen honours that
   *  is the codegen's business, not ours. Read it through `selectOf(group)`, the
   *  way `gameTypeOf(pack)` is read. */
  select: OptionalSelect.optional(),
  features: z.array(OptionalFeature).min(1).max(64),
})
export type OptionalGroup = z.infer<typeof OptionalGroup>

/** The resolved selection mode of a group: the stored value, or `any` when
 *  absent. One place owns the default so no consumer re-implements it. */
export const selectOf = (group: OptionalGroup): OptionalSelect => group.select ?? "any"

// ── Pack-bundled JVM runtime ───────────────────────────────────────────────
//
// A pack may RECOMMEND a heap size and a set of JVM tuning flags. Two things
// about this are deliberate and easy to get wrong later:
//
//   IT IS A SEED, NOT A SETTING. The launcher writes these into the instance's
//   `.boff-runtime.json` on first install and never touches them again — not on
//   update, not on repair. From that moment the values belong to the player.
//   A pack that "fixes its GC flags" in 1.4.2 therefore does NOT silently
//   re-tune an instance somebody has already adjusted.
//
//   THE ALLOWLIST IS NOT PARANOIA ABOUT ARBITRARY CODE. A modpack already ships
//   mod jars, so "the pack can run code" is a given. Two capabilities are NOT a
//   given, and both come free with an unfiltered arg list:
//     1. `-XX:OnError=` / `-XX:OnOutOfMemoryError=` run an arbitrary OS command,
//        not Java — a shell, outside the JVM, on a crash the player will read as
//        the pack being buggy.
//     2. Every byte a pack ships goes through `files[]`: a declared source, a
//        sha512, our blob store. `-javaagent:C:\Users\x\Downloads\evil.jar`
//        loads code that was never in the manifest and was never hashed.
//   The allowlist exists to keep both of those out, which is why it is a
//   positive grammar rather than a list of bad strings.

/** Longest single argument accepted. Real tuning flags are far under this;
 *  anything longer is a payload, not a flag. */
export const JVM_ARG_MAX_LEN = 256

/** Most args a pack may ship. G1 tuning takes ~10; 32 is generous and bounds
 *  both the manifest and the argv the launcher builds. */
export const JVM_ARGS_MAX = 32

/** Why a proposed argument was rejected. Carried out of `sanitizeJvmArgs` so the
 *  dashboard can explain a publish failure and the launcher can log a drop. */
export type JvmArgRejection = "heap" | "denied" | "malformed"

export type JvmArgVerdict =
  | { ok: true; arg: string }
  | JvmArgRejected

/** The refused arm on its own, so `sanitizeJvmArgs().dropped` carries `reason`
 *  without every caller having to re-narrow the union. */
export type JvmArgRejected = { ok: false; arg: string; reason: JvmArgRejection }

/** Flags that can run a command or load code from an unverified path. Matched
 *  case-insensitively and by prefix, so `-XX:onerror=` and `-javaagent:x` are
 *  both caught before the grammar below ever sees them. */
const JVM_DENY_PREFIXES = [
  "-javaagent",
  "-agentlib",
  "-agentpath",
  "-xx:onerror",
  "-xx:onoutofmemoryerror",
  "-xx:flightrecorderoptions",
  "-xx:startflightrecording",
  "-xx:+startflightrecording",
  "-xx:compilecommand",
  "-xbootclasspath",
  "-xshare",
  "-cp",
  "-classpath",
  "--class-path",
  "--patch-module",
  "--module-path",
  "--upgrade-module-path",
]

/** `-D` keys reserved to the platform and the launcher. A pack has no business
 *  setting `java.library.path` or `java.security.manager`; mod-facing keys
 *  (`fml.*`, `mixin.*`) stay allowed. */
const JVM_DENY_PROPERTY_PREFIXES = ["java.", "javax.", "jdk.", "sun.", "boffmedia."]

const SIZE = String.raw`\d{1,6}[kKmMgG]?`
/** `-Xms2G`, `-Xmn512M`, `-Xss1M`. `-Xmx` is deliberately NOT here. */
const RE_X_SIZE = new RegExp(String.raw`^-X(ms|mn|ss)${SIZE}$`)
/** `-XX:+UseG1GC`, `-XX:-OmitStackTraceInFastThrow`. */
const RE_XX_BOOL = /^-XX:[+-][A-Za-z0-9_]{1,64}$/
/** `-XX:MaxGCPauseMillis=50`. The value grammar excludes `/`, `\`, `:` and
 *  whitespace, so no `-XX:Something=<path>` can be expressed at all. */
const RE_XX_VALUE = /^-XX:[A-Za-z0-9_]{1,64}=[A-Za-z0-9_.%-]{1,64}$/
/** `-Dmixin.debug=true`. Same no-path rule on the value. */
const RE_PROPERTY = /^-D([A-Za-z0-9_.-]{1,64})=([A-Za-z0-9_.,%+-]{0,128})$/
/** `--add-opens=java.base/java.lang=ALL-UNNAMED`. The `/` here is a module
 *  separator, not a filesystem path — the grammar admits no drive letter, no
 *  leading slash and no `..`. Allowed because modern loaders genuinely need it
 *  and it grants nothing a mod jar does not already have. */
const RE_ADD_MODULE = /^--add-(opens|exports)=[A-Za-z0-9_.]{1,64}\/[A-Za-z0-9_.$]{1,64}=[A-Za-z0-9_.,$-]{1,64}$/

/** Judge one argument. Order matters: `-Xmx` and the deny list are checked
 *  BEFORE the grammar, so a rejected flag reports why it was rejected rather
 *  than the generic "malformed". */
export const judgeJvmArg = (raw: string): JvmArgVerdict => {
  const arg = raw.trim()
  if (arg.length === 0 || arg.length > JVM_ARG_MAX_LEN) return { ok: false, arg, reason: "malformed" }

  const lower = arg.toLowerCase()

  // `-Xmx` is not dangerous — it is UNREACHABLE. The launcher appends the
  // resolved heap last so it beats anything the version metadata set, so a
  // pack's own `-Xmx` would be silently overridden. Rejecting it here turns a
  // mystery into a publish error that names `memoryMib`.
  if (lower.startsWith("-xmx")) return { ok: false, arg, reason: "heap" }

  // A prefix match ends at a non-word character, so `-Xbootclasspath/a:` and
  // `-XX:OnError=` are both caught while a longer legitimate flag that merely
  // starts with the same letters is not.
  const denied = (prefix: string) =>
    lower === prefix ||
    (lower.startsWith(prefix) && !/[a-z0-9_]/.test(lower.charAt(prefix.length)))

  if (JVM_DENY_PREFIXES.some(denied)) return { ok: false, arg, reason: "denied" }

  // The reserved-property check runs BEFORE the grammar so that
  // `-Djava.library.path=C:\evil` reports "denied" (the honest reason) rather
  // than "malformed" (which it also is, since the value holds a path).
  if (lower.startsWith("-d")) {
    const key = arg.slice(2).split("=", 1)[0].toLowerCase()
    if (JVM_DENY_PROPERTY_PREFIXES.some((p) => key.startsWith(p))) {
      return { ok: false, arg, reason: "denied" }
    }
  }

  if (
    RE_PROPERTY.test(arg) ||
    RE_X_SIZE.test(arg) ||
    RE_XX_BOOL.test(arg) ||
    RE_XX_VALUE.test(arg) ||
    RE_ADD_MODULE.test(arg)
  ) {
    return { ok: true, arg }
  }
  return { ok: false, arg, reason: "malformed" }
}

/** Split a proposed arg list into what survives and what does not.
 *
 *  Called in two places for two purposes: the dashboard rejects a publish when
 *  anything is dropped, and the launcher re-runs it at seed time and logs the
 *  drops. The second is not redundant — an instance can be seeded from a
 *  manifest published before a rule existed. */
export const sanitizeJvmArgs = (
  args: readonly string[],
): { kept: string[]; dropped: JvmArgRejected[] } => {
  const kept: string[] = []
  const dropped: JvmArgRejected[] = []
  const seen = new Set<string>()
  for (const raw of args.slice(0, JVM_ARGS_MAX)) {
    const verdict = judgeJvmArg(raw)
    if (!verdict.ok) {
      dropped.push(verdict)
      continue
    }
    // A duplicated flag is not an error, but passing it twice is noise in the
    // argv and in every crash report that quotes it.
    if (seen.has(verdict.arg)) continue
    seen.add(verdict.arg)
    kept.push(verdict.arg)
  }
  return { kept, dropped }
}

/** The runtime block a pack version may carry. Both fields optional: a pack that
 *  only wants to say "this needs 8 GB" ships no args, and one that only wants
 *  GC flags ships no heap. Minecraft-only (superRefine) — an emulator pack has
 *  no JVM to configure. */
export const PackRuntime = z.object({
  /** Recommended max heap, seeded into the instance as an explicit choice.
   *  Bounded by the same clamp the launcher applies to every heap. */
  memoryMib: z.number().int().min(512).max(65536).optional(),
  /** Tuning flags, every one of which must pass `judgeJvmArg` (superRefine). */
  jvmArgs: z.array(z.string().max(JVM_ARG_MAX_LEN)).max(JVM_ARGS_MAX).optional(),
})
export type PackRuntime = z.infer<typeof PackRuntime>

export const PackVersion = z.object({
  /** Opaque, server-assigned. Not semver — packs version on their own clock. */
  id: z.string().min(1),
  /** What users see: "1.4.2", "Season 3", whatever the owner types. */
  name: z.string().min(1),
  createdAt: z.iso.datetime(),
  /** Minecraft loader/version set. OPTIONAL as of multi-game: required iff the
   *  pack is `minecraft` (enforced in PackManifest.superRefine), forbidden
   *  otherwise. */
  dependencies: MrpackDependencies.optional(),
  files: z.array(PackFile),
  /** Worlds shipped with this version, installed first-time-only. Minecraft-only
   *  (forbidden on any other gameType — superRefine). */
  worlds: z.array(BundledWorld).optional(),
  /** Per-game spec blocks — exactly one is present, matching the pack's
   *  gameType (superRefine). `minecraft` and `emulator` carry their real shapes;
   *  `zomboid`/`stardew` stay loose slots until those games ship. */
  emulator: EmulatorSpec.optional(),
  zomboid: z.unknown().optional(),
  stardew: z.unknown().optional(),
  /** Content the player opts into or out of, organised into named groups.
   *  Minecraft-only in practice today, but not forbidden elsewhere — nothing in
   *  the model is Minecraft-specific except the `activate` kinds.
   *
   *  Optional on the version: a pack that offers no choices carries no groups,
   *  and a manifest authored before this existed keeps parsing. Read the model
   *  through `optionalModelOf(version)`, which also folds in optional files no
   *  group claims (D4). */
  optionalGroups: z.array(OptionalGroup).max(32).optional(),
  /** First-install-only files (a starting `.sav`, a default options file):
   *  written only if the target path does not already exist, then owned by the
   *  player — never re-verified or overwritten on update/repair. Same shape as
   *  `files[]`, but `user-provided` sources are forbidden (we would prompt for a
   *  file only to never check it again) and paths must not collide with
   *  `files[]` (superRefine). Generalizes the bundled-worlds idea without
   *  touching the `worlds` mechanism. */
  initialFiles: z.array(PackFile).optional(),
  /** Heap and JVM flags this version RECOMMENDS. Seeded into the instance on
   *  first install and owned by the player from then on — never re-applied on
   *  update. Minecraft-only (superRefine); every arg must pass `judgeJvmArg`
   *  (superRefine). See the `PackRuntime` comment for why the allowlist is a
   *  grammar rather than a blocklist. */
  runtime: PackRuntime.optional(),
})
export type PackVersion = z.infer<typeof PackVersion>

/** The resolved game type of a pack: the stored value, or `minecraft` when
 *  absent (a pack authored before multi-game). One place owns the default so no
 *  consumer re-implements it. */
export const gameTypeOf = (pack: Pack): GameType => pack.gameType ?? "minecraft"

/** The optional-content model as the launcher and the chooser should see it:
 *  the authored groups, plus a synthesised `otros` group holding every
 *  `env.client === "optional"` file no feature claims (D4).
 *
 *  Why synthesise rather than reject: `env.client: "optional"` is a `.mrpack`
 *  field, so a pack imported from Modrinth can arrive carrying optional files
 *  that were never authored here. Each unclaimed file becomes its own feature
 *  with `default: true` — which IS today's behaviour, since the pre-feature
 *  runtime stored only a `disabled` set and therefore treated every optional
 *  file as on-unless-switched-off. So the fold-in is not a new policy, it is the
 *  old one written down. One exported helper owns it, the way `gameTypeOf` owns
 *  the game-type default, so no consumer re-derives it and drifts.
 *
 *  `otros` is a reserved group id — rule 3 rejects an author who declares it, so
 *  a synthesised group can never collide with a real one. */
export const SYNTHETIC_GROUP_ID = "otros"

export const optionalModelOf = (version: PackVersion): OptionalGroup[] => {
  const groups = version.optionalGroups ?? []
  const claimed = new Set<string>()
  for (const group of groups) {
    for (const feature of group.features) {
      for (const path of feature.paths) claimed.add(normPath(path))
    }
  }

  const orphans = version.files.filter(
    (f) => f.env.client === "optional" && !claimed.has(normPath(f.path)),
  )
  if (orphans.length === 0) return groups

  return [
    ...groups,
    {
      id: SYNTHETIC_GROUP_ID,
      name: "Otros",
      select: "any",
      features: orphans.map((f) => ({
        // Derived from the path, so it is stable for as long as the path is —
        // which is the same guarantee the pre-feature path-keyed state had.
        id: syntheticFeatureId(f.path),
        name: basenameOf(f.path),
        paths: [f.path],
        default: true,
      })),
    },
  ]
}

/** The last segment of an instance path, separators unified but case kept —
 *  this one feeds a label a person reads, not a comparison. */
const basenameOf = (path: string): string =>
  path.split("\\").join("/").split("/").pop() || path

/** A kebab-case id derived from a path. Collisions are impossible in practice
 *  because paths are already unique case-insensitively (the duplicate-path
 *  refinement), and any two paths that normalised to the same id would have had
 *  to differ only in characters this strips. */
const syntheticFeatureId = (path: string): string =>
  normPath(path)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/, "") || "archivo"

/** Non-fatal findings an authoring surface should show. Separate from the
 *  `superRefine` because zod issues are errors and these must not be: they rest
 *  on filename heuristics, and a heuristic that can refuse to publish a valid
 *  pack is worse than no check at all. */
export type OptionalWarning = {
  code: "datapack-loader-missing"
  groupId: string
  featureId: string
  message: string
}

export const optionalWarnings = (version: PackVersion): OptionalWarning[] => {
  const warnings: OptionalWarning[] = []
  const groups = version.optionalGroups ?? []
  if (groups.length === 0) return warnings

  // A global datapack loader is what makes D1 work: it is read at every world
  // load, so a world created next month still gets the datapack. Without one,
  // the zip sits in config/ and nothing ever reads it.
  const hasLoader = version.files.some((f) => {
    const name = basenameOf(f.path).toLowerCase()
    return name.endsWith(".jar") && DATAPACK_LOADER_HINTS.some((hint) => name.includes(hint))
  })
  if (hasLoader) return warnings

  for (const group of groups) {
    for (const feature of group.features) {
      if (feature.activate?.kind !== "datapack") continue
      warnings.push({
        code: "datapack-loader-missing",
        groupId: group.id,
        featureId: feature.id,
        message:
          `"${feature.name}" ships a datapack, but no global datapack loader ` +
          `(OpenLoader or Paxi) is in files[]. Without one the game never reads it.`,
      })
    }
  }
  return warnings
}

/** Quick Play target for this pack (RF-01/RF-03). `port` is OPTIONAL: a bare
 *  host (e.g. `play.example.com` behind a Minecraft SRV record) declares no
 *  port, and both the join (Minecraft resolves SRV from --quickPlayMultiplayer)
 *  and the status ping (the launcher does its own SRV lookup) find the real
 *  port. When a port IS given it is used verbatim and SRV is skipped. */
export const PackServer = z.object({
  host: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[^/\\]+$/, "host must not contain a scheme or a slash"),
  port: z.number().int().min(1).max(65535).optional(),
})
export type PackServer = z.infer<typeof PackServer>

/** A promotional gallery image shown before install (pack detail, browse). Not
 *  a game file — never installed — so it lives on the Pack, not in `files`. For
 *  managed packs `url` is a public upload URL; for local packs the gallery is
 *  kept out of the manifest entirely (a convention dir on disk), so this array
 *  is empty there. */
export const PackGalleryImage = z.object({
  url: z.url(),
  alt: z.string().max(256).optional(),
})
export type PackGalleryImage = z.infer<typeof PackGalleryImage>

export const Pack = z.object({
  id: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case"),
  /** Which game this pack targets. Absent = `minecraft` (back-compat). Use
   *  `gameTypeOf(pack)` to read it with the default applied. */
  gameType: GameType.optional(),
  name: z.string().min(1),
  summary: z.string().max(512).optional(),
  /** Long-form plain-text description shown on the pack's info panel. */
  description: z.string().max(2048).optional(),
  iconUrl: z.url().optional(),
  gallery: z.array(PackGalleryImage).optional(),
  access: PackAccess,
  latestVersionId: z.string().min(1).optional(),
  server: PackServer.optional(),
})
export type Pack = z.infer<typeof Pack>

/** The full document the dashboard publishes and the launcher consumes. This is
 *  the object the whole package exists for: one schema, both ends. */
export const PackManifest = z
  .object({
    formatVersion: z.literal(1),
    pack: Pack,
    version: PackVersion,
    /** OPTIONAL randomizer linkage: injected dynamically by the API at manifest-serve
     *  time when the pack is linked to an active randomizer event. Never stored in the
     *  manifest itself; authored manifests have this omitted. Launcher uses `eventId`
     *  to route the user to the randomizer feature if gated. */
    randomizer: z
      .object({
        eventId: z.number().int().positive(),
        cleanRomSha512: z.string().regex(/^[a-f0-9]{128}$/, "cleanRomSha512 must be 128 lowercase hex chars"),
      })
      .optional(),
  })
  .superRefine((m, ctx) => {
    const v = m.version
    const gameType = gameTypeOf(m.pack)

    // A normalized, case-insensitive view of a target path: Windows and macOS
    // would silently overwrite one file with the other while Linux installs
    // both, so collisions are judged case-insensitively with separators unified.
    const norm = normPath

    // ---- duplicate target paths within files[] ----
    const seen = new Set<string>()
    for (const [i, file] of v.files.entries()) {
      const key = norm(file.path)
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "files", i, "path"],
          message: `duplicate target path: ${file.path}`,
        })
      }
      seen.add(key)
    }

    // ---- duplicate bundled-world folders ----
    // Two bundled worlds targeting the same save folder would race to write the
    // same directory — reject case-insensitively for the same per-platform reason.
    const worldFolders = new Set<string>()
    for (const [i, world] of (v.worlds ?? []).entries()) {
      const key = world.folder.toLowerCase()
      if (worldFolders.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "worlds", i, "folder"],
          message: `duplicate world folder: ${world.folder}`,
        })
      }
      worldFolders.add(key)
    }

    // ---- game-type exclusivity rule engine ----
    // Exactly one shape per gameType. A new game tightens its own block and
    // reuses this exclusivity check unchanged.
    const specSlots = { emulator: v.emulator, zomboid: v.zomboid, stardew: v.stardew } as const
    const forbidSpec = (kind: keyof typeof specSlots) => {
      if (specSlots[kind] !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["version", kind],
          message: `\`${kind}\` is only allowed when gameType is "${kind}"`,
        })
      }
    }

    if (gameType === "minecraft") {
      if (v.dependencies === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "dependencies"],
          message: "minecraft packs require a `dependencies` block",
        })
      }
      forbidSpec("emulator")
      forbidSpec("zomboid")
      forbidSpec("stardew")
    } else {
      // Non-Minecraft: exactly its own spec block, and nothing Minecraft-shaped.
      if (v.dependencies !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "dependencies"],
          message: `\`dependencies\` is minecraft-only (gameType is "${gameType}")`,
        })
      }
      if (v.worlds !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "worlds"],
          message: `\`worlds\` is minecraft-only (gameType is "${gameType}")`,
        })
      }
      if (v.runtime !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "runtime"],
          message: `\`runtime\` is minecraft-only (gameType is "${gameType}") — there is no JVM to configure`,
        })
      }
      if (specSlots[gameType] === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["version", gameType],
          message: `gameType "${gameType}" requires its \`${gameType}\` spec block`,
        })
      }
      for (const kind of ["emulator", "zomboid", "stardew"] as const) {
        if (kind !== gameType) forbidSpec(kind)
      }
    }

    // ---- runtime.jvmArgs allowlist ----
    // Rejected at PUBLISH time, per argument, with the reason attached: an
    // author who typed `-Xmx6G` gets told to use `memoryMib`, not a generic
    // "invalid". The launcher re-checks at seed time (a manifest can predate a
    // rule), so this is the friendly gate rather than the security boundary.
    for (const [i, arg] of (v.runtime?.jvmArgs ?? []).entries()) {
      const verdict = judgeJvmArg(arg)
      if (verdict.ok) continue
      const why =
        verdict.reason === "heap"
          ? "set `runtime.memoryMib` instead — the launcher appends the resolved -Xmx last, so this would be ignored"
          : verdict.reason === "denied"
            ? "this flag can run a command or load code from a path no manifest verified"
            : "not a recognised JVM tuning flag"
      ctx.addIssue({
        code: "custom",
        path: ["version", "runtime", "jvmArgs", i],
        message: `${arg}: ${why}`,
      })
    }

    // ---- initialFiles rules ----
    // First-install-only files: distributable sources only (a `user-provided`
    // file would be prompted for then never checked again — nonsensical), and no
    // path collision with files[] (the two mechanisms would fight over the path).
    const initialSeen = new Set<string>()
    for (const [i, file] of (v.initialFiles ?? []).entries()) {
      if (file.source.kind !== "override" && file.source.kind !== "url") {
        ctx.addIssue({
          code: "custom",
          path: ["version", "initialFiles", i, "source"],
          message: `initialFiles source must be "override" or "url" (got "${file.source.kind}")`,
        })
      }
      const key = norm(file.path)
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "initialFiles", i, "path"],
          message: `initialFiles path collides with a files[] entry: ${file.path}`,
        })
      }
      if (initialSeen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "initialFiles", i, "path"],
          message: `duplicate initialFiles path: ${file.path}`,
        })
      }
      initialSeen.add(key)
    }

    // ---- `patched` (romhack) cross-field rules, game-agnostic ----
    // A patched file references two other files[] entries by path: its clean
    // `base` (must be user-provided — the server never hosts ROM bytes) and its
    // `patch` (must be distributable). Requiring the base to be user-provided
    // also forbids chains (a base can never itself be a patched entry).
    const fileByPath = new Map<string, (typeof v.files)[number]>()
    for (const file of v.files) fileByPath.set(norm(file.path), file)
    for (const [i, file] of v.files.entries()) {
      if (file.source.kind !== "patched") continue
      const base = fileByPath.get(norm(file.source.base))
      if (!base) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "files", i, "source", "base"],
          message: `patched.base must reference a files[] entry: ${file.source.base}`,
        })
      } else if (base.source.kind !== "user-provided") {
        ctx.addIssue({
          code: "custom",
          path: ["version", "files", i, "source", "base"],
          message: `patched.base must reference a user-provided file (no blob-hosted or chained ROMs)`,
        })
      }
      const patch = fileByPath.get(norm(file.source.patch))
      if (!patch) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "files", i, "source", "patch"],
          message: `patched.patch must reference a files[] entry: ${file.source.patch}`,
        })
      } else if (patch.source.kind !== "override" && patch.source.kind !== "url") {
        ctx.addIssue({
          code: "custom",
          path: ["version", "files", i, "source", "patch"],
          message: `patched.patch must reference an override or url file (patches are distributable)`,
        })
      }
    }

    // ---- emulator arm ----
    // The generic engine above already enforces block-presence/exclusivity; this
    // adds the emulator-internal rules. `emulator.rom` must name a real files[]
    // entry that is a player-supplied dump (user-provided) or a locally patched
    // ROM, client-required and server-unsupported.
    if (gameType === "emulator" && v.emulator) {
      const romFile = fileByPath.get(norm(v.emulator.rom))
      if (!romFile) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "emulator", "rom"],
          message: `emulator.rom must match a files[] entry path: ${v.emulator.rom}`,
        })
      } else {
        if (romFile.env.client !== "required" || romFile.env.server !== "unsupported") {
          ctx.addIssue({
            code: "custom",
            path: ["version", "emulator", "rom"],
            message: `the ROM entry must have env.client "required" and env.server "unsupported"`,
          })
        }
        if (romFile.source.kind !== "user-provided" && romFile.source.kind !== "patched") {
          ctx.addIssue({
            code: "custom",
            path: ["version", "emulator", "rom"],
            message: `the ROM must be user-provided or patched (the server never hosts ROM bytes)`,
          })
        }
      }
      // The ROM container must match the emulator kind: mgba runs GBA (.gba),
      // melonDS runs DS (.nds). The file is handed to the emulator verbatim, so a
      // .nds under mgba opens the wrong core. Mirrored in pack.rs::validate_emulator.
      const romLower = v.emulator.rom.toLowerCase()
      const wantExt = v.emulator.kind === "mgba" ? ".gba" : ".nds"
      if (!romLower.endsWith(wantExt)) {
        ctx.addIssue({
          code: "custom",
          path: ["version", "emulator", "rom"],
          message: `a ${v.emulator.kind} ROM must end in ${wantExt}: ${v.emulator.rom}`,
        })
      }
    }

    // ---- optional content: groups, features, activation ----
    // NINE cross-field rules, and every one of them must be mirrored by hand in
    // apps/desktop/src-tauri/src/pack.rs. emit-schema.mjs drops refinements
    // silently and build.rs generates the Rust types from that output, so
    // nothing in the pipeline catches a violation on the Rust side. This block
    // and `validate_optional` in pack.rs are one rule set written twice.
    const groups = v.optionalGroups ?? []
    if (groups.length > 0) {
      const groupIds = new Set<string>()
      // path -> "groupId/featureId" of the feature that already claims it.
      const pathOwner = new Map<string, string>()
      // featureId -> the select mode of the group it lives in; also the
      // existence check for `requires`.
      const featureGroupSelect = new Map<string, OptionalSelect>()
      const featureRequires = new Map<string, string[]>()

      for (const [gi, group] of groups.entries()) {
        const select = selectOf(group)

        // Rule 3a: group ids unique, and `otros` reserved for the synthesised
        // group in optionalModelOf — an authored group by that name would be
        // indistinguishable from a fold-in of unclaimed files.
        if (group.id === SYNTHETIC_GROUP_ID) {
          ctx.addIssue({
            code: "custom",
            path: ["version", "optionalGroups", gi, "id"],
            message: `"${SYNTHETIC_GROUP_ID}" is reserved for unclaimed optional files`,
          })
        }
        if (groupIds.has(group.id)) {
          ctx.addIssue({
            code: "custom",
            path: ["version", "optionalGroups", gi, "id"],
            message: `duplicate group id: ${group.id}`,
          })
        }
        groupIds.add(group.id)

        // Rule 6: a radio group needs exactly one default on; `atMostOne` at
        // most one. Two defaults in a `one` group has no correct resolution —
        // whichever the launcher picked would be arbitrary.
        const defaultsOn = group.features.filter((f) => f.default).length
        if (select === "one" && defaultsOn !== 1) {
          ctx.addIssue({
            code: "custom",
            path: ["version", "optionalGroups", gi, "features"],
            message: `a "one" group must declare exactly one default:true feature (found ${defaultsOn})`,
          })
        }
        if (select === "atMostOne" && defaultsOn > 1) {
          ctx.addIssue({
            code: "custom",
            path: ["version", "optionalGroups", gi, "features"],
            message: `an "atMostOne" group may declare at most one default:true feature (found ${defaultsOn})`,
          })
        }

        for (const [fi, feature] of group.features.entries()) {
          const at = (...rest: (string | number)[]) => [
            "version",
            "optionalGroups",
            gi,
            "features",
            fi,
            ...rest,
          ]

          // Rule 3b: feature ids unique across the WHOLE version, not per group
          // — the player's saved state is a flat set of feature ids, so two
          // groups sharing an id would share a switch.
          if (featureGroupSelect.has(feature.id)) {
            ctx.addIssue({
              code: "custom",
              path: at("id"),
              message: `duplicate feature id: ${feature.id}`,
            })
          }
          featureGroupSelect.set(feature.id, select)
          featureRequires.set(feature.id, feature.requires ?? [])

          for (const [pi, path] of feature.paths.entries()) {
            const key = norm(path)

            // Rule 1: the path is a real files[] entry. A feature owning a path
            // that does not exist is a switch wired to nothing.
            const file = fileByPath.get(key)
            if (!file) {
              ctx.addIssue({
                code: "custom",
                path: at("paths", pi),
                message: `feature path must match a files[] entry: ${path}`,
              })
            } else if (file.env.client !== "optional") {
              // Rule 2: keeps the .mrpack view honest. Prism and packwiz read
              // env.client and nothing else; a file we let a player skip while
              // telling them it is "required" installs differently depending on
              // which launcher opened the pack.
              ctx.addIssue({
                code: "custom",
                path: at("paths", pi),
                message: `a feature path must be env.client "optional" (${path} is "${file.env.client}")`,
              })
            }

            // Rule 4: one owner per path. Two features owning one jar cannot
            // both be honoured — switching either off deletes the other's file.
            const owner = pathOwner.get(key)
            if (owner) {
              ctx.addIssue({
                code: "custom",
                path: at("paths", pi),
                message: `path is already owned by feature "${owner}": ${path}`,
              })
            } else {
              pathOwner.set(key, `${group.id}/${feature.id}`)
            }
          }

          if (feature.activate) {
            const activateKey = norm(feature.activate.file)

            // Rule 7: you may only activate what you own. Activating a file
            // another feature can switch off means writing a config that names a
            // file that is not there.
            if (!feature.paths.some((p) => norm(p) === activateKey)) {
              ctx.addIssue({
                code: "custom",
                path: at("activate", "file"),
                message: `activate.file must be one of the feature's own paths: ${feature.activate.file}`,
              })
            }

            // Rule 8: iris.properties/oculus.properties hold ONE shaderPack
            // value. In an `any` group the author is offering a choice the game
            // cannot honour, and the launcher would have to pick a winner.
            if (feature.activate.kind === "shaderpack" && select === "any") {
              ctx.addIssue({
                code: "custom",
                path: at("activate", "kind"),
                message: `a shaderpack activation requires a "one" or "atMostOne" group — only one shaderpack can be active`,
              })
            }

            // Rule 9: D1. A datapack reaches the game through a global loader,
            // so its path has to be where that loader looks. Anywhere else and
            // the file is installed, verified, and never read.
            if (
              feature.activate.kind === "datapack" &&
              !DATAPACK_LOADER_DIRS.some((dir) => activateKey.startsWith(dir))
            ) {
              ctx.addIssue({
                code: "custom",
                path: at("activate", "file"),
                message:
                  `a datapack must be placed under ${DATAPACK_LOADER_DIRS.join(" or ")} ` +
                  `so a global loader reads it: ${feature.activate.file}`,
              })
            }
          }
        }
      }

      // Rule 5: `requires` must resolve, must not cycle, and must point at an
      // `any` group. Deferred to a second pass so a feature may require one
      // declared later in the document — order in the file should not be a rule.
      for (const [gi, group] of groups.entries()) {
        for (const [fi, feature] of group.features.entries()) {
          for (const [ri, req] of (feature.requires ?? []).entries()) {
            const path = ["version", "optionalGroups", gi, "features", fi, "requires", ri]
            if (req === feature.id) {
              ctx.addIssue({ code: "custom", path, message: `a feature cannot require itself: ${req}` })
              continue
            }
            const targetSelect = featureGroupSelect.get(req)
            if (targetSelect === undefined) {
              ctx.addIssue({
                code: "custom",
                path,
                message: `requires must name an existing feature id: ${req}`,
              })
              continue
            }
            // A dependency is a force-on. Forcing on a member of a radio group
            // either turns a second member on or silently turns the player's
            // choice off; neither is something an author can have meant.
            if (targetSelect !== "any") {
              ctx.addIssue({
                code: "custom",
                path,
                message: `requires may only target a feature in an "any" group: ${req}`,
              })
            }
          }
        }
      }

      // Cycle detection over the whole graph, reported at every feature that sits
      // on one. Iterative DFS with three-colour marking — the graph is tiny
      // (<= 32 groups x 64 features), but recursion on a hostile manifest is not
      // an acceptable failure mode when this runs inside the API.
      const state = new Map<string, 0 | 1 | 2>()
      const cyclic = new Set<string>()
      for (const start of featureRequires.keys()) {
        if (state.get(start)) continue
        const stack: Array<{ id: string; next: number }> = [{ id: start, next: 0 }]
        state.set(start, 1)
        while (stack.length > 0) {
          const frame = stack[stack.length - 1]!
          const deps = featureRequires.get(frame.id) ?? []
          if (frame.next >= deps.length) {
            state.set(frame.id, 2)
            stack.pop()
            continue
          }
          const dep = deps[frame.next++]!
          if (!featureRequires.has(dep)) continue // already reported by rule 5
          const depState = state.get(dep) ?? 0
          if (depState === 1) {
            // `dep` is grey: it is on the current stack, so everything from it
            // up to here closes a cycle.
            const from = stack.findIndex((f) => f.id === dep)
            for (const f of stack.slice(from === -1 ? 0 : from)) cyclic.add(f.id)
          } else if (depState === 0) {
            state.set(dep, 1)
            stack.push({ id: dep, next: 0 })
          }
        }
      }
      if (cyclic.size > 0) {
        for (const [gi, group] of groups.entries()) {
          for (const [fi, feature] of group.features.entries()) {
            if (!cyclic.has(feature.id)) continue
            ctx.addIssue({
              code: "custom",
              path: ["version", "optionalGroups", gi, "features", fi, "requires"],
              message: `requires forms a cycle through "${feature.id}"`,
            })
          }
        }
      }
    }
  })
export type PackManifest = z.infer<typeof PackManifest>

export { EnvSupport, loaderOf }
