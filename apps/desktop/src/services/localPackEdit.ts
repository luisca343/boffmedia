import type { PackManifest } from "@boffmedia/pack-schema";

import {
  instanceDeletePath,
  instanceInstallFiles,
  localPackGet,
  localPackSave,
} from "../runtime";

// Every edit a local pack's detail page can make, funnelled through one
// read-modify-write. Doing it here rather than in each component keeps two
// invariants that are easy to lose: the manifest is always written back WHOLE
// (a partial write silently drops the pack's configs), and `env` is always
// present on every entry (the schema defaults it, but the Rust side validates
// what it is actually given).

type ManifestFile = {
  path: string;
  sha512: string;
  fileSize: number;
  env: { client: string; server: string };
  source: unknown;
  /** Set only for a jar whose loader differs from the pack's — a Fabric mod
   *  running on NeoForge through Sinytra Connector. */
  loader?: string;
};

const DEFAULT_ENV = { client: "required", server: "required" } as const;

/** Reduce an entry to the manifest's PackFile shape and nothing else.
 *
 *  Callers legitimately carry UI metadata on the objects they hand us —
 *  BrowsePage tracks `projectId` on each pick so the grid can mark what is
 *  already added — and those objects reach `mutate` through a spread. The
 *  manifest is validated with `additionalProperties: false`, so a foreign key
 *  is not ignored on the way through: `local_pack_save` rejects the whole save
 *  with `unknown field \`projectId\``, and the edit is silently impossible.
 *
 *  Picking the fields explicitly is what lets a caller keep a richer object
 *  without every one of them having to remember to strip it. */
function toManifestFile(file: ManifestFile): ManifestFile {
  const clean: ManifestFile = {
    path: file.path,
    sha512: file.sha512,
    fileSize: file.fileSize,
    env: file.env ?? DEFAULT_ENV,
    source: file.source,
  };
  // Omitted rather than written as undefined: absent is what the schema reads
  // as "the pack's own loader".
  if (file.loader) clean.loader = file.loader;
  return clean;
}

function normalise(path: string): string {
  return path.toLowerCase().replace(/\\/g, "/");
}

/** A new opaque version id, minted on every edit.
 *
 *  This is what makes an edit VISIBLE to the installer. `instance_scan`
 *  compares the install marker's version id against the manifest's and reports
 *  `outdated` when they differ — so without a bump, adding, removing or
 *  updating a mod left the pack reading "instalado" while the files on disk
 *  were the previous set, and the only way to sync was a manual repair.
 *
 *  Timestamp-based rather than a counter: it has to be unique against every id
 *  this pack has ever had (the install history is keyed on it), and there is no
 *  monotonic source here that survives a reinstall. */
function nextVersionId(slug: string): string {
  return `local-${Date.now()}-${slug}`;
}

/** The version id the pack carried BEFORE this edit. Handed to
 *  `instanceInstallFiles`, which uses it to prove the instance on disk was in
 *  sync with the manifest a moment ago — the only condition under which
 *  dropping in a jar or two leaves it in sync again. */
type Mutation = { manifest: PackManifest; previousVersionId: string | null };

/** Carry the optional catalogue across a change to `files[]`.
 *
 *  Rule 3 requires every feature path to name a real `files[]` entry, so any
 *  edit that renames or removes a file invalidates the whole manifest unless the
 *  groups move with it. Updating a mod is exactly that: the jar's filename
 *  carries its version, so `moreculling-1.0.6.jar` becomes `moreculling-1.0.7.jar`
 *  and every feature still pointing at the old name makes the pack unsaveable —
 *  with an error naming a path the author never typed.
 *
 *  Done here rather than in `replaceFile` because `removeFile` breaks the same
 *  invariant in the other direction, and two callers maintaining one rule is how
 *  one of them ends up wrong.
 *
 *  Empty features and groups are dropped rather than left behind: `paths` has a
 *  min of 1 and `features` likewise, so a feature whose only jar was deleted is
 *  not a valid document either. */
function reconcileGroups(
  groups: unknown,
  files: ManifestFile[],
  renames: Map<string, string>,
): unknown {
  if (!Array.isArray(groups)) return groups;
  const live = new Set(files.map((f) => normalise(f.path)));

  const mapPath = (path: string): string | null => {
    const renamed = renames.get(normalise(path));
    if (renamed) return renamed;
    return live.has(normalise(path)) ? path : null;
  };

  return groups
    .map((group) => {
      const g = group as { features?: unknown[] };
      const features = (Array.isArray(g.features) ? g.features : [])
        .map((feature) => {
          const f = feature as {
            paths?: string[];
            activate?: { file?: string } | null;
          };
          const paths = (f.paths ?? [])
            .map(mapPath)
            .filter((p): p is string => p !== null);
          // An activation whose file is gone must go with it: rule 7 requires
          // `activate.file` to be one of the feature's own paths, and a stale
          // one fails validation just as loudly as a stale path.
          const activateFile = f.activate?.file
            ? mapPath(f.activate.file)
            : null;
          const activate =
            f.activate && activateFile
              ? { ...f.activate, file: activateFile }
              : undefined;
          return {
            ...f,
            paths,
            ...(activate ? { activate } : { activate: undefined }),
          };
        })
        .filter((f) => f.paths.length > 0);
      return { ...(group as object), features };
    })
    .filter((g) => (g as { features: unknown[] }).features.length > 0);
}

async function mutate(
  slug: string,
  change: (files: ManifestFile[]) => ManifestFile[],
  /** Old path -> new path, for an edit that MOVES a file rather than adding or
   *  removing one. Without it a rename looks like a delete plus an unrelated
   *  add, and the feature that owned the file silently loses it. */
  renames: Map<string, string> = new Map(),
): Promise<Mutation> {
  const current = await localPackGet(slug);
  if (!current) throw new Error("No se encontró el pack.");
  const files = ((current.version?.files ?? []) as ManifestFile[]).map(
    (file) => ({
      ...file,
      env: file.env ?? DEFAULT_ENV,
    }),
  );
  // Sanitised HERE rather than in each caller: this is the one funnel every
  // edit passes through, and it already owns the other invariant of the same
  // kind (every entry has `env`).
  const next = change(files).map(toManifestFile);
  const manifest = await localPackSave({
    ...current,
    version: {
      ...current.version,
      id: nextVersionId(slug),
      files: next,
      optionalGroups: reconcileGroups(
        current.version?.optionalGroups,
        next,
        renames,
      ),
    },
  });
  return { manifest, previousVersionId: current.version?.id ?? null };
}

/** The Modrinth/CurseForge project a file came from, when it has one.
 *
 *  This is the identity that decides whether two files are "the same mod". The
 *  PATH cannot: CreativeCore ships as `CreativeCore_NEOFORGE_v2.12.x.jar` and
 *  `..._v2.13.x.jar`, so a path-keyed check happily puts both in `mods/` and the
 *  loader then refuses to start with a duplicate mod id. An `override` blob or a
 *  hand-dropped jar has no project and is never matched by identity. */
function projectKeyOf(source: unknown): string | null {
  const src = source as { kind?: string; projectId?: string | number } | null;
  if (!src || typeof src.kind !== "string") return null;
  if (src.kind !== "modrinth" && src.kind !== "curseforge") return null;
  return src.projectId === undefined || src.projectId === null
    ? null
    : `${src.kind}:${src.projectId}`;
}

/** Remove a pack file's BYTES from the instance.
 *
 *  The manifest edit alone is not an uninstall. The install pass sweeps files the
 *  previous marker claimed and the new one does not — but that pass only runs on
 *  Install/Play, so between the edit and the next launch the jar is still in
 *  `mods/` and still loads. For a delete that reads as "uninstall this", and for
 *  a version swap that must not leave two copies of one mod, the bytes have to go
 *  now.
 *
 *  Both spellings are attempted because a switched-off mod lives at
 *  `<name>.jar.disabled`; deleting only the plain path would silently no-op on
 *  exactly the files a player is most likely to be tidying up. A missing path is
 *  not an error on the Rust side, so the extra call is free.
 *
 *  Never throws: the manifest is already written by the time this runs, and
 *  failing here would report a successful edit as a failure. */
async function deleteBytes(slug: string, path: string): Promise<void> {
  for (const candidate of [path, `${path}.disabled`]) {
    try {
      await instanceDeletePath(slug, candidate);
    } catch {
      /* the sweep on the next install is the backstop */
    }
  }
}

export async function removeFile(slug: string, path: string) {
  const { manifest } = await mutate(slug, (files) =>
    files.filter((f) => normalise(f.path) !== normalise(path)),
  );
  // After the manifest, not before: if the save is rejected the file is still
  // described by the pack, and deleting first would leave the instance missing a
  // jar the manifest still requires.
  await deleteBytes(slug, path);
  return manifest;
}

/** Point an existing entry at a different file — a version swap, or an update.
 *  Matched on the OLD path because the new file's name almost always differs;
 *  matching on the new one would append a duplicate instead of replacing. */
export async function replaceFile(
  slug: string,
  oldPath: string,
  next: { path: string; sha512: string; fileSize: number; source: unknown },
) {
  const { manifest } = await mutate(
    slug,
    (files) =>
      files.map((f) =>
        normalise(f.path) === normalise(oldPath)
          ? { ...f, ...next, env: f.env ?? DEFAULT_ENV }
          : f,
      ),
    // An update renames the jar — the version is in the filename — so every
    // feature that owned the old name has to follow it to the new one.
    new Map([[normalise(oldPath), next.path]]),
  );
  // Deliberately NOT fetched in the background the way an add is. A replace
  // also RETIRES a file, and `instance_install_files` only ever adds: it would
  // download the new jar, mark the instance complete, and thereby guarantee the
  // install pass — the only thing that runs the stale sweep — never runs again.
  // The old jar would sit in mods/ beside the new one, which is a crash, not a
  // cosmetic leftover. Updates stay on the Install/Play path.
  //
  // The retired jar's bytes go NOW rather than waiting for that sweep. Leaving
  // them is what puts two versions of one mod in `mods/` in the window between
  // the update and the next launch — and the loader refuses to start on a
  // duplicate mod id, so "I updated a mod and now it will not boot" is the
  // symptom. The sweep still runs and is still the backstop for everything else.
  if (normalise(oldPath) !== normalise(next.path))
    await deleteBytes(slug, oldPath);
  return manifest;
}

/** One in-flight background fetch per pack, so a second add cannot start before
 *  the first has written the marker.
 *
 *  Without this the two overlap and the second one loses: it passes the version
 *  id the first is about to install, reads a marker still on the id before
 *  that, and correctly declines — leaving a mod the player just added sitting
 *  at "sin instalar" for no reason they can see. Adding three mods in a row is
 *  the normal way to use the browser, so this is the common case, not the edge. */
const queues = new Map<string, Promise<unknown>>();

/** Kick the download off and return immediately.
 *
 *  Not awaited on purpose: the player asked to add a mod, not to wait for one.
 *  The Content tab follows along through `content://file` events, and a failure
 *  surfaces there per row rather than as a rejected add — the manifest edit
 *  itself already succeeded, so failing the whole call would be a lie. */
function fetchInBackground(
  slug: string,
  manifest: PackManifest,
  paths: string[],
  previousVersionId: string | null,
) {
  if (paths.length === 0) return;
  const next = (queues.get(slug) ?? Promise.resolve()).then(() =>
    instanceInstallFiles(slug, manifest, paths, previousVersionId).catch(() => {
      /* per-file errors already arrived as `content://file` events */
    }),
  );
  queues.set(slug, next);
  // Drop the entry once it is the tail, so the map does not grow one dead
  // promise per add for the life of the session.
  void next.then(() => {
    if (queues.get(slug) === next) queues.delete(slug);
  });
}

/** Append entries, skipping any whose path is already taken. The manifest
 *  rejects duplicate paths case-insensitively, so a silent overwrite here would
 *  become a save failure the player cannot explain.
 *
 *  Additive, which is what makes `fetchInBackground` safe here and not on
 *  `replaceFile`: nothing this function does retires a file, so an instance
 *  that gains exactly these paths is in sync with the new manifest. */
export async function addFiles(
  slug: string,
  entries: Array<{
    path: string;
    sha512: string;
    fileSize: number;
    source: unknown;
    /** Set only for a jar whose loader differs from the pack's — a Fabric mod
     *  running on NeoForge through Connector. Named in the signature rather than
     *  left to the spread so it is visibly part of what an entry may carry. */
    loader?: string;
  }>,
) {
  const added: string[] = [];
  /** Files an incoming entry replaces: same project, different jar. */
  const superseded: string[] = [];
  const { manifest, previousVersionId } = await mutate(slug, (files) => {
    // `taken` grows as the batch is walked, so it dedupes the incoming entries
    // against EACH OTHER as well as against what the pack already holds. The
    // second half matters: a caller that resolves two dependency edges to the
    // same jar (Fabric API and Forgified Fabric API both land on the forgified
    // one under Connector) would otherwise put two identical paths in the same
    // save, and the manifest's duplicate-path rule rejects the whole thing —
    // the player loses the add entirely over a duplicate we could have dropped.
    const taken = new Set(files.map((f) => normalise(f.path)));

    // Identity, not path. A pack must never hold two versions of one mod: the
    // loader sees two jars declaring the same mod id and refuses to start. Path
    // dedupe cannot catch it, because the version is IN the filename — which is
    // exactly how a pack ends up with two CreativeCores.
    const byProject = new Map<string, string>();
    for (const file of files) {
      const key = projectKeyOf(file.source);
      if (key) byProject.set(key, normalise(file.path));
    }

    const drop = new Set<string>();
    const fresh: ManifestFile[] = [];
    for (const entry of entries) {
      const key = normalise(entry.path);
      if (taken.has(key)) continue;

      const project = projectKeyOf(entry.source);
      const existing = project ? byProject.get(project) : undefined;
      // Already at this exact jar under a different name is impossible (the path
      // check above caught it), so a hit here is always a different version.
      if (existing && existing !== key) {
        drop.add(existing);
        superseded.push(existing);
      }
      if (project) byProject.set(project, key);

      taken.add(key);
      fresh.push({ ...entry, env: DEFAULT_ENV });
    }
    added.push(...fresh.map((f) => f.path));
    return [...files.filter((f) => !drop.has(normalise(f.path))), ...fresh];
  });

  // The superseded jar's bytes, explicitly. `fetchInBackground` runs
  // `instance_install_files`, which only ever ADDS — it would fetch the new jar,
  // mark the instance complete, and so guarantee the stale sweep never runs. The
  // old jar would then sit in `mods/` beside the new one, which is a crash and
  // not a cosmetic leftover. Same reasoning as `replaceFile`'s note above.
  for (const path of superseded) await deleteBytes(slug, path);

  fetchInBackground(slug, manifest, added, previousVersionId);
  return manifest;
}

// ── Optional content ───────────────────────────────────────────────────────
//
// Authoring the optional-content catalogue, which is a different kind of edit
// from the ones above: it writes `version.optionalGroups` AND rewrites
// `files[].env` in the SAME save, because rule 2 of the manifest refinements
// requires every path a feature claims to be `env.client: "optional"`. Writing
// one without the other produces a manifest `local_pack_save` refuses, so they
// cannot be two calls.
//
// This is also why `mutate` above could not be reused: it is `files[]`-only by
// construction, and there is nowhere in it to put the groups.

/** The manifest's group shape — which is NOT the shape the editor hands back.
 *
 *  `@boffmedia/ui`'s `OptionalFeature` is the RESOLVED view: it carries
 *  `enabled`, `explicit`, `size` and `installed`, which describe an instance on
 *  disk and have no place in a document. The editor fills them with placeholders
 *  so its own type-checks pass, and they must be stripped here — the manifest is
 *  validated with `additionalProperties: false`, so `local_pack_save` rejects
 *  the whole save with `unknown field \`enabled\``, exactly the way it rejects
 *  BrowsePage's `projectId` in `toManifestFile`. Same trap, same fix. */
type ManifestFeature = {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  paths: string[];
  default: boolean;
  requires?: string[];
  activate?: unknown;
};

type ManifestGroup = {
  id: string;
  name: string;
  description?: string;
  select?: string;
  features: ManifestFeature[];
};

/** The subset of a group the editor is allowed to have an opinion about. */
type EditedFeature = {
  id: string;
  name: string;
  description?: string | null;
  iconUrl?: string | null;
  paths: string[];
  default: boolean;
  requires?: string[];
  activate?: unknown;
};

type EditedGroup = {
  id: string;
  name: string;
  description?: string | null;
  select?: string;
  features: EditedFeature[];
};

/** Omitted, never written as null. `description` and `iconUrl` are `type:
 *  "string"` in the schema with no null branch, so an explicit null fails
 *  validation just as loudly as an unknown key would — and the editor's own
 *  state type allows null for "the author cleared the box". */
function toManifestGroup(group: EditedGroup): ManifestGroup {
  const clean: ManifestGroup = {
    id: group.id,
    name: group.name.trim(),
    features: group.features.map(toManifestFeature),
  };
  const description = group.description?.trim();
  if (description) clean.description = description;
  if (group.select) clean.select = group.select;
  return clean;
}

function toManifestFeature(feature: EditedFeature): ManifestFeature {
  const clean: ManifestFeature = {
    id: feature.id,
    name: feature.name.trim(),
    paths: feature.paths,
    default: feature.default,
  };
  const description = feature.description?.trim();
  if (description) clean.description = description;
  if (feature.iconUrl) clean.iconUrl = feature.iconUrl;
  if (feature.requires && feature.requires.length > 0)
    clean.requires = feature.requires;
  if (feature.activate) clean.activate = feature.activate;
  return clean;
}

/** What the schema will refuse, phrased for the author instead of for a parser.
 *
 *  Checked HERE rather than left to `local_pack_save` because the Rust side can
 *  only answer with the validator's own words — `name: minLength 1` on a group
 *  the author simply has not named yet — and a half-authored group is the normal
 *  state of the form, not an exceptional one. The nine `validate_optional` rules
 *  are still the authority and still run on save; these are the three failures
 *  the editor produces on its way to a valid model. */
export function optionalGroupProblems(
  groups: EditedGroup[],
  t: (key: string, values?: Record<string, string | number>) => string,
): string[] {
  const problems: string[] = [];
  for (const group of groups) {
    const label = group.name.trim() || group.id;
    if (!group.name.trim())
      problems.push(t("optionalEditor.errorGroupName", { id: group.id }));
    if (group.features.length === 0) {
      problems.push(t("optionalEditor.errorGroupEmpty", { name: label }));
    }
    for (const feature of group.features) {
      if (!feature.name.trim()) {
        problems.push(t("optionalEditor.errorFeatureName", { group: label }));
      }
      if (feature.paths.length === 0) {
        problems.push(
          t("optionalEditor.errorFeatureEmpty", {
            name: feature.name.trim() || feature.id,
          }),
        );
      }
    }
  }
  return problems;
}

/** Write the catalogue and the `env` it implies, in one save.
 *
 *  `files` is what the editor handed back through `onFilesChange` — the desktop
 *  form passes that callback where apps/web deliberately does not, and the
 *  difference is structural rather than stylistic: the admin wizard assembles
 *  its `files[]` at submit and derives `env` there, and there is no submit here.
 *  A local pack's manifest IS the live document, so both halves have to be
 *  carried by the one call that writes it.
 *
 *  Only `env` is taken from `files`; every other field comes from the manifest
 *  on disk. The editor never sees hashes or sources and must not be able to
 *  clear one by round-tripping a file it only knows the path of. */
export async function saveOptionalGroups(
  slug: string,
  groups: EditedGroup[],
  files: Array<{
    path: string;
    env?: { client?: string; server?: string } | null;
  }>,
): Promise<PackManifest> {
  const current = await localPackGet(slug);
  if (!current) throw new Error("No se encontró el pack.");

  const edited = new Map(files.map((f) => [normalise(f.path), f.env]));
  const nextFiles = ((current.version?.files ?? []) as ManifestFile[])
    .map((file) => {
      const env = edited.get(normalise(file.path));
      if (!env?.client) return { ...file, env: file.env ?? DEFAULT_ENV };
      return {
        ...file,
        env: {
          client: env.client,
          server: env.server ?? file.env?.server ?? "required",
        },
      };
    })
    .map(toManifestFile);

  const nextGroups = groups.map(toManifestGroup);

  // Built as a mutable object so the empty case can DELETE the key rather than
  // write `[]`. The schema has `optionalGroups` optional, and spreading
  // `...current.version` would otherwise carry the old catalogue straight
  // through the save that was meant to remove it.
  const version: Record<string, unknown> = {
    ...current.version,
    id: nextVersionId(slug),
    files: nextFiles,
  };
  if (nextGroups.length > 0) version.optionalGroups = nextGroups;
  else delete version.optionalGroups;

  return await localPackSave({ ...current, version });
}
