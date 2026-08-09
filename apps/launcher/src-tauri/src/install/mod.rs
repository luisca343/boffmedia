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
pub mod initial;
pub mod instance;
pub mod patch;
pub mod paths;
pub mod process;
pub mod progress;
pub mod resolve;
/// §9 — per-instance Java runtime + memory, and the sizing heuristic.
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

    // §9 "locked vs. user space". The previous marker is the ONLY authority on
    // what the launcher owns, so a mod dropped from the pack is removed here
    // and a jar the player added themselves — never recorded, therefore never
    // stale — is not a candidate. Before this the old jar simply stayed
    // forever, which is how a removed-but-still-loaded mod crashes a pack that
    // "updated fine".
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
///
/// If the manifest carries a `randomizer` block, populate the marker's randomizer
/// field; otherwise clear it (e.g., if the pack is no longer linked to an active
/// randomizer event).
fn build_marker(prepared: &game::Prepared, installed: &[PlannedFile], manifest: &crate::pack::PackManifest) -> Marker {
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
        // Cycle 1 only handles Minecraft; later cycles will add other game types.
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
    // Dispatch by game type. Emulator packs take an entirely separate, Java-free
    // path; everything below is the Minecraft arm, unchanged.
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

    // §9 — the resolved heap and JVM go in the log too, not only in the UI: a
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
    // Per-game folder standard: the retained marker knows which game this is.
    if target.game_type == instance::GameType::Emulator {
        layout.prepare_emulator(&instance)?;
    } else {
        layout.prepare(&instance)?;
    }

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

    let randomizer_blocked = compute_randomizer_blocked(&marker);
    Ok(InstallStatus::Installed {
        version_id: marker.version_id,
        size_bytes: paths::dir_size(&instance.root),
        missing_user_files: vec![],
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
    Ok(InstallStatus::Installed {
        version_id: marker.version_id,
        size_bytes: paths::dir_size(&instance.root),
        missing_user_files: vec![],
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

// ── User-provided files (§4.3) ───────────────────────────────────────────────

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

/// The result of a ROM-library sweep (§3): which required user-provided files it
/// found and imported, and which are still missing.
#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserFileScan {
    pub satisfied: Vec<String>,
    pub still_missing: Vec<String>,
}

/// "Plug and play" (§3): sweep the player's ROM library for any unsatisfied
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
/// directory levels (root files = depth 0). Bounded and dumb by design (§3):
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
