//! Locating the player's own emulator install (§2, D4). The launcher never
//! ships or writes into an emulator — it finds the one the player already has,
//! in this order: a manual override, then EmuDeck (the layout we recommend to
//! the community), then common install dirs, then PATH. The result carries its
//! SOURCE so "it launched the wrong mGBA" is diagnosable at a glance.
//!
//! Windows-shaped by design: the clients are Windows (WebView2). Non-Windows
//! builds compile with only the override + PATH steps.

use std::path::{Path, PathBuf};

use serde::Serialize;

use crate::settings::{self, Settings};

/// The systems supported in Cycle 2 (D2). Kept separate from the generated
/// pack-schema enum so the command layer takes a plain wire string.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EmulatorKind {
    Mgba,
    Melonds,
}

impl EmulatorKind {
    pub fn parse(raw: &str) -> Option<Self> {
        match raw {
            "mgba" => Some(Self::Mgba),
            "melonds" => Some(Self::Melonds),
            _ => None,
        }
    }

    pub fn wire(self) -> &'static str {
        match self {
            Self::Mgba => "mgba",
            Self::Melonds => "melonds",
        }
    }

    /// The install-folder / executable names used by EmuDeck and the standalone
    /// builds. **VT-1**: confirm these exact names on a real EmuDeck-on-Windows
    /// install before the release ships.
    fn dir_and_exe(self) -> (&'static str, &'static str) {
        match self {
            Self::Mgba => ("mGBA", "mGBA.exe"),
            Self::Melonds => ("melonDS", "melonDS.exe"),
        }
    }
}

/// Where a resolved emulator came from — surfaced to the UI verbatim.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ResolvedSource {
    Override,
    Emudeck,
    System,
    Path,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Resolved {
    pub path: String,
    pub source: ResolvedSource,
}

/// The full picture for one kind: what resolved (if anything) and whether a set
/// override is stale (points at a file that is gone) — the UI flags the latter
/// even when detection found a working fallback.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct EmulatorStatus {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolved: Option<Resolved>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stale_override: Option<String>,
}

fn is_file(path: &Path) -> bool {
    path.is_file()
}

/// Resolve one emulator kind against the current settings. Never errors: an
/// absent emulator is a normal state the UI turns into a "Locate…" prompt.
pub fn status(kind: EmulatorKind, settings: &Settings) -> EmulatorStatus {
    let mut out = EmulatorStatus::default();

    // 1. Manual override. A stale one (file gone) falls through to detection so a
    //    moved emulator does not brick every launch, but is still reported.
    if let Some(raw) = settings.emulator_paths.get(kind.wire()) {
        let path = PathBuf::from(raw);
        if is_file(&path) {
            out.resolved = Some(Resolved {
                path: raw.clone(),
                source: ResolvedSource::Override,
            });
            return out;
        }
        out.stale_override = Some(raw.clone());
    }

    // 2. EmuDeck, 3. common install dirs, 4. PATH.
    if let Some((path, source)) = detect(kind) {
        out.resolved = Some(Resolved {
            path: path.to_string_lossy().into_owned(),
            source,
        });
    }
    out
}

/// The resolved exe path for launching, or an error the UI turns into the locate
/// flow. Prefers a working override, otherwise detection.
pub fn resolve_exe(kind: EmulatorKind, settings: &Settings) -> Result<PathBuf, String> {
    let status = status(kind, settings);
    match status.resolved {
        Some(r) => Ok(PathBuf::from(r.path)),
        None => Err(format!(
            "No se encontró {}. Indícalo manualmente (Localizar…) o instálalo con EmuDeck.",
            kind.wire()
        )),
    }
}

#[cfg(windows)]
fn detect(kind: EmulatorKind) -> Option<(PathBuf, ResolvedSource)> {
    let (dir, exe) = kind.dir_and_exe();

    // 2. EmuDeck — %APPDATA%\EmuDeck\Emulators\<Emu>\<Emu>.exe (VT-1).
    if let Ok(appdata) = std::env::var("APPDATA") {
        let p = PathBuf::from(appdata)
            .join("EmuDeck")
            .join("Emulators")
            .join(dir)
            .join(exe);
        if is_file(&p) {
            return Some((p, ResolvedSource::Emudeck));
        }
    }

    // 3. Common install dirs.
    for var in ["ProgramFiles", "ProgramFiles(x86)", "LOCALAPPDATA"] {
        if let Ok(base) = std::env::var(var) {
            let p = PathBuf::from(base).join(dir).join(exe);
            if is_file(&p) {
                return Some((p, ResolvedSource::System));
            }
        }
    }

    // 4. PATH.
    path_lookup(exe).map(|p| (p, ResolvedSource::Path))
}

#[cfg(not(windows))]
fn detect(kind: EmulatorKind) -> Option<(PathBuf, ResolvedSource)> {
    // Non-Windows builds (dev on Linux/macOS): only the PATH step is meaningful;
    // EmuDeck's Windows layout does not apply.
    let (_dir, exe) = kind.dir_and_exe();
    let exe = exe.trim_end_matches(".exe");
    path_lookup(exe).map(|p| (p, ResolvedSource::Path))
}

/// A `where`-equivalent: the first entry on PATH that holds `exe`.
fn path_lookup(exe: &str) -> Option<PathBuf> {
    let path = std::env::var_os("PATH")?;
    std::env::split_paths(&path)
        .map(|dir| dir.join(exe))
        .find(|p| is_file(p))
}

// ── Tauri commands ───────────────────────────────────────────────────────────

use crate::install::InstallFailure;

fn parse_kind(raw: &str) -> Result<EmulatorKind, InstallFailure> {
    EmulatorKind::parse(raw)
        .ok_or_else(|| InstallFailure::message(format!("Emulador desconocido: {raw}")))
}

#[tauri::command]
pub fn emulator_status(kind: String, app: tauri::AppHandle) -> Result<EmulatorStatus, InstallFailure> {
    let k = parse_kind(&kind)?;
    Ok(status(k, &settings::load(&app)))
}

#[tauri::command]
pub fn emulator_set_path(
    kind: String,
    path: String,
    app: tauri::AppHandle,
) -> Result<EmulatorStatus, InstallFailure> {
    let k = parse_kind(&kind)?;
    if !is_file(&PathBuf::from(&path)) {
        return Err(InstallFailure::message(format!(
            "No existe un archivo en «{path}»."
        )));
    }
    let mut s = settings::load(&app);
    s.emulator_paths.insert(k.wire().to_string(), path);
    settings::save(&app, &s)?;
    Ok(status(k, &s))
}

#[tauri::command]
pub fn emulator_clear_path(
    kind: String,
    app: tauri::AppHandle,
) -> Result<EmulatorStatus, InstallFailure> {
    let k = parse_kind(&kind)?;
    let mut s = settings::load(&app);
    s.emulator_paths.remove(k.wire());
    settings::save(&app, &s)?;
    Ok(status(k, &s))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_known_kinds_only() {
        assert_eq!(EmulatorKind::parse("mgba"), Some(EmulatorKind::Mgba));
        assert_eq!(EmulatorKind::parse("melonds"), Some(EmulatorKind::Melonds));
        assert_eq!(EmulatorKind::parse("snes9x"), None);
    }

    #[test]
    fn a_working_override_wins_and_reports_its_source() {
        let tmp = std::env::temp_dir().join(format!("boff-emu-{}.exe", std::process::id()));
        std::fs::write(&tmp, b"x").unwrap();
        let mut s = Settings::default();
        s.emulator_paths
            .insert("mgba".to_string(), tmp.to_string_lossy().into_owned());
        let st = status(EmulatorKind::Mgba, &s);
        assert_eq!(st.resolved.unwrap().source, ResolvedSource::Override);
        assert!(st.stale_override.is_none());
        std::fs::remove_file(&tmp).ok();
    }

    #[test]
    fn a_stale_override_is_reported_and_falls_through() {
        let mut s = Settings::default();
        s.emulator_paths.insert(
            "mgba".to_string(),
            std::env::temp_dir()
                .join("boff-emu-does-not-exist.exe")
                .to_string_lossy()
                .into_owned(),
        );
        let st = status(EmulatorKind::Mgba, &s);
        assert!(st.stale_override.is_some());
        // Whatever detection returns (None on a clean machine) is fine; the point
        // is the override did not win.
        assert!(st.resolved.as_ref().map(|r| r.source) != Some(ResolvedSource::Override));
    }
}
