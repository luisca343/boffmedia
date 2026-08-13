// Where the launcher keeps everything, and the one-shot migration into it.
//
// Tauri's `app_data_dir()` is derived from the bundle identifier, so on Windows
// it lands on `%APPDATA%\es.boffmedia.app` (and `…app.dev` for the dev profile)
// — a reverse-DNS string is a macOS convention that Windows users read as junk
// in their Roaming folder. This module is the ONLY place that decides the root,
// and it uses a human name instead:
//
//   %APPDATA%\Boffmedia               release
//   %APPDATA%\Boffmedia Dev           dev profile (identifier ends in `.dev`)
//
// Dev and release stay separate on purpose: testing must never touch the
// instances a player actually plays.
//
// `data_dir()` rather than `app_data_dir()` is what makes this possible — it is
// the raw per-user data root (Roaming on Windows, ~/.local/share on Linux,
// ~/Library/Application Support on macOS) with no identifier appended.

use std::path::{Path, PathBuf};

use tauri::Manager;

/// The folder name under the OS data dir. Derived from the identifier so the
/// dev profile picks its own suffix up automatically — there is no second
/// constant to keep in sync with `tauri.dev.conf.json`.
fn folder_name(app: &tauri::AppHandle) -> &'static str {
    if app.config().identifier.ends_with(".dev") {
        "Boffmedia Dev"
    } else {
        "Boffmedia"
    }
}

/// The folder this app used before the "Boff Launcher" → "Boffmedia App"
/// rename. Kept ONLY so `migrate` can move an existing tree across; nothing
/// else may read it. Every instance, world, mod cache and pack a player already
/// has lives under this name.
fn legacy_folder_name(app: &tauri::AppHandle) -> &'static str {
    if app.config().identifier.ends_with(".dev") {
        "BoffLauncher Dev"
    } else {
        "BoffLauncher"
    }
}

/// The bundle identifier from before the rename. `app_data_dir()` resolves the
/// CURRENT one, so the oldest layout — a raw identifier folder, from before
/// this module existed — is unreachable without naming it.
fn legacy_identifier(app: &tauri::AppHandle) -> &'static str {
    if app.config().identifier.ends_with(".dev") {
        "es.boffmedia.launcher.dev"
    } else {
        "es.boffmedia.launcher"
    }
}

/// The launcher's data root. Every other module asks this one — a second
/// opinion about where `instances/` lives is how a migration ends up with two
/// half-populated trees.
pub fn data_root(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let base = app
        .path()
        .data_dir()
        .map_err(|e| format!("No se pudo localizar la carpeta de datos: {e}"))?;
    Ok(base.join(folder_name(app)))
}

/// Marker written once the tree is known to be in the current shape, so the
/// per-instance walk below happens on one startup rather than on every one.
const LAYOUT_MARKER: &str = ".boff-layout";
/// Bump when a future change needs another pass over existing instances.
const LAYOUT_VERSION: &str = "2";

/// Migrate an install made by an earlier build (§ "auto-migrate on first
/// launch"). Two independent steps, each a no-op when it has already happened:
///
///  1. `%APPDATA%\<old identifier>` or `%APPDATA%\BoffLauncher[ Dev]`
///     → `%APPDATA%\Boffmedia[ Dev]`
///  2. `instances/<slug>/.minecraft/*` → `instances/<slug>/`, and
///     `instances/<slug>/bin` → `instances/<slug>/.boff-bin`
///
/// Best-effort by design: a failure here must never stop the launcher from
/// starting, so every problem is logged and the rest of the work continues. The
/// worst case is an instance the player reinstalls, not a launcher that will
/// not open.
pub fn migrate(app: &tauri::AppHandle) {
    let Ok(root) = data_root(app) else {
        return;
    };

    // Step 1 — the whole tree, before anything looks inside it.
    //
    // TWO possible legacy roots, tried oldest-name-last:
    //
    //   %APPDATA%\es.boffmedia.launcher   the raw identifier folder, from
    //                                     before this module existed
    //   %APPDATA%\BoffLauncher            the human name this app used before
    //                                     it was renamed to Boffmedia App
    //
    // `app_data_dir()` now resolves the NEW identifier (`es.boffmedia.app`), so
    // it can no longer find the old identifier folder on its own — hence the
    // explicit list. First hit wins; a player who never had either just starts
    // clean. Only ever a RENAME of a whole tree: it is instant even for a 40 GB
    // instances/ folder, and it is on the same volume by construction.
    if !root.exists() {
        let legacy_roots = [
            app.path().app_data_dir().ok(),
            app.path()
                .data_dir()
                .ok()
                .map(|base| base.join(legacy_identifier(app))),
            app.path()
                .data_dir()
                .ok()
                .map(|base| base.join(legacy_folder_name(app))),
        ];
        for legacy in legacy_roots.into_iter().flatten() {
            if !legacy.exists() || legacy == root {
                continue;
            }
            if let Some(parent) = root.parent() {
                let _ = std::fs::create_dir_all(parent);
            }
            match std::fs::rename(&legacy, &root) {
                Ok(()) => {
                    eprintln!(
                        "[datadir] migrated {} -> {}",
                        legacy.display(),
                        root.display()
                    );
                    break;
                }
                Err(e) => eprintln!("[datadir] could not move {}: {e}", legacy.display()),
            }
        }
    }

    // Step 1b — settings used to be written to Tauri's `app_config_dir()`.
    // On Windows that IS the identifier folder, so step 1 already carried them
    // along; on Linux and macOS it is somewhere else entirely and they have to
    // be fetched. Copy, not move: leaving the originals in place means an older
    // build installed side by side still finds its own settings.
    if let Ok(legacy_config) = app.path().app_config_dir() {
        if legacy_config != root {
            for name in ["settings.json", "plays.json"] {
                let from = legacy_config.join(name);
                let to = root.join(name);
                if from.is_file() && !to.exists() {
                    let _ = std::fs::create_dir_all(&root);
                    if let Err(e) = std::fs::copy(&from, &to) {
                        eprintln!("[datadir] could not carry over {name}: {e}");
                    }
                }
            }
        }
    }

    // Step 2 — the per-instance shape. Skipped once the marker says this tree
    // has already been through it.
    let marker = root.join(LAYOUT_MARKER);
    if std::fs::read_to_string(&marker).is_ok_and(|v| v.trim() == LAYOUT_VERSION) {
        return;
    }
    let instances = root.join("instances");
    if let Ok(entries) = std::fs::read_dir(&instances) {
        for entry in entries.flatten() {
            let dir = entry.path();
            if dir.is_dir() {
                flatten_instance(&dir);
            }
        }
    }
    if root.is_dir() {
        let _ = std::fs::write(&marker, LAYOUT_VERSION);
    }
}

/// `<instance>/.minecraft/` is gone: the instance directory IS the game
/// directory. Moves the game tree up a level and renames `bin/` out of the way,
/// since it now shares a directory with whatever the game writes.
fn flatten_instance(dir: &Path) {
    let legacy_game = dir.join(".minecraft");
    if legacy_game.is_dir() {
        match std::fs::read_dir(&legacy_game) {
            Ok(children) => {
                for child in children.flatten() {
                    let target = dir.join(child.file_name());
                    // A name already taken in the instance root is left alone
                    // rather than overwritten — the metadata files there are
                    // the launcher's own state, and clobbering one is worse
                    // than leaving a stray copy behind in `.minecraft`.
                    if target.exists() {
                        eprintln!("[datadir] skipping {}: already present", target.display());
                        continue;
                    }
                    if let Err(e) = std::fs::rename(child.path(), &target) {
                        eprintln!("[datadir] could not move {}: {e}", child.path().display());
                    }
                }
            }
            Err(e) => eprintln!("[datadir] could not read {}: {e}", legacy_game.display()),
        }
        // Only removed when empty: anything left is a name that collided above,
        // and deleting it would lose the player's data.
        let _ = std::fs::remove_dir(&legacy_game);
    }

    // Done AFTER the move: a legacy `.minecraft/bin` would otherwise collide
    // with the instance-level `bin/` that is about to be renamed.
    let legacy_bin = dir.join("bin");
    let bin = dir.join(super::install::paths::BIN);
    if legacy_bin.is_dir() && !bin.exists() {
        if let Err(e) = std::fs::rename(&legacy_bin, &bin) {
            eprintln!("[datadir] could not rename {}: {e}", legacy_bin.display());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn flatten_moves_the_game_tree_up_and_renames_bin() {
        let dir = std::env::temp_dir().join(format!("boff-flatten-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(dir.join(".minecraft/mods")).unwrap();
        std::fs::create_dir_all(dir.join(".minecraft/saves/world")).unwrap();
        std::fs::create_dir_all(dir.join("bin")).unwrap();
        std::fs::write(dir.join(".minecraft/options.txt"), "fov:90").unwrap();
        std::fs::write(dir.join(".boff-install.json"), "{}").unwrap();

        flatten_instance(&dir);

        assert!(dir.join("mods").is_dir());
        assert!(dir.join("saves/world").is_dir());
        assert_eq!(
            std::fs::read_to_string(dir.join("options.txt")).unwrap(),
            "fov:90"
        );
        assert!(!dir.join(".minecraft").exists());
        assert!(dir.join(".boff-bin").is_dir());
        assert!(!dir.join("bin").exists());
        // The launcher's own state is untouched by the move.
        assert!(dir.join(".boff-install.json").is_file());

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn flatten_is_idempotent_and_never_clobbers_an_existing_name() {
        let dir = std::env::temp_dir().join(format!("boff-flatten-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(dir.join(".minecraft")).unwrap();
        std::fs::write(dir.join(".minecraft/options.txt"), "old").unwrap();
        std::fs::write(dir.join("options.txt"), "new").unwrap();

        flatten_instance(&dir);
        // The collision is kept, not overwritten, and `.minecraft` survives
        // precisely because it is not empty.
        assert_eq!(std::fs::read_to_string(dir.join("options.txt")).unwrap(), "new");
        assert!(dir.join(".minecraft/options.txt").is_file());

        // A second pass changes nothing.
        flatten_instance(&dir);
        assert_eq!(std::fs::read_to_string(dir.join("options.txt")).unwrap(), "new");

        let _ = std::fs::remove_dir_all(&dir);
    }
}
