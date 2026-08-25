import * as React from "react"

import { cn } from "../cn"
import { Badge } from "../primitives/badge"
import { Button } from "../primitives/button"
import { Checkbox } from "../primitives/checkbox"
import { Empty } from "../primitives/empty"
import { Field } from "../primitives/field"
import { IconButton } from "../primitives/icon-button"
import { Input } from "../primitives/input"
import { Select } from "../primitives/select"
import type { Activation, OptionalFeature, OptionalGroup, OptionalSelect } from "./types"

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
  path: string
  env?: { client?: string; server?: string } | null
}

export type OptionalGroupsEditorProps = {
  groups: OptionalGroup[]
  onChange: (groups: OptionalGroup[]) => void
  /** Every file in the version. The editor picks feature paths from here and
   *  rewrites the `env` of the ones a feature claims. */
  files: EditableFile[]
  /** Omit when the host derives `env` from the groups at save time instead of
   *  holding a file array to patch. Either way the invariant is the same — rule
   *  2 requires every claimed path to be `env.client: "optional"` — and this
   *  callback is only about WHERE that derivation lives. */
  onFilesChange?: (files: EditableFile[]) => void
  t: (key: string, values?: Record<string, string | number | Date>) => string
  className?: string
}

const SELECT_MODES: OptionalSelect[] = ["any", "one", "atMostOne"]
const ACTIVATION_KINDS = ["none", "resourcepack", "shaderpack", "datapack"] as const

/** Kept in step with `DATAPACK_LOADER_DIRS` in pack-schema. Rule 9 rejects a
 *  datapack activation outside one of these, so the editor warns before the save
 *  does — a validation error the author can only fix by moving a file is much
 *  cheaper as a hint next to the file. */
const DATAPACK_DIRS = ["config/openloader/datapacks/", "config/paxi/datapacks/"]

/** Ids are positional placeholders (`opcion-3`), never derived from the name,
 *  and never rewritten once assigned.
 *
 *  Deriving them would read better in the JSON and would be a real bug: the
 *  player's saved choice keys on the id, so an author renaming "Shaders" to
 *  "Shaders (beta)" in version 5 would silently reset the selection of everyone
 *  who had ever touched it. The id is invisible to players; the name is the
 *  thing they read, and it is free to change. */
function uniqueId(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`.slice(0, 64)
    if (!taken.has(candidate)) return candidate
  }
}

const norm = (path: string) => path.toLowerCase().split("\\").join("/")

export function OptionalGroupsEditor({
  groups,
  onChange,
  files,
  onFilesChange,
  t,
  className,
}: OptionalGroupsEditorProps) {
  const claimedBy = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const group of groups) {
      for (const feature of group.features) {
        for (const path of feature.paths) map.set(norm(path), feature.id)
      }
    }
    return map
  }, [groups])

  /** Re-derive every file's `env.client` from the groups. Called after ANY
   *  change, rather than patched at each claim site: a path can be released by
   *  deleting a feature, deleting a whole group, or unticking one checkbox, and
   *  three code paths maintaining the same invariant is how one of them ends up
   *  wrong. */
  const syncEnv = React.useCallback(
    (nextGroups: OptionalGroup[]) => {
      const claimed = new Set(
        nextGroups.flatMap((g) => g.features.flatMap((f) => f.paths.map(norm))),
      )
      let changed = false
      const nextFiles = files.map((file) => {
        const isClaimed = claimed.has(norm(file.path))
        const current = file.env?.client ?? "required"
        // A file the author marked `unsupported` is a deliberate statement about
        // the client, not something a group claim should silently overwrite.
        if (current === "unsupported") return file
        const want = isClaimed ? "optional" : current === "optional" ? "required" : current
        if (want === current) return file
        changed = true
        return {
          ...file,
          env: { client: want, server: file.env?.server ?? "required" },
        }
      })
      onChange(nextGroups)
      if (changed) onFilesChange?.(nextFiles)
    },
    [files, onChange, onFilesChange],
  )

  const featureIds = React.useMemo(
    () => new Set(groups.flatMap((g) => g.features.map((f) => f.id))),
    [groups],
  )

  const addGroup = () => {
    const taken = new Set(groups.map((g) => g.id))
    // "otros" is reserved for the group the launcher synthesises out of
    // unclaimed optional files, so it can never be authored.
    taken.add("otros")
    syncEnv([
      ...groups,
      {
        id: uniqueId(`grupo-${groups.length + 1}`, taken),
        name: "",
        select: "any",
        features: [],
      },
    ])
  }

  const patchGroup = (index: number, patch: Partial<OptionalGroup>) => {
    syncEnv(groups.map((g, i) => (i === index ? { ...g, ...patch } : g)))
  }

  const removeGroup = (index: number) => {
    syncEnv(groups.filter((_, i) => i !== index))
  }

  if (groups.length === 0) {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        <Empty icon="layers" title={t("optionalEditor.emptyTitle")} lead={t("optionalEditor.emptyDesc")} />
        <Button variant="pri" icon="plus" onClick={addGroup} className="self-start">
          {t("optionalEditor.addGroup")}
        </Button>
      </div>
    )
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
          onPatch={(patch) => patchGroup(gi, patch)}
          onRemove={() => removeGroup(gi)}
          t={t}
        />
      ))}
      <Button variant="ghost" icon="plus" onClick={addGroup} className="self-start">
        {t("optionalEditor.addGroup")}
      </Button>
    </div>
  )
}

function GroupEditor({
  group,
  files,
  claimedBy,
  featureIds,
  onPatch,
  onRemove,
  t,
}: {
  group: OptionalGroup
  files: EditableFile[]
  claimedBy: Map<string, string>
  featureIds: Set<string>
  onPatch: (patch: Partial<OptionalGroup>) => void
  onRemove: () => void
  t: OptionalGroupsEditorProps["t"]
}) {
  const exclusive = group.select === "one" || group.select === "atMostOne"
  const defaultsOn = group.features.filter((f) => f.default).length

  // Rule 6, surfaced where it is fixable. The API refuses a `one` group that
  // does not hold exactly one default, and an author who only meets that error
  // on save has to work backwards from a path string to a checkbox.
  const defaultError =
    group.select === "one" && defaultsOn !== 1
      ? t("optionalEditor.errorOneDefault", { count: defaultsOn })
      : group.select === "atMostOne" && defaultsOn > 1
        ? t("optionalEditor.errorAtMostOneDefault", { count: defaultsOn })
        : null

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
    })
  }

  const patchFeature = (index: number, patch: Partial<OptionalFeature>) => {
    onPatch({
      features: group.features.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    })
  }

  return (
    <section className="flex flex-col gap-3 border border-solid border-line bg-panel-2 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label={t("optionalEditor.groupName")} className="min-w-[200px] flex-1">
          <Input
            value={group.name}
            placeholder={t("optionalEditor.groupNamePlaceholder")}
            onChange={(e) => onPatch({ name: e.target.value })}
          />
        </Field>
        <Field label={t("optionalEditor.selectMode")} className="min-w-[180px]">
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
        <p role="alert" className="font-mono text-[11px] uppercase tracking-[0.06em] text-bad">
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
            onPatch={(patch) => patchFeature(fi, patch)}
            onRemove={() =>
              onPatch({ features: group.features.filter((_, i) => i !== fi) })
            }
            t={t}
          />
        ))}
      </ul>

      <Button variant="ghost" size="sm" icon="plus" onClick={addFeature} className="self-start">
        {t("optionalEditor.addFeature")}
      </Button>
    </section>
  )
}

function FeatureEditor({
  feature,
  group,
  exclusive,
  files,
  claimedBy,
  onPatch,
  onRemove,
  t,
}: {
  feature: OptionalFeature
  group: OptionalGroup
  exclusive: boolean
  files: EditableFile[]
  claimedBy: Map<string, string>
  onPatch: (patch: Partial<OptionalFeature>) => void
  onRemove: () => void
  t: OptionalGroupsEditorProps["t"]
}) {
  const owned = new Set(feature.paths.map(norm))

  const togglePath = (path: string, on: boolean) => {
    const next = on
      ? [...feature.paths, path]
      : feature.paths.filter((p) => norm(p) !== norm(path))
    // Dropping a path the activation pointed at would leave rule 7 broken
    // (activate.file must be one of the feature's own paths), so the activation
    // goes with it rather than becoming a dangling reference.
    const activate =
      feature.activate && next.some((p) => norm(p) === norm(feature.activate!.file))
        ? feature.activate
        : null
    onPatch({ paths: next, activate })
  }

  const setActivation = (kind: (typeof ACTIVATION_KINDS)[number]) => {
    if (kind === "none") return onPatch({ activate: null })
    const file = feature.activate?.file ?? feature.paths[0]
    if (!file) return
    const next: Activation =
      kind === "resourcepack"
        ? { kind, file, priority: 0 }
        : kind === "shaderpack"
          ? { kind, file }
          : { kind, file }
    onPatch({ activate: next })
  }

  // Rule 8 and rule 9, again surfaced where they are fixable.
  const activationError =
    feature.activate?.kind === "shaderpack" && !exclusive
      ? t("optionalEditor.errorShaderpackGroup")
      : feature.activate?.kind === "datapack" &&
          !DATAPACK_DIRS.some((dir) => norm(feature.activate!.file).startsWith(dir))
        ? t("optionalEditor.errorDatapackDir", { dirs: DATAPACK_DIRS.join(" · ") })
        : null

  return (
    <li className="flex flex-col gap-3 border border-solid border-line bg-panel p-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field label={t("optionalEditor.featureName")} className="min-w-[180px] flex-1">
          <Input value={feature.name} onChange={(e) => onPatch({ name: e.target.value })} />
        </Field>
        <Field label={t("optionalEditor.defaultState")} className="min-w-[170px]">
          <Select
            value={feature.default ? "on" : "off"}
            options={[
              { value: "on", label: t("optionalEditor.defaultOn") },
              { value: "off", label: t("optionalEditor.defaultOff") },
            ]}
            onChange={(v) => onPatch({ default: v === "on" })}
          />
        </Field>
        <Field label={t("optionalEditor.activation")} className="min-w-[170px]">
          <Select
            value={feature.activate?.kind ?? "none"}
            options={ACTIVATION_KINDS.map((kind) => ({
              value: kind,
              label: t(`optionalEditor.activationKind.${kind}`),
            }))}
            onChange={(v) => setActivation(v as (typeof ACTIVATION_KINDS)[number])}
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
            options={feature.paths.map((p) => ({ value: p, label: p }))}
            onChange={(file) =>
              onPatch({ activate: { ...feature.activate!, file } as Activation })
            }
          />
        </Field>
      )}

      {activationError && (
        <p role="alert" className="font-mono text-[11px] uppercase tracking-[0.06em] text-bad">
          {activationError}
        </p>
      )}

      {/* `requires` is restricted to `any`-group members by rule 5: a dependency
          is a force-on, and forcing on a member of a radio group either turns a
          second member on or silently discards the player's choice. */}
      <RequiresPicker feature={feature} group={group} onPatch={onPatch} t={t} />

      <Field
        label={t("optionalEditor.paths")}
        hint={t("optionalEditor.pathsHint")}
        error={feature.paths.length === 0 ? t("optionalEditor.errorNoPaths") : undefined}
      >
        <ul className="bm-scroll flex max-h-[190px] flex-col overflow-auto border border-solid border-line">
          {files.map((file) => {
            const owner = claimedBy.get(norm(file.path))
            // Rule 4: one owner per path. Shown as a disabled row with the
            // owner's name rather than hidden, so an author who cannot find a
            // file learns where it went instead of thinking it vanished.
            const takenByOther = owner !== undefined && owner !== feature.id
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
            )
          })}
        </ul>
      </Field>
    </li>
  )
}

function RequiresPicker({
  feature,
  group,
  onPatch,
  t,
}: {
  feature: OptionalFeature
  group: OptionalGroup
  onPatch: (patch: Partial<OptionalFeature>) => void
  t: OptionalGroupsEditorProps["t"]
}) {
  // Only same-group `any` members are offered here. Cross-group dependencies are
  // legal in the schema, but the editor would need the whole version's feature
  // list to offer them and the common case by far is "this needs the loader mod
  // sitting next to it".
  const candidates =
    group.select === "any" ? group.features.filter((f) => f.id !== feature.id) : []
  if (candidates.length === 0) return null

  const toggle = (id: string, on: boolean) => {
    onPatch({
      requires: on ? [...feature.requires, id] : feature.requires.filter((r) => r !== id),
    })
  }

  return (
    <Field label={t("optionalEditor.requires")} hint={t("optionalEditor.requiresHint")}>
      <div className="flex flex-wrap gap-3">
        {candidates.map((candidate) => (
          <Checkbox
            key={candidate.id}
            checked={feature.requires.includes(candidate.id)}
            onChange={(on) => toggle(candidate.id, on)}
            label={candidate.name || candidate.id}
          />
        ))}
      </div>
    </Field>
  )
}
