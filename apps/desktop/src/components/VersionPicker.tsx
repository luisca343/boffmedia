import { useEffect, useState } from "react"

import { Checkbox, Select } from "@boffmedia/ui"

import { useT } from "../i18n"
import { loaderVersions, minecraftVersions } from "../runtime"
import type { GameVersion, LoaderVersion } from "../runtime"

// The Minecraft/loader pickers shared by "create local pack" and "edit local
// pack". Both lists come from the real upstreams (runtime → meta.rs), not from
// a hardcoded array: a hardcoded one goes stale on every Mojang release, and a
// loader version of "latest" is a string no installer can resolve — Forge and
// NeoForge want a concrete build, so the picker has to offer one.

export const LOADERS = [
  { value: "", label: "Vanilla" },
  { value: "forge", label: "Forge" },
  { value: "neoforge", label: "NeoForge" },
  { value: "fabric-loader", label: "Fabric" },
  { value: "quilt-loader", label: "Quilt" },
]

export type VersionChoice = {
  minecraft: string
  loader: string
  loaderVersion: string
}

/** Preselect the loader build the upstream calls recommended, falling back to
 *  the newest one — never to an empty string, which would serialise into a
 *  dependency the installer cannot use. */
function preferred(list: LoaderVersion[]): string {
  return (list.find((v) => v.recommended) ?? list.find((v) => v.latest) ?? list[0])?.version ?? ""
}

export function VersionPicker({
  value,
  onChange,
  onLoadingChange,
}: {
  value: VersionChoice
  onChange: (next: VersionChoice) => void
  /** So the parent can keep "Crear"/"Guardar" disabled while a list is still
   *  in flight — saving mid-load would write an empty loader version. */
  onLoadingChange?: (loading: boolean) => void
}) {
  const t = useT("versionPicker")
  const [games, setGames] = useState<GameVersion[]>([])
  const [snapshots, setSnapshots] = useState(false)
  const [builds, setBuilds] = useState<LoaderVersion[]>([])
  const [loadingGames, setLoadingGames] = useState(true)
  const [loadingBuilds, setLoadingBuilds] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loaderLabel = (v: LoaderVersion): string => {
    const tags = [v.recommended ? t("recommendedTag") : null, v.latest ? t("latestTag") : null].filter(Boolean)
    return tags.length ? `${v.version} (${tags.join(", ")})` : v.version
  }

  useEffect(() => {
    let cancelled = false
    setLoadingGames(true)
    minecraftVersions()
      .then((list) => {
        if (cancelled) return
        setGames(list)
        // Nothing selected yet (a brand-new pack): take Mojang's latest
        // release rather than whatever happens to be first.
        if (!value.minecraft) {
          const latest = list.find((v) => v.type === "release" && v.latest) ?? list.find((v) => v.type === "release")
          if (latest) onChange({ ...value, minecraft: latest.id })
        }
      })
      .catch((err: { message?: string }) => {
        if (!cancelled) setError(err?.message ?? t("minecraftVersionsError"))
      })
      .finally(() => {
        if (!cancelled) setLoadingGames(false)
      })
    return () => {
      cancelled = true
    }
    // Runs once: the Minecraft list does not depend on any of the selections.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!value.loader || !value.minecraft) {
      setBuilds([])
      return
    }
    let cancelled = false
    setLoadingBuilds(true)
    loaderVersions(value.loader, value.minecraft)
      .then((list) => {
        if (cancelled) return
        setBuilds(list)
        // Keep the current build only if this loader/MC pair still offers it.
        const keep = list.some((v) => v.version === value.loaderVersion)
        onChange({ ...value, loaderVersion: keep ? value.loaderVersion : preferred(list) })
      })
      .catch((err: { message?: string }) => {
        if (!cancelled) setError(err?.message ?? t("loaderVersionsError"))
      })
      .finally(() => {
        if (!cancelled) setLoadingBuilds(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.loader, value.minecraft])

  useEffect(() => {
    onLoadingChange?.(loadingGames || loadingBuilds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingGames, loadingBuilds])

  const shown = games.filter((v) => (snapshots ? true : v.type === "release"))
  const options = shown.map((v) => ({
    value: v.id,
    label: v.latest ? `${v.id} (${t("latestTag")})` : v.id,
  }))
  // A version already saved on the pack must stay selectable even when it is a
  // snapshot and the toggle is off, or opening "editar" would silently move
  // the pack to another Minecraft version.
  if (value.minecraft && !options.some((o) => o.value === value.minecraft)) {
    options.unshift({ value: value.minecraft, label: value.minecraft })
  }

  const noBuilds = Boolean(value.loader) && !loadingBuilds && builds.length === 0

  return (
    <>
      <Select
        label={t("minecraftLabel")}
        value={value.minecraft}
        onChange={(minecraft) => onChange({ ...value, minecraft })}
        options={options}
        disabled={loadingGames}
      />
      <Checkbox
        checked={snapshots}
        onChange={setSnapshots}
        label={t("snapshotsLabel")}
      />
      <Select
        label={t("loaderLabel")}
        value={value.loader}
        onChange={(loader) => onChange({ ...value, loader, loaderVersion: "" })}
        options={LOADERS}
      />
      {value.loader && (
        <Select
          label={t("loaderVersionLabel")}
          value={value.loaderVersion}
          onChange={(loaderVersion) => onChange({ ...value, loaderVersion })}
          options={builds.map((v) => ({ value: v.version, label: loaderLabel(v) }))}
          disabled={loadingBuilds || builds.length === 0}
          hint={
            loadingBuilds
              ? t("loadingVersions")
              : noBuilds
                ? t("noVersionsHint")
                : undefined
          }
        />
      )}
      {error && <p className="text-xs text-bad">{error}</p>}
    </>
  )
}

/** The `dependencies` object a manifest wants, built from a picker choice. */
export function dependenciesOf(choice: VersionChoice): Record<string, string> {
  const dependencies: Record<string, string> = { minecraft: choice.minecraft }
  if (choice.loader && choice.loaderVersion) dependencies[choice.loader] = choice.loaderVersion
  return dependencies
}
