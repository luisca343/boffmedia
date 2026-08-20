// The bridge between portablemc's event stream and the ONE progress bar the UI
// draws. `InstallPhase` here is the same eight names, in the same order, as
// apps/desktop/src/services/types.ts:40 — the renderer switches on the string,
// so a ninth phase or a rename is a silent "unknown phase" in the UI.
//
// The fraction the renderer receives is OVERALL, not per-phase (types.ts says so
// explicitly). Each phase therefore owns a slice of the bar; a phase reporting
// 100% of itself moves the bar by its own weight and no further.

use std::sync::atomic::{AtomicU64, Ordering};

use portablemc::{base, fabric, forge, moj};
use serde::Serialize;
use tauri::Emitter;

pub const EVENT_PROGRESS: &str = "install://progress";
pub const EVENT_DONE: &str = "install://done";
pub const EVENT_LOG: &str = "game://log";
pub const EVENT_GAME_STATE: &str = "game://state";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Phase {
    Resolving,
    Java,
    Libraries,
    Assets,
    Loader,
    Mods,
    Overrides,
    Verifying,
}

impl Phase {
    /// Share of the overall bar. These are guesses about wall-clock time, not
    /// about byte counts: `assets` is thousands of tiny files and `libraries` a
    /// few large ones, and both take roughly the same wait.
    fn weight(self) -> f32 {
        match self {
            Phase::Resolving => 0.02,
            Phase::Java => 0.10,
            Phase::Libraries => 0.22,
            Phase::Assets => 0.22,
            Phase::Loader => 0.12,
            Phase::Mods => 0.26,
            Phase::Overrides => 0.04,
            Phase::Verifying => 0.02,
        }
    }

    const ORDER: [Phase; 8] = [
        Phase::Resolving,
        Phase::Java,
        Phase::Libraries,
        Phase::Assets,
        Phase::Loader,
        Phase::Mods,
        Phase::Overrides,
        Phase::Verifying,
    ];

    /// How much of the bar is already behind this phase.
    fn offset(self) -> f32 {
        Phase::ORDER
            .iter()
            .take_while(|p| **p != self)
            .map(|p| p.weight())
            .sum()
    }

    /// Overall 0–1 given how far through THIS phase we are.
    pub fn overall(self, within: f32) -> f32 {
        (self.offset() + self.weight() * within.clamp(0.0, 1.0)).clamp(0.0, 1.0)
    }
}

/// Which install shape the bar describes. The weights above are MINECRAFT
/// weights (Java/Libraries/Assets/Loader own 66% of the bar); an emulator
/// install runs none of those phases, so mapping it through the same table
/// left the bar parked at ~94% for the whole install. Each profile owns its
/// own offsets over the SAME phase names the renderer already knows.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ProgressProfile {
    #[default]
    Minecraft,
    /// Payload-only installs: Resolving → Overrides (the whole payload) →
    /// Verifying. Phases outside this plan clamp into it harmlessly.
    Emulator,
}

impl ProgressProfile {
    fn overall(self, phase: Phase, within: f32) -> f32 {
        match self {
            ProgressProfile::Minecraft => phase.overall(within),
            ProgressProfile::Emulator => {
                let within = within.clamp(0.0, 1.0);
                let (offset, weight) = match phase {
                    Phase::Resolving => (0.0, 0.05),
                    Phase::Overrides | Phase::Mods => (0.05, 0.80),
                    Phase::Verifying => (0.85, 0.15),
                    // Never emitted on this path; render as "almost done".
                    _ => (0.85, 0.0),
                };
                (offset + weight * within).clamp(0.0, 1.0)
            }
        }
    }
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProgressPayload<'a> {
    pack_id: &'a str,
    phase: Phase,
    fraction: f32,
    file: &'a str,
    downloaded_bytes: u64,
    total_bytes: u64,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DonePayload<'a> {
    pack_id: &'a str,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LogLine<'a> {
    pub ts: u64,
    pub level: &'a str,
    pub source: &'a str,
    pub text: &'a str,
}

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or_default()
}

/// One structured log line, matching types.ts's `LogLine`. `source` separates
/// what the launcher says from what the game printed, because crash-report
/// parsing only ever wants the latter.
pub fn log(app: &tauri::AppHandle, level: &str, source: &str, text: &str) {
    let _ = app.emit(
        EVENT_LOG,
        LogLine {
            ts: now_ms(),
            level,
            source,
            text,
        },
    );
}

/// Emits `install://progress`. Cloneable and cheap, so the async download side
/// (files.rs) and the blocking portablemc side (game.rs) can each hold one.
#[derive(Clone)]
pub struct Reporter {
    app: tauri::AppHandle,
    pack_id: String,
    profile: ProgressProfile,
}

impl Reporter {
    pub fn new(app: tauri::AppHandle, pack_id: impl Into<String>) -> Self {
        Self {
            app,
            pack_id: pack_id.into(),
            profile: ProgressProfile::Minecraft,
        }
    }

    /// The emulator-install bar shape (payload-only phases).
    pub fn for_emulator(app: tauri::AppHandle, pack_id: impl Into<String>) -> Self {
        Self {
            app,
            pack_id: pack_id.into(),
            profile: ProgressProfile::Emulator,
        }
    }

    pub fn emit(&self, phase: Phase, within: f32, file: &str, downloaded: u64, total: u64) {
        let _ = self.app.emit(
            EVENT_PROGRESS,
            ProgressPayload {
                pack_id: &self.pack_id,
                phase,
                fraction: self.profile.overall(phase, within),
                file,
                downloaded_bytes: downloaded,
                total_bytes: total,
            },
        );
    }

    pub fn done(&self) {
        let _ = self.app.emit(
            EVENT_DONE,
            DonePayload {
                pack_id: &self.pack_id,
            },
        );
    }

    pub fn log(&self, level: &str, text: &str) {
        log(&self.app, level, "app", text);
    }
}

/// Shared byte counter for the parallel download side. An atomic rather than a
/// Mutex because all N download tasks touch it as each file completes.
#[derive(Default)]
pub struct ByteCounter {
    downloaded: AtomicU64,
}

impl ByteCounter {
    /// Returns the new running total, so the caller can emit progress without a
    /// second read that another task could have moved in between.
    pub fn add(&self, bytes: u64) -> u64 {
        self.downloaded.fetch_add(bytes, Ordering::Relaxed) + bytes
    }
}

/// Watches a portablemc install. Implements all four handler traits so the same
/// value can be handed to the vanilla, Fabric or Forge installer — they layer
/// (`forge::Event::Mojang(moj::Event::Base(..))`) rather than replace.
pub struct InstallWatcher {
    reporter: Reporter,
    phase: Phase,
    file: String,
    /// A JVM the version metadata says is the wrong major version. Held
    /// here and raised as a HARD error by the caller once `install()` returns:
    /// portablemc treats it as a warning and launches anyway, which produces
    /// the confusing crash that is the #1 support ticket.
    pub jvm_incompatible: Option<String>,
}

impl InstallWatcher {
    pub fn new(reporter: Reporter) -> Self {
        Self {
            reporter,
            phase: Phase::Resolving,
            file: String::new(),
            jvm_incompatible: None,
        }
    }

    fn enter(&mut self, phase: Phase) {
        if self.phase != phase {
            self.phase = phase;
            self.file.clear();
            self.reporter.emit(phase, 0.0, "", 0, 0);
        }
    }

    fn handle_base(&mut self, event: base::Event) {
        match event {
            base::Event::LoadHierarchy { root_version } => {
                self.enter(Phase::Resolving);
                self.file = root_version.to_string();
            }
            base::Event::LoadClient | base::Event::LoadLibraries => {
                self.enter(Phase::Libraries);
            }
            base::Event::LoadAssets { .. } | base::Event::LoadedAssets { .. } => {
                self.enter(Phase::Assets);
            }
            base::Event::LoadJvm { major_version } => {
                self.enter(Phase::Java);
                self.file = format!("Java {major_version}");
            }
            base::Event::LoadedJvm {
                file,
                version,
                compatible,
            } => {
                if !compatible {
                    // Deliberately not a `warn` log. See the field's comment.
                    self.jvm_incompatible = Some(format!(
                        "La versión de Java seleccionada ({}) no es compatible con esta versión de Minecraft.\n{}",
                        version.unwrap_or("desconocida"),
                        file.display()
                    ));
                }
            }
            base::Event::DownloadProgress {
                count,
                total_count,
                size,
                total_size,
            } => {
                let within = if total_size > 0 {
                    size as f32 / total_size as f32
                } else if total_count > 0 {
                    count as f32 / total_count as f32
                } else {
                    0.0
                };
                self.reporter.emit(
                    self.phase,
                    within,
                    &self.file,
                    size as u64,
                    total_size as u64,
                );
            }
            _ => {}
        }
    }

    fn handle_moj(&mut self, event: moj::Event) {
        match event {
            moj::Event::Base(inner) => self.handle_base(inner),
            moj::Event::FetchVersion { version } | moj::Event::FetchedVersion { version } => {
                self.enter(Phase::Resolving);
                self.file = version.to_string();
            }
            _ => {}
        }
    }
}

impl base::Handler for InstallWatcher {
    fn on_event(&mut self, event: base::Event) {
        self.handle_base(event);
    }
}

impl moj::Handler for InstallWatcher {
    fn on_event(&mut self, event: moj::Event) {
        self.handle_moj(event);
    }
}

impl fabric::Handler for InstallWatcher {
    fn on_event(&mut self, event: fabric::Event) {
        match event {
            fabric::Event::Mojang(inner) => self.handle_moj(inner),
            fabric::Event::FetchVersion { loader_version, .. }
            | fabric::Event::FetchedVersion { loader_version, .. } => {
                self.enter(Phase::Loader);
                self.file = loader_version.to_string();
            }
            _ => {}
        }
    }
}

impl forge::Handler for InstallWatcher {
    fn on_event(&mut self, event: forge::Event) {
        match event {
            forge::Event::Mojang(inner) => self.handle_moj(inner),
            forge::Event::FetchInstaller { version } | forge::Event::FetchedInstaller { version } => {
                self.enter(Phase::Loader);
                self.file = version.to_string();
            }
            forge::Event::Installing { .. } | forge::Event::InstallingGame => {
                self.enter(Phase::Loader);
            }
            // The processors are the slow part of a Forge install and
            // the only feedback available during minutes of silence.
            forge::Event::RunInstallerProcessor { name, .. } => {
                self.enter(Phase::Loader);
                self.file = name.to_string();
                self.reporter.emit(Phase::Loader, 0.5, &self.file, 0, 0);
            }
            _ => {}
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn phase_names_match_the_renderers_union() {
        // types.ts:40 — same strings, same order. A rename here is invisible in
        // Rust and shows up as an unstyled phase label in the UI.
        let names: Vec<String> = Phase::ORDER
            .iter()
            .map(|p| serde_json::to_string(p).unwrap().replace('"', ""))
            .collect();
        assert_eq!(
            names,
            vec![
                "resolving",
                "java",
                "libraries",
                "assets",
                "loader",
                "mods",
                "overrides",
                "verifying"
            ]
        );
    }

    #[test]
    fn the_bar_only_ever_moves_forward() {
        let weights: f32 = Phase::ORDER.iter().map(|p| p.weight()).sum();
        assert!((weights - 1.0).abs() < 1e-5, "weights must total 1.0");

        let mut previous = 0.0;
        for phase in Phase::ORDER {
            let start = phase.overall(0.0);
            assert!(start >= previous, "{phase:?} went backwards");
            previous = phase.overall(1.0);
        }
        assert!((previous - 1.0).abs() < 1e-5);
    }

    #[test]
    fn fractions_are_clamped() {
        assert_eq!(Phase::Resolving.overall(-5.0), 0.0);
        assert!(Phase::Verifying.overall(9.0) <= 1.0);
    }
}
