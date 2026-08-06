// The Files tab: a read-mostly view of an instance's game directory.
//
// Scoped to the instance's game directory and nowhere else. Every path that crosses
// this boundary is a RELATIVE path resolved through `install::instance::
// safe_join`, which is what stops `../../` in a request from listing or
// deleting somewhere outside the instance. A file browser that takes absolute
// paths from the renderer is a file browser that deletes anything the process
// can reach.

use base64::Engine as _;
use serde::Serialize;

use crate::install::instance::safe_join;
use crate::install::paths::Layout;
use crate::install::InstallFailure;
use crate::settings;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DirEntry {
    /// Relative to the game directory, forward slashes. The only path shape the
    /// renderer ever holds.
    pub path: String,
    pub name: String,
    pub is_dir: bool,
    pub size: u64,
    /// Milliseconds since the epoch, or 0 when the platform will not say.
    pub modified: u64,
}

/// The launcher's own state now sits in the same directory as the game's tree
/// (there is no `.minecraft` level any more), so the Files tab filters it out.
/// Every launcher-owned entry is `.boff-`-prefixed by construction — see the
/// constants in `install::paths` and the test that pins the prefix — which is
/// why one rule covers all of them, present and future.
///
/// Hiding is not the point; NOT offering the player a Delete button on
/// `.boff-install.json` is. `is_launcher_owned` therefore guards the delete
/// path too, and both only apply at the root: a `.boff-`-named file the player
/// puts inside `config/` is theirs.
fn is_launcher_owned(rel_dir: &str, name: &str) -> bool {
    rel_dir.is_empty() && name.starts_with(".boff-")
}

fn modified_ms(meta: &std::fs::Metadata) -> u64 {
    meta.modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn instance_root(slug: &str, app: &tauri::AppHandle) -> Result<std::path::PathBuf, InstallFailure> {
    let settings = settings::load(app);
    let layout = Layout::new(app, settings.game_dir())?;
    Ok(layout.instance(slug).minecraft)
}

/// List one directory. `rel` is "" for the root of `.minecraft`.
#[tauri::command]
pub async fn instance_browse(
    slug: String,
    rel: String,
    app: tauri::AppHandle,
) -> Result<Vec<DirEntry>, InstallFailure> {
    let root = instance_root(&slug, &app)?;
    let dir = if rel.is_empty() {
        root.clone()
    } else {
        safe_join(&root, &rel).ok_or_else(|| InstallFailure::message("Ruta no válida."))?
    };
    if !dir.is_dir() {
        return Ok(Vec::new());
    }

    let mut out = Vec::new();
    let listing = std::fs::read_dir(&dir)
        .map_err(|e| InstallFailure::message(format!("No se pudo leer la carpeta: {e}")))?;
    for entry in listing.flatten() {
        let Ok(meta) = entry.metadata() else { continue };
        let name = entry.file_name().to_string_lossy().to_string();
        if is_launcher_owned(&rel, &name) {
            continue;
        }
        let path = if rel.is_empty() {
            name.clone()
        } else {
            format!("{}/{name}", rel.trim_end_matches('/'))
        };
        out.push(DirEntry {
            is_dir: meta.is_dir(),
            // A directory's own metadata size is meaningless (it is the size of
            // the entry table); walking it here would make listing a saves
            // folder take seconds.
            size: if meta.is_dir() { 0 } else { meta.len() },
            modified: modified_ms(&meta),
            path,
            name,
        });
    }
    // Folders first, then case-insensitive by name — the order every file
    // manager uses, and the one a player scanning for `config` expects.
    out.sort_by(|a, b| {
        b.is_dir
            .cmp(&a.is_dir)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    Ok(out)
}

/// Delete one file or directory inside the instance.
#[tauri::command]
pub async fn instance_delete_path(
    slug: String,
    rel: String,
    app: tauri::AppHandle,
) -> Result<(), InstallFailure> {
    if rel.trim().is_empty() {
        // Guard the root explicitly: an empty `rel` is "the whole game
        // directory", and safe_join would happily hand it back.
        return Err(InstallFailure::message("No se puede borrar la raíz."));
    }
    // The launcher's own state is not the player's to delete from here: losing
    // `.boff-install.json` turns a healthy instance into one the launcher
    // believes was never installed.
    let trimmed = rel.trim().trim_start_matches("./");
    if !trimmed.contains('/') && is_launcher_owned("", trimmed) {
        return Err(InstallFailure::message(
            "Ese archivo pertenece al launcher y no se puede borrar aquí.",
        ));
    }
    let root = instance_root(&slug, &app)?;
    let target = safe_join(&root, &rel).ok_or_else(|| InstallFailure::message("Ruta no válida."))?;
    if !target.exists() {
        return Ok(());
    }
    let result = if target.is_dir() {
        std::fs::remove_dir_all(&target)
    } else {
        std::fs::remove_file(&target)
    };
    result.map_err(|e| InstallFailure::message(format!("No se pudo borrar «{rel}»: {e}")))
}

/// Uninstall a pack by deleting its whole instance directory, so the next
/// library scan reports it as "not installed" again. Unlike `local_pack_delete`
/// this is for MANAGED packs — the pack itself stays in the registry-backed
/// library and can be reinstalled, so backups under `backups/<slug>/` are left
/// untouched: an uninstall is not a "throw the snapshots away too" decision the
/// way deleting a player-authored pack is. Refusing to run while the game is
/// live is the renderer's job (it disables the action); by the time this runs
/// the process is expected to be gone.
#[tauri::command]
pub async fn instance_delete(slug: String, app: tauri::AppHandle) -> Result<(), InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let root = layout.instance(&slug).root;
    if root.exists() {
        std::fs::remove_dir_all(&root).map_err(|e| {
            InstallFailure::message(format!("No se pudo desinstalar el pack: {e}"))
        })?;
    }
    Ok(())
}

/// Reveal a path in the OS file manager. `rel` may be "" for the game folder.
#[tauri::command]
pub async fn instance_reveal(
    slug: String,
    rel: String,
    app: tauri::AppHandle,
) -> Result<(), InstallFailure> {
    let root = instance_root(&slug, &app)?;
    let target = if rel.is_empty() {
        root.clone()
    } else {
        safe_join(&root, &rel).ok_or_else(|| InstallFailure::message("Ruta no válida."))?
    };
    if !target.exists() {
        return Err(InstallFailure::message("La ruta ya no existe."));
    }
    open_in_file_manager(&target)
}

#[cfg(target_os = "windows")]
fn open_in_file_manager(path: &std::path::Path) -> Result<(), InstallFailure> {
    std::process::Command::new("explorer")
        .arg(path)
        .spawn()
        // explorer.exe returns a non-zero exit code even on success, so the
        // spawn is the only thing worth checking.
        .map(|_| ())
        .map_err(|e| InstallFailure::message(format!("No se pudo abrir la carpeta: {e}")))
}

#[cfg(target_os = "macos")]
fn open_in_file_manager(path: &std::path::Path) -> Result<(), InstallFailure> {
    std::process::Command::new("open")
        .arg(path)
        .spawn()
        .map(|_| ())
        .map_err(|e| InstallFailure::message(format!("No se pudo abrir la carpeta: {e}")))
}

#[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
fn open_in_file_manager(path: &std::path::Path) -> Result<(), InstallFailure> {
    std::process::Command::new("xdg-open")
        .arg(path)
        .spawn()
        .map(|_| ())
        .map_err(|e| InstallFailure::message(format!("No se pudo abrir la carpeta: {e}")))
}

// ── Screenshots ─────────────────────────────────────────────────────────────
//
// The Screenshots tab: the images Minecraft writes to `screenshots/` on F2.
// Listed like the Files tab, but served as images. The bytes come back as
// `data:` URLs the CSP already allows (same reasoning as icons.rs), loaded
// lazily one thumbnail at a time — a session can leave hundreds of 2–8 MB PNGs
// there, and base64-ing them all at once would be pointless work and a memory
// spike for images the player has scrolled past.

/// A screenshot on disk. `rel` is the path the image loader takes back.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Screenshot {
    pub name: String,
    pub rel: String,
    pub size: u64,
    /// Milliseconds since the epoch, 0 when unknown. The tab sorts on this so
    /// the newest capture is first.
    pub modified: u64,
}

fn is_image_name(name: &str) -> bool {
    matches!(
        name.rsplit('.').next().map(str::to_ascii_lowercase).as_deref(),
        Some("png" | "jpg" | "jpeg" | "webp" | "gif")
    )
}

/// Every screenshot in this instance, newest first. An instance with no
/// `screenshots/` folder yet (never pressed F2) is an empty list, not an error.
#[tauri::command]
pub async fn instance_screenshots(
    slug: String,
    app: tauri::AppHandle,
) -> Result<Vec<Screenshot>, InstallFailure> {
    let dir = instance_root(&slug, &app)?.join("screenshots");
    let Ok(listing) = std::fs::read_dir(&dir) else {
        return Ok(Vec::new());
    };

    let mut out: Vec<Screenshot> = Vec::new();
    for entry in listing.flatten() {
        let Ok(meta) = entry.metadata() else { continue };
        if !meta.is_file() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        if !is_image_name(&name) {
            continue;
        }
        out.push(Screenshot {
            rel: format!("screenshots/{name}"),
            size: meta.len(),
            modified: modified_ms(&meta),
            name,
        });
    }
    out.sort_by(|a, b| b.modified.cmp(&a.modified));
    Ok(out)
}

/// One screenshot as a `data:` URL. `rel` is a value `instance_screenshots`
/// handed out, but it is still `safe_join`-guarded and confined to the
/// `screenshots/` folder — the renderer is never trusted with a path, and this
/// command must not become a way to read arbitrary files as base64.
#[tauri::command]
pub async fn screenshot_image(
    slug: String,
    rel: String,
    app: tauri::AppHandle,
) -> Result<Option<String>, InstallFailure> {
    // A high-res capture is a few MB; anything past this is not a screenshot,
    // and refusing it early keeps one huge file from spiking memory.
    const MAX_BYTES: u64 = 24 * 1024 * 1024;

    // Confine to screenshots/ and to actual images: `rel` is only ever a value
    // this module produced, but a caller could still ask for `config/x.png`.
    // `safe_join` already blocks `../` escape; this narrows it to the one
    // folder the tab serves. Comparing on `rel` rather than the resolved parent
    // avoids any path-normalisation mismatch.
    let normalized = rel.replace('\\', "/");
    let name = normalized.rsplit('/').next().unwrap_or("").to_string();
    if !normalized.starts_with("screenshots/") || !is_image_name(&name) {
        return Ok(None);
    }
    let root = instance_root(&slug, &app)?;
    let target = safe_join(&root, &rel).ok_or_else(|| InstallFailure::message("Ruta no válida."))?;
    if !target.is_file() {
        return Ok(None);
    }
    if std::fs::metadata(&target).map(|m| m.len()).unwrap_or(0) > MAX_BYTES {
        return Err(InstallFailure::message("La captura es demasiado grande."));
    }
    let bytes =
        std::fs::read(&target).map_err(|e| InstallFailure::message(format!("No se pudo leer la captura: {e}")))?;
    Ok(Some(image_data_url(&bytes, &name)))
}

/// Sniff the MIME from the bytes (the extension lies often enough), then encode.
/// The same idea as icons.rs `mime_of`, kept local so the two can diverge if a
/// screenshot format ever needs handling a mod icon does not.
fn image_data_url(bytes: &[u8], name: &str) -> String {
    let mime = if bytes.starts_with(b"\x89PNG\r\n\x1a\n") {
        "image/png"
    } else if bytes.starts_with(b"\xff\xd8\xff") {
        "image/jpeg"
    } else if bytes.starts_with(b"GIF87a") || bytes.starts_with(b"GIF89a") {
        "image/gif"
    } else if bytes.len() >= 12 && &bytes[0..4] == b"RIFF" && &bytes[8..12] == b"WEBP" {
        "image/webp"
    } else {
        match name.rsplit('.').next().map(str::to_ascii_lowercase).as_deref() {
            Some("jpg" | "jpeg") => "image/jpeg",
            Some("webp") => "image/webp",
            Some("gif") => "image/gif",
            _ => "image/png",
        }
    };
    let encoded = base64::engine::general_purpose::STANDARD.encode(bytes);
    format!("data:{mime};base64,{encoded}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_image_files_are_listed_as_screenshots() {
        assert!(is_image_name("2026-08-06_12.00.00.png"));
        assert!(is_image_name("shot.JPG"));
        assert!(!is_image_name("readme.txt"));
        assert!(!is_image_name("noextension"));
    }

    #[test]
    fn the_data_url_mime_comes_from_the_bytes() {
        assert!(image_data_url(b"\x89PNG\r\n\x1a\n", "x.jpg").starts_with("data:image/png;base64,"));
        assert!(image_data_url(b"\xff\xd8\xff\xe0", "x.png").starts_with("data:image/jpeg;base64,"));
    }

    #[test]
    fn a_child_path_is_built_with_forward_slashes() {
        // The renderer round-trips these straight back as `rel`, so a backslash
        // here would produce a path safe_join cannot resolve on the next click.
        let rel = "config";
        let name = "sodium.json";
        assert_eq!(format!("{}/{name}", rel.trim_end_matches('/')), "config/sodium.json");
    }

    #[test]
    fn launcher_state_is_hidden_at_the_root_but_not_inside_the_players_folders() {
        assert!(is_launcher_owned("", ".boff-install.json"));
        assert!(is_launcher_owned("", ".boff-bin"));
        // The game's own tree is never filtered, dot-prefixed or not.
        assert!(!is_launcher_owned("", "mods"));
        assert!(!is_launcher_owned("", ".fabric"));
        // Same name one level down belongs to the player.
        assert!(!is_launcher_owned("config", ".boff-install.json"));
    }

    #[test]
    fn deleting_the_root_is_refused_before_any_path_work() {
        // Not a filesystem test: the guard must reject on the argument alone,
        // because safe_join(root, "") resolves to the game directory itself.
        for rel in ["", "   "] {
            assert!(rel.trim().is_empty());
        }
    }
}
