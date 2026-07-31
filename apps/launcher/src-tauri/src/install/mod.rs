// HANDOFF §6 — the install and launch pipeline, and the commands the renderer
// drives it with.
//
// Shape of an install, and why it is split the way it is:
//
//   install_pack (async)
//     ├─ resolve   manifest -> InstallPlan                      [resolving]
//     ├─ spawn_blocking: portablemc                [java|libraries|assets|loader]
//     └─ async reqwest: pack payload                     [mods|overrides|verifying]
//
// portablemc is synchronous AND creates its own tokio runtime internally
// (portablemc/src/tokio.rs:9), so touching it from an async command panics with
// "cannot start a runtime from within a runtime". Everything portablemc goes
// through `spawn_blocking`; everything of ours stays async. That split is not
// stylistic — it is the difference between the installer working and the app
// aborting.

pub mod files;
pub mod game;
pub mod paths;
pub mod process;
pub mod progress;
pub mod resolve;
pub mod session;

use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex as StdMutex};

use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

use crate::auth::AuthState;
use crate::settings;

use paths::{InstancePaths, Layout};
use process::RunningGame;
use progress::{Phase, Reporter};

/// Serialisable failure for the renderer.
///
/// The shape ({ message, needs_signin }) is NOT incidental: runtime.ts's
/// `asFailure()` reads exactly these two fields, and anything else renders as
/// "Error inesperado". Kept identical to `auth::AuthFailure` and `api::ApiError`
/// so the renderer needs one error path, not three.
#[derive(Debug, Clone, Serialize)]
pub struct InstallFailure {
    pub message: String,
    pub needs_signin: bool,
}

impl InstallFailure {
    pub fn message(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            needs_signin: false,
        }
    }

    /// Only for "we have no Minecraft session" — a disk or network problem is
    /// not fixed by signing in again, and telling the player otherwise sends
    /// them round a loop.
    pub fn needs_signin(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            needs_signin: true,
        }
    }
}

impl From<crate::auth::AuthFailure> for InstallFailure {
    fn from(err: crate::auth::AuthFailure) -> Self {
        Self {
            message: err.message,
            needs_signin: err.needs_signin,
        }
    }
}

/// A failed payload download is an install failure. Routed through AuthFailure
/// so `needs_signin` is decided in exactly one place for all three error types.
impl From<crate::api::ApiError> for InstallFailure {
    fn from(err: crate::api::ApiError) -> Self {
        crate::auth::AuthFailure::from(err).into()
    }
}

/// What this machine knows about a pack. Mirrors types.ts's `InstallState`;
/// `installing` is owned by the renderer (it has the progress events) and is
/// therefore never produced here.
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "kind", rename_all = "kebab-case")]
pub enum InstallStatus {
    NotInstalled,
    #[serde(rename_all = "camelCase")]
    Installed {
        version_id: String,
        size_bytes: u64,
    },
    #[serde(rename_all = "camelCase")]
    Outdated {
        version_id: String,
        latest_version_id: String,
        size_bytes: u64,
    },
    #[serde(rename_all = "camelCase")]
    Broken {
        reason: String,
    },
}

/// The marker file left in an instance root. Its whole job is to answer
/// "installed, and of what version?" without walking 400 files.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Marker {
    version_id: String,
    version_name: String,
    minecraft: String,
    loader: Option<String>,
    loader_version: Option<String>,
    installed_at: String,
    file_count: usize,
}

/// Per-pack runtime state. One game at a time per pack; the map is keyed on
/// pack id so two different packs can run side by side.
#[derive(Default)]
pub struct InstallManager {
    running: Mutex<HashMap<String, RunningGame>>,
    /// Serialises installs of the SAME pack. React StrictMode double-invokes
    /// effects in dev and a double-click does the same in production; two
    /// installers writing the same instance would interleave partial files.
    ///
    /// A std Mutex, not tokio's, precisely so the guard below can release it
    /// from `Drop` — which is not async and cannot await.
    installing: Arc<StdMutex<HashSet<String>>>,
}

/// Held for the length of an install. Releasing on drop is the point: an
/// install that fails, is cancelled, or panics must not leave the pack
/// permanently "already installing" until the app restarts.
struct InstallGuard {
    flags: Arc<StdMutex<HashSet<String>>>,
    pack_id: String,
}

impl InstallManager {
    fn begin_install(&self, pack_id: &str) -> Result<InstallGuard, InstallFailure> {
        let mut installing = self
            .installing
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        if !installing.insert(pack_id.to_string()) {
            return Err(InstallFailure::message(
                "Ese pack ya se está instalando.".to_string(),
            ));
        }
        Ok(InstallGuard {
            flags: Arc::clone(&self.installing),
            pack_id: pack_id.to_string(),
        })
    }
}

impl Drop for InstallGuard {
    fn drop(&mut self) {
        if let Ok(mut flags) = self.flags.lock() {
            flags.remove(&self.pack_id);
        }
    }
}

// ── Shared setup ───────────────────────────────────────────────────────────

/// Everything a command needs before it can do anything: settings, layout, the
/// signed-in session, and the plan. Shared by install and launch so the two can
/// never disagree about where a pack lives or who is playing.
async fn prepare(
    app: &tauri::AppHandle,
    auth: &AuthState,
    manifest: &serde_json::Value,
) -> Result<(game::Prepared, reqwest::Client), InstallFailure> {
    let raw = serde_json::to_string(manifest)
        .map_err(|e| InstallFailure::message(format!("Manifiesto ilegible: {e}")))?;
    let parsed = crate::pack::parse_manifest(&raw)
        .map_err(|e| InstallFailure::message(format!("El manifiesto del pack no es válido: {e}")))?;
    let plan = resolve::plan(&parsed)?;

    let mc = auth.session().await.ok_or_else(|| {
        InstallFailure::needs_signin(
            "Inicia sesión con tu cuenta de Minecraft antes de instalar un pack.".to_string(),
        )
    })?;
    let session = session::GameSession::from_mc(&mc)?;

    let settings = settings::load(app);
    let layout = Layout::new(app, settings.game_dir())?;
    let instance = layout.instance(&plan.slug);
    layout.prepare(&instance)?;

    let http = reqwest::Client::builder()
        .user_agent(concat!("BoffLauncher/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|e| InstallFailure::message(format!("No se pudo crear el cliente HTTP: {e}")))?;

    Ok((
        game::Prepared {
            layout,
            instance,
            plan,
            settings,
            session,
        },
        http,
    ))
}

/// Run the blocking portablemc pass off the async runtime. `Prepared` is moved
/// in and back out because it owns the plan every later step needs.
async fn install_minecraft(
    prepared: game::Prepared,
    reporter: Reporter,
) -> Result<(game::Prepared, portablemc::base::Game), InstallFailure> {
    tauri::async_runtime::spawn_blocking(move || {
        let game = game::install(&prepared, &reporter)?;
        Ok((prepared, game))
    })
    .await
    .map_err(|e| InstallFailure::message(format!("La instalación se interrumpió: {e}")))?
}

/// Download the pack payload: mods and overrides as two phases, then a verify
/// pass and the marker.
///
/// A pack published with an `override` source still 404s if its blob was not
/// uploaded before publishing. The admin upload route now exists, but the
/// launcher keeps the failure deliberately worded as "falta subirlo" by
/// `api::missing_fallback`, so it reads as a publishing gap rather than as a
/// network fault; do not soften it into a retry.
async fn install_payload(
    app: &tauri::AppHandle,
    prepared: &game::Prepared,
    http: &reqwest::Client,
    password: Option<&str>,
    reporter: &Reporter,
) -> Result<(), InstallFailure> {
    let (mods, overrides): (Vec<_>, Vec<_>) = prepared
        .plan
        .files
        .iter()
        .cloned()
        .partition(|f| f.is_mod);

    files::download_all(
        app,
        http,
        &prepared.layout,
        &prepared.instance.minecraft,
        &prepared.plan.pack_id,
        password,
        &mods,
        Phase::Mods,
        reporter,
    )
    .await?;

    files::download_all(
        app,
        http,
        &prepared.layout,
        &prepared.instance.minecraft,
        &prepared.plan.pack_id,
        password,
        &overrides,
        Phase::Overrides,
        reporter,
    )
    .await?;

    reporter.emit(Phase::Verifying, 0.5, "", 0, 0);
    write_marker(prepared)?;
    reporter.emit(Phase::Verifying, 1.0, "", 0, 0);
    Ok(())
}

fn write_marker(prepared: &game::Prepared) -> Result<(), InstallFailure> {
    let plan = &prepared.plan;
    let marker = Marker {
        version_id: plan.version_id.clone(),
        version_name: plan.version_name.clone(),
        minecraft: plan.minecraft.clone(),
        loader: plan.loader.as_ref().map(|(k, _)| k.key().to_string()),
        loader_version: plan.loader.as_ref().map(|(_, v)| v.clone()),
        installed_at: chrono::Utc::now().to_rfc3339(),
        file_count: plan.files.len(),
    };
    let raw = serde_json::to_string_pretty(&marker)
        .map_err(|e| InstallFailure::message(format!("No se pudo serializar el estado: {e}")))?;
    // Written LAST, after every file verified. Its presence is the definition
    // of "installed", so writing it early would make an interrupted install
    // look complete.
    std::fs::write(&prepared.instance.marker, raw).map_err(|e| {
        InstallFailure::message(format!(
            "No se pudo escribir {}: {e}",
            prepared.instance.marker.display()
        ))
    })
}

fn read_marker(instance: &InstancePaths) -> Option<Marker> {
    let raw = std::fs::read_to_string(&instance.marker).ok()?;
    serde_json::from_str(&raw).ok()
}

// ── Commands ───────────────────────────────────────────────────────────────

/// Install or update a pack. `manifest` is the value `pack_manifest` returned —
/// it is re-validated here rather than trusted, because the renderer is the one
/// thing between the API and the disk that we do not control.
///
/// `password` is the same value `pack_manifest` was called with. A
/// password-protected pack re-checks it on EVERY download (§7.4: access can be
/// revoked between the listing and the file), so it has to be threaded all the
/// way through rather than proved once. Omitted by the renderer for a public
/// pack, which Tauri delivers as None.
#[tauri::command]
pub async fn install_pack(
    manifest: serde_json::Value,
    password: Option<String>,
    app: tauri::AppHandle,
    auth: tauri::State<'_, AuthState>,
    manager: tauri::State<'_, InstallManager>,
) -> Result<InstallStatus, InstallFailure> {
    let (prepared, http) = prepare(&app, &auth, &manifest).await?;
    let pack_id = prepared.plan.pack_id.clone();
    let _guard = manager.begin_install(&pack_id)?;

    let reporter = Reporter::new(app.clone(), &pack_id);
    reporter.emit(Phase::Resolving, 0.0, &prepared.plan.version_name, 0, 0);
    reporter.log(
        "info",
        &format!(
            "Instalando «{}» {} (Minecraft {}{}).",
            prepared.plan.slug,
            prepared.plan.version_name,
            prepared.plan.minecraft,
            prepared
                .plan
                .loader
                .as_ref()
                .map(|(k, v)| format!(", {} {v}", k.key()))
                .unwrap_or_default()
        ),
    );

    let (prepared, _game) = install_minecraft(prepared, reporter.clone()).await?;
    install_payload(&app, &prepared, &http, password.as_deref(), &reporter).await?;

    reporter.done();
    Ok(InstallStatus::Installed {
        version_id: prepared.plan.version_id.clone(),
        size_bytes: paths::dir_size(&prepared.instance.root),
    })
}

/// Verify-then-launch. The install pass runs again on every launch on purpose:
/// portablemc skips what is already correct, and a mod deleted by antivirus
/// between sessions is exactly the failure this catches.
#[tauri::command]
pub async fn launch_pack(
    manifest: serde_json::Value,
    password: Option<String>,
    app: tauri::AppHandle,
    auth: tauri::State<'_, AuthState>,
    manager: tauri::State<'_, InstallManager>,
) -> Result<u32, InstallFailure> {
    let (prepared, http) = prepare(&app, &auth, &manifest).await?;
    let pack_id = prepared.plan.pack_id.clone();

    {
        let mut running = manager.running.lock().await;
        if let Some(existing) = running.get(&pack_id) {
            if !existing.has_exited() {
                return Err(InstallFailure::message(
                    "Ese pack ya se está ejecutando.".to_string(),
                ));
            }
            running.remove(&pack_id);
        }
    }

    let _guard = manager.begin_install(&pack_id)?;
    process::emit_preparing(&app);

    let reporter = Reporter::new(app.clone(), &pack_id);
    let (prepared, game) = install_minecraft(prepared, reporter.clone()).await?;

    if let Err(err) = install_payload(&app, &prepared, &http, password.as_deref(), &reporter).await {
        process::emit_idle(&app);
        return Err(err);
    }
    reporter.done();

    let running = process::spawn(&app, &game)?;
    let pid = running.pid;
    settings::record_play(&app, &pack_id);
    manager.running.lock().await.insert(pack_id, running);
    Ok(pid)
}

/// Kill a running game. Idempotent: stopping a pack that is not running is what
/// happens when the player clicks stop just as the game crashed on its own.
#[tauri::command]
pub async fn stop_game(
    pack_id: String,
    manager: tauri::State<'_, InstallManager>,
) -> Result<(), InstallFailure> {
    let Some(running) = manager.running.lock().await.remove(&pack_id) else {
        return Ok(());
    };
    running.kill()
}

/// What is on disk for this pack, from the marker alone.
///
/// `latest_version_id` comes from the listing and is what turns `installed` into
/// `outdated`; passing None (the pack has no published version) can therefore
/// never produce `outdated`, which is the state that would offer an update to
/// nothing.
#[tauri::command]
pub async fn instance_scan(
    slug: String,
    latest_version_id: Option<String>,
    app: tauri::AppHandle,
) -> Result<InstallStatus, InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let instance = layout.instance(&slug);

    if !instance.root.is_dir() {
        return Ok(InstallStatus::NotInstalled);
    }

    let Some(marker) = read_marker(&instance) else {
        // A directory with no marker is an install that was interrupted, or one
        // whose marker was deleted. Either way reinstalling is the fix, and
        // calling it "not installed" would hide that files are already there.
        return Ok(InstallStatus::Broken {
            reason: "La instalación quedó a medias. Vuelve a instalar el pack.".to_string(),
        });
    };

    if !instance.minecraft.is_dir() {
        return Ok(InstallStatus::Broken {
            reason: "Falta la carpeta del juego. Vuelve a instalar el pack.".to_string(),
        });
    }

    let size_bytes = paths::dir_size(&instance.root);
    Ok(match latest_version_id {
        Some(latest) if latest != marker.version_id => InstallStatus::Outdated {
            version_id: marker.version_id,
            latest_version_id: latest,
            size_bytes,
        },
        _ => InstallStatus::Installed {
            version_id: marker.version_id,
            size_bytes,
        },
    })
}

/// Throw away the managed half of an instance so the next install rebuilds it
/// from the manifest.
///
/// Deliberately narrow: `mods/`, `config/`, `bin/` and the marker are ours and
/// are re-derived from the manifest, but the rest of `.minecraft` — saves,
/// screenshots, options.txt — belongs to the player. A "repair" that eats a
/// world is not a repair, and there is no undo for it.
#[tauri::command]
pub async fn repair_instance(
    slug: String,
    app: tauri::AppHandle,
    manager: tauri::State<'_, InstallManager>,
) -> Result<InstallStatus, InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let instance = layout.instance(&slug);

    // Removing files under a running game is how you get a half-loaded modpack
    // and a crash report nobody can read.
    if manager
        .running
        .lock()
        .await
        .values()
        .any(|game| !game.has_exited())
    {
        return Err(InstallFailure::message(
            "Cierra el juego antes de reparar la instalación.".to_string(),
        ));
    }

    for dir in [&instance.mods, &instance.config, &instance.bin] {
        if dir.is_dir() {
            std::fs::remove_dir_all(dir).map_err(|e| {
                InstallFailure::message(format!("No se pudo borrar {}: {e}", dir.display()))
            })?;
        }
    }
    // Last, so an interrupted repair still reads as broken rather than as a
    // healthy install missing its mods.
    let _ = std::fs::remove_file(&instance.marker);

    Ok(InstallStatus::NotInstalled)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn install_status_matches_the_renderers_union() {
        // types.ts:33 — kebab-case tags, camelCase fields.
        let raw = serde_json::to_string(&InstallStatus::NotInstalled).unwrap();
        assert_eq!(raw, r#"{"kind":"not-installed"}"#);

        let raw = serde_json::to_string(&InstallStatus::Outdated {
            version_id: "v1".into(),
            latest_version_id: "v2".into(),
            size_bytes: 10,
        })
        .unwrap();
        assert!(raw.contains(r#""kind":"outdated""#));
        assert!(raw.contains(r#""latestVersionId":"v2""#));
        assert!(raw.contains(r#""sizeBytes":10"#));
    }

    #[test]
    fn failures_carry_the_shape_runtime_ts_expects() {
        let raw = serde_json::to_string(&InstallFailure::message("boom")).unwrap();
        assert!(raw.contains(r#""message":"boom""#));
        assert!(raw.contains(r#""needs_signin":false"#));
    }
}
