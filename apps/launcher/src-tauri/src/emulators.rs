// Resolving the PLAYER'S OWN emulator install. A pack never ships an emulator
// (schema: EmulatorSpec has no executable) — using the copy the player already
// has means their controller mappings, shaders and per-game config all apply,
// and the launcher never writes into an install it does not own.
//
// Resolution order, same policy as java_path (§6.3): an explicit setting wins
// verbatim; otherwise detect. EmuDeck is the first detection stop because it is
// the layout we recommend to the community: on Windows it installs emulators
// under %APPDATA%\EmuDeck\Emulators\<Name>\ and keeps the content tree at
// <drive>:\Emulation\{roms,bios,saves}.

use std::path::{Path, PathBuf};

use serde::Serialize;

use crate::install::resolve::EmulatorKind;
use crate::install::InstallFailure;
use crate::settings::Settings;

/// Where a resolved emulator path came from — shown in the UI so "it launched
/// the wrong mGBA" is diagnosable at a glance.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum EmulatorSource {
    /// The player set the path in Ajustes; used verbatim.
    Override,
    /// Found in EmuDeck's conventional install dir.
    Emudeck,
    /// Found in a common system install location.
    System,
    /// Found on PATH.
    Path,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EmulatorStatus {
    pub kind: String,
    /// Null when nothing was found — the UI offers "locate it" / EmuDeck.
    pub path: Option<String>,
    pub source: Option<EmulatorSource>,
}

pub fn kind_from_key(key: &str) -> Option<EmulatorKind> {
    Some(match key {
        "mgba" => EmulatorKind::Mgba,
        "melonds" => EmulatorKind::MelonDs,
        _ => return None,
    })
}

/// The executable names each emulator ships under, in preference order.
fn exe_names(kind: EmulatorKind) -> &'static [&'static str] {
    match kind {
        EmulatorKind::Mgba => &["mGBA.exe", "mgba.exe", "mgba-qt.exe"],
        EmulatorKind::MelonDs => &["melonDS.exe", "melonds.exe"],
    }
}

/// EmuDeck's per-emulator install folder name (Windows:
/// %APPDATA%\EmuDeck\Emulators\<name>).
fn emudeck_dir_name(kind: EmulatorKind) -> &'static str {
    match kind {
        EmulatorKind::Mgba => "mGBA",
        EmulatorKind::MelonDs => "melonDS",
    }
}

/// The EmuDeck `Emulation/roms/<system>` folder names this emulator reads.
/// mGBA covers the whole Game Boy line, so all three GB folders count.
pub fn rom_system_dirs(kind: EmulatorKind) -> &'static [&'static str] {
    match kind {
        EmulatorKind::Mgba => &["gba", "gb", "gbc"],
        EmulatorKind::MelonDs => &["nds"],
    }
}

fn existing(path: PathBuf) -> Option<PathBuf> {
    path.is_file().then_some(path)
}

/// EmuDeck install candidates for one emulator.
fn emudeck_candidates(kind: EmulatorKind) -> Vec<PathBuf> {
    let Some(appdata) = std::env::var_os("APPDATA") else {
        return Vec::new();
    };
    let dir = PathBuf::from(appdata)
        .join("EmuDeck")
        .join("Emulators")
        .join(emudeck_dir_name(kind));
    exe_names(kind).iter().map(|name| dir.join(name)).collect()
}

/// Common non-EmuDeck install locations.
fn system_candidates(kind: EmulatorKind) -> Vec<PathBuf> {
    let mut roots: Vec<PathBuf> = Vec::new();
    for var in ["ProgramFiles", "ProgramFiles(x86)", "LOCALAPPDATA"] {
        if let Some(value) = std::env::var_os(var) {
            roots.push(PathBuf::from(value));
        }
    }
    let sub = match kind {
        EmulatorKind::Mgba => "mGBA",
        EmulatorKind::MelonDs => "melonDS",
    };
    roots
        .into_iter()
        .flat_map(|root| {
            exe_names(kind)
                .iter()
                .map(move |name| root.join(sub).join(name))
                .collect::<Vec<_>>()
        })
        .collect()
}

fn path_candidate(kind: EmulatorKind) -> Option<PathBuf> {
    let path_var = std::env::var_os("PATH")?;
    for dir in std::env::split_paths(&path_var) {
        for name in exe_names(kind) {
            if let Some(found) = existing(dir.join(name)) {
                return Some(found);
            }
        }
    }
    None
}

/// The resolution chain. `None` means "not installed anywhere we know to look",
/// which the UI turns into a locate-or-install-EmuDeck prompt, never a crash.
pub fn resolve(kind: EmulatorKind, settings: &Settings) -> Option<(PathBuf, EmulatorSource)> {
    if let Some(over) = settings
        .emulator_paths
        .get(kind.key())
        .map(|p| p.trim())
        .filter(|p| !p.is_empty())
    {
        // Verbatim even if missing? No: a stale override must fall through to
        // detection rather than fail every launch until the player finds the
        // setting — but it stays visible as "configured path not found" via
        // `status`, which reports the override before this chain runs.
        if let Some(found) = existing(PathBuf::from(over)) {
            return Some((found, EmulatorSource::Override));
        }
    }
    for candidate in emudeck_candidates(kind) {
        if let Some(found) = existing(candidate) {
            return Some((found, EmulatorSource::Emudeck));
        }
    }
    for candidate in system_candidates(kind) {
        if let Some(found) = existing(candidate) {
            return Some((found, EmulatorSource::System));
        }
    }
    path_candidate(kind).map(|p| (p, EmulatorSource::Path))
}

pub fn status_of(kind: EmulatorKind, settings: &Settings) -> EmulatorStatus {
    let resolved = resolve(kind, settings);
    EmulatorStatus {
        kind: kind.key().to_string(),
        path: resolved.as_ref().map(|(p, _)| p.display().to_string()),
        source: resolved.map(|(_, s)| s),
    }
}

/// Every `<drive>:\Emulation\roms` tree on this machine (EmuDeck lets the
/// player pick the drive), plus `%USERPROFILE%\Emulation` for good measure.
pub fn emudeck_rom_roots() -> Vec<PathBuf> {
    let mut roots = Vec::new();
    for letter in b'A'..=b'Z' {
        let root = PathBuf::from(format!("{}:\\Emulation\\roms", letter as char));
        if root.is_dir() {
            roots.push(root);
        }
    }
    if let Some(profile) = std::env::var_os("USERPROFILE") {
        let root = PathBuf::from(profile).join("Emulation").join("roms");
        if root.is_dir() {
            roots.push(root);
        }
    }
    roots
}

/// Where the ROM auto-scan looks for this emulator's games: the player's own
/// extra dirs first (they said where their library is — believe them), then
/// EmuDeck's conventional folders.
pub fn rom_scan_dirs(kind: EmulatorKind, settings: &Settings) -> Vec<PathBuf> {
    let mut dirs: Vec<PathBuf> = settings
        .rom_dirs
        .iter()
        .map(|d| d.trim())
        .filter(|d| !d.is_empty())
        .map(PathBuf::from)
        .filter(|d| d.is_dir())
        .collect();
    for root in emudeck_rom_roots() {
        for system in rom_system_dirs(kind) {
            let dir = root.join(system);
            if dir.is_dir() {
                dirs.push(dir);
            }
        }
    }
    dirs
}

/// Walk a scan dir a couple of levels deep collecting files whose size matches.
/// Size is the prefilter that makes scanning cheap: hashing happens only on the
/// handful of candidates that could possibly be the pinned ROM.
pub fn size_matches_under(dir: &Path, size: u64, depth: usize, out: &mut Vec<PathBuf>) {
    let Ok(entries) = std::fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let Ok(kind) = entry.file_type() else { continue };
        let path = entry.path();
        if kind.is_dir() {
            if depth > 0 {
                size_matches_under(&path, size, depth - 1, out);
            }
        } else if kind.is_file() {
            if entry.metadata().map(|m| m.len() == size).unwrap_or(false) {
                out.push(path);
            }
        }
    }
}

// ── Commands ───────────────────────────────────────────────────────────────

/// Where this emulator would launch from right now, and how we know.
#[tauri::command]
pub async fn emulator_status(
    kind: String,
    app: tauri::AppHandle,
) -> Result<EmulatorStatus, InstallFailure> {
    let kind = kind_from_key(&kind)
        .ok_or_else(|| InstallFailure::message(format!("Emulador desconocido: {kind}")))?;
    Ok(status_of(kind, &crate::settings::load(&app)))
}

/// Let the player point at their emulator by hand — the escape hatch when
/// detection finds nothing (or the wrong copy). Stored globally, not per pack:
/// "where is my mGBA" has one answer per machine.
#[tauri::command]
pub async fn emulator_set_path(
    kind: String,
    app: tauri::AppHandle,
) -> Result<EmulatorStatus, InstallFailure> {
    use tauri_plugin_dialog::DialogExt;

    let parsed = kind_from_key(&kind)
        .ok_or_else(|| InstallFailure::message(format!("Emulador desconocido: {kind}")))?;

    let dialog = app.dialog().clone();
    let chosen = tauri::async_runtime::spawn_blocking(move || {
        dialog
            .file()
            .add_filter("Ejecutable", &["exe"])
            .blocking_pick_file()
    })
    .await
    .map_err(|e| InstallFailure::message(format!("La selección se interrumpió: {e}")))?;
    let Some(picked) = chosen else {
        return Err(InstallFailure::message("Selección cancelada.".to_string()));
    };
    let path = picked
        .into_path()
        .map_err(|e| InstallFailure::message(format!("Ruta inválida: {e}")))?;

    let mut settings = crate::settings::load(&app);
    settings
        .emulator_paths
        .insert(parsed.key().to_string(), path.display().to_string());
    crate::settings::save(&app, &settings)?;
    Ok(status_of(parsed, &settings))
}

/// Back to auto-detection.
#[tauri::command]
pub async fn emulator_clear_path(
    kind: String,
    app: tauri::AppHandle,
) -> Result<EmulatorStatus, InstallFailure> {
    let parsed = kind_from_key(&kind)
        .ok_or_else(|| InstallFailure::message(format!("Emulador desconocido: {kind}")))?;
    let mut settings = crate::settings::load(&app);
    settings.emulator_paths.remove(parsed.key());
    crate::settings::save(&app, &settings)?;
    Ok(status_of(parsed, &settings))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn an_override_that_exists_wins_over_everything() {
        let dir = std::env::temp_dir().join("boff-emu-test");
        std::fs::create_dir_all(&dir).unwrap();
        let exe = dir.join("mGBA.exe");
        std::fs::write(&exe, b"stub").unwrap();

        let mut settings = Settings::default();
        settings
            .emulator_paths
            .insert("mgba".into(), exe.display().to_string());
        let (path, source) = resolve(EmulatorKind::Mgba, &settings).expect("must resolve");
        assert_eq!(path, exe);
        assert_eq!(source, EmulatorSource::Override);

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn a_stale_override_falls_through_instead_of_failing_every_launch() {
        let mut settings = Settings::default();
        settings
            .emulator_paths
            .insert("mgba".into(), "C:/definitely/not/here/mGBA.exe".into());
        // Whatever detection finds (or nothing), it must not be the override.
        if let Some((_, source)) = resolve(EmulatorKind::Mgba, &settings) {
            assert_ne!(source, EmulatorSource::Override);
        }
    }

    #[test]
    fn size_prefilter_only_collects_exact_matches() {
        let dir = std::env::temp_dir().join("boff-romscan-test");
        let sub = dir.join("gba");
        std::fs::create_dir_all(&sub).unwrap();
        std::fs::write(dir.join("right.gba"), vec![0u8; 64]).unwrap();
        std::fs::write(sub.join("nested-right.gba"), vec![0u8; 64]).unwrap();
        std::fs::write(dir.join("wrong.gba"), vec![0u8; 65]).unwrap();

        let mut out = Vec::new();
        size_matches_under(&dir, 64, 2, &mut out);
        assert_eq!(out.len(), 2);

        let _ = std::fs::remove_dir_all(&dir);
    }
}
