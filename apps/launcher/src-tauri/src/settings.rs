// Launcher preferences — the Rust side of `Settings` in
// apps/launcher/src/services/types.ts.
//
// Plain JSON in the app CONFIG dir, deliberately not the keyring: there is no
// secret here, and §5.7's rule is about tokens. Putting a memory slider in the
// OS credential store would be as wrong as putting a refresh token in a file.

use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::install::InstallFailure;

const FILE: &str = "settings.json";
const PLAYS_FILE: &str = "plays.json";

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
    /// §9 — how many previous versions stay revertible. Cheap: a retained
    /// version is one marker (~40 KB of JSON), never a copy of the instance
    /// tree, because the blobs it names already live in the shared
    /// content-addressed cache. `#[serde(default)]` so a settings.json written
    /// by the previous build loads instead of resetting every preference.
    #[serde(default = "default_retain")]
    pub retain_versions: u32,
    /// §9 — when true, `memory_mib` is ignored and the heap is sized by
    /// `install::runtime::recommended_heap_mib` from the pack's mod count and
    /// this machine's RAM. A separate flag rather than a sentinel value in
    /// `memory_mib` so switching automatic OFF restores the number the player
    /// had chosen instead of resetting the slider.
    #[serde(default)]
    pub memory_auto: bool,
    /// UI language ("es" | "en"). Rust never reads it — the renderer's i18n store
    /// owns the choice — but it round-trips through here so it persists in the
    /// same settings.json as everything else. `#[serde(default)]` fills a file
    /// written before i18n with "es".
    #[serde(default = "default_locale")]
    pub locale: String,
}

fn default_retain() -> u32 {
    crate::install::instance::DEFAULT_RETAIN as u32
}

fn default_locale() -> String {
    "es".to_string()
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
            retain_versions: default_retain(),
            // Off by default: the launcher must not silently change a heap size
            // a player already tuned. The per-pack panel is where §9's heuristic
            // is offered, and Ajustes can opt the global default into it.
            memory_auto: false,
            locale: default_locale(),
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

    /// Clamped: 0 would make every install unrevertable the instant it lands,
    /// and an absurd number turns the history file into a log nobody prunes.
    pub fn retain_versions(&self) -> usize {
        self.retain_versions.clamp(1, 20) as usize
    }

    pub fn game_dir(&self) -> Option<&str> {
        let dir = self.game_dir.trim();
        (!dir.is_empty()).then_some(dir)
    }
}

/// Settings live in the SAME root as everything else (`datadir::data_root`),
/// not in Tauri's `app_config_dir()`.
///
/// On Windows those two used to be the identical directory, so the move to
/// `%APPDATA%\BoffLauncher` would have carried `settings.json` off to a folder
/// nothing read any more — the player's memory slider and game-dir override
/// silently back to defaults. Pointing both at one root is what keeps the
/// migration honest, and it means "the launcher's folder" is one place a
/// player can back up or delete.
fn config_path(app: &tauri::AppHandle, name: &str) -> Result<PathBuf, InstallFailure> {
    let dir = crate::datadir::data_root(app).map_err(InstallFailure::message)?;
    Ok(dir.join(name))
}

fn file_path(app: &tauri::AppHandle) -> Result<PathBuf, InstallFailure> {
    config_path(app, FILE)
}

/// When each pack was last launched, keyed by pack id. Kept out of
/// `settings.json` because it is a log, not a preference: a corrupt entry here
/// must never cost the player their memory slider.
pub type Plays = std::collections::HashMap<String, String>;

pub fn plays_load(app: &tauri::AppHandle) -> Plays {
    config_path(app, PLAYS_FILE)
        .ok()
        .and_then(|path| std::fs::read_to_string(path).ok())
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_default()
}

/// Best-effort by design: failing to note a launch must never fail the launch.
pub fn record_play(app: &tauri::AppHandle, pack_id: &str) {
    let mut plays = plays_load(app);
    plays.insert(pack_id.to_string(), chrono::Utc::now().to_rfc3339());
    let Ok(path) = config_path(app, PLAYS_FILE) else {
        return;
    };
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    if let Ok(raw) = serde_json::to_string_pretty(&plays) {
        let _ = std::fs::write(path, raw);
    }
}

#[tauri::command]
pub fn plays_get(app: tauri::AppHandle) -> Plays {
    plays_load(&app)
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
    fn a_settings_file_from_the_previous_build_keeps_its_preferences() {
        // The trap: a missing `retainVersions` making the whole parse fail,
        // which `load()` swallows into Settings::default() — silently resetting
        // the player's memory slider and java path.
        let raw = r#"{"memoryMib":8192,"javaPath":"/opt/jdk/bin/java","gameDir":"",
            "closeOnLaunch":true,"keepLogs":false}"#;
        let s: Settings = serde_json::from_str(raw).expect("an old settings.json must still load");
        assert_eq!(s.memory_mib, 8192);
        assert_eq!(s.retain_versions(), 3);
        assert_eq!(s.java_path(), Some("/opt/jdk/bin/java"));
        // §9's automatic sizing must default OFF for an existing player: an
        // update that silently re-sizes a heap they tuned is a regression they
        // cannot explain.
        assert!(!s.memory_auto);
    }

    #[test]
    fn retention_is_clamped_so_zero_never_means_unrevertable() {
        let with = |retain_versions| Settings {
            retain_versions,
            ..Settings::default()
        };
        assert_eq!(with(0).retain_versions(), 1);
        assert_eq!(with(5).retain_versions(), 5);
        assert_eq!(with(9_999).retain_versions(), 20);
    }

    #[test]
    fn the_wire_shape_is_camel_case() {
        let raw = serde_json::to_string(&Settings::default()).unwrap();
        for key in [
            "memoryMib",
            "javaPath",
            "gameDir",
            "closeOnLaunch",
            "keepLogs",
            "retainVersions",
            "memoryAuto",
        ] {
            assert!(raw.contains(key), "missing {key} in {raw}");
        }
    }
}
