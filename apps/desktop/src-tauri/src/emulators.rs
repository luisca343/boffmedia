//! Locating the player's own emulator install; EmuDeck-aware.
//!
//! Ground truth from a real EmuDeck-on-Windows install (2026-08): EmuDeck's
//! per-system default is recorded in `%APPDATA%\EmuDeck\settings.json` under
//! `emulatorAlternative` — `"multiemulator"` means **RetroArch with a libretro
//! core**, not a standalone exe, and for GBA that is the default (standalone
//! mGBA is often not even installed; its folder holds only config files). The
//! same file's `storagePath` names the drive of the user-chosen `Emulation`
//! folder (roms/saves/bios). So autowiring means: parse that file, honor the
//! player's own choice, and fall back gracefully.
//!
//! The launcher never ships or writes into an emulator. Resolution order:
//! manual override → EmuDeck (per settings.json) → common install dirs → PATH.
//! The result carries its SOURCE and METHOD so "it launched the wrong thing"
//! is diagnosable at a glance.

use std::path::{Path, PathBuf};

use serde::Serialize;

use crate::settings::{self, Settings};

/// The supported systems. Kept separate from the generated pack-schema enum so
/// the command layer takes a plain wire string.
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

    /// The key EmuDeck's `emulatorAlternative` uses for this system.
    fn emudeck_system(self) -> &'static str {
        match self {
            Self::Mgba => "gba",
            Self::Melonds => "nds",
        }
    }

    /// The `emulatorAlternative` value naming the STANDALONE for this system.
    fn emudeck_standalone_id(self) -> &'static str {
        match self {
            Self::Mgba => "mgba",
            Self::Melonds => "melonds",
        }
    }

    /// Candidate standalone exe paths under an EmuDeck `Emulators` dir. The
    /// folder casing differs between installs (`mgba` observed lowercase).
    fn emudeck_exe_candidates(self) -> &'static [&'static str] {
        match self {
            Self::Mgba => &["mgba/mGBA.exe", "mGBA/mGBA.exe"],
            Self::Melonds => &["melonDS/melonDS.exe", "melonds/melonDS.exe"],
        }
    }

    /// Install-folder / exe names for the standalone outside EmuDeck.
    fn standalone_dir_and_exe(self) -> (&'static str, &'static str) {
        match self {
            Self::Mgba => ("mGBA", "mGBA.exe"),
            Self::Melonds => ("melonDS", "melonDS.exe"),
        }
    }

    /// The libretro core file for this system.
    pub fn core_file(self) -> &'static str {
        match self {
            Self::Mgba => "mgba_libretro.dll",
            Self::Melonds => "melonds_libretro.dll",
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

/// HOW the game will be launched. RetroArch runs a libretro core (`-L`), a
/// standalone runs its own exe. The distinction matters for the launch args and
/// for save redirection, and the UI shows it ("mGBA · vía RetroArch (EmuDeck)").
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LaunchMethod {
    Standalone { exe: PathBuf },
    RetroArch { exe: PathBuf, core: PathBuf },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Resolved {
    /// The exe that will actually run (retroarch.exe for the core method).
    pub path: String,
    pub source: ResolvedSource,
    /// `"standalone"` | `"retroarch"` — the launch method, for the UI tag.
    pub via: &'static str,
    /// The libretro core path when via == "retroarch".
    #[serde(skip_serializing_if = "Option::is_none")]
    pub core: Option<String>,
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

// ── EmuDeck discovery ────────────────────────────────────────────────────────

/// What we read from `%APPDATA%\EmuDeck\settings.json`. All optional: a partial
/// or future-format file degrades to path-probing, never to a failure.
#[derive(Debug, Clone, Default)]
pub struct EmuDeckInfo {
    /// `%APPDATA%\EmuDeck` — the app dir that also holds `Emulators\`.
    pub app_dir: PathBuf,
    /// The user-chosen storage drive/root (`"E:\\"`), from `storagePath`.
    pub storage: Option<PathBuf>,
    /// `emulatorAlternative` — system key → emulator id ("multiemulator" = RetroArch).
    pub alternatives: std::collections::HashMap<String, String>,
}

impl EmuDeckInfo {
    /// The user's `Emulation` folder (`<storage>\Emulation`), when known and real.
    pub fn emulation_root(&self) -> Option<PathBuf> {
        let root = self.storage.as_ref()?.join("Emulation");
        root.is_dir().then_some(root)
    }

    fn emulators_dir(&self) -> PathBuf {
        self.app_dir.join("Emulators")
    }

    /// RetroArch exe + this kind's core, if both exist. Checked in the app dir
    /// first (observed layout) and the documented ES-DE layout second.
    fn retroarch(&self, kind: EmulatorKind) -> Option<(PathBuf, PathBuf)> {
        let mut candidates = vec![self.emulators_dir().join("RetroArch")];
        if let Some(profile) = std::env::var_os("USERPROFILE") {
            candidates.push(
                PathBuf::from(profile)
                    .join("emudeck")
                    .join("EmulationStation-DE")
                    .join("Emulators")
                    .join("RetroArch"),
            );
        }
        for dir in candidates {
            let exe = dir.join("retroarch.exe");
            let core = dir.join("cores").join(kind.core_file());
            if exe.is_file() && core.is_file() {
                return Some((exe, core));
            }
        }
        None
    }

    fn standalone(&self, kind: EmulatorKind) -> Option<PathBuf> {
        kind.emudeck_exe_candidates()
            .iter()
            .map(|rel| self.emulators_dir().join(rel))
            .find(|p| p.is_file())
    }
}

/// Detect EmuDeck from its settings file. `None` when not installed.
pub fn emudeck_info() -> Option<EmuDeckInfo> {
    let appdata = std::env::var_os("APPDATA")?;
    let app_dir = PathBuf::from(appdata).join("EmuDeck");
    let raw = std::fs::read_to_string(app_dir.join("settings.json")).ok()?;
    let json: serde_json::Value = serde_json::from_str(&raw).ok()?;

    let storage = json
        .get("storagePath")
        .or_else(|| json.get("storage"))
        .and_then(|v| v.as_str())
        .map(PathBuf::from);
    let mut alternatives = std::collections::HashMap::new();
    if let Some(map) = json.get("emulatorAlternative").and_then(|v| v.as_object()) {
        for (k, v) in map {
            if let Some(s) = v.as_str() {
                alternatives.insert(k.clone(), s.to_string());
            }
        }
    }
    Some(EmuDeckInfo {
        app_dir,
        storage,
        alternatives,
    })
}

// ── Resolution ───────────────────────────────────────────────────────────────

fn is_file(path: &Path) -> bool {
    path.is_file()
}

/// Resolve one emulator kind against the current settings. Never errors: an
/// absent emulator is a normal state the UI turns into a "Locate…" prompt.
pub fn status(kind: EmulatorKind, settings: &Settings) -> EmulatorStatus {
    let mut out = EmulatorStatus::default();

    // 1. Manual override. A stale one (file gone) falls through to detection so
    //    a moved emulator does not brick every launch, but is still reported.
    //    An override pointing at retroarch.exe is honored AS RetroArch — the
    //    core is still resolved automatically, because launching retroarch
    //    without `-L` would open its menu instead of the game.
    if let Some(raw) = settings.emulator_paths.get(kind.wire()) {
        let path = PathBuf::from(raw);
        if is_file(&path) {
            let is_ra = path
                .file_name()
                .and_then(|n| n.to_str())
                .is_some_and(|n| n.eq_ignore_ascii_case("retroarch.exe"));
            if is_ra {
                if let Some(core) = core_near(&path, kind) {
                    out.resolved = Some(Resolved {
                        path: raw.clone(),
                        source: ResolvedSource::Override,
                        via: "retroarch",
                        core: Some(core.to_string_lossy().into_owned()),
                    });
                    return out;
                }
                // RetroArch without its core cannot launch this system; treat
                // as stale so detection can still find something usable.
                out.stale_override = Some(raw.clone());
            } else {
                out.resolved = Some(Resolved {
                    path: raw.clone(),
                    source: ResolvedSource::Override,
                    via: "standalone",
                    core: None,
                });
                return out;
            }
        } else {
            out.stale_override = Some(raw.clone());
        }
    }

    if let Some(resolved) = detect(kind) {
        out.resolved = Some(resolved);
    }
    out
}

fn core_near(retroarch_exe: &Path, kind: EmulatorKind) -> Option<PathBuf> {
    let core = retroarch_exe.parent()?.join("cores").join(kind.core_file());
    core.is_file().then_some(core)
}

fn detect(kind: EmulatorKind) -> Option<Resolved> {
    // 2. EmuDeck — honor the player's own per-system choice from settings.json.
    if let Some(deck) = emudeck_info() {
        let alt = deck
            .alternatives
            .get(kind.emudeck_system())
            .map(String::as_str);
        let prefers_standalone = alt == Some(kind.emudeck_standalone_id());

        let standalone = deck.standalone(kind);
        let retroarch = deck.retroarch(kind);

        // The preferred method first; the other as a graceful fallback, so a
        // half-installed EmuDeck still launches SOMETHING correct.
        let picked: Option<Resolved> = if prefers_standalone {
            standalone
                .map(|exe| Resolved {
                    path: exe.to_string_lossy().into_owned(),
                    source: ResolvedSource::Emudeck,
                    via: "standalone",
                    core: None,
                })
                .or_else(|| {
                    retroarch.map(|(exe, core)| Resolved {
                        path: exe.to_string_lossy().into_owned(),
                        source: ResolvedSource::Emudeck,
                        via: "retroarch",
                        core: Some(core.to_string_lossy().into_owned()),
                    })
                })
        } else {
            // "multiemulator", an unknown id, or no entry: RetroArch is the
            // EmuDeck default; standalone only as fallback.
            retroarch
                .map(|(exe, core)| Resolved {
                    path: exe.to_string_lossy().into_owned(),
                    source: ResolvedSource::Emudeck,
                    via: "retroarch",
                    core: Some(core.to_string_lossy().into_owned()),
                })
                .or_else(|| {
                    standalone.map(|exe| Resolved {
                        path: exe.to_string_lossy().into_owned(),
                        source: ResolvedSource::Emudeck,
                        via: "standalone",
                        core: None,
                    })
                })
        };
        if picked.is_some() {
            return picked;
        }
    }

    // 3. Common standalone install dirs, 4. PATH.
    let (dir, exe) = kind.standalone_dir_and_exe();
    #[cfg(windows)]
    for var in ["ProgramFiles", "ProgramFiles(x86)", "LOCALAPPDATA"] {
        if let Ok(base) = std::env::var(var) {
            let p = PathBuf::from(base).join(dir).join(exe);
            if is_file(&p) {
                return Some(Resolved {
                    path: p.to_string_lossy().into_owned(),
                    source: ResolvedSource::System,
                    via: "standalone",
                    core: None,
                });
            }
        }
    }
    #[cfg(not(windows))]
    let exe = exe.trim_end_matches(".exe");
    path_lookup(exe).map(|p| Resolved {
        path: p.to_string_lossy().into_owned(),
        source: ResolvedSource::Path,
        via: "standalone",
        core: None,
    })
}

/// The launch method for a kind, or an error the UI turns into the locate flow.
pub fn resolve_method(kind: EmulatorKind, settings: &Settings) -> Result<LaunchMethod, String> {
    let status = status(kind, settings);
    match status.resolved {
        Some(r) => Ok(match r.core {
            Some(core) => LaunchMethod::RetroArch {
                exe: PathBuf::from(r.path),
                core: PathBuf::from(core),
            },
            None => LaunchMethod::Standalone {
                exe: PathBuf::from(r.path),
            },
        }),
        None => Err(format!(
            "No se encontró un emulador para {}. Indícalo manualmente (Localizar…) o instálalo con EmuDeck.",
            kind.wire()
        )),
    }
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
        let resolved = st.resolved.unwrap();
        assert_eq!(resolved.source, ResolvedSource::Override);
        assert_eq!(resolved.via, "standalone");
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
        assert!(st.resolved.as_ref().map(|r| r.source) != Some(ResolvedSource::Override));
    }

    #[test]
    fn an_override_pointing_at_retroarch_without_its_core_is_stale() {
        // retroarch.exe with no cores/<core>.dll beside it cannot launch the
        // system — the override must be flagged rather than half-honored.
        let dir = std::env::temp_dir().join(format!("boff-ra-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let exe = dir.join("retroarch.exe");
        std::fs::write(&exe, b"x").unwrap();
        let mut s = Settings::default();
        s.emulator_paths
            .insert("mgba".to_string(), exe.to_string_lossy().into_owned());
        let st = status(EmulatorKind::Mgba, &s);
        assert!(st.stale_override.is_some());
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn an_override_pointing_at_retroarch_with_a_core_resolves_via_retroarch() {
        let dir = std::env::temp_dir().join(format!("boff-ra2-{}", std::process::id()));
        std::fs::create_dir_all(dir.join("cores")).unwrap();
        let exe = dir.join("retroarch.exe");
        std::fs::write(&exe, b"x").unwrap();
        std::fs::write(dir.join("cores").join("mgba_libretro.dll"), b"x").unwrap();
        let mut s = Settings::default();
        s.emulator_paths
            .insert("mgba".to_string(), exe.to_string_lossy().into_owned());
        let st = status(EmulatorKind::Mgba, &s);
        let resolved = st.resolved.unwrap();
        assert_eq!(resolved.via, "retroarch");
        assert!(resolved.core.unwrap().ends_with("mgba_libretro.dll"));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn resolve_method_maps_core_to_retroarch_variant() {
        let dir = std::env::temp_dir().join(format!("boff-ra3-{}", std::process::id()));
        std::fs::create_dir_all(dir.join("cores")).unwrap();
        let exe = dir.join("retroarch.exe");
        std::fs::write(&exe, b"x").unwrap();
        std::fs::write(dir.join("cores").join("melonds_libretro.dll"), b"x").unwrap();
        let mut s = Settings::default();
        s.emulator_paths
            .insert("melonds".to_string(), exe.to_string_lossy().into_owned());
        match resolve_method(EmulatorKind::Melonds, &s) {
            Ok(LaunchMethod::RetroArch { core, .. }) => {
                assert!(core.ends_with("melonds_libretro.dll"))
            }
            other => panic!("expected RetroArch method, got {other:?}"),
        }
        std::fs::remove_dir_all(&dir).ok();
    }
}
