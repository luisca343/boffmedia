// Launcher preferences — the Rust side of `Settings` in
// apps/launcher/src/services/types.ts.
//
// Plain JSON in the app CONFIG dir, deliberately not the keyring: there is no
// secret here, and §5.7's rule is about tokens. Putting a memory slider in the
// OS credential store would be as wrong as putting a refresh token in a file.

use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::Manager;

use crate::install::InstallFailure;

const FILE: &str = "settings.json";

/// Matches types.ts's `Settings` field for field. `gameDir` empty means "use the
/// default app-data location" — an absent field and a blank one must mean the
/// same thing, or a hand-edited file bricks the launcher.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub memory_mib: u32,
    pub java_path: Option<String>,
    pub game_dir: String,
    pub close_on_launch: bool,
    pub keep_logs: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            // §9 asks for a heuristic rather than a constant, but 4 GiB is the
            // floor a modern modpack needs; anything lower reads as "the
            // launcher is broken" on first launch.
            memory_mib: 4096,
            // None = let the JVM policy find or install one (§6.3).
            java_path: None,
            game_dir: String::new(),
            close_on_launch: false,
            keep_logs: true,
        }
    }
}

impl Settings {
    /// The JVM heap flag, clamped to something a JVM will actually accept.
    /// A `-Xmx0m` from a corrupt settings file makes the game fail to start
    /// with a JVM error nobody will connect to a slider.
    pub fn xmx_arg(&self) -> String {
        format!("-Xmx{}M", self.memory_mib.clamp(512, 65536))
    }

    pub fn java_path(&self) -> Option<&str> {
        self.java_path.as_deref().map(str::trim).filter(|p| !p.is_empty())
    }

    pub fn game_dir(&self) -> Option<&str> {
        let dir = self.game_dir.trim();
        (!dir.is_empty()).then_some(dir)
    }
}

fn file_path(app: &tauri::AppHandle) -> Result<PathBuf, InstallFailure> {
    let dir = app.path().app_config_dir().map_err(|e| {
        InstallFailure::message(format!("No se pudo localizar la carpeta de ajustes: {e}"))
    })?;
    Ok(dir.join(FILE))
}

/// Never fails on a missing or unreadable file: settings are a convenience, and
/// a corrupt file must not stop anyone from playing. It IS overwritten by the
/// next save, which is the only way out of a bad hand-edit.
pub fn load(app: &tauri::AppHandle) -> Settings {
    let Ok(path) = file_path(app) else {
        return Settings::default();
    };
    std::fs::read_to_string(path)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_default()
}

pub fn save(app: &tauri::AppHandle, settings: &Settings) -> Result<(), InstallFailure> {
    let path = file_path(app)?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| {
            InstallFailure::message(format!("No se pudo crear {}: {e}", parent.display()))
        })?;
    }
    let raw = serde_json::to_string_pretty(settings)
        .map_err(|e| InstallFailure::message(format!("Ajustes no serializables: {e}")))?;
    std::fs::write(&path, raw).map_err(|e| {
        InstallFailure::message(format!("No se pudo guardar {}: {e}", path.display()))
    })
}

#[tauri::command]
pub fn settings_get(app: tauri::AppHandle) -> Settings {
    load(&app)
}

#[tauri::command]
pub fn settings_set(app: tauri::AppHandle, settings: Settings) -> Result<Settings, InstallFailure> {
    save(&app, &settings)?;
    Ok(settings)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn heap_flag_is_clamped_in_both_directions() {
        let with = |memory_mib| Settings {
            memory_mib,
            ..Settings::default()
        };
        assert_eq!(with(0).xmx_arg(), "-Xmx512M");
        assert_eq!(with(1_000_000).xmx_arg(), "-Xmx65536M");
        assert_eq!(with(6144).xmx_arg(), "-Xmx6144M");
    }

    #[test]
    fn blank_strings_mean_unset() {
        let s = Settings {
            java_path: Some("   ".into()),
            game_dir: "  ".into(),
            ..Settings::default()
        };
        assert!(s.java_path().is_none());
        assert!(s.game_dir().is_none());
    }

    #[test]
    fn the_wire_shape_is_camel_case() {
        let raw = serde_json::to_string(&Settings::default()).unwrap();
        for key in ["memoryMib", "javaPath", "gameDir", "closeOnLaunch", "keepLogs"] {
            assert!(raw.contains(key), "missing {key} in {raw}");
        }
    }
}
