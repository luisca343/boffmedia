// The install and launch pipeline, and the commands the renderer
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

/// Placement is not activation: options.txt and the Iris/Oculus config.
pub mod activate;
pub mod crash;
pub mod emulator;
pub mod files;
pub mod game;
pub mod initial;
pub mod instance;
/// Optional content: the feature model a player chooses from.
pub mod optional;
pub mod patch;
pub mod paths;
pub mod process;
pub mod progress;
pub mod resolve;
/// Per-instance Java runtime + memory, and the sizing heuristic.
pub mod runtime;
pub mod session;

use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex as StdMutex};

use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

use crate::auth::AuthState;
use crate::backups;
use crate::settings;

use instance::{History, ManagedSource, Marker, OptionalFile, OptionalState, RetainedVersion};
use paths::{InstancePaths, Layout};
use process::RunningGame;
use progress::{Phase, Reporter};
use resolve::PlannedFile;
use runtime::{JavaChoice, MemoryChoice, ResolvedRuntime, RuntimeOverride};

/// Serialisable failure for the renderer.
///
/// The shape ({ message, needs_signin, code }) is NOT incidental: runtime.ts's
/// `asFailure()` reads these fields, and anything else renders as
/// "Error inesperado". Kept similar to `auth::AuthFailure` and `api::ApiError`
/// so the renderer needs one error path, not three. The optional `code` field
/// allows UI-specific error handling (e.g., randomizer-specific messages).
#[derive(Debug, Clone, Serialize)]
pub struct InstallFailure {
    pub message: String,
    pub needs_signin: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<String>,
}

impl InstallFailure {
    pub fn message(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            needs_signin: false,
            code: None,
        }
    }

    /// Only for "we have no Minecraft session" — a disk or network problem is
    /// not fixed by signing in again, and telling the player otherwise sends
    /// them round a loop.
    pub fn needs_signin(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            needs_signin: true,
            code: None,
        }
    }

    /// Create a failure with an error code for UI-specific handling.
    pub fn with_code(message: impl Into<String>, code: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            needs_signin: false,
            code: Some(code.into()),
        }
    }
}

impl From<crate::auth::AuthFailure> for InstallFailure {
    fn from(err: crate::auth::AuthFailure) -> Self {
        Self {
            message: err.message,
            needs_signin: err.needs_signin,
            code: None,
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
        #[serde(skip_serializing_if = "Vec::is_empty", default)]
        missing_user_files: Vec<MissingUserFile>,
        /// True when the pack is linked to a randomizer event and the ROM has
        /// not yet been patched (expected sha512 == clean_rom_sha512).
        #[serde(skip_serializing_if = "is_false", default)]
        randomizer_blocked: bool,
    },
    #[serde(rename_all = "camelCase")]
    Outdated {
        version_id: String,
        latest_version_id: String,
        size_bytes: u64,
        #[serde(skip_serializing_if = "Vec::is_empty", default)]
        missing_user_files: Vec<MissingUserFile>,
        /// True when the pack is linked to a randomizer event and the ROM has
        /// not yet been patched (expected sha512 == clean_rom_sha512).
        #[serde(skip_serializing_if = "is_false", default)]
        randomizer_blocked: bool,
    },
    #[serde(rename_all = "camelCase")]
    Broken {
        reason: String,
    },
}

/// Helper for skip_serializing_if to omit false booleans.
fn is_false(b: &bool) -> bool {
    !b
}

/// A user-provided file that is required but not yet satisfied.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MissingUserFile {
    pub path: String,
    pub hint: String,
    pub file_size: u64,
}

/// The path to the emulator ROM slot managed by the randomizer, if present.
/// Returns None if there is no randomizer gate or the ROM path is not found.
/// Used to exclude the slot from blob-cache re-satisfaction and missing-file checks.
pub fn randomizer_rom_slot_path(marker: &Marker) -> Option<String> {
    if marker.randomizer.is_none() || marker.game_type != instance::GameType::Emulator {
        return None;
    }
    let emulator = marker.emulator.as_ref()?;
    Some(emulator.rom.clone())
}

/// The required `user-provided` files this instance still lacks. Read from the
/// marker (which records every managed file, including the ones we never fetch),
/// so it works from a plain library scan with no manifest in hand.
///
/// Cheap by design — no hashing: the local blob store is content-addressed, so
/// the mere presence of `<sha512>` there means a reinstall would place the file;
/// and a file already at the instance path was hash-verified when it was placed.
/// Optional entries (`env.client == optional`) never block and are skipped.
/// Randomizer ROM slots are also skipped — they are managed by the randomizer.
pub fn compute_missing_user_files(
    layout: &Layout,
    instance: &InstancePaths,
    marker: &Marker,
) -> Vec<MissingUserFile> {
    let norm = |p: &str| p.to_lowercase().replace('\\', "/");
    let randomizer_slot_norm = randomizer_rom_slot_path(marker).map(|p| norm(&p));

    let mut missing = Vec::new();
    for file in &marker.managed {
        if file.optional {
            continue;
        }
        let ManagedSource::UserProvided { hint } = &file.source else {
            continue;
        };
        // Skip the randomizer ROM slot if present
        if let Some(ref slot_norm) = randomizer_slot_norm {
            if norm(&file.path) == *slot_norm {
                continue;
            }
        }
        let sha512 = file.sha512.to_lowercase();
        let in_blob = files::local_blob_path(layout, &sha512).is_file();
        let on_disk = std::fs::metadata(instance.minecraft.join(file.path.replace('\\', "/")))
            .map(|m| m.is_file() && (file.size == 0 || m.len() == file.size))
            .unwrap_or(false);
        if !in_blob && !on_disk {
            missing.push(MissingUserFile {
                path: file.path.clone(),
                hint: hint.clone(),
                file_size: file.size,
            });
        }
    }
    missing
}

/// True when the pack is linked to a randomizer event and the ROM has not yet
/// been patched (i.e., the expected sha512 in the managed entry still equals
/// the clean_rom_sha512 from the gate). Cheap by design: no hashing, just
/// marker field comparison.
pub fn compute_randomizer_blocked(marker: &Marker) -> bool {
    let Some(gate) = &marker.randomizer else {
        return false;
    };
    // Find the ROM file in the managed list (for emulator packs only)
    if marker.game_type != instance::GameType::Emulator {
        return false;
    }
    let Some(emulator) = &marker.emulator else {
        return false;
    };
    // Find the ROM's managed entry
    let norm = |p: &str| p.to_lowercase().replace('\\', "/");
    let rom_key = norm(&emulator.rom);
    if let Some(rom_entry) = marker.managed.iter().find(|f| norm(&f.path) == rom_key) {
        // Blocked if expected sha512 == clean_rom_sha512 (player never patched)
        rom_entry.sha512.eq_ignore_ascii_case(&gate.clean_rom_sha512)
    } else {
        false
    }
}

// The marker (`instance::Marker`) answers "installed, and of what version?"
// without walking 400 files, and records WHICH files the launcher owns — see
// instance.rs for why that set is the whole locked-vs-user distinction.

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
    /// True while an install is downloading or a game is running. A session
    /// mutation (account switch, sign-out) must refuse in this window: the
    /// process-global launcher token is what those operations authenticate
    /// with, and swapping it mid-flight re-authenticates their remaining
    /// requests as somebody else (C1).
    pub async fn is_busy(&self) -> bool {
        if !self.running.lock().await.is_empty() {
            return true;
        }
        !self
            .installing
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
            .is_empty()
    }

    /// True while THIS pack's game is running. Distinct from `is_busy`, which
    /// asks about the whole app: activation writes are only unsafe against the
    /// instance Minecraft currently has open, because it is that process which
    /// rewrites `options.txt` from memory when it exits (D3).
    pub async fn is_pack_running(&self, pack_id: &str) -> bool {
        self.running
            .lock()
            .await
            .get(pack_id)
            .is_some_and(|game| !game.has_exited())
    }

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

/// Parse+fully-validate the manifest value the renderer handed us. The renderer
/// is the one thing between the API and the disk we do not control, so this is
/// re-checked rather than trusted.
fn parse_manifest_value(
    manifest: &serde_json::Value,
) -> Result<crate::pack::PackManifest, InstallFailure> {
    let raw = serde_json::to_string(manifest)
        .map_err(|e| InstallFailure::message(format!("Manifiesto ilegible: {e}")))?;
    crate::pack::parse_manifest(&raw)
        .map_err(|e| InstallFailure::message(format!("El manifiesto del pack no es válido: {e}")))
}

/// Everything a command needs before it can do anything: settings, layout, the
/// signed-in session, and the plan. Shared by install and launch so the two can
/// never disagree about where a pack lives or who is playing.
async fn prepare(
    app: &tauri::AppHandle,
    auth: &AuthState,
    manifest: &serde_json::Value,
) -> Result<(game::Prepared, reqwest::Client), InstallFailure> {
    let parsed = parse_manifest_value(manifest)?;
    let plan = match resolve::plan(&parsed)? {
        resolve::PlannedGame::Minecraft(mc_plan) => mc_plan,
        // The command dispatches non-Minecraft packs before ever calling
        // prepare(); reaching here with one is an internal bug.
        _ => {
            return Err(InstallFailure::message(
                "interno: prepare() sólo maneja packs de Minecraft".to_string(),
            ))
        }
    };

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
        .user_agent(concat!("BoffmediaApp/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|e| InstallFailure::message(format!("No se pudo crear el cliente HTTP: {e}")))?;

    // The heap and JVM this pack will actually use. Resolved once, here,
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
/// what an instance with no per-pack choice should do.
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
        None,
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
    // The `<name>.jar.disabled` convention works on ALL FOUR loaders, not just
    // Forge/NeoForge: every one of them discovers mods by scanning for files
    // ending in `.jar`, so every one skips a `.disabled` one. Prism and the
    // Modrinth app use the suffix across every loader for the same reason, and
    // so does this launcher (instance::set_enabled_on_disk) — parking the file
    // makes re-enabling instant and leaves the mods folder legible to a player
    // who opens it by hand.
    //
    // The state file remains the INTENT and this filter remains the mechanism
    // that stops a download: the rename only exists once the bytes are on disk,
    // and the very first install has to know not to fetch them at all.
    //
    // `optional` is deliberately not consulted. It gates whether the pack
    // OFFERS the choice, not whether the launcher honours one already made.
    // Requiring it here brings a disabled non-optional mod back on the next
    // launch: the file is re-fetched into the path the rename just vacated.
    //
    // FEATURES, not paths, are what the player actually switched. A feature owns
    // several paths — Iris + Sodium + a config + the `.zip` — and subtracting
    // them here, before a byte moves, is what makes the install-time chooser
    // worth having: an unwanted 400 MB shaderpack is never downloaded rather
    // than downloaded and then parked.
    let state = read_optional_state(&prepared.instance);
    let views = optional::resolve(
        &prepared.plan.optional_groups,
        &state,
        &plan_sizes(&prepared.plan.files),
    );
    let feature_off = optional::disabled_paths(&views);
    // A path a feature has switched ON overrides a stale legacy opt-out for the
    // same file: the feature record is the newer and more specific statement.
    let feature_on = optional::enabled_paths(&views);

    let wanted: Vec<PlannedFile> = prepared
        .plan
        .files
        .iter()
        .filter(|f| {
            let path = instance::normalise(&f.path);
            if feature_off.contains(&path) {
                return false;
            }
            feature_on.contains(&path) || !state.is_path_disabled(&path)
        })
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

    // Romhacks: materialize any patched files now that their base + patch are on
    // disk (Minecraft packs never carry these, but the pass is a cheap no-op).
    let patched: Vec<PlannedFile> = wanted
        .iter()
        .filter(|f| matches!(f.fetch, resolve::Fetch::Patched { .. }))
        .cloned()
        .collect();
    files::materialize_patched(&prepared.layout, &prepared.instance.minecraft, &patched, reporter)?;

    // First-install-only seeds (a starting `.sav`, a default options file).
    // Same "written once, then owned by the player" contract as worlds, and
    // likewise best-effort — a failed seed never blocks the install.
    initial::seed_initial_files(
        app,
        &prepared.instance,
        &prepared.layout,
        &prepared.plan.pack_id,
        http,
        password,
        reporter,
        manifest,
    )
    .await;

    reporter.emit(Phase::Verifying, 0.5, "", 0, 0);

    // Locked vs. user space. The previous marker is the ONLY authority on what
    // the launcher owns, so a mod dropped from the pack is removed here, and a
    // jar the player added themselves — never recorded, therefore never stale —
    // is not a candidate. Without this the dropped jar stays forever, which is
    // how a removed-but-still-loaded mod crashes a pack that "updated fine".
    let previous = read_marker(&prepared.instance);
    let mut marker = build_marker(prepared, &wanted, &manifest);
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
    // Same trap, same fix, for the feature catalogue: a pinned relaunch rebuilds
    // its plan from `managed`, which holds no files for a feature that is off.
    if marker.optional_groups.is_empty() {
        if let Some(prev) = previous.as_ref().filter(|p| p.version_id == marker.version_id) {
            marker.optional_groups = prev.optional_groups.clone();
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

    // Placement is not activation: a resourcepack sitting in `resourcepacks/`
    // and a shaderpack in `shaderpacks/` do nothing until a config names them.
    //
    // Here specifically, and not in a launch-only step, because this function IS
    // the pre-launch verify pass as well as the installer — so one call covers
    // both, and it always runs before `process::spawn`. That ordering is what
    // makes D3 work: Minecraft rewrites `options.txt` from memory when it exits,
    // so the only safe moment to touch it is while the game is not running, and
    // a toggle made mid-session is applied right here on the next launch.
    match activate::reconcile(
        &prepared.instance.minecraft,
        &views,
        prepared.plan.loader.as_ref().map(|(kind, _)| kind.key()),
    ) {
        Ok(lines) => {
            for line in lines {
                reporter.log("info", &line);
            }
        }
        // Never fatal. A pack whose files are all present is playable; a config
        // we could not rewrite is a wrong-looking resourcepack list, not a
        // broken install, and failing the launch over it would be the worse bug.
        Err(e) => reporter.log(
            "warn",
            &format!("No se pudo aplicar la configuración de contenido opcional: {e}"),
        ),
    }

    reporter.emit(Phase::Verifying, 1.0, "", 0, 0);
    Ok(())
}

/// The marker for what was just installed. `installed` is the files actually
/// written, which excludes the optional ones the player switched off —
/// recording those as managed would make the next update "clean up" files that
/// were never there.
///
/// If the manifest carries a `randomizer` block, populate the marker's randomizer
/// field; otherwise clear it (e.g., if the pack is no longer linked to an active
/// randomizer event).
fn build_marker(prepared: &game::Prepared, installed: &[PlannedFile], manifest: &crate::pack::PackManifest) -> Marker {
    let plan = &prepared.plan;
    Marker {
        version_id: plan.version_id.clone(),
        version_name: plan.version_name.clone(),
        minecraft: Some(plan.minecraft.clone()),
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
        // The FEATURE catalogue, for the same reason and one level up: a
        // switched-off feature owns nothing in `managed`, so without this the
        // chooser has no switch to render and the choice becomes irreversible.
        optional_groups: plan.optional_groups.clone(),
        // A forward install always clears the pin: the player asked for this
        // version explicitly.
        pinned: false,
        // Only Minecraft is handled here; other game types get their own arm.
        game_type: instance::GameType::Minecraft,
        emulator: None,
        // Populate randomizer gate from manifest, if present
        randomizer: manifest.randomizer.as_ref().map(|r| instance::RandomizerGate {
            event_id: r.event_id,
            clean_rom_sha512: r.clean_rom_sha512.to_string(),
        }),
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

/// Emu-M3 — stash the just-fetched manifest beside the instance. Best-effort:
/// the value arrived from the network (JS fetched it), so it is a good copy; a
/// failure to persist it only costs a future offline launch, never this one.
/// Runs for every game type but is only read back by the offline emulator path.
fn cache_manifest(app: &tauri::AppHandle, manifest: &serde_json::Value) {
    let Ok(parsed) = parse_manifest_value(manifest) else {
        return;
    };
    let settings = settings::load(app);
    let Ok(layout) = Layout::new(app, settings.game_dir()) else {
        return;
    };
    let instance = layout.instance(parsed.pack.slug.as_str());
    let _ = std::fs::create_dir_all(&instance.root);
    if let Ok(raw) = serde_json::to_string(manifest) {
        let _ = std::fs::write(&instance.manifest, raw);
    }
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

/// Declared byte size per instance path, so a feature can show what it costs
/// before anything is downloaded. Built from the plan (the manifest's own
/// numbers) rather than from disk, because the whole point is to answer the
/// question BEFORE the file exists.
fn plan_sizes(files: &[PlannedFile]) -> HashMap<String, u64> {
    files
        .iter()
        .map(|f| (instance::normalise(&f.path), f.size))
        .collect()
}

/// The same index built from a marker, for the surfaces that have no plan in
/// hand — the Content tab reads what this instance HAS, not what a manifest
/// declares.
fn marker_sizes(marker: &Marker) -> HashMap<String, u64> {
    marker
        .managed
        .iter()
        .chain(marker.optional_files.iter())
        .map(|f| (instance::normalise(&f.path), f.size))
        .collect()
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
/// Refuses to act on a marker with no managed list — an older install, or a
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
    // A pinned Minecraft marker always carries its version; default to empty for
    // the impossible None so pinning can never silently install "no version".
    plan.minecraft = marker.minecraft.clone().unwrap_or_default();
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
/// password-protected pack re-checks it on EVERY download (access can be
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
    // Dispatch by game type. Emulator packs take an entirely separate, Java-free
    // path; everything below is the Minecraft arm, unchanged.
    cache_manifest(&app, &manifest);
    {
        let parsed = parse_manifest_value(&manifest)?;
        if let resolve::PlannedGame::Emulator(plan) = resolve::plan(&parsed)? {
            return emulator::install(&app, &manager, plan, &parsed, password.as_deref()).await;
        }
    }

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

    // The resolved heap and JVM go in the log too, not only in the UI: a
    // player pasting a crash log into a support thread brings the number with
    // them, which is half of every out-of-memory diagnosis.
    reporter.log("info", &prepared.runtime.summary());

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

    let (prepared, _game) = install_minecraft(prepared, reporter.clone()).await?;

    // Parse the manifest for world extraction (needed by install_payload)
    let manifest_raw = serde_json::to_string(&manifest)
        .map_err(|e| InstallFailure::message(format!("Manifiesto ilegible: {e}")))?;
    let parsed_manifest = crate::pack::parse_manifest(&manifest_raw)
        .map_err(|e| InstallFailure::message(format!("El manifiesto del pack no es válido: {e}")))?;

    install_payload(&app, &prepared, &http, password.as_deref(), &reporter, &parsed_manifest).await?;

    // The marker install_payload just wrote is the authority on what this pack
    // owns; any required user-provided file it still lacks is reported so the
    // pack shows as installed-but-not-launchable and the required-files panel
    // can prompt for it.
    let (missing_user_files, randomizer_blocked) = read_marker(&prepared.instance)
        .map(|m| {
            let missing = compute_missing_user_files(&prepared.layout, &prepared.instance, &m);
            let blocked = compute_randomizer_blocked(&m);
            (missing, blocked)
        })
        .unwrap_or_default();

    reporter.done();
    Ok(InstallStatus::Installed {
        version_id: prepared.plan.version_id.clone(),
        size_bytes: paths::dir_size(&prepared.instance.root),
        missing_user_files,
        randomizer_blocked,
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
    // Emulator packs launch an external process, not the JVM — a wholly separate
    // path. Everything below is the Minecraft arm, unchanged.
    cache_manifest(&app, &manifest);
    {
        let parsed = parse_manifest_value(&manifest)?;
        if let resolve::PlannedGame::Emulator(plan) = resolve::plan(&parsed)? {
            return emulator::launch(&app, &manager, plan, &parsed, password.as_deref()).await;
        }
    }

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

    // Version pinning. `launch_pack` re-verifies against the manifest it was handed,
    // which is always the LATEST — so without this a revert would be undone by
    // the very next click of Play, silently and with a progress bar that looks
    // like a normal launch. The retained marker carries the version's minecraft,
    // loader and complete file list, so the pin is applied to the whole plan and
    // not just to the payload: installing the latest loader under the pinned
    // mods is exactly the loader-mismatch crash rollback exists to escape.
    let mut prepared = prepared;
    if let Some(pinned) = apply_pin(&mut prepared) {
        reporter.log(
            "info",
            &format!("Este pack está anclado a «{pinned}». No se actualizará al iniciar."),
        );
    }

    reporter.log("info", &prepared.runtime.summary());

    let (prepared, game) = install_minecraft(prepared, reporter.clone()).await?;

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

    // Defence in depth: the UI disables Play while required player-supplied files
    // are missing, but the backend must never launch a pack that lacks them.
    let missing = read_marker(&prepared.instance)
        .map(|m| compute_missing_user_files(&prepared.layout, &prepared.instance, &m))
        .unwrap_or_default();
    if !missing.is_empty() {
        process::emit_idle(&app);
        let names = missing
            .iter()
            .map(|f| f.path.as_str())
            .collect::<Vec<_>>()
            .join(", ");
        return Err(InstallFailure::message(format!(
            "Faltan archivos que debes proporcionar tú antes de jugar: {names}."
        )));
    }

    let running = process::spawn(&app, &game, prepared.plan.quick_play.as_deref(), pack_id.clone())?;
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
        // whose marker was deleted. Either way it must be reinstalled, and
        // calling it "not installed" would hide that files are already there.
        return Ok(InstallStatus::Broken {
            reason: "La instalación quedó a medias. Vuelve a instalar el pack.".to_string(),
        });
    };

    // No separate `instance.minecraft.is_dir()` check: the instance directory IS
    // the game directory, so `instance.root.is_dir()` above already answers it.
    // A second copy would be dead code that reads like a real guard.

    let size_bytes = paths::dir_size(&instance.root);
    let missing_user_files = compute_missing_user_files(&layout, &instance, &marker);
    let randomizer_blocked = compute_randomizer_blocked(&marker);
    Ok(match latest_version_id {
        Some(latest) if latest != marker.version_id => InstallStatus::Outdated {
            version_id: marker.version_id,
            latest_version_id: latest,
            size_bytes,
            missing_user_files,
            randomizer_blocked,
        },
        _ => InstallStatus::Installed {
            version_id: marker.version_id,
            size_bytes,
            missing_user_files,
            randomizer_blocked,
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

    // Game-type-aware: what "repair" may delete differs per game. Minecraft
    // owns mods/config/bin wholesale; an emulator instance has no such dirs —
    // there, only the RE-FETCHABLE managed files are removed. The player's ROM
    // (user-provided; re-satisfied from the local blob store without a prompt)
    // and their saves/states are NEVER repair casualties.
    let marker = read_marker(&instance);
    let is_emulator = marker
        .as_ref()
        .is_some_and(|m| m.game_type == instance::GameType::Emulator);
    if is_emulator {
        if let Some(marker) = &marker {
            for file in &marker.managed {
                if matches!(file.source, ManagedSource::UserProvided { .. }) {
                    continue;
                }
                let _ = std::fs::remove_file(instance.minecraft.join(file.path.replace('\\', "/")));
            }
        }
    } else {
        for dir in [&instance.mods, &instance.config, &instance.bin] {
            if dir.is_dir() {
                std::fs::remove_dir_all(dir).map_err(|e| {
                    InstallFailure::message(format!("No se pudo borrar {}: {e}", dir.display()))
                })?;
            }
        }
    }
    // Last, so an interrupted repair still reads as broken rather than as a
    // healthy install missing its mods.
    let _ = std::fs::remove_file(&instance.marker);

    Ok(InstallStatus::NotInstalled)
}

// ── Locked vs. user space, and version rollback ────────────────────────────

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
            // An older entry carries no file list, so there is nothing to
            // replay and offering a revert to it would be a lie.
            revertible: !v.managed.is_empty(),
        })
        .collect())
}

/// One-click rollback. Replays a retained version's recorded file list
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
            "Esa versión se instaló con una versión antigua de la app y no guarda su lista de \
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
    // Per-game folder standard: the retained marker knows which game this is.
    if target.game_type == instance::GameType::Emulator {
        layout.prepare_emulator(&instance)?;
    } else {
        layout.prepare(&instance)?;
    }

    let http = reqwest::Client::builder()
        .user_agent(concat!("BoffmediaApp/", env!("CARGO_PKG_VERSION")))
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
        // what the player switched off. Path-level here rather than
        // feature-level because a revert replays a MARKER, and the marker's
        // `managed` list already excludes everything a switched-off feature
        // owns — there is nothing left for the feature filter to subtract.
        .filter(|f| !disabled.is_path_disabled(&f.path))
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

    // Re-materialize any romhack ("Patched") files now their base + patch are
    // back on disk. A reverted emulator/randomizer version whose ROM is a patched
    // file would otherwise come back with an empty slot — the download pass never
    // produces these, they are generated locally.
    let patched: Vec<PlannedFile> = wanted
        .iter()
        .filter(|f| matches!(f.fetch, resolve::Fetch::Patched { .. }))
        .cloned()
        .collect();
    files::materialize_patched(&layout, &instance.minecraft, &patched, &reporter)?;

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

    let randomizer_blocked = compute_randomizer_blocked(&marker);
    let missing_user_files = compute_missing_user_files(&layout, &instance, &marker);
    Ok(InstallStatus::Installed {
        version_id: marker.version_id,
        size_bytes: paths::dir_size(&instance.root),
        missing_user_files,
        randomizer_blocked,
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
    let randomizer_blocked = compute_randomizer_blocked(&marker);
    let missing_user_files = compute_missing_user_files(&layout, &instance, &marker);
    Ok(InstallStatus::Installed {
        version_id: marker.version_id,
        size_bytes: paths::dir_size(&instance.root),
        missing_user_files,
        randomizer_blocked,
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

/// The optional-content model for one instance: groups, features, and the
/// effective on/off state of each.
///
/// Serves BOTH chooser surfaces, which need different sources and is why
/// `manifest` is optional:
///
/// - **Content tab** (installed): read from the MARKER, so it describes what
///   this instance actually has, the same reason `instance_content` does.
/// - **Install-time step** (not installed yet): there is no marker, so the model
///   comes from the manifest about to be installed. The player's state file is
///   still consulted — it is user state that outlives an uninstall, so someone
///   who declined shaders, removed the pack and reinstalled it should not have
///   to decline them again.
///
/// A marker always wins when one exists: it records the catalogue of the version
/// on disk, which is the one the toggles act on.
#[tauri::command]
pub async fn instance_optional_model(
    slug: String,
    manifest: Option<serde_json::Value>,
    app: tauri::AppHandle,
) -> Result<Vec<optional::GroupView>, InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let instance = layout.instance(&slug);
    let state = read_optional_state(&instance);

    if let Some(marker) = read_marker(&instance) {
        let mut views = optional::resolve(&marker.optional_groups, &state, &marker_sizes(&marker));
        mark_installed(&mut views, &instance);
        return Ok(views);
    }

    let Some(manifest) = manifest else {
        return Ok(Vec::new());
    };
    let (groups, sizes) = model_from_manifest(&manifest)?;
    // No `mark_installed`: nothing is on disk, so every feature correctly
    // reports `installed: false` — which is what tells the chooser that turning
    // one on means a download.
    Ok(optional::resolve(&groups, &state, &sizes))
}

/// The model a manifest declares, plus the declared size of every path in it.
///
/// The sizes come from the manifest's own numbers rather than from disk, because
/// the whole point of the install-time chooser is answering "how big is this?"
/// BEFORE the bytes exist.
fn model_from_manifest(
    manifest: &serde_json::Value,
) -> Result<(Vec<optional::Group>, HashMap<String, u64>), InstallFailure> {
    let parsed = parse_manifest_value(manifest)?;
    let sizes = parsed
        .version
        .files
        .iter()
        .map(|f| (instance::normalise(f.path.as_str()), f.file_size.max(0) as u64))
        .collect();
    Ok((optional::model_of(&parsed), sizes))
}

/// Fill in each feature's `installed` flag from what is on disk.
///
/// Separate from `optional::resolve` because resolve also runs at install time,
/// where nothing is on disk yet and the question is meaningless. A feature
/// counts as installed only when EVERY path it owns is present — three of four
/// files is what the feature unit exists to prevent, so reporting it as
/// installed would be the same lie in a different place.
fn mark_installed(views: &mut [optional::GroupView], instance: &InstancePaths) {
    for group in views.iter_mut() {
        for feature in group.features.iter_mut() {
            feature.installed = !feature.paths.is_empty()
                && feature.paths.iter().all(|path| {
                    let active = instance::safe_join(&instance.minecraft, path)
                        .map(|p| p.is_file())
                        .unwrap_or(false);
                    active || instance::is_parked(&instance.minecraft, path)
                });
        }
    }
}

/// What a toggle did.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FeatureSetResult {
    /// The whole model again, so the caller re-renders from one source of truth
    /// rather than patching a row it guessed at. A toggle is rarely one feature:
    /// exclusivity and `requires` mean switching Shaders on can move three.
    pub groups: Vec<optional::GroupView>,
    /// Feature ids whose effective state changed, including the one asked for.
    pub changed: Vec<String>,
    /// Paths now wanted that are not on disk under either name. The renderer
    /// feeds these to `instance_install_files`, which already carries the
    /// marker interlock and the per-row progress events.
    pub missing: Vec<String>,
    /// D3: the toggle needed a config edit (a resourcepack or a shaderpack) but
    /// the game is open, and Minecraft rewrites `options.txt` from memory when
    /// it exits — so anything written now is discarded at that moment, silently.
    /// The choice IS saved; it takes effect at the next launch, and the chooser
    /// says so on the affected row. Losing the edit quietly is the one outcome
    /// worth ruling out.
    pub deferred: bool,
}

/// Switch one FEATURE on or off.
///
/// The unit is deliberately not a path. Switching "Shaders" off has to park
/// Iris, its config and the `.zip` together, and switching it on has to bring
/// Sodium with it — a player who ends up with three of those four files has a
/// crash, not a choice. `optional::apply_toggle` owns those rules; this command
/// owns what they mean on disk.
///
/// Switching OFF parks every file the feature owns (`<name>.disabled`), which is
/// instant and needs no network. Switching ON unparks what is already there and
/// reports what is not, because the first time a player opts into something they
/// declined at install time, the bytes were never downloaded.
#[tauri::command]
pub async fn instance_feature_set(
    slug: String,
    feature_id: String,
    enabled: bool,
    manifest: Option<serde_json::Value>,
    app: tauri::AppHandle,
    manager: tauri::State<'_, InstallManager>,
) -> Result<FeatureSetResult, InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let instance = layout.instance(&slug);

    // Before the first install there is no marker, and the install-time chooser
    // still has to record choices — that is the whole point of choosing at
    // install time, since the install pass then never downloads what was
    // declined. Falling back to the manifest is what makes the same command
    // serve both surfaces. Everything below is then a no-op on disk, correctly:
    // there are no files yet to park.
    let marker = read_marker(&instance);
    let (groups, sizes) = match &marker {
        Some(m) => (m.optional_groups.clone(), marker_sizes(m)),
        None => {
            let Some(manifest) = &manifest else {
                return Err(InstallFailure::message(
                    "Este pack todavía no está instalado.",
                ));
            };
            model_from_manifest(manifest)?
        }
    };
    if optional::find(&groups, &feature_id).is_none() {
        // The state file feeds the install filter directly, so recording an
        // unknown id there would be a silent no-op the player reads as a
        // working switch.
        return Err(InstallFailure::message(format!(
            "«{feature_id}» no es una opción de este pack."
        )));
    }

    let mut state = read_optional_state(&instance);
    let changed = optional::apply_toggle(&groups, &mut state, &feature_id, enabled);
    write_optional_state(&instance, &state)?;

    // Park or unpark every affected file. Done AFTER the state write so an
    // interrupted toggle leaves the intent recorded — the next install pass
    // then honours it, where the reverse order would leave files renamed with
    // nothing on disk saying why.
    let mut missing: Vec<String> = Vec::new();
    for id in &changed {
        let Some((_, feature)) = optional::find(&groups, id) else {
            continue;
        };
        let now_on = state.is_feature_enabled(feature);
        for path in &feature.paths {
            // Pre-install this renames nothing, because nothing is there — and
            // that is right. `missing` stays empty too: the install pass is
            // about to fetch everything that is on, so reporting files for the
            // add-a-mod shortcut to grab would race it.
            instance::set_enabled_on_disk(&instance.minecraft, path, now_on).map_err(|e| {
                InstallFailure::message(format!(
                    "No se pudo {} «{path}»: {e}",
                    if now_on { "activar" } else { "desactivar" }
                ))
            })?;
            if now_on && marker.is_some() {
                let active = instance::safe_join(&instance.minecraft, path)
                    .map(|p| p.is_file())
                    .unwrap_or(false);
                if !active && !instance::is_parked(&instance.minecraft, path) {
                    missing.push(path.clone());
                }
            }
        }
    }

    let mut groups_view = optional::resolve(&groups, &state, &sizes);
    if marker.is_some() {
        mark_installed(&mut groups_view, &instance);
    }

    // Parking a jar is safe at any time — the loader only reads `mods/` at
    // startup. Editing `options.txt` is not: Minecraft holds the whole file in
    // memory and writes it back on exit, so an edit made now would vanish
    // without a trace. Defer to the next launch, where `install_payload`'s
    // reconcile pass applies it from the state we just wrote (D3).
    //
    // Pre-install there is nothing to reconcile against: the install pass runs
    // it once at the end, from the state this call just wrote.
    let needs_config = marker.is_some()
        && groups_view
            .iter()
            .flat_map(|g| g.features.iter())
            .any(|f| changed.contains(&f.id) && f.activate.is_some());
    let pack_id = marker.as_ref().map(|m| m.pack_id.clone()).unwrap_or_default();
    let deferred = needs_config && manager.is_pack_running(&pack_id).await;
    if needs_config && !deferred {
        let loader = marker.as_ref().and_then(|m| m.loader.as_deref());
        activate::reconcile(&instance.minecraft, &groups_view, loader).map_err(|e| {
            InstallFailure::message(format!("No se pudo aplicar la configuración: {e}"))
        })?;
    }

    Ok(FeatureSetResult {
        groups: groups_view,
        changed,
        missing,
        deferred,
    })
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
            enabled: !state.is_path_disabled(&path),
            installed: active || parked,
            source: file.source.clone(),
            path,
        });
    }
    out.sort_by(|a, b| a.path.to_lowercase().cmp(&b.path.to_lowercase()));
    Ok(out)
}

// ── Add-a-mod: install just the new files ──────────────────────────────────

pub const EVENT_CONTENT_FILE: &str = "content://file";

/// One file's download state while an add is in flight. The Content tab keys
/// on `path` to swap that row's "sin instalar" badge for a spinner, so `path`
/// is normalised exactly the way `instance_content` normalises the paths it
/// hands the same component.
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ContentFileEvent {
    slug: String,
    path: String,
    /// `downloading` | `done` | `error`
    state: &'static str,
    error: Option<String>,
}

fn emit_content_file(
    app: &tauri::AppHandle,
    slug: &str,
    path: &str,
    state: &'static str,
    error: Option<String>,
) {
    use tauri::Emitter;
    let _ = app.emit(
        EVENT_CONTENT_FILE,
        ContentFileEvent {
            slug: slug.to_string(),
            path: instance::normalise(path),
            state,
            error,
        },
    );
}

/// Download the files a local pack just gained and place them in its instance,
/// without a full install pass.
///
/// This exists so that adding a mod makes it INSTALLED, not merely declared.
/// `install_pack` cannot serve that: it goes through `prepare()`, which demands
/// a live Minecraft (MSA) session — and fetching a jar off Modrinth's CDN needs
/// no session at all. Asking a player to sign in to Microsoft to add a mod is
/// the wrong trade, so this path is deliberately session-free and does only the
/// two things it can do safely: fetch the named files, and record them.
///
/// `previous_version_id` is the manifest version this instance was installed
/// from BEFORE the add. It is the whole safety interlock:
///
///   * marker missing, or its version id does not match  ->  do nothing. The
///     instance is not in sync with the manifest for reasons this command
///     cannot see (never installed, a pending update, a rollback), and dropping
///     one jar into it would not change that. Install/Play still does the job.
///   * it matches  ->  every other file the manifest declares is already on
///     disk, so once these land the instance IS the new version, and the
///     marker's version id may move with it.
///
/// A partial failure keeps the version id where it was: the files that arrived
/// are recorded (their rows go green), the pack stays `outdated`, and the next
/// install finishes what this could not. Reporting "installed" over a jar that
/// never downloaded is the one outcome worth ruling out.
///
/// Returns true when the marker moved onto the new version.
#[tauri::command]
pub async fn instance_install_files(
    slug: String,
    manifest: serde_json::Value,
    paths: Vec<String>,
    previous_version_id: Option<String>,
    app: tauri::AppHandle,
) -> Result<bool, InstallFailure> {
    let parsed = parse_manifest_value(&manifest)?;
    // Minecraft only. An emulator pack has no mod browser to add from, and its
    // payload is a ROM the player supplies rather than something to fetch.
    let resolve::PlannedGame::Minecraft(plan) = resolve::plan(&parsed)? else {
        return Ok(false);
    };

    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let instance = layout.instance(&slug);

    let Some(mut marker) = read_marker(&instance) else {
        return Ok(false);
    };
    if previous_version_id.as_deref() != Some(marker.version_id.as_str()) {
        return Ok(false);
    }

    // The requested paths, resolved back to planned files. Anything the player
    // has switched off is skipped: the optional state is an intent the install
    // pass honours by never fetching the file, and this path must not disagree.
    let wanted: HashSet<String> = paths.iter().map(|p| instance::normalise(p)).collect();
    let state = read_optional_state(&instance);
    let targets: Vec<PlannedFile> = plan
        .files
        .iter()
        .filter(|f| wanted.contains(&instance::normalise(&f.path)))
        .filter(|f| !state.is_path_disabled(&instance::normalise(&f.path)))
        .cloned()
        .collect();
    if targets.is_empty() {
        return Ok(false);
    }

    layout.prepare(&instance)?;
    let http = reqwest::Client::builder()
        .user_agent(concat!("BoffmediaApp/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|e| InstallFailure::message(format!("No se pudo crear el cliente HTTP: {e}")))?;

    // Sequential, unlike `download_all`'s six-wide fan-out. An add is a handful
    // of files the player is watching one row at a time, and the per-row badges
    // read as progress only if they light up in order.
    let mut placed: Vec<&PlannedFile> = Vec::new();
    let mut failed = false;
    for file in &targets {
        emit_content_file(&app, &slug, &file.path, "downloading", None);
        match files::fetch_one(
            &app,
            &http,
            &layout,
            &instance.minecraft,
            &plan.pack_id,
            None,
            file,
        )
        .await
        {
            Ok(()) => {
                placed.push(file);
                emit_content_file(&app, &slug, &file.path, "done", None);
            }
            Err(err) => {
                failed = true;
                emit_content_file(&app, &slug, &file.path, "error", Some(err.message.clone()));
            }
        }
    }

    if placed.is_empty() {
        return Ok(false);
    }

    // Recorded in the marker, or `instance_extra_files` would find them on disk
    // and the Content tab would badge a pack file as hand-dropped.
    let mut by_path: HashMap<String, instance::ManagedFile> = marker
        .managed
        .iter()
        .map(|f| (instance::normalise(&f.path), f.clone()))
        .collect();
    for file in placed {
        by_path.insert(
            instance::normalise(&file.path),
            instance::ManagedFile::from_planned(file),
        );
    }
    marker.managed = by_path.into_values().collect();
    marker.managed.sort_by(|a, b| a.path.cmp(&b.path));
    marker.file_count = marker.managed.len();
    // The full catalogue of switchable files, rebuilt from the new plan so a
    // freshly added optional mod is toggleable without a reinstall.
    marker.optional_files = plan
        .files
        .iter()
        .filter(|f| f.optional)
        .map(instance::ManagedFile::from_planned)
        .collect();

    let complete = !failed;
    if complete {
        marker.version_id = plan.version_id.clone();
        marker.version_name = plan.version_name.clone();
        marker.installed_at = chrono::Utc::now().to_rfc3339();
    }
    write_marker(&instance, &marker)?;
    if complete {
        retain_version(&instance, &marker, settings.retain_versions());
    }
    Ok(complete)
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

    // Reject a path the pack never declared optional. The intent file feeds the
    // install filter directly, so silently recording an arbitrary path there
    // would let a caller switch OFF a required file and have the next install
    // honour it. Only validated once a marker exists — before the first install
    // there is no catalogue to check against and toggling intent is still valid.
    if let Some(marker) = read_marker(&instance) {
        let target = instance::normalise(&path);
        let is_optional = marker
            .optional_files
            .iter()
            .any(|f| instance::normalise(&f.path) == target);
        if !is_optional {
            return Err(InstallFailure::message(format!(
                "«{path}» no es un archivo opcional de este pack."
            )));
        }
    }

    let mut state = read_optional_state(&instance);
    state.set_path(&path, enabled);
    write_optional_state(&instance, &state)?;

    instance::set_enabled_on_disk(&instance.minecraft, &path, enabled).map_err(|e| {
        InstallFailure::message(format!("No se pudo {} «{path}»: {e}", if enabled { "activar" } else { "desactivar" }))
    })?;

    let catalogue = read_marker(&instance)
        .map(|m| m.optional_files)
        .unwrap_or_default();
    Ok(instance::optional_list(&catalogue, &state))
}

// ── Per-instance Java runtime + memory ─────────────────────────────────────

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

/// The effective Java and heap for one pack, surfaced BEFORE launch so a
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

// ── User-provided files ──────────────────────────────────────────────────────

/// Response types for instance_provide_file.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProvideFileOk {
    pub satisfied: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProvideFileError {
    pub code: String,
    pub expected_hint: Option<String>,
    pub message: String,
}

/// Accept a player-supplied file for an installed instance. The file must match
/// the expected sha512+fileSize recorded for its entry in the instance MARKER
/// (which already carries every managed user-provided file's hash + hint from
/// install time). On match it is imported to the never-purged local blob store
/// and placed at the instance path. Marker-based on purpose: no API round-trip,
/// so it works offline and needs only the pack's slug — not its id or a session.
#[tauri::command]
pub async fn instance_provide_file(
    slug: String,
    path: String,
    source_file: String,
    app: tauri::AppHandle,
) -> Result<ProvideFileOk, ProvideFileError> {
    let source_path = std::path::PathBuf::from(&source_file);
    if !source_path.is_file() {
        return Err(ProvideFileError {
            code: "not_found".to_string(),
            expected_hint: None,
            message: "El archivo no existe.".to_string(),
        });
    }

    // Hash the source file
    let actual_hash = files::sha512_of(&source_path)
        .ok_or_else(|| ProvideFileError {
            code: "io".to_string(),
            expected_hint: None,
            message: "No se pudo leer el archivo.".to_string(),
        })?;

    let actual_file_size = std::fs::metadata(&source_path)
        .map_err(|e| ProvideFileError {
            code: "io".to_string(),
            expected_hint: None,
            message: format!("No se pudo obtener el tamaño del archivo: {e}"),
        })?
        .len();

    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir()).map_err(|e| ProvideFileError {
        code: "io".to_string(),
        expected_hint: None,
        message: format!("Error al acceder a la configuración: {}", e.message),
    })?;
    let instance = layout.instance(&slug);

    // The marker is the authority on what this instance expects. Find the managed
    // user-provided entry whose path matches (case-insensitively, like the
    // installer), and read its pinned sha512 + size + hint from there.
    let norm = |p: &str| p.to_lowercase().replace('\\', "/");
    let target = norm(&path);
    let marker = read_marker(&instance).ok_or_else(|| ProvideFileError {
        code: "not_found".to_string(),
        expected_hint: None,
        message: "El pack no está instalado.".to_string(),
    })?;
    let entry = marker
        .managed
        .iter()
        .find(|f| norm(&f.path) == target)
        .ok_or_else(|| ProvideFileError {
            code: "not_found".to_string(),
            expected_hint: None,
            message: format!("El archivo «{}» no está en el pack.", path),
        })?;
    let expected_sha512 = entry.sha512.to_lowercase();
    let file_size = entry.size;
    let expected_hint = match &entry.source {
        ManagedSource::UserProvided { hint } => hint.clone(),
        _ => String::new(),
    };
    // Place at the MARKER's recorded path, not the caller's spelling — the
    // match above is case-insensitive, and on a case-sensitive filesystem the
    // two could otherwise land at different paths.
    let path = entry.path.clone();

    if actual_hash != expected_sha512 || actual_file_size != file_size {
        return Err(ProvideFileError {
            code: "wrong_hash".to_string(),
            expected_hint: Some(expected_hint),
            message: format!(
                "El archivo no coincide. Se esperaba: {} ({} bytes), pero se obtuvo: {} ({} bytes)",
                expected_sha512, file_size, actual_hash, actual_file_size
            ),
        });
    }

    // Import to the never-purged local blob store (reinstall/repair never
    // re-prompts) and place at the instance path.
    let blob_path = files::local_blob_path(&layout, &actual_hash.to_lowercase());
    if let Some(parent) = blob_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    std::fs::copy(&source_path, &blob_path).map_err(|e| ProvideFileError {
        code: "io".to_string(),
        expected_hint: None,
        message: format!("No se pudo copiar al almacén: {e}"),
    })?;

    let dest = instance.minecraft.join(path.replace('\\', "/"));
    if let Some(parent) = dest.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    std::fs::copy(&blob_path, &dest).map_err(|e| ProvideFileError {
        code: "io".to_string(),
        expected_hint: None,
        message: format!("No se pudo guardar el archivo: {e}"),
    })?;

    Ok(ProvideFileOk { satisfied: true })
}

/// The result of a ROM-library sweep: which required user-provided files it
/// found and imported, and which are still missing.
#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserFileScan {
    pub satisfied: Vec<String>,
    pub still_missing: Vec<String>,
}

/// "Plug and play": sweep the player's ROM library for any unsatisfied
/// required `user-provided` file of an installed pack, matching by size then
/// streamed SHA-512, and import+place every hit (the `instance_provide_file`
/// flow, without a prompt). Also user-invokable ("Scan my library").
#[tauri::command]
pub async fn instance_user_files_scan(
    slug: String,
    app: tauri::AppHandle,
) -> Result<UserFileScan, InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let instance = layout.instance(&slug);
    let Some(marker) = read_marker(&instance) else {
        return Ok(UserFileScan::default());
    };

    // Required, still-unsatisfied user-provided entries: (rel path, sha512, size).
    let mut remaining: Vec<(String, String, u64)> = marker
        .managed
        .iter()
        .filter(|f| !f.optional && matches!(f.source, ManagedSource::UserProvided { .. }))
        .filter_map(|f| {
            let sha = f.sha512.to_lowercase();
            let in_blob = files::local_blob_path(&layout, &sha).is_file();
            let on_disk = std::fs::metadata(instance.minecraft.join(f.path.replace('\\', "/")))
                .map(|m| m.is_file() && (f.size == 0 || m.len() == f.size))
                .unwrap_or(false);
            if in_blob || on_disk {
                None
            } else {
                Some((f.path.clone(), sha, f.size))
            }
        })
        .collect();

    if remaining.is_empty() {
        return Ok(UserFileScan::default());
    }

    // Cheap prefilter: only files whose exact size matches a missing entry are
    // ever hashed. A renamed dump is still found; a wrong-region dump never
    // silently accepted (the SHA-512 is the judge).
    let sizes: HashSet<u64> = remaining.iter().map(|(_, _, size)| *size).collect();

    let mut satisfied = Vec::new();
    'roots: for root in rom_search_roots(&settings) {
        for candidate in walk_files(&root, 2) {
            if remaining.is_empty() {
                break 'roots;
            }
            let Ok(meta) = std::fs::metadata(&candidate) else {
                continue;
            };
            if !meta.is_file() || !sizes.contains(&meta.len()) {
                continue;
            }
            let Some(hash) = files::sha512_of(&candidate) else {
                continue;
            };
            let Some(pos) = remaining
                .iter()
                .position(|(_, sha, size)| *size == meta.len() && *sha == hash)
            else {
                continue;
            };
            let (path, sha, _) = remaining.remove(pos);
            if import_user_file(&layout, &instance, &candidate, &sha, &path).is_ok() {
                satisfied.push(path);
            }
        }
    }

    Ok(UserFileScan {
        satisfied,
        still_missing: remaining.into_iter().map(|(path, _, _)| path).collect(),
    })
}

/// One file sitting in the instance that the launcher did NOT put there — a jar
/// the player dropped into `mods/` by hand.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtraFile {
    /// Instance-relative, WITHOUT the `.disabled` suffix, so it is the same
    /// path whether the file is currently parked or not.
    pub path: String,
    pub size: u64,
    pub enabled: bool,
    /// SHA-512, so the renderer can ask Modrinth what this jar actually is.
    /// `None` when the file could not be read.
    pub sha512: Option<String>,
}

/// The folders a player actually drops content into, each paired with the file
/// extensions that folder can actually LOAD. Depth 1: `mods/` is flat, and
/// descending further would sweep up the per-mod data directories some mods
/// create inside `resourcepacks/`.
///
/// The extension allowlist is the other half of that depth rule, and it is not
/// cosmetic. A shaderpack is often shipped UNZIPPED — a real folder full of
/// licences, READMEs and a `.gitignore` — and depth 1 walks straight into it, so
/// without the filter every `.txt` and `.md` inside `ComplementaryUnbound.../`
/// showed up in the Shaders list as if the player had dropped it there.
const EXTRA_ROOTS: [(&str, &[&str]); 3] = [
    ("mods", &["jar"]),
    ("resourcepacks", &["zip"]),
    ("shaderpacks", &["zip"]),
];

/// True when an instance-relative path (`.disabled` already stripped) sits in a
/// content folder AND carries an extension that folder can load.
///
/// Used by both the listing and the guard on purpose: a file the Content tab
/// refuses to show must also be a file `instance_extra_delete` refuses to touch.
fn is_extra_candidate(path: &str) -> bool {
    EXTRA_ROOTS.iter().any(|(root, exts)| {
        path.starts_with(&format!("{root}/"))
            && path.rsplit_once('.').is_some_and(|(_, ext)| {
                exts.iter().any(|allowed| ext.eq_ignore_ascii_case(allowed))
            })
    })
}

/// Hashing every jar on every Content-tab open is the one expensive part of the
/// scan, and the answer almost never changes: a file's identity is fixed by its
/// (len, mtime) pair. Process-lifetime cache, so the first open pays and the
/// rest are free; a rebuilt jar changes mtime and is re-hashed.
static EXTRA_HASH_CACHE: std::sync::Mutex<
    Option<std::collections::HashMap<(std::path::PathBuf, u64, i64), String>>,
> = std::sync::Mutex::new(None);

fn cached_sha512(path: &std::path::Path, len: u64, mtime: i64) -> Option<String> {
    let key = (path.to_path_buf(), len, mtime);
    if let Ok(guard) = EXTRA_HASH_CACHE.lock() {
        if let Some(hit) = guard.as_ref().and_then(|m| m.get(&key)) {
            return Some(hit.clone());
        }
    }
    let hash = files::sha512_of(path)?;
    if let Ok(mut guard) = EXTRA_HASH_CACHE.lock() {
        guard
            .get_or_insert_with(std::collections::HashMap::new)
            .insert(key, hash.clone());
    }
    Some(hash)
}

fn mtime_of(meta: &std::fs::Metadata) -> i64 {
    meta.modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

/// Everything in the content folders that the marker does not claim.
///
/// This is the OTHER half of "locked vs user space". The marker is the authority
/// on what the launcher owns and may sweep; anything else in `mods/` belongs to
/// the player and is deliberately never touched by an update. Until now it was
/// also never SHOWN, so a hand-dropped jar was invisible in the very list that
/// claims to be the pack's contents.
///
/// Returned separately from `instance_content` rather than merged into it, and
/// that separation is the point: these files must not end up in the marker. The
/// moment one did, the stale sweep would consider it a candidate for deletion.
#[tauri::command]
pub async fn instance_extra_files(
    slug: String,
    app: tauri::AppHandle,
) -> Result<Vec<ExtraFile>, InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let instance = layout.instance(&slug);
    if !instance.minecraft.is_dir() {
        return Ok(Vec::new());
    }

    // Paths the pack owns. A missing marker is not an error: a local pack that
    // has never been installed owns nothing, so everything on disk is extra.
    let owned: HashSet<String> = read_marker(&instance)
        .map(|m| {
            m.managed
                .iter()
                .chain(m.optional_files.iter())
                .map(|f| instance::normalise(&f.path))
                .collect()
        })
        .unwrap_or_default();

    let mut out = Vec::new();
    for (root, _) in EXTRA_ROOTS {
        let dir = instance.minecraft.join(root);
        if !dir.is_dir() {
            continue;
        }
        for file in walk_files(&dir, 1) {
            let Ok(relative) = file.strip_prefix(&instance.minecraft) else {
                continue;
            };
            let raw = instance::normalise(&relative.to_string_lossy());
            // A parked file is reported under its REAL path with enabled:false,
            // matching how the marker-backed rows report themselves — otherwise
            // switching a mod off would make it look like a different file.
            let (path, enabled) = match raw.strip_suffix(instance::DISABLED_SUFFIX) {
                Some(base) => (base.to_string(), false),
                None => (raw, true),
            };
            if !is_extra_candidate(&path) || owned.contains(&path) {
                continue;
            }
            let Ok(meta) = std::fs::metadata(&file) else {
                continue;
            };
            let len = meta.len();
            out.push(ExtraFile {
                sha512: cached_sha512(&file, len, mtime_of(&meta)),
                path,
                size: len,
                enabled,
            });
        }
    }
    out.sort_by(|a, b| a.path.to_lowercase().cmp(&b.path.to_lowercase()));
    Ok(out)
}

/// Park or unpark a file the player added themselves.
///
/// Separate from `instance_optional_set` on purpose: that one also records the
/// choice in the optional-state file, which exists so an INSTALL can honour it.
/// An extra file is never part of an install plan, so there is no intent to
/// persist — the rename on disk is the whole truth.
#[tauri::command]
pub async fn instance_extra_set_enabled(
    slug: String,
    path: String,
    enabled: bool,
    app: tauri::AppHandle,
) -> Result<(), InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let instance = layout.instance(&slug);
    guard_extra_path(&instance, &path)?;
    instance::set_enabled_on_disk(&instance.minecraft, &path, enabled)
        .map_err(|e| InstallFailure::message(format!("No se pudo cambiar «{path}»: {e}")))
}

/// Delete a file the player added themselves. Both names are removed, because
/// the file may be parked, and the caller asked for it to be gone either way.
#[tauri::command]
pub async fn instance_extra_delete(
    slug: String,
    path: String,
    app: tauri::AppHandle,
) -> Result<(), InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let instance = layout.instance(&slug);
    guard_extra_path(&instance, &path)?;

    let Some(active) = instance::safe_join(&instance.minecraft, &path) else {
        return Ok(());
    };
    let parked = std::path::PathBuf::from(format!(
        "{}{}",
        active.display(),
        instance::DISABLED_SUFFIX
    ));
    for target in [active, parked] {
        if target.is_file() {
            std::fs::remove_file(&target)
                .map_err(|e| InstallFailure::message(format!("No se pudo borrar «{path}»: {e}")))?;
        }
    }
    Ok(())
}

/// Refuse to touch anything the launcher owns, or anything outside the content
/// folders.
///
/// `safe_join` already stops traversal out of the instance; this is the second
/// half of the rule. Without it a caller could hand a managed mod's path to
/// `instance_extra_delete` and delete a pack file through the one command whose
/// entire premise is that it only ever touches user space.
fn guard_extra_path(instance: &InstancePaths, path: &str) -> Result<(), InstallFailure> {
    let normalised = instance::normalise(path);
    if !is_extra_candidate(&normalised) {
        return Err(InstallFailure::message(format!(
            "«{path}» no está en una carpeta de contenido."
        )));
    }
    if instance::safe_join(&instance.minecraft, &normalised).is_none() {
        return Err(InstallFailure::message(format!("Ruta no válida: «{path}».")));
    }
    let owned = read_marker(instance).is_some_and(|m| {
        m.managed
            .iter()
            .chain(m.optional_files.iter())
            .any(|f| instance::normalise(&f.path) == normalised)
    });
    if owned {
        return Err(InstallFailure::message(format!(
            "«{path}» pertenece al pack; gestiónalo desde el pack."
        )));
    }
    Ok(())
}

/// Return the emulator ROM slot's instance-relative path, if this is an emulator
/// pack with a marker. Returns None for non-emulator packs or when the marker
/// is not yet written.
#[tauri::command]
pub fn instance_rom_slot(
    slug: String,
    app: tauri::AppHandle,
) -> Result<Option<String>, InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let instance = layout.instance(&slug);

    let marker = match read_marker(&instance) {
        Some(m) => m,
        None => return Ok(None),
    };

    // Only emulator packs have ROM slots
    if marker.game_type != instance::GameType::Emulator {
        return Ok(None);
    }

    // Return the ROM path from the emulator marker
    Ok(marker.emulator.as_ref().map(|e| e.rom.clone()))
}

/// Read back the manifest [`cache_manifest`] stashed on the last successful
/// install/launch. `None` when nothing was cached, which the caller treats as
/// "no offline fallback available" and surfaces the original network error.
#[tauri::command]
pub fn pack_manifest_cache(
    slug: String,
    app: tauri::AppHandle,
) -> Result<Option<serde_json::Value>, InstallFailure> {
    let settings = settings::load(&app);
    let layout = Layout::new(&app, settings.game_dir())?;
    let instance = layout.instance(&slug);
    let Ok(raw) = std::fs::read_to_string(&instance.manifest) else {
        return Ok(None);
    };
    Ok(serde_json::from_str(&raw).ok())
}

/// Search roots in priority order: the player's own list first, then the
/// Emulation folder EmuDeck's own settings.json names (`storagePath` — no
/// guessing, no asking), then a drive sweep as a last resort, then the profile.
fn rom_search_roots(settings: &settings::Settings) -> Vec<std::path::PathBuf> {
    use std::path::PathBuf;
    let mut roots: Vec<PathBuf> = settings.rom_dirs.iter().map(PathBuf::from).collect();

    // EmuDeck knows where its Emulation folder is — read it rather than scan.
    if let Some(root) = crate::emulators::emudeck_info().and_then(|d| d.emulation_root()) {
        roots.push(root.join("roms"));
    }

    // Fallback sweep for a moved/hand-made layout. C: onward only — touching
    // A:/B: can stall for seconds while Windows interrogates a phantom floppy
    // controller, from what is effectively a UI-blocking call.
    #[cfg(windows)]
    for letter in b'C'..=b'Z' {
        let drive = format!("{}:\\Emulation\\roms", letter as char);
        let p = PathBuf::from(drive);
        if p.is_dir() && !roots.contains(&p) {
            roots.push(p);
        }
    }

    if let Some(profile) = std::env::var_os("USERPROFILE").or_else(|| std::env::var_os("HOME")) {
        let p = PathBuf::from(profile).join("Emulation").join("roms");
        if p.is_dir() {
            roots.push(p);
        }
    }
    roots.dedup();
    roots
}

/// Collect files under `root`, traversing up to and including `max_depth`
/// directory levels (root files = depth 0). Bounded and dumb by design:
/// the size+hash match is the judge, so no extension filter that could miss a
/// renamed dump. Uses the dirent's own file type — which does NOT follow
/// symlinks — so a link loop inside a ROM library cannot trap the walk.
fn walk_files(root: &std::path::Path, max_depth: usize) -> Vec<std::path::PathBuf> {
    let mut out = Vec::new();
    let mut stack = vec![(root.to_path_buf(), 0usize)];
    while let Some((dir, depth)) = stack.pop() {
        let Ok(entries) = std::fs::read_dir(&dir) else {
            continue;
        };
        for entry in entries.flatten() {
            let Ok(kind) = entry.file_type() else { continue };
            let path = entry.path();
            if kind.is_dir() {
                if depth < max_depth {
                    stack.push((path, depth + 1));
                }
            } else if kind.is_file() {
                out.push(path);
            }
        }
    }
    out
}

/// Import a verified user-provided file into the never-purged local blob store
/// (so reinstall/repair never re-prompts) and place it at the instance path.
fn import_user_file(
    layout: &Layout,
    instance: &InstancePaths,
    source: &std::path::Path,
    sha512: &str,
    rel_path: &str,
) -> std::io::Result<()> {
    let blob = files::local_blob_path(layout, sha512);
    if let Some(parent) = blob.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::copy(source, &blob)?;
    let dest = instance.minecraft.join(rel_path.replace('\\', "/"));
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::copy(&blob, &dest)?;
    Ok(())
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
            missing_user_files: vec![],
            randomizer_blocked: false,
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
