// The on-disk layout, and the ONLY place portablemc's `set_*_dir` calls are
// made. Every other module asks this one where something lives; a second
// opinion about where `libraries/` is would mean re-downloading 400MB the first
// time the two disagreed.
//
// HANDOFF §9 ("delta updates", "locked vs. user space") is the reason the
// per-instance and the shared trees are separate: instances are cheap and
// disposable, `shared/` is the expensive part and is never keyed on a pack.
//
//   <app-data>/
//     instances/<slug>/      the game's working directory ITSELF
//       mods/  config/       where the manifest's files land
//       saves/ options.txt   whatever the game writes
//       .boff-bin/           extracted natives (legacy versions)
//       .boff-install.json   what this machine believes is installed
//     shared/
//
// There is deliberately no `.minecraft` level: it buys nothing (the launcher
// state beside it is all dot-prefixed and hidden from the Files tab) and costs
// the player one confusing directory on every "open pack folder". Instances
// created by an earlier build are flattened by `datadir::migrate`.
//       versions/ libraries/ assets/ jvm/
//       cache/               content-addressed blobs, keyed by sha512

use std::path::{Path, PathBuf};

use portablemc::base;

use super::InstallFailure;

/// Marker written after a successful install. `instance_scan` reads only this —
/// walking the tree to guess a version is how launchers end up reinstalling a
/// pack that was already fine.
pub const MARKER: &str = ".boff-install.json";

/// §9 "pack version pinning + rollback" — the last N installed markers, newest
/// first. Beside the marker rather than inside it: this is read only when the
/// player opens the rollback list, and a corrupt history must never make an
/// otherwise healthy instance unreadable.
pub const HISTORY: &str = ".boff-history.json";

/// §9 optional-mod toggles — which optional files the player switched OFF.
/// Survives updates and reinstalls precisely because it is NOT in the marker,
/// which every install overwrites.
pub const OPTIONAL: &str = ".boff-optional.json";

/// §9 "per-instance Java runtime + memory" — this pack's Java path and heap
/// choice. Beside the marker, not inside it and not in the global settings: an
/// install overwrites the marker, and a global blob cannot hold a per-pack
/// answer. Absent on every instance installed before this build, which
/// `RuntimeOverride::default()` reads as "inherit the global setting".
pub const RUNTIME: &str = ".boff-runtime.json";

/// Emu-M3 — the last-good manifest fetched for this pack. Written on a
/// successful install/launch so an already-installed emulator pack can be
/// relaunched offline: the network fetch is skipped in favour of this copy,
/// from which the launch (and any randomizer gate) is rebuilt exactly as a
/// fresh manifest would be. User-independent managed state; overwritten on
/// every successful fetch.
pub const MANIFEST: &str = ".boff-manifest.json";

/// Extracted natives. Dot-prefixed since it now shares a directory with the
/// game's own tree — a plain `bin/` would sit among `mods/` and `saves/` and
/// read as something the player put there.
pub const BIN: &str = ".boff-bin";

#[derive(Debug, Clone)]
pub struct Layout {
    root: PathBuf,
}

/// Everything about one installed pack.
#[derive(Debug, Clone)]
pub struct InstancePaths {
    pub root: PathBuf,
    /// The game's working directory — now the same path as `root`. Kept as its
    /// own field because every caller that means "the directory the game runs
    /// in" reads this one, and that intent should survive the day a future
    /// layout separates them again.
    pub minecraft: PathBuf,
    pub mods: PathBuf,
    pub config: PathBuf,
    pub bin: PathBuf,
    pub marker: PathBuf,
    /// §9 — retained version markers. Never deleted by `repair_instance`: a
    /// repair rebuilds what is on disk, it does not throw away the rollback
    /// targets that are the reason the player is repairing at all.
    pub history: PathBuf,
    /// §9 — the player's optional-mod choices. Deliberately outside everything
    /// an install or a repair rewrites; it is user state, not managed state.
    pub optional: PathBuf,
    /// §9 — the per-pack Java/memory override. User state like `optional`, so
    /// an install, an update and a repair all leave it alone.
    pub runtime: PathBuf,
    /// Emu-M3 — the cached last-good manifest, read back to launch offline.
    pub manifest: PathBuf,
}

impl Layout {
    /// Rooted at the OS app-data dir, unless `gameDir` in the settings points
    /// somewhere else (§9 — people put instances on the drive with space on it).
    pub fn new(app: &tauri::AppHandle, game_dir: Option<&str>) -> Result<Self, InstallFailure> {
        if let Some(dir) = game_dir.map(str::trim).filter(|d| !d.is_empty()) {
            return Ok(Self {
                root: PathBuf::from(dir),
            });
        }
        let root = crate::datadir::data_root(app).map_err(InstallFailure::message)?;
        Ok(Self { root })
    }

    #[cfg(test)]
    pub fn for_tests(root: PathBuf) -> Self {
        Self { root }
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    pub fn instances_dir(&self) -> PathBuf {
        self.root.join("instances")
    }

    pub fn shared_dir(&self) -> PathBuf {
        self.root.join("shared")
    }

    /// The content-addressed blob store (§9 delta updates): a file already here
    /// is never fetched again, whatever pack or version asks for it.
    pub fn cache_dir(&self) -> PathBuf {
        self.shared_dir().join("cache")
    }

    /// Blobs that exist ONLY on this machine, keyed by sha512 exactly like the
    /// cache above.
    ///
    /// An imported third-party `.mrpack` carries its `overrides/` (configs,
    /// resource packs, scripts) as bytes inside the zip. Those become
    /// `source: override` entries in the manifest, and an `override` normally
    /// means "stream it from the Boffmedia API" (§7.2) — which for a pack the
    /// player imported off Modrinth would 404, because we never hosted it.
    ///
    /// Separate from `cache_dir()` on purpose: the cache is disposable by
    /// definition (anything in it can be re-fetched) and a future cache purge
    /// must not be able to destroy the only copy of a file that has no origin
    /// to re-fetch from.
    pub fn local_blobs_dir(&self) -> PathBuf {
        self.root.join("local-blobs")
    }

    pub fn instance(&self, slug: &str) -> InstancePaths {
        let root = self.instances_dir().join(sanitize_slug(slug));
        // The instance directory IS the game directory (see the header): no
        // `.minecraft` level, so `mods/` and `config/` are direct children.
        let minecraft = root.clone();
        InstancePaths {
            mods: minecraft.join("mods"),
            config: minecraft.join("config"),
            bin: root.join(BIN),
            marker: root.join(MARKER),
            history: root.join(HISTORY),
            optional: root.join(OPTIONAL),
            runtime: root.join(RUNTIME),
            manifest: root.join(MANIFEST),
            minecraft,
            root,
        }
    }

    /// Create the directories a MINECRAFT install writes into. Called once,
    /// before anything downloads, so a permissions problem surfaces as "cannot
    /// create the folder" rather than as a failed download 200 files in.
    pub fn prepare(&self, instance: &InstancePaths) -> Result<(), InstallFailure> {
        for dir in [
            &self.cache_dir(),
            &self.shared_dir().join("versions"),
            &self.shared_dir().join("libraries"),
            &self.shared_dir().join("assets"),
            &self.shared_dir().join("jvm"),
            &instance.minecraft,
            &instance.mods,
            &instance.config,
            &instance.bin,
        ] {
            std::fs::create_dir_all(dir).map_err(|e| {
                InstallFailure::message(format!("No se pudo crear {}: {e}", dir.display()))
            })?;
        }
        Ok(())
    }

    /// The EMULATOR variant of `prepare`: per-game folder standards mean an
    /// emulator instance never grows `mods/`, `config/`, `bin/` or the shared
    /// JVM tree — only the cache, its own root, and its save/state dirs. The
    /// pack payload (`roms/…`) creates its parents on placement.
    pub fn prepare_emulator(&self, instance: &InstancePaths) -> Result<(), InstallFailure> {
        for dir in [
            &self.cache_dir(),
            &instance.root,
            &instance.root.join("saves"),
            &instance.root.join("states"),
        ] {
            std::fs::create_dir_all(dir).map_err(|e| {
                InstallFailure::message(format!("No se pudo crear {}: {e}", dir.display()))
            })?;
        }
        Ok(())
    }

    /// Point a portablemc installer at this layout. Every installer variant
    /// (vanilla, Fabric, Forge) reaches its `base::Installer` and lands here,
    /// which is what keeps `shared/` genuinely shared.
    pub fn apply(&self, base: &mut base::Installer, instance: &InstancePaths) {
        let shared = self.shared_dir();
        base.set_versions_dir(shared.join("versions"))
            .set_libraries_dir(shared.join("libraries"))
            .set_assets_dir(shared.join("assets"))
            .set_jvm_dir(shared.join("jvm"))
            .set_bin_dir(&instance.bin)
            .set_mc_dir(&instance.minecraft);
    }
}

/// The slug is server-supplied and becomes a directory name, so it is filtered
/// rather than trusted. `pack.slug` is already kebab-case by schema, but this
/// is the last point before a path is built and a bad one is a path traversal.
pub fn sanitize_slug(slug: &str) -> String {
    let cleaned: String = slug
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '-' || c == '_' {
                c.to_ascii_lowercase()
            } else {
                '-'
            }
        })
        .collect();
    let trimmed = cleaned.trim_matches('-').to_string();
    if trimmed.is_empty() {
        "pack".to_string()
    } else {
        trimmed
    }
}

/// Total bytes under a directory. Used only for the size the UI shows; a
/// failure to read a subdirectory is reported as the bytes counted so far
/// rather than as an error, since "we cannot tell you the size" must not read
/// as "this pack is broken".
pub fn dir_size(dir: &Path) -> u64 {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return 0;
    };
    entries
        .flatten()
        .map(|entry| match entry.file_type() {
            Ok(t) if t.is_dir() => dir_size(&entry.path()),
            Ok(t) if t.is_file() => entry.metadata().map(|m| m.len()).unwrap_or(0),
            _ => 0,
        })
        .sum()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn slugs_cannot_escape_the_instances_dir() {
        assert_eq!(sanitize_slug("../../etc"), "etc");
        assert_eq!(sanitize_slug("boff/smp"), "boff-smp");
        assert_eq!(sanitize_slug(""), "pack");
        assert_eq!(sanitize_slug("Boff SMP"), "boff-smp");
    }

    #[test]
    fn mods_live_inside_the_game_directory() {
        let layout = Layout::for_tests(PathBuf::from("/tmp/boff"));
        let instance = layout.instance("boff-smp");
        assert!(instance.mods.starts_with(&instance.minecraft));
        assert!(instance.config.starts_with(&instance.minecraft));
    }

    #[test]
    fn the_instance_directory_is_the_game_directory() {
        let layout = Layout::for_tests(PathBuf::from("/tmp/boff"));
        let instance = layout.instance("boff-smp");
        assert_eq!(instance.minecraft, instance.root);
        assert_eq!(instance.mods, instance.root.join("mods"));
        // Every launcher-owned entry is dot-prefixed, which is what lets the
        // Files tab hide the lot with one rule.
        for path in [&instance.marker, &instance.history, &instance.optional, &instance.runtime, &instance.manifest, &instance.bin] {
            let name = path.file_name().unwrap().to_string_lossy().to_string();
            assert!(name.starts_with(".boff-"), "{name} must be hidden");
        }
    }
}
