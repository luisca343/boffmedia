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
    // Per-game folder standard: no mods/config/bin/JVM dirs for an emulator.
    layout.prepare_emulator(&instance)?;
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
    let mut marker = build_marker(&prepared.plan, &wanted, manifest);
    // A pin survives a re-verify of the SAME version (every launch does one)
    // and is cleared by an install of a different one — an explicit update.
    marker.pinned = previous
        .as_ref()
        .is_some_and(|p| p.pinned && p.version_id == marker.version_id);
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

fn build_marker(plan: &PlannedEmulator, installed: &[PlannedFile], manifest: &PackManifest) -> Marker {
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
        emulator: Some(instance::EmulatorMarker {
            kind: plan.kind.clone(),
            rom: plan.rom.clone(),
            args: plan.args.clone(),
        }),
        // Populate randomizer gate from manifest, if present
        randomizer: manifest.randomizer.as_ref().map(|r| instance::RandomizerGate {
            event_id: r.event_id,
            clean_rom_sha512: r.clean_rom_sha512.to_string(),
        }),
    }
}

/// §9 pinning for the emulator path. `launch` re-verifies against the manifest
/// it was handed — always the LATEST — so without this a revert would be undone
/// by the very next Play. The retained marker carries the version's kind, rom,
/// args and complete file list, so the pin rewrites the WHOLE plan.
fn apply_pin(prepared: &mut EmulatorPrepared) -> Option<String> {
    let marker = super::read_marker(&prepared.instance)?;
    if !marker.pinned || marker.managed.is_empty() || marker.version_id == prepared.plan.version_id
    {
        return None;
    }
    let emu = marker.emulator.as_ref()?;
    let plan = &mut prepared.plan;
    plan.version_id = marker.version_id.clone();
    plan.version_name = marker.version_name.clone();
    plan.kind = emu.kind.clone();
    plan.rom = emu.rom.clone();
    plan.args = emu.args.clone();
    plan.files = marker.managed.iter().map(ManagedFile::to_planned).collect();
    plan.total_bytes = plan.files.iter().map(|f| f.size).sum();
    Some(marker.version_name)
}

/// Install or update an emulator pack. Mirrors `install_pack`'s Minecraft arm:
/// guard, backup-before-update, payload, then report any still-missing ROM.
pub async fn install(
    app: &tauri::AppHandle,
    manager: &InstallManager,
    plan: PlannedEmulator,
    manifest: &PackManifest,
    password: Option<&str>,
) -> Result<InstallStatus, InstallFailure> {
    let prepared = prepare(app, plan)?;
    let pack_id = prepared.plan.pack_id.clone();
    let _guard = manager.begin_install(&pack_id)?;

    let reporter = Reporter::for_emulator(app.clone(), &pack_id);
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
    install_payload(app, &prepared, &http, password, &reporter, manifest).await?;

    let (missing_user_files, randomizer_blocked) = super::read_marker(&prepared.instance)
        .map(|m| {
            let missing = super::compute_missing_user_files(&prepared.layout, &prepared.instance, &m);
            let blocked = super::compute_randomizer_blocked(&m);
            (missing, blocked)
        })
        .unwrap_or_default();

    reporter.done();
    Ok(InstallStatus::Installed {
        version_id: prepared.plan.version_id.clone(),
        size_bytes: super::paths::dir_size(&prepared.instance.root),
        missing_user_files,
        randomizer_blocked,
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
    manifest: &PackManifest,
    password: Option<&str>,
) -> Result<u32, InstallFailure> {
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
    let reporter = Reporter::for_emulator(app.clone(), &pack_id);

    // §9 pinning — same contract as the Minecraft path: a reverted pack must
    // not be silently re-upgraded by the next Play.
    let mut prepared = prepared;
    if let Some(pinned) = apply_pin(&mut prepared) {
        reporter.log(
            "info",
            &format!("Este pack está anclado a «{pinned}». No se actualizará al iniciar."),
        );
    }

    let http = build_client()?;
    if let Err(err) = install_payload(app, &prepared, &http, password, &reporter, manifest).await {
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
    let method = crate::emulators::resolve_method(kind, &prepared.settings)
        .map_err(InstallFailure::message)?;

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

    // Randomizer event gate: if this pack is linked to an active randomizer,
    // verify the ROM has been patched (expected sha512 != clean_rom_sha512).
    if let Some(marker) = super::read_marker(&prepared.instance) {
        if let Some(gate) = &marker.randomizer {
            // Find the ROM's managed entry to get its expected sha512
            let norm = |p: &str| p.to_lowercase().replace('\\', "/");
            let rom_key = norm(&prepared.plan.rom);
            if let Some(rom_entry) = marker
                .managed
                .iter()
                .find(|f| norm(&f.path) == rom_key)
            {
                let expected_sha512 = &rom_entry.sha512;
                // If expected == clean, the player never patched the ROM
                if expected_sha512.eq_ignore_ascii_case(&gate.clean_rom_sha512) {
                    return Err(InstallFailure::with_code(
                        "Este pack está vinculado a un evento de randomizador que requiere que parches el ROM antes de jugar.",
                        "randomizer_not_patched",
                    ));
                }
                // Otherwise, verify the actual file matches the expected hash
                if let Some(actual_sha512) = files::sha512_of(&rom) {
                    if !actual_sha512.eq_ignore_ascii_case(expected_sha512) {
                        return Err(InstallFailure::with_code(
                            "El ROM no coincide con el esperado. Asegúrate de que has descargado la versión correcta randomizada.",
                            "randomizer_rom_mismatch",
                        ));
                    }
                } else {
                    return Err(InstallFailure::message(
                        "No se pudo verificar la integridad del ROM."
                    ));
                }
            }
        }
    }

    // Saves live INSIDE the instance (owner decision): two packs of the same
    // game never share progress, and the Backups tab can protect it. EmuDeck
    // configs redirect saves to the player's Emulation tree, so relying on
    // cwd alone is not enough — each method gets an explicit redirection.
    let saves_dir = prepared.instance.root.join("saves");
    let states_dir = prepared.instance.root.join("states");
    let _ = std::fs::create_dir_all(&saves_dir);
    let _ = std::fs::create_dir_all(&states_dir);

    let (exe, args) = match method {
        crate::emulators::LaunchMethod::RetroArch { exe, core } => {
            // Per-launch config overlay: RetroArch merges `--appendconfig` over
            // the player's own retroarch.cfg, so ONLY the save/state dirs change
            // — their shaders, controls and hotkeys all still apply (D4).
            let overlay = prepared.instance.root.join("retroarch-boff.cfg");
            let cfg = format!(
                "savefile_directory = \"{}\"\nsavestate_directory = \"{}\"\n",
                saves_dir.display(),
                states_dir.display()
            );
            std::fs::write(&overlay, cfg).map_err(|e| {
                InstallFailure::message(format!("No se pudo preparar la configuración: {e}"))
            })?;

            let mut args = vec![
                "--appendconfig".to_string(),
                overlay.to_string_lossy().into_owned(),
                "-L".to_string(),
                core.to_string_lossy().into_owned(),
            ];
            args.extend(prepared.plan.args.iter().cloned());
            args.push(rom.to_string_lossy().into_owned());
            (exe, args)
        }
        crate::emulators::LaunchMethod::Standalone { exe } => {
            // Standalones default to writing the .sav beside the ROM, which is
            // already inside the instance (`roms/`). An EmuDeck-configured
            // standalone may redirect saves in its own config; VT-2 tracks
            // verifying melonDS and adding a per-kind save flag if needed.
            let mut args = prepared.plan.args.clone();
            args.push(rom.to_string_lossy().into_owned());
            (exe, args)
        }
    };

    process::spawn_external(
        app,
        &exe,
        &args,
        &prepared.instance.minecraft,
        prepared.plan.pack_id.clone(),
    )
}
