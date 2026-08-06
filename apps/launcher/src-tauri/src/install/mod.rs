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

pub mod crash;
pub mod emulator;
pub mod files;
pub mod game;
pub mod instance;
pub mod paths;
pub mod process;
pub mod progress;
pub mod resolve;
/// §9 — per-instance Java runtime + memory, and the sizing heuristic.
pub mod runtime;
pub mod session;

use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex as StdMutex};

use serde::Serialize;
use tokio::sync::Mutex;

use crate::auth::AuthState;
use crate::backups;
use crate::settings;

use instance::{History, Marker, OptionalFile, OptionalState, RetainedVersion};
use paths::{InstancePaths, Layout};
use process::RunningGame;
use progress::{Phase, Reporter};
use resolve::PlannedFile;
use runtime::{JavaChoice, MemoryChoice, ResolvedRuntime, RuntimeOverride};

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

// The marker (`instance::Marker`) answers "installed, and of what version?"
// without walking 400 files, and since §9 it also records WHICH files the
// launcher owns — see instance.rs for why that set is the whole locked-vs-user
// distinction.

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

    // §9 — the heap and JVM this pack will actually use. Resolved once, here,
    // so install and launch can never disagree, and computed from the pack's
    // OWN mod count: the plan on a first install, the marker afterwards (which
    // knows which of the installed files are mods).
    let runtime = resolve_runtime(&settings, &instance, plan.files.iter().filter(|f| f.is_mod).count());

    Ok((
        game::Prepared {
            layout,
            instance,
            plan,
            settings,
            session,
            runtime,
        },
        http,
    ))
}

/// Fold the global settings and this instance's override into the values a
/// launch uses. `planned_mods` is the fallback mod count for a pack that has
/// never been installed and therefore has no marker to count.
fn resolve_runtime(
    settings: &settings::Settings,
    instance: &InstancePaths,
    planned_mods: usize,
) -> ResolvedRuntime {
    let mod_count = read_marker(instance)
        .map(|m| runtime::mod_count_of(&m))
        .filter(|n| *n > 0)
        .unwrap_or(planned_mods);
    runtime::resolve(
        settings,
        &read_runtime_override(instance),
        mod_count,
        runtime::total_ram_mib_or_assumed(),
    )
}

/// Never fails: a corrupt or absent override file means "inherit", which is
/// exactly what every instance installed before §9 should do.
fn read_runtime_override(instance: &InstancePaths) -> RuntimeOverride {
    std::fs::read_to_string(&instance.runtime)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_default()
}

fn write_runtime_override(
    instance: &InstancePaths,
    over: &RuntimeOverride,
) -> Result<(), InstallFailure> {
    if let Some(parent) = instance.runtime.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let raw = serde_json::to_string_pretty(over).map_err(|e| {
        InstallFailure::message(format!("No se pudo serializar la configuración: {e}"))
    })?;
    std::fs::write(&instance.runtime, raw).map_err(|e| {
        InstallFailure::message(format!(
            "No se pudo escribir {}: {e}",
            instance.runtime.display()
        ))
    })
}

/// Run the blocking portablemc pass off the async runtime. `Prepared` is moved
/// in and back out because it owns the plan every later step needs.
/// Extract bundled worlds from the manifest (version.worlds[]). First-install-only:
/// if saves/<folder> already exists, skip (never overwrite played saves). For each
/// world: fetch zip bytes (local blob store for local packs; existing override
/// download path for managed packs), verify sha512, extract with ZIP-SLIP
/// protection. Best-effort: failures log but do not block launch.
async fn extract_bundled_worlds(
    app: &tauri::AppHandle,
    prepared: &game::Prepared,
    http: &reqwest::Client,
    password: Option<&str>,
    reporter: &Reporter,
    manifest: &crate::pack::PackManifest,
) {
    let saves_dir = prepared.instance.minecraft.join("saves");
    for world in &manifest.version.worlds {
        let world_folder = world.folder.as_str();
        let world_path = saves_dir.join(world_folder);

        // First-install-only: skip if the world already exists
        if world_path.is_dir() {
            reporter.log(
                "info",
                &format!("Mundo «{world_folder}» ya existe; se conserva."),
            );
            continue;
        }

        // Fetch the world zip bytes
        let zip_bytes = match &prepared.plan.pack_id {
            pack_id if pack_id.starts_with("local-") => {
                // Local pack: fetch from local blob store
                let layout = &prepared.layout;
                let local_blob_path = files::local_blob_path(layout, &world.sha512);
                match std::fs::read(&local_blob_path) {
                    Ok(bytes) => bytes,
                    Err(e) => {
                        reporter.log(
                            "warn",
                            &format!(
                                "No se pudo leer el mundo «{world_folder}» del almacén local: {e}"
                            ),
                        );
                        continue;
                    }
                }
            }
            _ => {
                // Managed pack: fetch from override using existing path
                match fetch_world_bytes(app, prepared, http, password, world).await {
                    Ok(bytes) => bytes,
                    Err(e) => {
                        reporter.log(
                            "warn",
                            &format!("No se pudo descargar el mundo «{world_folder}\": {e:?}"),
                        );
                        continue;
                    }
                }
            }
        };

        // Verify sha512 before extracting
        let actual_sha512 = {
            use sha2::{Digest, Sha512};
            let mut hasher = Sha512::new();
            hasher.update(&zip_bytes);
            files::hex(&hasher.finalize())
        };
        if actual_sha512 != world.sha512.as_str() {
            reporter.log(
                "warn",
                &format!(
                    "El mundo «{world_folder}» está dañado (SHA-512 incorrecto); se omite."
                ),
            );
            continue;
        }

        // Extract with ZIP-SLIP protection
        if let Err(e) = extract_world_zip(&zip_bytes, &saves_dir, world_folder, reporter) {
            reporter.log(
                "warn",
                &format!("No se pudo extraer el mundo «{world_folder}\": {e}"),
            );
        }
    }
}

/// Fetch world zip bytes from override for a managed pack.
async fn fetch_world_bytes(
    app: &tauri::AppHandle,
    prepared: &game::Prepared,
    _http: &reqwest::Client,
    password: Option<&str>,
    world: &crate::pack::PackManifestVersionWorldsItem,
) -> Result<Vec<u8>, String> {
    // Worlds for managed packs are stored as overrides in the blob store
    let pack_file = crate::api::PackFile::Override {
        sha512: world.sha512.as_str().to_string(),
    };
    let response = crate::api::fetch_pack_file(
        app,
        &prepared.plan.pack_id,
        password,
        &pack_file,
    )
    .await
    .map_err(|e| format!("{e:?}"))?;
    let bytes = response.bytes().await.map_err(|e| e.to_string())?;
    Ok(bytes.to_vec())
}

/// Extract a world zip with ZIP-SLIP protection. Rejects entries that are
/// absolute paths or contain `..`, and verifies canonical paths stay under
/// saves/<folder>.
fn extract_world_zip(
    zip_bytes: &[u8],
    saves_dir: &std::path::Path,
    folder: &str,
    _reporter: &Reporter,
) -> Result<(), String> {
    let mut archive = zip::ZipArchive::new(std::io::Cursor::new(zip_bytes))
        .map_err(|e| format!("Zip inválido: {e}"))?;

    let target_dir = saves_dir.join(folder);
    std::fs::create_dir_all(&target_dir).map_err(|e| format!("No se pudo crear carpeta: {e}"))?;
    // Canonicalize the destination ONCE, up front: it exists, so this succeeds,
    // and it resolves any symlink in the path so the per-entry parent check
    // below compares like against like.
    let canonical_target =
        target_dir.canonicalize().map_err(|e| format!("No se pudo resolver destino: {e}"))?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i)
            .map_err(|e| format!("Error leyendo zip: {e}"))?;

        let path_str = file.name();
        // ZIP-SLIP, first line: reject absolute paths or any `..` segment. On its
        // own this already guarantees a `target_dir.join(path)` stays under
        // target_dir; the parent canonicalization below is defence-in-depth
        // against a symlinked entry.
        if path_str.starts_with('/')
            || path_str.starts_with('\\')
            || path_str.split(['/', '\\']).any(|seg| seg == "..")
        {
            return Err(format!("Ruta sospechosa en el zip: {path_str}"));
        }

        let full_path = target_dir.join(path_str);

        if file.is_dir() {
            std::fs::create_dir_all(&full_path)
                .map_err(|e| format!("No se pudo crear directorio: {e}"))?;
            continue;
        }

        // Create the parent, then canonicalize IT (a real, existing dir —
        // `full_path` itself does not exist yet, so canonicalizing it would
        // always fail) and confirm it is inside the destination.
        let parent = full_path
            .parent()
            .ok_or_else(|| format!("Ruta sin carpeta padre: {path_str}"))?;
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("No se pudo crear directorio padre: {e}"))?;
        let canonical_parent =
            parent.canonicalize().map_err(|e| format!("No se pudo resolver ruta: {e}"))?;
        if !canonical_parent.starts_with(&canonical_target) {
            return Err(format!("Ruta fuera del directorio de destino: {path_str}"));
        }

        let mut outfile = std::fs::File::create(&full_path)
            .map_err(|e| format!("No se pudo crear archivo: {e}"))?;
        std::io::copy(&mut file, &mut outfile)
            .map_err(|e| format!("No se pudo escribir archivo: {e}"))?;
    }

    Ok(())
}

/// Install (or verify) the game runtime, when the game HAS one to install.
/// Minecraft goes through the blocking portablemc pass; an emulator pack has no
/// runtime step at all — its executable arrives with the payload — so this
/// returns `None` and the launch path builds its command after the payload.
async fn install_runtime(
    prepared: game::Prepared,
    reporter: Reporter,
) -> Result<(game::Prepared, Option<portablemc::base::Game>), InstallFailure> {
    match prepared.plan.game {
        resolve::PlannedGame::Minecraft => {
            tauri::async_runtime::spawn_blocking(move || {
                let game = game::install(&prepared, &reporter)?;
                Ok((prepared, Some(game)))
            })
            .await
            .map_err(|e| InstallFailure::message(format!("La instalación se interrumpió: {e}")))?
        }
        resolve::PlannedGame::Emulator { .. } => Ok((prepared, None)),
    }
}

/// Download the pack payload: mods and overrides as two phases, then a verify
/// pass and the marker.
///
/// An `override` file whose blob was never uploaded (admin `POST packs/admin/blobs`)
/// 404s here. That failure is deliberately worded as "falta subirlo" by
/// `api::missing_fallback`, so it reads as a publishing gap rather than as a
/// network fault; do not soften it into a retry.
async fn install_payload(
    app: &tauri::AppHandle,
    prepared: &game::Prepared,
    http: &reqwest::Client,
    password: Option<&str>,
    reporter: &Reporter,
    manifest: &crate::pack::PackManifest,
) -> Result<(), InstallFailure> {
    // A file the player switched off is never fetched.
    //
    // This comment used to claim that the `<name>.jar.disabled` convention was
    // Forge/NeoForge-only and that Fabric and Quilt would load the mod anyway.
    // That is not so: all four loaders discover mods by scanning for files
    // ending in `.jar`, so all four skip a `.disabled` one — which is why Prism
    // and the Modrinth app use the suffix across every loader. The launcher now
    // does the same (instance::set_enabled_on_disk), because parking the file
    // makes re-enabling instant and leaves the mods folder legible to a player
    // who opens it by hand.
    //
    // The state file remains the INTENT and this filter remains the mechanism
    // that stops a download: the rename only exists once the bytes are on disk,
    // and the very first install has to know not to fetch them at all.
    //
    // `optional` is deliberately not consulted. It gates whether the pack
    // OFFERS the choice, not whether the launcher honours one already made —
    // requiring it here is what let a disabled non-optional mod come back on
    // the next launch, since the file was re-fetched into the path the rename
    // had just vacated.
    let disabled = read_optional_state(&prepared.instance);
    let wanted: Vec<PlannedFile> = prepared
        .plan
        .files
        .iter()
        .filter(|f| !disabled.is_disabled(&f.path))
        .cloned()
        .collect();

    let (mods, overrides): (Vec<_>, Vec<_>) = wanted.iter().cloned().partition(|f| f.is_mod);

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

    // Extract bundled worlds (first-install-only). Best-effort: a failure logs
    // but does not block the install. Worlds are only installed if saves/<folder>
    // does not already exist.
    extract_bundled_worlds(
        app,
        prepared,
        http,
        password,
        reporter,
        manifest,
    )
    .await;

    reporter.emit(Phase::Verifying, 0.5, "", 0, 0);

    // §9 "locked vs. user space". The previous marker is the ONLY authority on
    // what the launcher owns, so a mod dropped from the pack is removed here
    // and a jar the player added themselves — never recorded, therefore never
    // stale — is not a candidate. Before this the old jar simply stayed
    // forever, which is how a removed-but-still-loaded mod crashes a pack that
    // "updated fine".
    let previous = read_marker(&prepared.instance);
    let mut marker = build_marker(prepared, &wanted);
    // A pin survives a re-verify of the SAME version (every launch does one)
    // and is cleared by an install of a different one — which is only ever an
    // explicit "Actualizar" click.
    marker.pinned = previous
        .as_ref()
        .is_some_and(|p| p.pinned && p.version_id == marker.version_id);
    // A pinned relaunch rebuilds the plan from `managed`, which by construction
    // holds only the ENABLED optional files — so the catalogue would shrink to
    // the mods that are already on, and a switched-off one could never be
    // switched back on. Same version, same catalogue: inherit it.
    if marker.optional_files.is_empty() {
        if let Some(prev) = previous.as_ref().filter(|p| p.version_id == marker.version_id) {
            marker.optional_files = prev.optional_files.clone();
        }
    }
    if let Some(previous) = &previous {
        let stale = instance::stale_files(&previous.managed, &marker.managed_paths());
        for (path, outcome) in
            instance::sweep_with(&prepared.instance.minecraft, &stale, files::sha512_of)
        {
            match outcome {
                instance::SweepOutcome::Removed => {
                    reporter.log("info", &format!("Eliminado «{path}» (ya no está en el pack)."))
                }
                instance::SweepOutcome::Modified => reporter.log(
                    "warn",
                    &format!("«{path}» ya no está en el pack pero lo has modificado; se conserva."),
                ),
                _ => {}
            }
        }
    }

    write_marker(&prepared.instance, &marker)?;
    retain_version(&prepared.instance, &marker, prepared.settings.retain_versions());

    reporter.emit(Phase::Verifying, 1.0, "", 0, 0);
    Ok(())
}

/// The marker for what was just installed. `installed` is the files actually
/// written, which for §9 excludes the optional ones the player switched off —
/// recording those as managed would make the next update "clean up" files that
/// were never there.
fn build_marker(prepared: &game::Prepared, installed: &[PlannedFile]) -> Marker {
    let plan = &prepared.plan;
    Marker {
        version_id: plan.version_id.clone(),
        version_name: plan.version_name.clone(),
        minecraft: plan.minecraft.clone(),
        loader: plan.loader.as_ref().map(|(k, _)| k.key().to_string()),
        loader_version: plan.loader.as_ref().map(|(_, v)| v.clone()),
        installed_at: chrono::Utc::now().to_rfc3339(),
        file_count: installed.len(),
        pack_id: plan.pack_id.clone(),
        managed: installed.iter().map(instance::ManagedFile::from_planned).collect(),
        // The full catalogue, enabled or not: the toggle UI reads this, and a
        // disabled mod that vanished from the list could never be switched back
        // on without a reinstall.
        optional_files: plan
            .files
            .iter()
            .filter(|f| f.optional)
            .map(instance::ManagedFile::from_planned)
            .collect(),
        // A forward install always clears the pin: the player asked for this
        // version explicitly.
        pinned: false,
    }
}

fn write_marker(instance: &InstancePaths, marker: &Marker) -> Result<(), InstallFailure> {
    let raw = serde_json::to_string_pretty(marker)
        .map_err(|e| InstallFailure::message(format!("No se pudo serializar el estado: {e}")))?;
    // Written LAST, after every file verified. Its presence is the definition
    // of "installed", so writing it early would make an interrupted install
    // look complete.
    std::fs::write(&instance.marker, raw).map_err(|e| {
        InstallFailure::message(format!(
            "No se pudo escribir {}: {e}",
            instance.marker.display()
        ))
    })
}

fn read_marker(instance: &InstancePaths) -> Option<Marker> {
    let raw = std::fs::read_to_string(&instance.marker).ok()?;
    serde_json::from_str(&raw).ok()
}

fn read_history(instance: &InstancePaths) -> History {
    std::fs::read_to_string(&instance.history)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_default()
}

/// Best-effort by design: failing to record a rollback point must never fail
/// the install that just succeeded. The player would rather have the pack.
fn retain_version(instance: &InstancePaths, marker: &Marker, keep: usize) {
    let mut history = read_history(instance);
    history.push(marker, keep);
    if let Ok(raw) = serde_json::to_string_pretty(&history) {
        let _ = std::fs::write(&instance.history, raw);
    }
}

fn read_optional_state(instance: &InstancePaths) -> OptionalState {
    std::fs::read_to_string(&instance.optional)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_default()
}

fn write_optional_state(
    instance: &InstancePaths,
    state: &OptionalState,
) -> Result<(), InstallFailure> {
    if let Some(parent) = instance.optional.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let raw = serde_json::to_string_pretty(state)
        .map_err(|e| InstallFailure::message(format!("No se pudo serializar la selección: {e}")))?;
    std::fs::write(&instance.optional, raw).map_err(|e| {
        InstallFailure::message(format!(
            "No se pudo escribir {}: {e}",
            instance.optional.display()
        ))
    })
}

/// Rewrite the plan to the pinned version recorded on disk. Returns the version
/// name when a pin was applied, `None` when there is nothing to pin to.
///
/// Refuses to act on a marker with no managed list — a pre-§9 install, or a
/// hand-edited one. There is nothing to replay, and launching with an EMPTY
/// file list would present a modpack with no mods as a successful launch.
fn apply_pin(prepared: &mut game::Prepared) -> Option<String> {
    let marker = read_marker(&prepared.instance)?;
    if !marker.pinned
        || marker.managed.is_empty()
        || marker.version_id == prepared.plan.version_id
    {
        return None;
    }
    let plan = &mut prepared.plan;
    plan.version_id = marker.version_id.clone();
    plan.version_name = marker.version_name.clone();
    plan.minecraft = marker.minecraft.clone();
    plan.loader = match (&marker.loader, &marker.loader_version) {
        (Some(key), Some(version)) => resolve::LoaderKind::from_key(key).map(|k| (k, version.clone())),
        _ => None,
    };
    plan.files = marker.managed.iter().map(instance::ManagedFile::to_planned).collect();
    plan.total_bytes = plan.files.iter().map(|f| f.size).sum();
    Some(marker.version_name)
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
            "Instalando «{}» {} ({}).",
            prepared.plan.slug,
            prepared.plan.version_name,
            describe_game(&prepared.plan),
        ),
    );

    // §9 — the resolved heap and JVM go in the log too, not only in the UI: a
    // player pasting a crash log into a support thread brings the number with
    // them, which is half of every out-of-memory diagnosis. Meaningless for an
    // emulator pack, which has no JVM to size.
    if matches!(prepared.plan.game, resolve::PlannedGame::Minecraft) {
        reporter.log("info", &prepared.runtime.summary());
    }

    // Check if we need to backup before updating.
    if prepared.instance.root.is_dir() {
        let previous = read_marker(&prepared.instance);
        if let Some(prev) = previous {
            if prev.version_id != prepared.plan.version_id {
                // Version is changing; try to create a pre-update backup.
                if backups::backup_before_update(
                    &app,
                    &prepared.layout,
                    &prepared.plan.slug,
                    &prepared.plan.version_id,
                ) {
                    reporter.log("info", "Copia de seguridad creada antes de la actualización.");
                }
            }
        }
    }

    let (prepared, _game) = install_runtime(prepared, reporter.clone()).await?;

    // Parse the manifest for world extraction (needed by install_payload)
    let manifest_raw = serde_json::to_string(&manifest)
        .map_err(|e| InstallFailure::message(format!("Manifiesto ilegible: {e}")))?;
    let parsed_manifest = crate::pack::parse_manifest(&manifest_raw)
        .map_err(|e| InstallFailure::message(format!("El manifiesto del pack no es válido: {e}")))?;

    install_payload(&app, &prepared, &http, password.as_deref(), &reporter, &parsed_manifest).await?;

    reporter.done();
    Ok(InstallStatus::Installed {
        version_id: prepared.plan.version_id.clone(),
        size_bytes: paths::dir_size(&prepared.instance.root),
    })
}

/// One human-readable line for the install log: what game, what version.
fn describe_game(plan: &resolve::InstallPlan) -> String {
    match &plan.game {
        resolve::PlannedGame::Minecraft => format!(
            "Minecraft {}{}",
            plan.minecraft,
            plan.loader
                .as_ref()
                .map(|(k, v)| format!(", {} {v}", k.key()))
                .unwrap_or_default()
        ),
        resolve::PlannedGame::Emulator { kind, .. } => format!("emulador {}", kind.key()),
    }
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

    // §9 pinning. `launch_pack` re-verifies against the manifest it was handed,
    // which is always the LATEST — so without this a revert would be undone by
    // the very next click of Play, silently and with a progress bar that looks
    // like a normal launch. The retained marker carries the version's minecraft,
    // loader and complete file list, so the pin is applied to the whole plan and
    // not just to the payload: installing the latest loader under the old mods
    // is exactly the loader-mismatch crash rollback exists to escape.
    let mut prepared = prepared;
    if let Some(pinned) = apply_pin(&mut prepared) {
        reporter.log(
            "info",
            &format!("Este pack está anclado a «{pinned}». No se actualizará al iniciar."),
        );
    }

    if matches!(prepared.plan.game, resolve::PlannedGame::Minecraft) {
        reporter.log("info", &prepared.runtime.summary());
    }

    let (prepared, game) = install_runtime(prepared, reporter.clone()).await?;

    // Parse the manifest for world extraction
    let manifest_raw = serde_json::to_string(&manifest)
        .map_err(|e| InstallFailure::message(format!("Manifiesto ilegible: {e}")))?;
    let parsed_manifest = crate::pack::parse_manifest(&manifest_raw)
        .map_err(|e| InstallFailure::message(format!("El manifiesto del pack no es válido: {e}")))?;

    if let Err(err) = install_payload(&app, &prepared, &http, password.as_deref(), &reporter, &parsed_manifest).await {
        process::emit_idle(&app);
        return Err(err);
    }
    reporter.done();

    // Minecraft's command comes from portablemc; an emulator's is built here,
    // after the payload, because that is when its executable and ROM exist.
    let launchable = match game {
        Some(game) => process::Launchable::Minecraft(game),
        None => match emulator::launchable(&prepared) {
            Ok(launchable) => launchable,
            Err(err) => {
                process::emit_idle(&app);
                return Err(err);
            }
        },
    };

    let running = process::spawn(&app, &launchable, prepared.plan.quick_play.as_deref(), pack_id.clone())?;
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

    // There used to be a separate `instance.minecraft.is_dir()` check here. The
    // instance directory IS the game directory now, so `instance.root.is_dir()`
    // above already answers it — a second copy would be dead code that reads
    // like a real guard.

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

// ── §9: locked vs. user space, and version rollback ────────────────────────

/// The versions this machine can still roll back to, newest first.
///
/// Cheap by construction: each entry is one retained MARKER, not a copy of the
/// instance. The jars it names live once in `shared/cache`, keyed by sha512, so
/// retaining three versions of a 400-mod pack costs three JSON files plus
/// whatever blobs the player already had.
#[tauri::command]
pub async fn instance_versions(
    slug: String,
    app: tauri::AppHandle,
) -> Result<Vec<RetainedVersion>, InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let instance = layout.instance(&slug);

    let current = read_marker(&instance).map(|m| m.version_id);
    Ok(read_history(&instance)
        .versions
        .iter()
        .map(|v| RetainedVersion {
            version_id: v.version_id.clone(),
            version_name: v.version_name.clone(),
            minecraft: v.minecraft.clone(),
            loader: v.loader.clone(),
            loader_version: v.loader_version.clone(),
            installed_at: v.installed_at.clone(),
            file_count: v.file_count,
            current: current.as_deref() == Some(v.version_id.as_str()),
            // A pre-§9 entry carries no file list, so there is nothing to
            // replay and offering a revert to it would be a lie.
            revertible: !v.managed.is_empty(),
        })
        .collect())
}

/// One-click rollback (§9). Replays a retained version's recorded file list
/// through the same content-addressed download path an install uses, then
/// sweeps whatever the current version added.
///
/// No manifest is fetched: the server may already have replaced the version, and
/// "the update bricked it mid-session" is precisely when the network is the
/// thing you cannot rely on. Everything needed is in the retained marker.
///
/// The reverted instance is PINNED, so the next Play launches this version
/// instead of quietly reinstalling the one that broke.
#[tauri::command]
pub async fn instance_revert(
    slug: String,
    version_id: String,
    password: Option<String>,
    app: tauri::AppHandle,
    manager: tauri::State<'_, InstallManager>,
) -> Result<InstallStatus, InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let instance = layout.instance(&slug);

    if manager
        .running
        .lock()
        .await
        .values()
        .any(|game| !game.has_exited())
    {
        return Err(InstallFailure::message(
            "Cierra el juego antes de volver a una versión anterior.".to_string(),
        ));
    }

    let history = read_history(&instance);
    let target = history.find(&version_id).cloned().ok_or_else(|| {
        InstallFailure::message(
            "Esa versión ya no se conserva en este equipo. Instala el pack de nuevo.".to_string(),
        )
    })?;
    if target.managed.is_empty() {
        return Err(InstallFailure::message(
            "Esa versión se instaló con una versión antigua del launcher y no guarda su lista de \
             archivos. Instálala desde el servidor."
                .to_string(),
        ));
    }

    let pack_id = if target.pack_id.is_empty() {
        return Err(InstallFailure::message(
            "Esa versión no registra a qué pack pertenece. Instálala desde el servidor.".to_string(),
        ));
    } else {
        target.pack_id.clone()
    };

    let _guard = manager.begin_install(&pack_id)?;
    layout.prepare(&instance)?;

    let http = reqwest::Client::builder()
        .user_agent(concat!("BoffLauncher/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|e| InstallFailure::message(format!("No se pudo crear el cliente HTTP: {e}")))?;

    let reporter = Reporter::new(app.clone(), &pack_id);
    reporter.log(
        "info",
        &format!("Volviendo a «{}» de «{slug}».", target.version_name),
    );

    let disabled = read_optional_state(&instance);
    let wanted: Vec<PlannedFile> = target
        .managed
        .iter()
        .map(instance::ManagedFile::to_planned)
        // Same rule as the install pass: a revert must not silently re-enable
        // what the player switched off.
        .filter(|f| !disabled.is_disabled(&f.path))
        .collect();
    let (mods, overrides): (Vec<_>, Vec<_>) = wanted.iter().cloned().partition(|f| f.is_mod);

    for (batch, phase) in [(&mods, Phase::Mods), (&overrides, Phase::Overrides)] {
        files::download_all(
            &app,
            &http,
            &layout,
            &instance.minecraft,
            &pack_id,
            password.as_deref(),
            batch,
            phase,
            &reporter,
        )
        .await?;
    }

    reporter.emit(Phase::Verifying, 0.5, "", 0, 0);

    let mut marker = target.clone();
    marker.managed = wanted.iter().map(instance::ManagedFile::from_planned).collect();
    marker.file_count = marker.managed.len();
    marker.installed_at = chrono::Utc::now().to_rfc3339();
    marker.pinned = true;

    // Same rule as an update: only files the CURRENT marker claims, and only
    // those still byte-identical to what we installed. A mod the player added
    // themselves is not in that set and survives the rollback.
    if let Some(current) = read_marker(&instance) {
        let stale = instance::stale_files(&current.managed, &marker.managed_paths());
        for (path, outcome) in instance::sweep_with(&instance.minecraft, &stale, files::sha512_of) {
            if outcome == instance::SweepOutcome::Removed {
                reporter.log("info", &format!("Eliminado «{path}» (no está en esta versión)."));
            }
        }
    }

    write_marker(&instance, &marker)?;
    // Re-push so the version you just rolled back to is the newest retained
    // entry — otherwise three reverts in a row would evict it.
    retain_version(&instance, &marker, settings.retain_versions());
    reporter.emit(Phase::Verifying, 1.0, "", 0, 0);
    reporter.done();

    Ok(InstallStatus::Installed {
        version_id: marker.version_id,
        size_bytes: paths::dir_size(&instance.root),
    })
}

/// Release a pin so the pack follows the server's latest version again.
#[tauri::command]
pub async fn instance_unpin(
    slug: String,
    app: tauri::AppHandle,
) -> Result<InstallStatus, InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let instance = layout.instance(&slug);

    let Some(mut marker) = read_marker(&instance) else {
        return Ok(InstallStatus::NotInstalled);
    };
    marker.pinned = false;
    write_marker(&instance, &marker)?;
    Ok(InstallStatus::Installed {
        version_id: marker.version_id,
        size_bytes: paths::dir_size(&instance.root),
    })
}

/// The optional files this pack declares, and whether each is switched on.
/// Empty before the first install: optional-ness comes from the manifest, and
/// the marker is where the launcher remembers it.
#[tauri::command]
pub async fn instance_optional(
    slug: String,
    app: tauri::AppHandle,
) -> Result<Vec<OptionalFile>, InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let instance = layout.instance(&slug);

    let catalogue = read_marker(&instance)
        .map(|m| m.optional_files)
        .unwrap_or_default();
    Ok(instance::optional_list(&catalogue, &read_optional_state(&instance)))
}

/// One row of the Content tab.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContentFile {
    pub path: String,
    pub size: u64,
    pub is_mod: bool,
    /// The pack marks this as something the player may switch off. Not the same
    /// as `enabled` — this is whether the choice is OFFERED.
    pub optional: bool,
    pub enabled: bool,
    /// True when the bytes are on disk under either name. False means the pack
    /// declares the file but this instance has not installed it yet.
    pub installed: bool,
    pub source: instance::ManagedSource,
}

/// Everything the Content tab renders for one instance: the pack's files, each
/// with its on-disk and enabled status.
///
/// Built from the marker rather than the manifest so it describes what this
/// INSTANCE actually has. The renderer layers the pack's own declared files on
/// top for a local pack that has never been installed, where there is no marker
/// to read at all.
#[tauri::command]
pub async fn instance_content(
    slug: String,
    app: tauri::AppHandle,
) -> Result<Vec<ContentFile>, InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let instance = layout.instance(&slug);

    let Some(marker) = read_marker(&instance) else {
        return Ok(Vec::new());
    };
    let state = read_optional_state(&instance);

    // `managed` holds what is installed; `optional_files` is the full
    // catalogue including the ones switched off. Union, deduped by path, or a
    // disabled mod disappears from the list it is meant to be toggled from.
    let mut seen: HashSet<String> = HashSet::new();
    let mut out = Vec::new();
    for file in marker.managed.iter().chain(marker.optional_files.iter()) {
        let path = instance::normalise(&file.path);
        if !seen.insert(path.clone()) {
            continue;
        }
        let active = instance::safe_join(&instance.minecraft, &path)
            .map(|p| p.is_file())
            .unwrap_or(false);
        let parked = instance::is_parked(&instance.minecraft, &path);
        out.push(ContentFile {
            size: file.size,
            is_mod: file.is_mod,
            optional: file.optional,
            enabled: !state.is_disabled(&path),
            installed: active || parked,
            source: file.source.clone(),
            path,
        });
    }
    out.sort_by(|a, b| a.path.to_lowercase().cmp(&b.path.to_lowercase()));
    Ok(out)
}

/// Switch one file on or off.
///
/// Two things happen, and both are needed. The state file records the INTENT,
/// which is what survives a reinstall and what the plan filter reads before any
/// bytes exist. The rename applies it to the copy already on disk, so the
/// change is visible in-game on the very next launch without a download — and
/// reversible just as cheaply.
///
/// A file that is not on disk yet is not an error: the intent is stored and the
/// next install pass honours it by never fetching the file.
#[tauri::command]
pub async fn instance_optional_set(
    slug: String,
    path: String,
    enabled: bool,
    app: tauri::AppHandle,
) -> Result<Vec<OptionalFile>, InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let instance = layout.instance(&slug);

    let mut state = read_optional_state(&instance);
    state.set(&path, enabled);
    write_optional_state(&instance, &state)?;

    instance::set_enabled_on_disk(&instance.minecraft, &path, enabled).map_err(|e| {
        InstallFailure::message(format!("No se pudo {} «{path}»: {e}", if enabled { "activar" } else { "desactivar" }))
    })?;

    let catalogue = read_marker(&instance)
        .map(|m| m.optional_files)
        .unwrap_or_default();
    Ok(instance::optional_list(&catalogue, &state))
}

// ── User-provided files (ROM dumps and the like) ───────────────────────────

/// One file the pack expects the player to supply, and whether it is already
/// available (on disk or in a blob store) so the UI knows to stop prompting.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserFile {
    pub path: String,
    pub hint: String,
    pub sha512: String,
    pub size: u64,
    pub satisfied: bool,
}

/// Parse a manifest and enumerate its `user-provided` files. No session
/// needed: this reads the manifest the renderer already holds and the local
/// disk, never the API.
fn user_files_view(
    app: &tauri::AppHandle,
    manifest: &serde_json::Value,
) -> Result<(Layout, InstancePaths, Vec<UserFile>), InstallFailure> {
    let raw = serde_json::to_string(manifest)
        .map_err(|e| InstallFailure::message(format!("Manifiesto ilegible: {e}")))?;
    let parsed = crate::pack::parse_manifest(&raw)
        .map_err(|e| InstallFailure::message(format!("El manifiesto del pack no es válido: {e}")))?;
    let plan = resolve::plan(&parsed)?;

    let settings = settings::load(app);
    let layout = Layout::new(app, settings.game_dir())?;
    let instance = layout.instance(&plan.slug);

    let files = plan
        .files
        .iter()
        .filter_map(|f| match &f.fetch {
            resolve::Fetch::UserProvided { hint } => Some(UserFile {
                path: f.path.clone(),
                hint: hint.clone(),
                sha512: f.sha512.clone(),
                size: f.size,
                satisfied: files::is_satisfied(&layout, &instance.minecraft, f),
            }),
            _ => None,
        })
        .collect();
    Ok((layout, instance, files))
}

/// The files this pack needs the player to supply, with their current status.
/// The renderer calls this before offering install/play on an emulator pack,
/// and after each `instance_provide_user_file` to refresh the checklist.
#[tauri::command]
pub async fn instance_user_files(
    manifest: serde_json::Value,
    app: tauri::AppHandle,
) -> Result<Vec<UserFile>, InstallFailure> {
    Ok(user_files_view(&app, &manifest)?.2)
}

/// Take the player's file for one `user-provided` entry: open the native
/// picker (dialogs live on the Rust side of the boundary, like every other
/// picker in this app), verify the choice against the manifest's sha512/size,
/// file it in the local blob store (so a reinstall or repair never asks again),
/// and place it at its instance path.
///
/// The hash check is the contract: a wrong dump is rejected HERE, with a clear
/// message, rather than surfacing later as a corrupt-download error mid-install.
#[tauri::command]
pub async fn instance_provide_user_file(
    manifest: serde_json::Value,
    path: String,
    app: tauri::AppHandle,
) -> Result<Vec<UserFile>, InstallFailure> {
    use tauri_plugin_dialog::DialogExt;

    let (layout, instance, files) = user_files_view(&app, &manifest)?;
    let wanted = files
        .iter()
        .find(|f| f.path.eq_ignore_ascii_case(&path))
        .ok_or_else(|| {
            InstallFailure::message("El pack no espera ese archivo.".to_string())
        })?;

    let dialog = app.dialog().clone();
    let title = wanted.hint.clone();
    let chosen = tauri::async_runtime::spawn_blocking(move || {
        dialog.file().set_title(&title).blocking_pick_file()
    })
    .await
    .map_err(|e| InstallFailure::message(format!("La selección se interrumpió: {e}")))?;
    let Some(picked) = chosen else {
        return Err(InstallFailure::message("Selección cancelada.".to_string()));
    };
    let source = picked
        .into_path()
        .map_err(|e| InstallFailure::message(format!("Ruta de origen inválida: {e}")))?;

    // Hashing and copying a ROM can take seconds — off the async runtime, like
    // every other blocking file pass in this module.
    let expected_sha512 = wanted.sha512.clone();
    let expected_size = wanted.size;
    let dest_path = wanted.path.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let meta = std::fs::metadata(&source).map_err(|e| {
            InstallFailure::message(format!("No se pudo leer el archivo seleccionado: {e}"))
        })?;
        if expected_size > 0 && meta.len() != expected_size {
            return Err(InstallFailure::message(format!(
                "El archivo no coincide con el que espera el pack ({} bytes en lugar de {}). \
                 Comprueba que es el volcado correcto.",
                meta.len(),
                expected_size
            )));
        }
        let actual = files::sha512_of(&source).ok_or_else(|| {
            InstallFailure::message("No se pudo leer el archivo seleccionado.".to_string())
        })?;
        if !actual.eq_ignore_ascii_case(&expected_sha512) {
            return Err(InstallFailure::message(
                "El archivo no coincide con el que espera el pack (hash distinto). Comprueba que \
                 es el volcado correcto, sin modificar."
                    .to_string(),
            ));
        }

        let blob = files::import_local_blob(&layout, &source, &actual)?;
        // Place it at its instance path too, so a pack already installed gets
        // the file without another install pass.
        if let Some(dest) = instance::safe_join(&instance.minecraft, &dest_path) {
            files::place_blob(&blob, &dest)?;
        }
        Ok(())
    })
    .await
    .map_err(|e| InstallFailure::message(format!("La verificación se interrumpió: {e}")))??;

    Ok(user_files_view(&app, &manifest)?.2)
}

// ── §9: per-instance Java runtime + memory ─────────────────────────────────

/// What the runtime panel renders: the player's choice, what it resolves to,
/// and the global values it would fall back to.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstanceRuntime {
    /// The stored per-pack choice, `inherit`/`inherit` when nothing was set.
    pub over: RuntimeOverride,
    /// What a launch right now would actually use.
    pub effective: ResolvedRuntime,
    /// So the UI can label the inherit option "heredar (6 GB)" instead of
    /// making the player open Ajustes to find out what they are inheriting.
    pub global_memory_mib: u32,
    pub global_memory_auto: bool,
    pub global_java_path: Option<String>,
}

fn instance_runtime_view(
    settings: &settings::Settings,
    instance: &InstancePaths,
) -> InstanceRuntime {
    InstanceRuntime {
        over: read_runtime_override(instance),
        // No plan here, so a pack that has never been installed reports 0 mods
        // and gets the vanilla floor — which is honest: there is nothing on disk
        // to size for yet, and the first install recomputes it from the plan.
        effective: resolve_runtime(settings, instance, 0),
        global_memory_mib: settings.memory_mib,
        global_memory_auto: settings.memory_auto,
        global_java_path: settings.java_path().map(str::to_string),
    }
}

/// §9 — the effective Java and heap for one pack, surfaced BEFORE launch so a
/// player reads "6,0 GB (automático, 214 mods)" rather than guessing.
#[tauri::command]
pub async fn instance_runtime(
    slug: String,
    app: tauri::AppHandle,
) -> Result<InstanceRuntime, InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    Ok(instance_runtime_view(&settings, &layout.instance(&slug)))
}

/// Set this pack's Java and memory choice. Both arguments are the full
/// three-state enum, so "heredar" is an explicit value the player can return to
/// rather than something they have to reconstruct by clearing a field.
///
/// Takes effect on the next install, update or launch, all of which re-resolve
/// through `prepare()`. Nothing on disk changes here — a heap size is an argv
/// flag, not a file.
#[tauri::command]
pub async fn instance_runtime_set(
    slug: String,
    memory: MemoryChoice,
    java: JavaChoice,
    app: tauri::AppHandle,
) -> Result<InstanceRuntime, InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let instance = layout.instance(&slug);

    write_runtime_override(&instance, &RuntimeOverride { memory, java })?;
    Ok(instance_runtime_view(&settings, &instance))
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
