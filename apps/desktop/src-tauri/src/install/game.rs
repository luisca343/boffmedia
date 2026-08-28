// portablemc orchestration. Everything in this file BLOCKS.
//
// portablemc is a synchronous API that spins up its own tokio runtime
// internally (portablemc/src/tokio.rs:9 — `Runtime::new().block_on(..)`).
// Calling any of it from inside an async `#[tauri::command]` therefore panics
// with "cannot start a runtime from within a runtime". Every entry point here is
// meant to be reached through `tauri::async_runtime::spawn_blocking`, and
// progress crosses back out through the `Reporter`'s event emitter rather than
// through a return value.

use portablemc::{base, fabric, forge, moj};

use crate::settings::Settings;

use super::paths::{InstancePaths, Layout};
use super::progress::{InstallWatcher, Reporter};
use super::resolve::{InstallPlan, LoaderKind};
use super::runtime::ResolvedRuntime;
use super::session::{self, GameSession};
use super::InstallFailure;

/// Everything a blocking install needs, packaged so the caller can move one
/// value into `spawn_blocking`.
pub struct Prepared {
    pub layout: Layout,
    pub instance: InstancePaths,
    pub plan: InstallPlan,
    pub settings: Settings,
    pub session: GameSession,
    /// The heap and JVM for THIS pack, already folded from the global
    /// settings, the per-instance override and the sizing heuristic. Everything
    /// below reads this rather than `settings`, so a pack-level choice cannot be
    /// bypassed by a code path that forgot about it.
    pub runtime: ResolvedRuntime,
}

/// Install (or verify) the Minecraft side of the pack and produce a launchable
/// `Game`. Idempotent and fast on a second run — portablemc checks hashes and
/// skips what is already there — which is why `launch_pack` calls it again
/// rather than caching a `Game` across commands.
pub fn install(prepared: &Prepared, reporter: &Reporter) -> Result<base::Game, InstallFailure> {
    let mut watcher = InstallWatcher::new(reporter.clone());

    let mut game = match prepared.plan.loader.as_ref() {
        None => {
            let mut installer = moj::Installer::new(prepared.plan.minecraft.clone());
            configure(installer.base_mut(), prepared);
            installer
                .set_auth_offline(prepared.session.uuid, prepared.session.username.clone());
            installer
                .install(&mut watcher)
                .map_err(|e| describe_moj(e, prepared))?
        }

        // Fabric and Quilt hand back a ready-made profile with
        // `inheritsFrom`; there is nothing to patch and no processors to run.
        Some((kind @ (LoaderKind::FabricLoader | LoaderKind::QuiltLoader), version)) => {
            let loader = if *kind == LoaderKind::FabricLoader {
                fabric::Loader::Fabric
            } else {
                fabric::Loader::Quilt
            };
            let mut installer = fabric::Installer::new(
                loader,
                prepared.plan.minecraft.clone(),
                version.clone(),
            );
            configure(installer.mojang_mut().base_mut(), prepared);
            installer
                .mojang_mut()
                .set_auth_offline(prepared.session.uuid, prepared.session.username.clone());
            installer
                .install(&mut watcher)
                .map_err(|e| describe_fabric(e, prepared))?
        }

        // Forge/NeoForge since 1.13 run install_profile.json processors
        // that binary-patch the client jar. portablemc's forge installer
        // downloads the official installer AND runs those processors itself
        // (forge/mod.rs:40), so there is nothing to shell out to and nothing to
        // reimplement. "Do not hand-roll this" is satisfied by using it.
        Some((kind, version)) => {
            let loader = if *kind == LoaderKind::Forge {
                forge::Loader::Forge
            } else {
                forge::Loader::NeoForge
            };
            let mut installer = forge::Installer::new(loader, version.clone());
            // Forge version strings are usually "<mc>-<forge>", but manifests
            // carry the loader version alone; pinning the game version keeps
            // the two from disagreeing.
            installer
                .mojang_mut()
                .set_version(prepared.plan.minecraft.clone());
            configure(installer.mojang_mut().base_mut(), prepared);
            installer
                .mojang_mut()
                .set_auth_offline(prepared.session.uuid, prepared.session.username.clone());
            installer
                .install(&mut watcher)
                .map_err(|e| describe_forge(e, prepared))?
        }
    };

    // Portablemc reports an incompatible JVM as a warning and launches anyway.
    // That produces the single most common support ticket there is, so it is
    // promoted to a hard failure here.
    if let Some(detail) = watcher.jvm_incompatible.take() {
        return Err(InstallFailure::message(format!(
            "{detail}\nElige otra ruta de Java en los ajustes, o déjala vacía para que el \
             lanzador instale la correcta."
        )));
    }

    // Tuning flags BEFORE the heap, and the heap last, both deliberately.
    //
    // These have already passed `jvm_args::judge` in `runtime::resolve` — this
    // is the only place they reach argv, and it does not re-check them, so the
    // sanitizing must stay on the resolve path rather than moving here.
    game.jvm_args.extend(prepared.runtime.jvm_args.iter().cloned());

    // -Xmx last so it wins over anything the version metadata set — AND over
    // anything above, which is why a pack's own `-Xmx` is refused at publish
    // time instead of being silently swallowed here. This is the RESOLVED
    // value — the pack's own override, the heuristic, or the global setting, in
    // that order — not the global slider.
    game.jvm_args.push(prepared.runtime.xmx_arg());
    session::patch_game_args(&mut game, &prepared.session);

    Ok(game)
}

fn configure(base: &mut base::Installer, prepared: &Prepared) {
    prepared.layout.apply(base, &prepared.instance);
    base.set_launcher_name("boffmedia-app")
        .set_launcher_version(env!("CARGO_PKG_VERSION"))
        .set_jvm_policy(jvm_policy(&prepared.runtime));
}

/// A path the player chose is used verbatim — silently falling back to a
/// different JVM would make "I set Java 21 and it still crashes" unanswerable.
/// Otherwise Mojang's own runtime is preferred over whatever is on PATH,
/// because the system JVM is the usual source of a version mismatch.
///
/// The path comes from the RESOLVED runtime, so a pack that sets Java to
/// "automático" escapes a global path that is wrong for it — the exact case
/// where one player keeps a Java 8 path for an old pack and every new pack then
/// refuses to start.
fn jvm_policy(runtime: &ResolvedRuntime) -> base::JvmPolicy {
    match runtime.java_path.as_deref() {
        Some(path) => base::JvmPolicy::Static(path.into()),
        None => base::JvmPolicy::MojangThenSystem,
    }
}

// ── Error text ─────────────────────────────────────────────────────────────
// portablemc's Display text is developer-facing ("jvm not found",
// "installer processor execution failed"). These wrap the cases a player can
// actually act on and pass everything else through with context.

fn describe_base(err: &base::Error, prepared: &Prepared) -> String {
    match err {
        base::Error::JvmNotFound { major_version } => format!(
            "No se encontró una versión de Java {major_version} utilizable para Minecraft {}. \
             Indica una ruta de Java en los ajustes o vuelve a intentarlo con conexión.",
            prepared.plan.minecraft
        ),
        base::Error::VersionNotFound { version } => {
            format!("La versión «{version}» de Minecraft no existe en el manifiesto de Mojang.")
        }
        base::Error::Download { batch } => format!(
            "Fallaron {} de {} descargas de Minecraft. Comprueba tu conexión y reintenta.",
            batch.errors_count(),
            batch.len()
        ),
        other => format!("Error instalando Minecraft: {other}"),
    }
}

fn describe_moj(err: moj::Error, prepared: &Prepared) -> InstallFailure {
    InstallFailure::message(match &err {
        moj::Error::Base(base) => describe_base(base, prepared),
        other => format!("Error instalando Minecraft: {other}"),
    })
}

fn describe_fabric(err: fabric::Error, prepared: &Prepared) -> InstallFailure {
    InstallFailure::message(match &err {
        fabric::Error::Mojang(moj::Error::Base(base)) => describe_base(base, prepared),
        fabric::Error::LoaderVersionNotFound { loader_version, .. } => format!(
            "El cargador Fabric «{loader_version}» no existe para Minecraft {}.",
            prepared.plan.minecraft
        ),
        other => format!("Error instalando el cargador: {other}"),
    })
}

fn describe_forge(err: forge::Error, prepared: &Prepared) -> InstallFailure {
    InstallFailure::message(match &err {
        forge::Error::Mojang(moj::Error::Base(base)) => describe_base(base, prepared),
        forge::Error::InstallerNotFound { version } => format!(
            "No existe instalador de Forge/NeoForge para la versión «{version}»."
        ),
        // The processors are the part that binary-patches the client jar; when
        // they fail the pack is genuinely uninstallable, not merely slow.
        forge::Error::InstallerProcessorFailed { name, .. } => format!(
            "El instalador de Forge/NeoForge falló al ejecutar «{name}». Suele deberse a una \
             versión de Java incompatible o a una instalación corrupta."
        ),
        other => format!("Error instalando Forge/NeoForge: {other}"),
    })
}
