// HANDOFF §9 — "locked vs. user space" and "pack version pinning + rollback".
//
// Two ideas, one on-disk change, which is why they live in one module:
//
//   MANAGED vs USER. The marker used to record only `fileCount`, which answers
//   "how many?" and nothing else. It now records the managed SET — path, size,
//   sha512 and the source it came from. That set is the launcher's property:
//   it may replace it, and it may DELETE from it when a mod leaves the pack.
//   Anything under `.minecraft` that is not in the set is the player's (the
//   minimap they dropped into `mods/`), and is never touched. Without the set
//   there is no way to tell those apart, so "remove mods dropped from the pack"
//   was simply not implemented — an update left the old jar behind forever.
//
//   RETENTION. Because every managed entry carries its source, an old version
//   is fully described by its marker: ~40 KB of JSON, not 400 jars. Reverting
//   replays that list through the same content-addressed download path, so the
//   blobs already in `shared/cache` are copied rather than fetched. Retaining N
//   versions therefore costs N markers plus whatever cache the player already
//   had. Copying instance trees would cost gigabytes and is never done.

use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use super::resolve::{Fetch, PlannedFile};

/// Retained-version cap when settings say nothing. Three is "the one that broke
/// it, the one before, and one more" — enough for a mid-session rollback,
/// small enough that the history file stays a file and not a database.
pub const DEFAULT_RETAIN: usize = 3;

/// Where a managed file came from, in a form that survives a restart.
///
/// A mirror of `resolve::Fetch` rather than Fetch itself: `Fetch::Proxied`
/// wraps `api::PackFile`, which is a live request description and deliberately
/// not Serialize. Keeping the serialisable copy separate means a change to the
/// HTTP layer cannot silently invalidate every marker on every player's disk.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum ManagedSource {
    Url { url: String },
    #[serde(rename_all = "camelCase")]
    Modrinth { version_id: String },
    #[serde(rename_all = "camelCase")]
    Curseforge { project_id: i64, file_id: i64 },
    #[serde(rename_all = "camelCase")]
    Override { sha512: String },
}

impl ManagedSource {
    pub fn from_fetch(fetch: &Fetch) -> Self {
        match fetch {
            Fetch::Direct(url) => ManagedSource::Url { url: url.clone() },
            Fetch::ModrinthVersion { version_id } => ManagedSource::Modrinth {
                version_id: version_id.clone(),
            },
            Fetch::Proxied(crate::api::PackFile::Curseforge {
                project_id,
                file_id,
            }) => ManagedSource::Curseforge {
                project_id: *project_id,
                file_id: *file_id,
            },
            Fetch::Proxied(crate::api::PackFile::Override { sha512 }) => ManagedSource::Override {
                sha512: sha512.clone(),
            },
        }
    }

    pub fn to_fetch(&self) -> Fetch {
        match self {
            ManagedSource::Url { url } => Fetch::Direct(url.clone()),
            ManagedSource::Modrinth { version_id } => Fetch::ModrinthVersion {
                version_id: version_id.clone(),
            },
            ManagedSource::Curseforge {
                project_id,
                file_id,
            } => Fetch::Proxied(crate::api::PackFile::Curseforge {
                project_id: *project_id,
                file_id: *file_id,
            }),
            ManagedSource::Override { sha512 } => {
                Fetch::Proxied(crate::api::PackFile::Override {
                    sha512: sha512.clone(),
                })
            }
        }
    }
}

/// One file the launcher owns, as recorded in the marker.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManagedFile {
    /// Relative to the instance's game directory, forward slashes.
    pub path: String,
    pub sha512: String,
    #[serde(default)]
    pub size: u64,
    #[serde(default)]
    pub is_mod: bool,
    /// `env.client == "optional"` in the manifest — the player may switch it
    /// off. §9's optional-mod toggles need no schema change: `.mrpack` already
    /// models this and `pack-schema`'s `EnvSupport` already carries it.
    #[serde(default)]
    pub optional: bool,
    pub source: ManagedSource,
}

impl ManagedFile {
    pub fn from_planned(file: &PlannedFile) -> Self {
        Self {
            path: normalise(&file.path),
            sha512: file.sha512.to_lowercase(),
            size: file.size,
            is_mod: file.is_mod,
            optional: file.optional,
            source: ManagedSource::from_fetch(&file.fetch),
        }
    }

    pub fn to_planned(&self) -> PlannedFile {
        PlannedFile {
            path: self.path.clone(),
            sha512: self.sha512.clone(),
            size: self.size,
            fetch: self.source.to_fetch(),
            is_mod: self.is_mod,
            optional: self.optional,
        }
    }
}

/// The marker written into an instance root after a successful install.
///
/// COMPATIBILITY: every field added since the first release carries
/// `#[serde(default)]`. A marker written by the previous build deserialises
/// into `managed: []`, `optional_files: []`, `pinned: false`. That is the
/// safe reading of "we do not know what we own" — an empty managed set makes
/// the stale sweep a no-op, so an old instance is never swept and never wiped.
/// It is not treated as broken either: `versionId` is all `instance_scan`
/// needs, so an old install keeps launching and simply gains the new
/// behaviour on its next update.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Marker {
    pub version_id: String,
    pub version_name: String,
    pub minecraft: String,
    pub loader: Option<String>,
    pub loader_version: Option<String>,
    pub installed_at: String,
    /// Kept for backwards compatibility AND because it is what the UI shows.
    /// Always `managed.len()` on a marker this build wrote.
    pub file_count: usize,
    #[serde(default)]
    pub pack_id: String,
    /// What the launcher owns on disk right now. Empty on a pre-§9 marker.
    #[serde(default)]
    pub managed: Vec<ManagedFile>,
    /// EVERY optional file this version declares, installed or not — the
    /// catalogue the toggle UI renders. `managed` only holds the enabled ones,
    /// so without this a disabled mod would vanish from the list and could
    /// never be switched back on without a reinstall.
    #[serde(default)]
    pub optional_files: Vec<ManagedFile>,
    /// Set by a revert. A pinned instance is launched at this version instead
    /// of at whatever the server currently calls latest.
    #[serde(default)]
    pub pinned: bool,
}

impl Marker {
    pub fn managed_paths(&self) -> HashSet<String> {
        self.managed.iter().map(|f| f.path.clone()).collect()
    }
}

/// The retained-version log, kept beside the marker.
///
/// Separate from the marker on purpose: the marker answers "what is installed"
/// and is read on every scan, while this is only read when the player opens the
/// rollback list. A corrupt history must never make an instance unreadable.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct History {
    /// Newest first. Each entry is a complete marker, which is what makes a
    /// revert possible without re-fetching a manifest the server may have
    /// already replaced.
    #[serde(default)]
    pub versions: Vec<Marker>,
}

impl History {
    /// Record `marker` as the newest retained version and prune to `keep`.
    ///
    /// Deduplicated by version id: reinstalling or relaunching the same version
    /// refreshes its entry rather than filling the whole history with one
    /// version and evicting the very rollback targets it exists to protect.
    pub fn push(&mut self, marker: &Marker, keep: usize) {
        let keep = keep.max(1);
        self.versions.retain(|v| v.version_id != marker.version_id);
        self.versions.insert(0, marker.clone());
        self.versions.truncate(keep);
    }

    pub fn find(&self, version_id: &str) -> Option<&Marker> {
        self.versions.iter().find(|v| v.version_id == version_id)
    }
}

/// Which optional files the player switched OFF, persisted per instance.
///
/// Stored as the disabled set, not the enabled one: a new optional mod added by
/// a later pack version is then enabled by default, which matches `.mrpack`
/// semantics ("optional" means opt-out, and the pack author put it there for a
/// reason). Storing the enabled set would silently drop every newly added
/// optional mod.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OptionalState {
    #[serde(default)]
    pub disabled: Vec<String>,
}

impl OptionalState {
    pub fn is_disabled(&self, path: &str) -> bool {
        let path = normalise(path);
        self.disabled.iter().any(|p| normalise(p) == path)
    }

    pub fn set(&mut self, path: &str, enabled: bool) {
        let path = normalise(path);
        self.disabled.retain(|p| normalise(p) != path);
        if !enabled {
            self.disabled.push(path);
        }
    }
}

/// What the renderer sees for one retained version.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RetainedVersion {
    pub version_id: String,
    pub version_name: String,
    pub minecraft: String,
    pub loader: Option<String>,
    pub loader_version: Option<String>,
    pub installed_at: String,
    pub file_count: usize,
    /// True for the version currently on disk — the UI must not offer to revert
    /// to what is already installed.
    pub current: bool,
    /// False when the entry predates §9 and carries no managed list; there is
    /// nothing to replay, so reverting to it would be a lie.
    pub revertible: bool,
}

/// One optional file and whether it is switched on.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OptionalFile {
    pub path: String,
    /// Basename, so the UI shows `journeymap-5.9.jar` rather than the path.
    pub name: String,
    pub size: u64,
    pub enabled: bool,
}

// ── The managed / user partition ───────────────────────────────────────────

/// Forward slashes, no leading `./`. Paths come from a JSON manifest on one
/// side and from `Path` on the other; comparing them raw makes `mods/a.jar` and
/// `mods\a.jar` two different files, and the sweep below would then delete a
/// file it had just installed.
pub fn normalise(path: &str) -> String {
    path.replace('\\', "/")
        .trim_start_matches("./")
        .trim_start_matches('/')
        .to_string()
}

/// Files the previous version owned that the new one does not.
///
/// This is the ONLY input to deletion. A file the launcher never recorded is by
/// definition the player's, and is not a candidate however much it looks like a
/// mod.
pub fn stale_files(previous: &[ManagedFile], next: &HashSet<String>) -> Vec<ManagedFile> {
    previous
        .iter()
        .filter(|f| !next.contains(&normalise(&f.path)))
        .cloned()
        .collect()
}

/// Why a stale file was or was not deleted. Returned rather than logged so the
/// tests can assert on the decision instead of on a side effect.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SweepOutcome {
    Removed,
    /// On disk but no longer the bytes we installed — the player edited that
    /// config, or replaced that jar. Left alone: deleting it is indistinguishable
    /// from deleting their own work, and there is no undo.
    Modified,
    Missing,
    /// The recorded path escapes the game directory. Impossible through
    /// `parse_manifest`, but the marker is a file on the player's disk and a
    /// hand-edited one must not turn an update into `rm -rf`.
    Rejected,
}

/// Delete the stale managed files that are still exactly as we installed them.
///
/// `hash_of` is injected so the tests can drive the three outcomes without a
/// real sha512 over real bytes; production passes `files::sha512_of`.
pub fn sweep_with<F>(
    minecraft: &Path,
    stale: &[ManagedFile],
    hash_of: F,
) -> Vec<(String, SweepOutcome)>
where
    F: Fn(&Path) -> Option<String>,
{
    let root = minecraft.to_path_buf();
    stale
        .iter()
        .map(|file| {
            let rel = normalise(&file.path);
            let Some(dest) = safe_join(&root, &rel) else {
                return (rel, SweepOutcome::Rejected);
            };
            if !dest.is_file() {
                return (rel, SweepOutcome::Missing);
            }
            match hash_of(&dest) {
                Some(actual) if actual.eq_ignore_ascii_case(&file.sha512) => {
                    if std::fs::remove_file(&dest).is_ok() {
                        prune_empty_dirs(&root, dest.parent());
                        (rel, SweepOutcome::Removed)
                    } else {
                        (rel, SweepOutcome::Modified)
                    }
                }
                _ => (rel, SweepOutcome::Modified),
            }
        })
        .collect()
}

/// Join a relative path under `root`, refusing anything that leaves it.
pub fn safe_join(root: &Path, rel: &str) -> Option<PathBuf> {
    let mut out = root.to_path_buf();
    for part in rel.split('/') {
        match part {
            "" | "." => continue,
            ".." => return None,
            _ => {
                if part.contains(':') || part.contains('\\') {
                    return None;
                }
                out.push(part);
            }
        }
    }
    (out != root).then_some(out)
}

/// Remove directories emptied by the sweep, stopping at the game directory.
/// `mods/` itself is never removed even when empty — the game and several
/// loaders expect it to exist.
fn prune_empty_dirs(root: &Path, mut dir: Option<&Path>) {
    while let Some(current) = dir {
        if current == root || !current.starts_with(root) {
            return;
        }
        if std::fs::remove_dir(current).is_err() {
            return;
        }
        dir = current.parent();
    }
}

/// Merge the marker's optional catalogue with the player's disabled set.
pub fn optional_list(catalogue: &[ManagedFile], state: &OptionalState) -> Vec<OptionalFile> {
    let mut seen: HashMap<String, ()> = HashMap::new();
    catalogue
        .iter()
        .filter(|f| seen.insert(normalise(&f.path), ()).is_none())
        .map(|f| {
            let path = normalise(&f.path);
            OptionalFile {
                name: path.rsplit('/').next().unwrap_or(&path).to_string(),
                enabled: !state.is_disabled(&path),
                size: f.size,
                path,
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn managed(path: &str, sha: &str) -> ManagedFile {
        ManagedFile {
            path: path.to_string(),
            sha512: sha.to_string(),
            size: 10,
            is_mod: path.starts_with("mods/"),
            optional: false,
            source: ManagedSource::Url {
                url: "https://x.test/f".into(),
            },
        }
    }

    // ── the partition ──────────────────────────────────────────────────────

    #[test]
    fn a_file_the_launcher_never_recorded_is_never_stale() {
        // The whole point of §9's user space: the player's minimap is not in
        // the previous managed set, so it cannot appear in the delete list
        // whatever the new version contains.
        let previous = vec![managed("mods/a.jar", "aa")];
        let next: HashSet<String> = ["mods/b.jar".to_string()].into_iter().collect();
        let stale = stale_files(&previous, &next);
        assert_eq!(stale.len(), 1);
        assert_eq!(stale[0].path, "mods/a.jar");
        assert!(
            !stale.iter().any(|f| f.path.contains("journeymap")),
            "an unmanaged jar must never reach the sweep"
        );
    }

    #[test]
    fn a_file_kept_by_the_new_version_is_not_stale() {
        let previous = vec![managed("mods/a.jar", "aa"), managed("config/a.toml", "bb")];
        let next: HashSet<String> = ["mods/a.jar".into(), "config/a.toml".into()]
            .into_iter()
            .collect();
        assert!(stale_files(&previous, &next).is_empty());
    }

    #[test]
    fn separator_style_does_not_split_a_file_in_two() {
        // A marker written on Windows and a plan read from JSON must agree, or
        // the sweep deletes the jar the install just wrote.
        let previous = vec![managed("mods\\a.jar", "aa")];
        let next: HashSet<String> = ["mods/a.jar".to_string()].into_iter().collect();
        assert!(stale_files(&previous, &next).is_empty());
    }

    #[test]
    fn the_sweep_removes_only_untouched_files() {
        let dir = std::env::temp_dir().join(format!("boff-sweep-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(dir.join("mods")).unwrap();
        std::fs::write(dir.join("mods/pristine.jar"), b"x").unwrap();
        std::fs::write(dir.join("mods/edited.jar"), b"x").unwrap();

        let stale = vec![
            managed("mods/pristine.jar", "aa"),
            managed("mods/edited.jar", "aa"),
            managed("mods/gone.jar", "aa"),
        ];
        // Only `pristine` still hashes to what the marker recorded.
        let outcomes = sweep_with(&dir, &stale, |p| {
            if p.ends_with("pristine.jar") {
                Some("aa".into())
            } else {
                Some("player-changed-this".into())
            }
        });

        let by_path: HashMap<_, _> = outcomes.into_iter().collect();
        assert_eq!(by_path["mods/pristine.jar"], SweepOutcome::Removed);
        assert_eq!(by_path["mods/edited.jar"], SweepOutcome::Modified);
        assert_eq!(by_path["mods/gone.jar"], SweepOutcome::Missing);
        assert!(!dir.join("mods/pristine.jar").exists());
        assert!(
            dir.join("mods/edited.jar").exists(),
            "a file the player changed is theirs now — deleting it has no undo"
        );
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn a_traversing_marker_entry_cannot_delete_outside_the_instance() {
        let dir = std::env::temp_dir().join(format!("boff-esc-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        let outcomes = sweep_with(
            &dir,
            &[
                managed("../../../etc/passwd", "aa"),
                managed("mods/../../out.jar", "aa"),
            ],
            |_| Some("aa".into()),
        );
        assert!(outcomes.iter().all(|(_, o)| *o == SweepOutcome::Rejected));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn safe_join_rejects_escapes_and_accepts_normal_paths() {
        let root = Path::new("/tmp/boff/.minecraft");
        assert!(safe_join(root, "mods/a.jar").unwrap().ends_with("mods/a.jar"));
        assert!(safe_join(root, "../a.jar").is_none());
        assert!(safe_join(root, "C:/windows").is_none());
        assert!(safe_join(root, "").is_none(), "the root itself is not a file");
    }

    // ── retention pruning ──────────────────────────────────────────────────

    fn marker(version: &str) -> Marker {
        Marker {
            version_id: version.to_string(),
            version_name: version.to_string(),
            minecraft: "1.21.4".into(),
            loader: None,
            loader_version: None,
            installed_at: "2026-07-30T12:00:00Z".into(),
            file_count: 1,
            pack_id: "pk".into(),
            managed: vec![managed("mods/a.jar", "aa")],
            optional_files: vec![],
            pinned: false,
        }
    }

    #[test]
    fn retention_keeps_the_newest_n_versions() {
        let mut history = History::default();
        for v in ["v1", "v2", "v3", "v4", "v5"] {
            history.push(&marker(v), DEFAULT_RETAIN);
        }
        let ids: Vec<_> = history.versions.iter().map(|v| &v.version_id).collect();
        assert_eq!(ids, vec!["v5", "v4", "v3"], "newest first, oldest evicted");
    }

    #[test]
    fn reinstalling_the_same_version_does_not_evict_the_rollback_targets() {
        // The failure this guards: launch re-verifies on EVERY run, so pushing
        // blindly would fill a 3-slot history with three copies of the current
        // version and throw away the very version the player wants back.
        let mut history = History::default();
        for v in ["v1", "v2", "v3"] {
            history.push(&marker(v), DEFAULT_RETAIN);
        }
        for _ in 0..5 {
            history.push(&marker("v3"), DEFAULT_RETAIN);
        }
        let ids: Vec<_> = history.versions.iter().map(|v| &v.version_id).collect();
        assert_eq!(ids, vec!["v3", "v2", "v1"]);
    }

    #[test]
    fn a_retain_of_zero_still_keeps_the_current_version() {
        // Otherwise a hand-edited settings.json makes every install unrevertable
        // AND drops the record of what is on disk.
        let mut history = History::default();
        history.push(&marker("v1"), 0);
        assert_eq!(history.versions.len(), 1);
    }

    #[test]
    fn history_lookup_finds_a_retained_version() {
        let mut history = History::default();
        history.push(&marker("v1"), DEFAULT_RETAIN);
        history.push(&marker("v2"), DEFAULT_RETAIN);
        assert_eq!(history.find("v1").unwrap().version_name, "v1");
        assert!(history.find("v9").is_none());
    }

    // ── compatibility with the marker the previous build wrote ─────────────

    #[test]
    fn an_old_marker_still_parses_and_owns_nothing() {
        let raw = r#"{"versionId":"v1","versionName":"1.0","minecraft":"1.21.4",
            "loader":null,"loaderVersion":null,"installedAt":"2026-07-30T12:00:00Z",
            "fileCount":42}"#;
        let old: Marker = serde_json::from_str(raw).expect("a pre-§9 marker must still load");
        assert_eq!(old.version_id, "v1");
        assert_eq!(old.file_count, 42);
        assert!(old.managed.is_empty());
        assert!(!old.pinned);
        // An empty managed set makes the sweep a no-op, which is the only safe
        // reading of "we do not know what we own".
        let next: HashSet<String> = HashSet::new();
        assert!(stale_files(&old.managed, &next).is_empty());
    }

    #[test]
    fn the_marker_wire_shape_is_camel_case() {
        let raw = serde_json::to_string(&marker("v1")).unwrap();
        for key in ["versionId", "fileCount", "packId", "optionalFiles", "pinned"] {
            assert!(raw.contains(key), "missing {key} in {raw}");
        }
        assert!(raw.contains(r#""kind":"url""#), "source must stay tagged");
    }

    #[test]
    fn a_managed_file_round_trips_through_a_plan() {
        for source in [
            ManagedSource::Url { url: "https://x.test/a".into() },
            ManagedSource::Modrinth { version_id: "mv".into() },
            ManagedSource::Curseforge { project_id: 1, file_id: 2 },
            ManagedSource::Override { sha512: "b".repeat(128) },
        ] {
            let file = ManagedFile { source: source.clone(), ..managed("mods/a.jar", "aa") };
            let back = ManagedFile::from_planned(&file.to_planned());
            assert_eq!(back.source, source, "a revert replays the recorded source");
            assert_eq!(back.path, "mods/a.jar");
        }
    }

    // ── optional toggles ───────────────────────────────────────────────────

    #[test]
    fn optional_defaults_to_enabled_and_toggles_off() {
        let catalogue = vec![
            ManagedFile { optional: true, ..managed("mods/minimap.jar", "aa") },
            ManagedFile { optional: true, ..managed("mods/shaders.jar", "bb") },
        ];
        let mut state = OptionalState::default();
        assert!(optional_list(&catalogue, &state).iter().all(|f| f.enabled));

        state.set("mods/minimap.jar", false);
        let list = optional_list(&catalogue, &state);
        assert_eq!(list[0].name, "minimap.jar");
        assert!(!list[0].enabled);
        assert!(list[1].enabled);

        // Idempotent, and re-enabling clears the entry rather than adding a
        // second one.
        state.set("mods/minimap.jar", false);
        state.set("mods/minimap.jar", true);
        assert!(state.disabled.is_empty());
    }

    #[test]
    fn a_disabled_path_matches_whatever_separator_it_was_stored_with() {
        let mut state = OptionalState::default();
        state.disabled.push("mods\\minimap.jar".into());
        assert!(state.is_disabled("mods/minimap.jar"));
    }
}
