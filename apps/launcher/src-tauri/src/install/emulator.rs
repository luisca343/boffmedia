//! The emulator install + launch path (Cycle 2). Installs are payload-only —
//! no Java, no loaders, no MC session — so this is deliberately thin and reuses
//! the game-agnostic file pipeline (`files`, `initial`) and the external-process
//! launcher (`process::spawn_external`). The launcher never writes into the
//! emulator itself (D4); everything lives inside `instances/<slug>/`.

use super::files;
use super::initial;
use super::instance::{self, GameType, ManagedFile, Marker};
use super::paths::{InstancePaths, Layout};
use super::process::{self, RunningGame};
use super::progress::{Phase, Reporter};
use super::resolve::{Fetch, PlannedEmulator, PlannedFile};
use super::{InstallFailure, InstallManager, InstallStatus};
use crate::pack::PackManifest;
use crate::settings::{self, Settings};

pub struct EmulatorPrepared {
    pub layout: Layout,
    pub instance: InstancePaths,
    pub settings: Settings,
    pub plan: PlannedEmulator,
}

fn prepare(app: &tauri::AppHandle, plan: PlannedEmulator) -> Result<EmulatorPrepared, InstallFailure> {
    let settings = settings::load(app);
    let layout = Layout::new(app, settings.game_dir())?;
    let instance = layout.instance(&plan.slug);
    layout.prepare(&instance)?;
    Ok(EmulatorPrepared {
        layout,
        instance,
        settings,
        plan,
    })
}

fn build_client() -> Result<reqwest::Client, InstallFailure> {
    reqwest::Client::builder()
        .user_agent(concat!("BoffLauncher/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|e| InstallFailure::message(format!("No se pudo crear el cliente HTTP: {e}")))
}

/// Payload phase: download the fetchable files (patch blobs, extra overrides),
/// materialize romhacks, seed starting saves, sweep stale files, write the
/// marker. No runtime step (no Java).
async fn install_payload(
    app: &tauri::AppHandle,
    prepared: &EmulatorPrepared,
    http: &reqwest::Client,
    password: Option<&str>,
    reporter: &Reporter,
    manifest: &PackManifest,
) -> Result<(), InstallFailure> {
    let disabled = super::read_optional_state(&prepared.instance);
    let wanted: Vec<PlannedFile> = prepared
        .plan
        .files
        .iter()
        .filter(|f| !disabled.is_disabled(&f.path))
        .cloned()
        .collect();

    // Everything that is actually fetchable in one pass (emulators have no
    // `mods/`, so there is no separate mods phase). Unsatisfied user-provided
    // ROMs skip inside fetch_one; patched files are materialized separately.
    let downloadable: Vec<PlannedFile> = wanted
        .iter()
        .filter(|f| !matches!(f.fetch, Fetch::Patched { .. }))
        .cloned()
        .collect();
    files::download_all(
        app,
        http,
        &prepared.layout,
        &prepared.instance.minecraft,
        &prepared.plan.pack_id,
        password,
        &downloadable,
        Phase::Overrides,
        reporter,
    )
    .await?;

    let patched: Vec<PlannedFile> = wanted
        .iter()
        .filter(|f| matches!(f.fetch, Fetch::Patched { .. }))
        .cloned()
        .collect();
    files::materialize_patched(
        &prepared.layout,
        &prepared.instance.minecraft,
        &patched,
        reporter,
    )?;

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

    let previous = super::read_marker(&prepared.instance);
    let marker = build_marker(&prepared.plan, &wanted);
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

    super::write_marker(&prepared.instance, &marker)?;
    super::retain_version(&prepared.instance, &marker, prepared.settings.retain_versions());
    reporter.emit(Phase::Verifying, 1.0, "", 0, 0);
    Ok(())
}

fn build_marker(plan: &PlannedEmulator, installed: &[PlannedFile]) -> Marker {
    Marker {
        version_id: plan.version_id.clone(),
        version_name: plan.version_name.clone(),
        // Minecraft/loader are meaningless for an emulator pack.
        minecraft: String::new(),
        loader: None,
        loader_version: None,
        installed_at: chrono::Utc::now().to_rfc3339(),
        file_count: installed.len(),
        pack_id: plan.pack_id.clone(),
        managed: installed.iter().map(ManagedFile::from_planned).collect(),
        optional_files: plan
            .files
            .iter()
            .filter(|f| f.optional)
            .map(ManagedFile::from_planned)
            .collect(),
        pinned: false,
        game_type: GameType::Emulator,
    }
}

/// Install or update an emulator pack. Mirrors `install_pack`'s Minecraft arm:
/// guard, backup-before-update, payload, then report any still-missing ROM.
pub async fn install(
    app: &tauri::AppHandle,
    manager: &InstallManager,
    plan: PlannedEmulator,
    manifest_value: &serde_json::Value,
    password: Option<&str>,
) -> Result<InstallStatus, InstallFailure> {
    let manifest = super::parse_manifest_value(manifest_value)?;
    let prepared = prepare(app, plan)?;
    let pack_id = prepared.plan.pack_id.clone();
    let _guard = manager.begin_install(&pack_id)?;

    let reporter = Reporter::new(app.clone(), &pack_id);
    reporter.emit(Phase::Resolving, 0.0, &prepared.plan.version_name, 0, 0);
    reporter.log(
        "info",
        &format!(
            "Instalando «{}» {} ({}).",
            prepared.plan.slug, prepared.plan.version_name, prepared.plan.kind
        ),
    );

    if prepared.instance.root.is_dir() {
        if let Some(prev) = super::read_marker(&prepared.instance) {
            if prev.version_id != prepared.plan.version_id
                && super::backups::backup_before_update(
                    app,
                    &prepared.layout,
                    &prepared.plan.slug,
                    &prepared.plan.version_id,
                )
            {
                reporter.log("info", "Copia de seguridad creada antes de la actualización.");
            }
        }
    }

    let http = build_client()?;
    install_payload(app, &prepared, &http, password, &reporter, &manifest).await?;

    let missing_user_files = super::read_marker(&prepared.instance)
        .map(|m| super::compute_missing_user_files(&prepared.layout, &prepared.instance, &m))
        .unwrap_or_default();

    reporter.done();
    Ok(InstallStatus::Installed {
        version_id: prepared.plan.version_id.clone(),
        size_bytes: super::paths::dir_size(&prepared.instance.root),
        missing_user_files,
    })
}

/// Verify-then-launch an emulator pack: re-run the payload, refuse if a required
/// ROM is still missing, resolve the player's emulator, then spawn it with the
/// ROM (cwd = the instance dir, so the emulator's `.sav` stays inside the
/// instance and within the Backups tab's reach).
pub async fn launch(
    app: &tauri::AppHandle,
    manager: &InstallManager,
    plan: PlannedEmulator,
    manifest_value: &serde_json::Value,
    password: Option<&str>,
) -> Result<u32, InstallFailure> {
    let manifest = super::parse_manifest_value(manifest_value)?;
    let prepared = prepare(app, plan)?;
    let pack_id = prepared.plan.pack_id.clone();

    {
        let mut running = manager.running.lock().await;
        if let Some(existing) = running.get(&pack_id) {
            if !existing.has_exited() {
                return Err(InstallFailure::message("Ese pack ya se está ejecutando.".to_string()));
            }
            running.remove(&pack_id);
        }
    }

    let _guard = manager.begin_install(&pack_id)?;
    process::emit_preparing(app);
    let reporter = Reporter::new(app.clone(), &pack_id);

    let http = build_client()?;
    if let Err(err) = install_payload(app, &prepared, &http, password, &reporter, &manifest).await {
        process::emit_idle(app);
        return Err(err);
    }
    reporter.done();

    // Required ROM still missing → not launchable (the UI gates this too).
    let missing = super::read_marker(&prepared.instance)
        .map(|m| super::compute_missing_user_files(&prepared.layout, &prepared.instance, &m))
        .unwrap_or_default();
    if !missing.is_empty() {
        process::emit_idle(app);
        let names = missing
            .iter()
            .map(|f| f.path.as_str())
            .collect::<Vec<_>>()
            .join(", ");
        return Err(InstallFailure::message(format!(
            "Faltan archivos que debes proporcionar tú antes de jugar: {names}."
        )));
    }

    let running = spawn(app, &prepared)?;
    let pid = running.pid;
    settings::record_play(app, &pack_id);
    manager.running.lock().await.insert(pack_id, running);
    Ok(pid)
}

fn spawn(app: &tauri::AppHandle, prepared: &EmulatorPrepared) -> Result<RunningGame, InstallFailure> {
    let kind = crate::emulators::EmulatorKind::parse(&prepared.plan.kind).ok_or_else(|| {
        InstallFailure::message(format!("Emulador desconocido: {}", prepared.plan.kind))
    })?;
    let exe = crate::emulators::resolve_exe(kind, &prepared.settings).map_err(InstallFailure::message)?;

    let rom = prepared
        .instance
        .minecraft
        .join(prepared.plan.rom.replace('\\', "/"));
    if !rom.is_file() {
        return Err(InstallFailure::message(format!(
            "No se encontró el ROM «{}». Proporciónalo antes de jugar.",
            prepared.plan.rom
        )));
    }

    // Extra flags first, then the absolute ROM path (the emulator's positional arg).
    let mut args = prepared.plan.args.clone();
    args.push(rom.to_string_lossy().into_owned());

    process::spawn_external(
        app,
        &exe,
        &args,
        &prepared.instance.minecraft,
        prepared.plan.pack_id.clone(),
    )
}
