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
//     instances/<slug>/
//       .minecraft/          the game's working directory
//         mods/  config/     where the manifest's files land
//       bin/                 extracted natives (legacy versions)
//       .boff-install.json   what this machine believes is installed
//     shared/
//       versions/ libraries/ assets/ jvm/
//       cache/               content-addressed blobs, keyed by sha512

use std::path::{Path, PathBuf};

use portablemc::base;
use tauri::Manager;

use super::InstallFailure;

/// Marker written after a successful install. `instance_scan` reads only this —
/// walking the tree to guess a version is how launchers end up reinstalling a
/// pack that was already fine.
pub const MARKER: &str = ".boff-install.json";

#[derive(Debug, Clone)]
pub struct Layout {
    root: PathBuf,
}

/// Everything about one installed pack.
#[derive(Debug, Clone)]
pub struct InstancePaths {
    pub root: PathBuf,
    /// The game's working directory. NOTE: `mods/` and `config/` live INSIDE
    /// this, not beside it — the game only ever looks for them relative to its
    /// own game directory, so a sibling `instances/<slug>/mods` would install
    /// correctly and then load nothing.
    pub minecraft: PathBuf,
    pub mods: PathBuf,
    pub config: PathBuf,
    pub bin: PathBuf,
    pub marker: PathBuf,
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
        let root = app.path().app_data_dir().map_err(|e| {
            InstallFailure::message(format!("No se pudo localizar la carpeta de datos: {e}"))
        })?;
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

    pub fn instance(&self, slug: &str) -> InstancePaths {
        let root = self.instances_dir().join(sanitize_slug(slug));
        let minecraft = root.join(".minecraft");
        InstancePaths {
            mods: minecraft.join("mods"),
            config: minecraft.join("config"),
            bin: root.join("bin"),
            marker: root.join(MARKER),
            minecraft,
            root,
        }
    }

    /// Create the directories an install writes into. Called once, before
    /// anything downloads, so a permissions problem surfaces as "cannot create
    /// the folder" rather than as a failed download 200 files in.
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
}
