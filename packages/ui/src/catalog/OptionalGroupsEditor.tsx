import * as React from "react";

import { cn } from "../cn";
import { Badge } from "../primitives/badge";
import { Button } from "../primitives/button";
import { Checkbox } from "../primitives/checkbox";
import { Empty } from "../primitives/empty";
import { Field } from "../primitives/field";
import { IconButton } from "../primitives/icon-button";
import { Input } from "../primitives/input";
import { Select } from "../primitives/select";
import type {
  Activation,
  MissingRequires,
  OptionalFeature,
  OptionalGroup,
  OptionalSelect,
} from "./types";

// The authoring half of optional content, and the piece that was missing
// entirely: `env.client: "optional"` has been in the schema since the .mrpack
// import landed, and nothing anywhere could set it.
//
// It edits TWO things at once, and has to. Rule 2 of the manifest refinements
// says every path a feature owns must be `env.client: "optional"` — that is what
// keeps the .mrpack view honest, so Prism and packwiz see the same optionality
// we do. An editor that only wrote groups would produce a model the API rejects
// on save, and the author would have to guess why. So claiming a path for a
// feature flips its file to optional, and releasing the last claim flips it
// back. One action, one coherent result.
//
// Host-agnostic like the rest of `@boffmedia/ui`: `t` is a prop, since these
// strings live in each host's own namespace.

/** The subset of a manifest file entry this editor reads and writes. */
export type EditableFile = {
  path: string;
  env?: { client?: string; server?: string } | null;
};

export type OptionalGroupsEditorProps = {
  groups: OptionalGroup[];
  onChange: (groups: OptionalGroup[]) => void;
  /** Every file in the version. The editor picks feature paths from here and
   *  rewrites the `env` of the ones a feature claims. */
  files: EditableFile[];
  /** Omit when the host derives `env` from the groups at save time instead of
   *  holding a file array to patch. Either way the invariant is the same — rule
   *  2 requires every claimed path to be `env.client: "optional"` — and this
   *  callback is only about WHERE that derivation lives. */
  onFilesChange?: (files: EditableFile[]) => void;
  /** Hard dependencies the JARS declare that the catalogue does not, read off
   *  disk by the host (`instanceModGraph`). The editor cannot derive these — a
   *  dependency lives inside the jar, not in the document being edited — which
   *  is exactly why it is the one check worth importing: it catches "Iris needs
   *  Sodium and Sodium is a separate switch" at authoring time rather than in a
   *  player's crash log. Omit where no graph is available; the editor then
   *  behaves exactly as before. */
  missingRequires?: MissingRequires[];
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  className?: string;
};

const SELECT_MODES: OptionalSelect[] = ["any", "one", "atMostOne"];
const ACTIVATION_KINDS = [
  "none",
  "resourcepack",
  "shaderpack",
  "datapack",
] as const;

/** Kept in step with `DATAPACK_LOADER_DIRS` in pack-schema. Rule 9 rejects a
 *  datapack activation outside one of these, so the editor warns before the save
 *  does — a validation error the author can only fix by moving a file is much
 *  cheaper as a hint next to the file. */
const DATAPACK_DIRS = [
  "config/openloader/datapacks/",
  "config/paxi/datapacks/",
];

/** Where a file of each activation kind has to live for the game to read it.
 *
 *  Used to pick a sensible default file rather than to forbid one: rule 7 only
 *  requires `activate.file` to be one of the feature's own paths, so a jar
 *  declared as a resourcepack validates and then silently does nothing — the
 *  worst kind of wrong, because every check passes. */
const ACTIVATION_DIRS: Record<
  Exclude<(typeof ACTIVATION_KINDS)[number], "none">,
  string[]
> = {
  resourcepack: ["resourcepacks/"],
  shaderpack: ["shaderpacks/"],
  datapack: DATAPACK_DIRS,
};

/** Ids are positional placeholders (`opcion-3`), never derived from the name,
 *  and never rewritten once assigned.
 *
 *  Deriving them would read better in the JSON and would be a real bug: the
 *  player's saved choice keys on the id, so an author renaming "Shaders" to
 *  "Shaders (beta)" in version 5 would silently reset the selection of everyone
 *  who had ever touched it. The id is invisible to players; the name is the
 *  thing they read, and it is free to change. */
function uniqueId(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`.slice(0, 64);
    if (!taken.has(candidate)) return candidate;
  }
}

const norm = (path: string) => path.toLowerCase().split("\\").join("/");

export function OptionalGroupsEditor({
  groups,
  onChange,
  files,
  onFilesChange,
  missingRequires = [],
  t,
  className,
}: OptionalGroupsEditorProps) {
  const claimedBy = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const group of groups) {
      for (const feature of group.features) {
        for (const path of feature.paths) map.set(norm(path), feature.id);
      }
    }
    return map;
  }, [groups]);

  /** Every feature in the version, for resolving a warning's target id to a
   *  name the author recognises. `selectable` carries rule 5: only a member of
   *  an `any` group may be the target of a `requires`. */
  const featureNames = React.useMemo(() => {
    const map = new Map<string, { name: string; selectable: boolean }>();
    for (const group of groups) {
      const selectable = (group.select ?? "any") === "any";
      for (const feature of group.features) {
        map.set(feature.id, { name: feature.name || feature.id, selectable });
      }
    }
    return map;
  }, [groups]);

  /** Re-derive every file's `env.client` from the groups. Called after ANY
   *  change, rather than patched at each claim site: a path can be released by
   *  deleting a feature, deleting a whole group, or unticking one checkbox, and
   *  three code paths maintaining the same invariant is how one of them ends up
   *  wrong. */
  const syncEnv = React.useCallback(
    (nextGroups: OptionalGroup[]) => {
      const claimed = new Set(
        nextGroups.flatMap((g) => g.features.flatMap((f) => f.paths.map(norm))),
      );
      let changed = false;
      const nextFiles = files.map((file) => {
        const isClaimed = claimed.has(norm(file.path));
        const current = file.env?.client ?? "required";
        // A file the author marked `unsupported` is a deliberate statement about
        // the client, not something a group claim should silently overwrite.
        if (current === "unsupported") return file;
        const want = isClaimed
          ? "optional"
          : current === "optional"
            ? "required"
            : current;
        if (want === current) return file;
        changed = true;
        return {
          ...file,
          env: { client: want, server: file.env?.server ?? "required" },
        };
      });
      onChange(nextGroups);
      if (changed) onFilesChange?.(nextFiles);
    },
    [files, onChange, onFilesChange],
  );

  const featureIds = React.useMemo(
    () => new Set(groups.flatMap((g) => g.features.map((f) => f.id))),
    [groups],
  );

  const addGroup = () => {
    const taken = new Set(groups.map((g) => g.id));
    // "otros" is reserved for the group the launcher synthesises out of
    // unclaimed optional files, so it can never be authored.
    taken.add("otros");
    syncEnv([
      ...groups,
      {
        id: uniqueId(`grupo-${groups.length + 1}`, taken),
        name: "",
        select: "any",
        features: [],
      },
    ]);
  };

  const patchGroup = (index: number, patch: Partial<OptionalGroup>) => {
    syncEnv(groups.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  };

  const removeGroup = (index: number) => {
    syncEnv(groups.filter((_, i) => i !== index));
  };

  if (groups.length === 0) {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        <Empty
          icon="layers"
          title={t("optionalEditor.emptyTitle")}
          lead={t("optionalEditor.emptyDesc")}
        />
        <Button
          variant="pri"
          icon="plus"
          onClick={addGroup}
          className="self-start"
        >
          {t("optionalEditor.addGroup")}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {groups.map((group, gi) => (
        <GroupEditor
          key={group.id}
          group={group}
          files={files}
          claimedBy={claimedBy}
          featureIds={featureIds}
          missingRequires={missingRequires}
          featureNames={featureNames}
          onPatch={(patch) => patchGroup(gi, patch)}
          onRemove={() => removeGroup(gi)}
          t={t}
        />
      ))}
      <Button
        variant="ghost"
        icon="plus"
        onClick={addGroup}
        className="self-start"
      >
        {t("optionalEditor.addGroup")}
      </Button>
    </div>
  );
}

function GroupEditor({
  group,
  files,
  claimedBy,
  featureIds,
  missingRequires,
  featureNames,
  onPatch,
  onRemove,
  t,
}: {
  group: OptionalGroup;
  files: EditableFile[];
  claimedBy: Map<string, string>;
  featureIds: Set<string>;
  missingRequires: MissingRequires[];
  featureNames: Map<string, { name: string; selectable: boolean }>;
  onPatch: (patch: Partial<OptionalGroup>) => void;
  onRemove: () => void;
  t: OptionalGroupsEditorProps["t"];
}) {
  const exclusive = group.select === "one" || group.select === "atMostOne";
  const defaultsOn = group.features.filter((f) => f.default).length;

  // Rule 6, surfaced where it is fixable. The API refuses a `one` group that
  // does not hold exactly one default, and an author who only meets that error
  // on save has to work backwards from a path string to a checkbox.
  const defaultError =
    group.select === "one" && defaultsOn !== 1
      ? t("optionalEditor.errorOneDefault", { count: defaultsOn })
      : group.select === "atMostOne" && defaultsOn > 1
        ? t("optionalEditor.errorAtMostOneDefault", { count: defaultsOn })
        : null;

  const addFeature = () => {
    onPatch({
      features: [
        ...group.features,
        {
          id: uniqueId(`opcion-${group.features.length + 1}`, featureIds),
          name: "",
          paths: [],
          // Opt-out is the safer default to land on: it matches what
          // `env.client: "optional"` alone has always meant, so a group left
          // half-authored behaves the way the pre-feature runtime did.
          default: true,
          requires: [],
          enabled: true,
          explicit: false,
          size: 0,
          installed: false,
        },
      ],
    });
  };

  const patchFeature = (index: number, patch: Partial<OptionalFeature>) => {
    onPatch({
      features: group.features.map((f, i) =>
        i === index ? { ...f, ...patch } : f,
      ),
    });
  };

  return (
    <section className="flex flex-col gap-3 border border-solid border-line bg-panel-2 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field
          label={t("optionalEditor.groupName")}
          className="min-w-[12.5rem] flex-1"
        >
          <Input
            value={group.name}
            placeholder={t("optionalEditor.groupNamePlaceholder")}
            onChange={(e) => onPatch({ name: e.target.value })}
          />
        </Field>
        <Field label={t("optionalEditor.selectMode")} className="min-w-[11.25rem]">
          <Select
            value={group.select}
            options={SELECT_MODES.map((mode) => ({
              value: mode,
              label: t(`optionalEditor.mode.${mode}`),
            }))}
            onChange={(v) => onPatch({ select: v as OptionalSelect })}
          />
        </Field>
        <IconButton
          name="trash"
          variant="ghost"
          label={t("optionalEditor.removeGroup")}
          onClick={onRemove}
        />
      </div>

      <Field label={t("optionalEditor.groupDescription")}>
        <Input
          value={group.description ?? ""}
          onChange={(e) => onPatch({ description: e.target.value || null })}
        />
      </Field>

      {defaultError && (
        <p
          role="alert"
          className="font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-bad"
        >
          {defaultError}
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {group.features.map((feature, fi) => (
          <FeatureEditor
            key={feature.id}
            feature={feature}
            group={group}
            exclusive={exclusive}
            files={files}
            claimedBy={claimedBy}
            warnings={missingRequires.filter((w) => w.feature === feature.id)}
            featureNames={featureNames}
            onPatch={(patch) => patchFeature(fi, patch)}
            onRemove={() =>
              onPatch({ features: group.features.filter((_, i) => i !== fi) })
            }
            t={t}
          />
        ))}
      </ul>

      <Button
        variant="ghost"
        size="sm"
        icon="plus"
        onClick={addFeature}
        className="self-start"
      >
        {t("optionalEditor.addFeature")}
      </Button>
    </section>
  );
}

function FeatureEditor({
  feature,
  group,
  exclusive,
  files,
  claimedBy,
  warnings,
  featureNames,
  onPatch,
  onRemove,
  t,
}: {
  feature: OptionalFeature;
  group: OptionalGroup;
  exclusive: boolean;
  files: EditableFile[];
  claimedBy: Map<string, string>;
  /** Undeclared hard dependencies whose SOURCE is this feature. */
  warnings: MissingRequires[];
  /** Every feature id in the version, with its display name and whether it sits
   *  in an `any` group — needed because a warning routinely points at a feature
   *  in a DIFFERENT group, which the same-group picker cannot offer. */
  featureNames: Map<string, { name: string; selectable: boolean }>;
  onPatch: (patch: Partial<OptionalFeature>) => void;
  onRemove: () => void;
  t: OptionalGroupsEditorProps["t"];
}) {
  const owned = new Set(feature.paths.map(norm));

  const featureWarnings = warnings;
  const nameOfFeature = (id: string) => featureNames.get(id)?.name || id;

  // The picker offers same-group `any` members only, and the dependency that
  // matters most here — Iris in `shaders` needing Sodium in `rendimiento` — is
  // cross-group. Rather than widen the picker to the whole version and bury the
  // useful option among thirty, only the targets a WARNING actually names are
  // added: the author is offered exactly the fix the warning asked for.
  //
  // Rule 5 still applies, so a target in an exclusive group is named in the
  // warning but never offered as a tickable fix — a `requires` pointing into a
  // radio group could force two of its members on at once.
  const crossGroupCandidates = featureWarnings
    .map((w) => w.needs)
    .filter((id) => !group.features.some((f) => f.id === id))
    .filter((id) => featureNames.get(id)?.selectable)
    .map((id) => ({ id, name: nameOfFeature(id) }));

  // Per FeatureEditor rather than per group: two features are picked from the
  // same file list but almost never with the same query, and the list is keyed
  // on `feature.id`, so this state follows the feature it belongs to rather
  // than the position it happens to sit at.
  const [filter, setFilter] = React.useState("");
  const query = norm(filter.trim());
  const visible = React.useMemo(
    () => (query ? files.filter((f) => norm(f.path).includes(query)) : files),
    [files, query],
  );
  // Matched against the FULL path, so "shaderpacks/" narrows by folder and
  // "sodium" by name — one box does both, and a jar is as often found by where
  // it lives as by what it is called.

  /** Files this feature owns that the filter is hiding.
   *
   *  Surfaced rather than left implicit because this list is the ONLY view of
   *  the selection — nothing else on the form enumerates `feature.paths` — so a
   *  filter that quietly hides three ticked rows reads as having lost them. */
  const hiddenSelected = React.useMemo(
    () =>
      // Only while filtering. With no query the misses are paths the pack no
      // longer has — a jar deleted after the feature claimed it — and calling
      // those "hidden by the filter" would be a wrong answer to a question
      // nobody asked. They are still visible where they belong: the save
      // carries them, and rule 1 rejects a path that is not in files[].
      query
        ? feature.paths.filter(
            (path) => !visible.some((f) => norm(f.path) === norm(path)),
          ).length
        : 0,
    [feature.paths, visible, query],
  );

  const togglePath = (path: string, on: boolean) => {
    const next = on
      ? [...feature.paths, path]
      : feature.paths.filter((p) => norm(p) !== norm(path));
    // Dropping a path the activation pointed at would leave rule 7 broken
    // (activate.file must be one of the feature's own paths), so the activation
    // goes with it rather than becoming a dangling reference.
    const activate =
      feature.activate &&
      next.some((p) => norm(p) === norm(feature.activate!.file))
        ? feature.activate
        : null;
    onPatch({ paths: next, activate });
  };

  const setActivation = (kind: (typeof ACTIVATION_KINDS)[number]) => {
    if (kind === "none") return onPatch({ activate: null });
    // Prefer a path that belongs where this kind has to live. `paths[0]` is a
    // coin toss on the feature this is FOR — a resourcepack and the mod that
    // reads it, where the jar is very often first — and a jar declared as a
    // resourcepack passes rule 7, writes itself into options.txt and does
    // nothing. Falls back to the old behaviour when nothing matches, so a pack
    // laid out unusually is still authorable.
    const dirs = ACTIVATION_DIRS[kind];
    const file =
      feature.activate?.file ??
      feature.paths.find((p) => dirs.some((dir) => norm(p).startsWith(dir))) ??
      feature.paths[0];
    if (!file) return;
    const next: Activation =
      kind === "resourcepack"
        ? { kind, file, priority: 0 }
        : kind === "shaderpack"
          ? { kind, file }
          : { kind, file };
    onPatch({ activate: next });
  };

  // Rule 8 and rule 9, again surfaced where they are fixable.
  const activationError =
    feature.activate?.kind === "shaderpack" && !exclusive
      ? t("optionalEditor.errorShaderpackGroup")
      : feature.activate?.kind === "datapack" &&
          !DATAPACK_DIRS.some((dir) =>
            norm(feature.activate!.file).startsWith(dir),
          )
        ? t("optionalEditor.errorDatapackDir", {
            dirs: DATAPACK_DIRS.join(" · "),
          })
        : null;

  return (
    <li className="flex flex-col gap-3 border border-solid border-line bg-panel p-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field
          label={t("optionalEditor.featureName")}
          className="min-w-[11.25rem] flex-1"
        >
          <Input
            value={feature.name}
            onChange={(e) => onPatch({ name: e.target.value })}
          />
        </Field>
        <Field
          label={t("optionalEditor.defaultState")}
          className="min-w-[10.625rem]"
        >
          <Select
            value={feature.default ? "on" : "off"}
            options={[
              { value: "on", label: t("optionalEditor.defaultOn") },
              { value: "off", label: t("optionalEditor.defaultOff") },
            ]}
            onChange={(v) => onPatch({ default: v === "on" })}
          />
        </Field>
        <Field label={t("optionalEditor.activation")} className="min-w-[10.625rem]">
          <Select
            value={feature.activate?.kind ?? "none"}
            options={ACTIVATION_KINDS.map((kind) => ({
              value: kind,
              label: t(`optionalEditor.activationKind.${kind}`),
            }))}
            onChange={(v) =>
              setActivation(v as (typeof ACTIVATION_KINDS)[number])
            }
          />
        </Field>
        <IconButton
          name="trash"
          variant="ghost"
          label={t("optionalEditor.removeFeature")}
          onClick={onRemove}
        />
      </div>

      <Field label={t("optionalEditor.featureDescription")}>
        <Input
          value={feature.description ?? ""}
          onChange={(e) => onPatch({ description: e.target.value || null })}
        />
      </Field>

      {feature.activate && feature.paths.length > 1 && (
        <Field label={t("optionalEditor.activationFile")}>
          <Select
            value={feature.activate.file}
            // Every path stays selectable — rule 7 allows any of them and an
            // unusual layout is not an error — but one that does not sit where
            // its kind is read from is marked, so a wrong pick is visible at the
            // moment it is made rather than as a feature that does nothing.
            options={feature.paths.map((p) => ({
              value: p,
              label: ACTIVATION_DIRS[feature.activate!.kind].some((dir) =>
                norm(p).startsWith(dir),
              )
                ? p
                : `${p}  ⚠`,
            }))}
            onChange={(file) =>
              onPatch({
                activate: { ...feature.activate!, file } as Activation,
              })
            }
          />
        </Field>
      )}

      {activationError && (
        <p
          role="alert"
          className="font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-bad"
        >
          {activationError}
        </p>
      )}

      {/* `requires` is restricted to `any`-group members by rule 5: a dependency
          is a force-on, and forcing on a member of a radio group either turns a
          second member on or silently discards the player's choice. */}
      {featureWarnings.length > 0 && (
        // Named, not counted: "Iris necesita Sodium" is actionable and "1 problema"
        // is not. Each line says which mod declared it and which feature holds the
        // mod that satisfies it, because the author's fix is a `requires` between
        // those two features.
        <p
          role="status"
          className="font-body text-[0.75rem] leading-[1.4] text-warn"
        >
          {featureWarnings
            .map((w) =>
              t("optionalEditor.missingRequires", {
                mod: w.fromPath.split("/").pop() ?? w.fromPath,
                modId: w.modId,
                feature: nameOfFeature(w.needs),
              }),
            )
            .join(" ")}
        </p>
      )}

      <RequiresPicker
        feature={feature}
        group={group}
        extraCandidates={crossGroupCandidates}
        onPatch={onPatch}
        t={t}
      />

      <Field
        label={t("optionalEditor.paths")}
        hint={t("optionalEditor.pathsHint")}
        error={
          feature.paths.length === 0
            ? t("optionalEditor.errorNoPaths")
            : undefined
        }
      >
        {/* ONE child, or Field clones nothing and its <label> ends up naming
            nothing at all — the exact defect that component exists to prevent.
            `role="group"` is what makes the cloned `aria-label` carry: on a bare
            <div> it is ignored, and the visible label would have been hidden
            from AT while naming no control. */}
        <div role="group" className="flex flex-col gap-2">
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            // Explicit, so Field leaves it alone: its label belongs to the
            // group, and naming the search box "Archivos de esta opción" would
            // announce the wrong control.
            aria-label={t("optionalEditor.pathsFilterLabel")}
            placeholder={t("optionalEditor.pathsFilter", {
              count: files.length,
            })}
            className="py-[0.4375rem] text-[0.8125rem]"
          />

          {hiddenSelected > 0 && (
            <p
              role="status"
              className="font-body text-[0.75rem] leading-[1.4] text-warn"
            >
              {t("optionalEditor.pathsHiddenSelected", {
                count: hiddenSelected,
              })}
            </p>
          )}

          <ul className="bm-scroll flex max-h-[11.875rem] flex-col overflow-auto border border-solid border-line">
            {visible.length === 0 && (
              <li className="px-2 py-3 text-center font-body text-[0.75rem] text-txt-dim">
                {t("optionalEditor.pathsNoMatch", { query: filter.trim() })}
              </li>
            )}
            {visible.map((file) => {
              const owner = claimedBy.get(norm(file.path));
              // Rule 4: one owner per path. Shown as a disabled row with the
              // owner's name rather than hidden, so an author who cannot find a
              // file learns where it went instead of thinking it vanished.
              const takenByOther = owner !== undefined && owner !== feature.id;
              return (
                <li
                  key={file.path}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1",
                    takenByOther && "opacity-50",
                  )}
                >
                  <Checkbox
                    checked={owned.has(norm(file.path))}
                    disabled={takenByOther}
                    onChange={(on) => togglePath(file.path, on)}
                    label={file.path}
                  />
                  {takenByOther && (
                    <Badge tone="warn" className="ml-auto shrink-0">
                      {owner}
                    </Badge>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </Field>
    </li>
  );
}

function RequiresPicker({
  extraCandidates = [],
  feature,
  group,
  onPatch,
  t,
}: {
  /** Cross-group targets a jar-level warning named. Empty by default, so the
   *  picker's own rule is unchanged where no graph is available. */
  extraCandidates?: { id: string; name: string }[];
  feature: OptionalFeature;
  group: OptionalGroup;
  onPatch: (patch: Partial<OptionalFeature>) => void;
  t: OptionalGroupsEditorProps["t"];
}) {
  // Same-group `any` members, because the common case by far is "this needs the
  // loader mod sitting next to it". Cross-group dependencies are legal in the
  // schema and the editor has no reason to list the whole version — but a target
  // that a jar's own metadata says is REQUIRED is worth offering, and arrives
  // through `extraCandidates`.
  const sameGroup =
    group.select === "any"
      ? group.features.filter((f) => f.id !== feature.id)
      : [];
  // Cross-group targets arrive only because a jar-level warning named them, so
  // they are additions to the same-group list, never a replacement for it.
  const candidates = [
    ...sameGroup.map((f) => ({ id: f.id, name: f.name })),
    ...extraCandidates.filter((c) => !sameGroup.some((f) => f.id === c.id)),
  ];
  if (candidates.length === 0) return null;

  /** `requires` arrives UNDEFINED off a saved document, and the type says it
   *  cannot.
   *
   *  The schema has it optional and the sanitisers omit it when empty rather
   *  than writing `[]`, so a group round-tripped through a manifest comes back
   *  without the key. Every load site casts the stored document into
   *  `OptionalFeature` — the RESOLVED view, where the array is always present —
   *  which is exactly what lets the gap through the type system: desktop's
   *  `startEditing`, web's version-editor at `setOptionalGroups`. Reading
   *  `.includes` off it threw, and a throw in render blanks the whole window.
   *
   *  Tolerated at the read rather than normalised at each cast, because there is
   *  no submit between them: this is the only place that has to care. */
  const requires = feature.requires ?? [];

  const toggle = (id: string, on: boolean) => {
    onPatch({
      requires: on ? [...requires, id] : requires.filter((r) => r !== id),
    });
  };

  return (
    <Field
      label={t("optionalEditor.requires")}
      hint={t("optionalEditor.requiresHint")}
    >
      <div className="flex flex-wrap gap-3">
        {candidates.map((candidate) => (
          <Checkbox
            key={candidate.id}
            checked={requires.includes(candidate.id)}
            onChange={(on) => toggle(candidate.id, on)}
            label={candidate.name || candidate.id}
          />
        ))}
      </div>
    </Field>
  );
}
